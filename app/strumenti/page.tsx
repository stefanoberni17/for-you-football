'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { TOOLS, type Tool } from '@/lib/toolsCatalog';
import {
  CAPACITA,
  unlockedCapacita,
  visibleEsercizi,
  type Capacita,
  type PalestraExercise,
} from '@/lib/palestraCatalog';
import { useMeditation } from '@/components/MeditationContext';
import { PalestraTestata, salvaCorpoAperto } from '@/components/ParteSwitch';
import { livelloFisico, hasActiveAccess, inProva } from '@/lib/checkAccess';
import { dataLunga } from '@/lib/abbonamento';
import PracticePopup from '@/components/PracticePopup';
import { Check, Play, Wind, Lock, Wrench, Eye, Ear, Shield, Waves, Flame, Backpack, Sparkles } from 'lucide-react';
import { AppLoader, Card, CardPlay, Elenco, GrigliaRiquadri, RigaElenco, Riquadro, Testata, TitoloGruppo } from '@/components/ui';

/** Esercizio + capacità di appartenenza (per il "Riprendi" e per il player). */
interface Pick {
  cap: Capacita;
  ex: PalestraExercise;
}

const LAST_KEY = 'palestra.ultimo';

function readLast(): string | null {
  try {
    return localStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}
function saveLast(id: string) {
  try {
    localStorage.setItem(LAST_KEY, id);
  } catch { /* storage non disponibile: il "Riprendi" cade sull'esercizio della settimana */ }
}

/** Cerca un esercizio per id tra quelli SBLOCCATI (mai un esercizio futuro nel "Riprendi"). */
function findPick(id: string | null, week: number): Pick | null {
  if (!id) return null;
  for (const cap of unlockedCapacita(week)) {
    const ex = visibleEsercizi(cap, week).find(e => e.id === id);
    if (ex) return { cap, ex };
  }
  return null;
}

/** Primo esercizio della capacità della settimana corrente (l'ultima sbloccata). */
function weekPick(week: number): Pick | null {
  const caps = unlockedCapacita(week);
  const cap = caps[caps.length - 1];
  if (!cap) return null;
  const ex = visibleEsercizi(cap, week)[0];
  return ex ? { cap, ex } : null;
}

/**
 * Divide il testo della pratica in intro (righe prima del primo step numerato),
 * step (righe "1." / "2)") e coda (righe dopo l'ultimo step). Se il testo non ha
 * numeri, ogni riga è uno step (stessa regola di PracticePopup).
 */
function splitPratica(pratica: string): { intro: string[]; steps: string[]; outro: string[] } {
  const lines = pratica.split('\n').map(s => s.trim()).filter(Boolean);
  const isStep = (s: string) => /^\d+[.)]\s*/.test(s);
  if (!lines.some(isStep)) return { intro: [], steps: lines, outro: [] };
  const first = lines.findIndex(isStep);
  let last = -1;
  lines.forEach((l, i) => { if (isStep(l)) last = i; });
  return {
    intro: lines.slice(0, first),
    steps: lines.slice(first, last + 1).filter(isStep).map(s => s.replace(/^\d+[.)]\s*/, '')),
    outro: lines.slice(last + 1),
  };
}

function Steps({ steps, size = 'lg' }: { steps: string[]; size?: 'lg' | 'md' }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-forest-500 text-white text-label font-bold flex items-center justify-center mt-0.5 tabular-nums" aria-hidden="true">
            {i + 1}
          </span>
          <p className={`${size === 'lg' ? 'text-body-lg' : 'text-body'} text-app leading-relaxed`}>{step}</p>
        </li>
      ))}
    </ol>
  );
}

/** L'icona di ogni capacità (al posto delle emoji: le icone sono lo stile dell'app). */
const ICONE_CAPACITA: Record<string, typeof Wind> = {
  presenza: Wind, osservazione: Eye, ascolto: Ear, pressione: Shield,
  accettazione: Waves, perdono: Flame, 'lasciare-andare': Backpack,
};
function IconaCapacita({ id }: { id: string }) {
  const I = ICONE_CAPACITA[id] ?? Sparkles;
  return <I />;
}

/**
 * La Palestra — hub dell'allenamento mentale (review 16/9, blocco 3).
 * Ordine della pagina: l'esercizio da fare adesso ("Riprendi", unico gradiente),
 * il Reset rapido in una riga, le capacità sbloccate in lista aperta (le bloccate
 * in una riga sola), le difficoltà, poi Carta e Campo. Dati e sblocchi invariati.
 */
export default function StrumentiPage() {
  const router = useRouter();
  const { openMeditation } = useMeditation();
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [lastId, setLastId] = useState<string | null>(null);
  const [selectedCapacita, setSelectedCapacita] = useState<Capacita | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<PalestraExercise | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [activePick, setActivePick] = useState<Pick | null>(null);
  const [showToolPractice, setShowToolPractice] = useState(false);
  const [trainingAccess, setTrainingAccess] = useState(false);
  const [mentaleAttivo, setMentaleAttivo] = useState(true); // Mente, Completo, beta o Season 1: altrimenti la card "Sblocca il Mente"
  const [provaFino, setProvaFino] = useState<string | null>(null); // in prova (review 12/11): niente «Sblocca», la data di fine prova
  const [conFisico, setConFisico] = useState(false); // ha il Fisico da pacchetto: la card propone il Completo

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      const week = profile?.current_week || 1;
      setCurrentWeek(week);
      // Il Campo: acceso a mano o con un pacchetto con il Fisico (3/11); il Mente: con il Mente o il Completo
      setTrainingAccess(!!livelloFisico(profile));
      setMentaleAttivo(hasActiveAccess(profile));
      setProvaFino(inProva(profile) ? (dataLunga((profile as { trial_ends_at?: string | null } | null)?.trial_ends_at ?? null)?.toLowerCase() ?? 'la fine della settimana') : null);
      setConFisico(!!livelloFisico(profile) && !(profile as { training_access?: boolean } | null)?.training_access);
      salvaCorpoAperto(!!livelloFisico(profile));
      setLastId(readLast());
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) {
    return <AppLoader />;
  }

  const openExercise = (cap: Capacita, ex: PalestraExercise) => {
    saveLast(ex.id);
    setLastId(ex.id);
    setSelectedCapacita(cap);
    setSelectedExercise(ex);
  };
  const startPractice = (pick: Pick) => {
    saveLast(pick.ex.id);
    setLastId(pick.ex.id);
    setActivePick(pick);
  };

  const practicePopup = activePick && (
    <PracticePopup
      titolo={activePick.ex.nome}
      pratica={activePick.ex.pratica}
      durataMinuti={activePick.ex.durataMinuti}
      tipoPratica={activePick.ex.tipoPratica}
      weekTool={activePick.cap.principio}
      onComplete={() => setActivePick(null)}
      onSkip={() => setActivePick(null)}
    />
  );

  // ── Dettaglio strumento (riferimento): cos'è / quando / la pratica ────────
  if (selectedTool) {
    const { intro, steps, outro } = splitPratica(selectedTool.pratica);
    return (
      <main className="min-h-screen bg-app pt-safe px-4 pb-tabbar-lg">
        <div className="mx-auto max-w-xl space-y-4">
          <Testata indietro={{ onClick: () => setSelectedTool(null), label: selectedExercise ? selectedExercise.nome : 'Allenamento' }}
            sopra={`Strumento · Settimana ${selectedTool.week}`} titolo={selectedTool.nome} sotto={selectedTool.inUnaRiga} />

          <CardPlay onClick={() => setShowToolPractice(true)} label={`Fai la pratica: ${selectedTool.nome}`}
            sopra={`${selectedTool.durataMinuti} min`} titolo="Fai la pratica ora" />

          <TitoloGruppo className="pt-2">Quando usarlo</TitoloGruppo>
          <Card padding="md"><p className="text-body-lg leading-relaxed text-app">{selectedTool.quando}</p></Card>

          <TitoloGruppo className="pt-2">La pratica</TitoloGruppo>
          <Card padding="md">
            {intro.map((l, i) => <p key={`i${i}`} className="mb-3 text-body leading-relaxed text-muted">{l}</p>)}
            <Steps steps={steps} size="md" />
            {outro.map((l, i) => <p key={`o${i}`} className="mt-3 text-body leading-relaxed text-muted">{l}</p>)}
          </Card>
        </div>

        {showToolPractice && (
          <PracticePopup
            titolo={selectedTool.nome}
            pratica={selectedTool.pratica}
            durataMinuti={selectedTool.durataMinuti}
            weekTool={selectedTool.nome}
            onComplete={() => setShowToolPractice(false)}
            onSkip={() => setShowToolPractice(false)}
          />
        )}
      </main>
    );
  }

  // ── Dettaglio esercizio: cosa allena, step, CTA ───────────────────────────
  if (selectedCapacita && selectedExercise) {
    const ex = selectedExercise;
    const cap = selectedCapacita;
    const tool = ex.ancora ? TOOLS.find(t => t.id === ex.id) : undefined;
    const { intro, steps, outro } = splitPratica(ex.pratica);
    return (
      <main className="min-h-screen bg-app pt-safe px-4 pb-tabbar-lg">
        <div className="mx-auto max-w-xl space-y-4">
          <Testata indietro={{ onClick: () => setSelectedExercise(null), label: cap.principio }} titolo={ex.nome} />

          <CardPlay onClick={() => startPractice({ cap, ex })} label={`Fai la pratica: ${ex.nome}`}
            sopra={`${cap.principio} · ${ex.durataMinuti} min`} titolo="Fai la pratica ora" />

          <TitoloGruppo className="pt-2">Cosa allena</TitoloGruppo>
          <Card padding="md"><p className="text-body-lg leading-relaxed text-app">{ex.cosaAllena}</p></Card>

          <TitoloGruppo className="pt-2">Come si fa</TitoloGruppo>
          <Card padding="md">
            {intro.map((l, i) => <p key={`i${i}`} className="mb-3 text-body leading-relaxed text-muted">{l}</p>)}
            <Steps steps={steps} />
            {outro.map((l, i) => <p key={`o${i}`} className="mt-4 font-quote text-body-lg leading-relaxed text-forest-300">{l}</p>)}
          </Card>

          {tool && (
            <Elenco>
              <RigaElenco onClick={() => setSelectedTool(tool)} icona={<Wrench />} titolo={`Lo strumento: ${tool.nome}`} valore={`Sett. ${tool.week}`} />
            </Elenco>
          )}
        </div>

        {practicePopup}
      </main>
    );
  }

  // ── Dettaglio capacità: gli esercizi in righe ─────────────────────────────
  if (selectedCapacita) {
    const cap = selectedCapacita;
    const esercizi = visibleEsercizi(cap, currentWeek);
    return (
      <main className="min-h-screen bg-app pt-safe px-4 pb-tabbar-lg">
        <div className="mx-auto max-w-xl space-y-4">
          <Testata indietro={{ onClick: () => setSelectedCapacita(null), label: 'Allenamento' }}
            titolo={cap.principio} sotto={cap.sottotitolo} />
          <Elenco>
            {esercizi.map(ex => (
              <RigaElenco key={ex.id} onClick={() => openExercise(cap, ex)}
                icona={ex.ancora ? <Wrench /> : <Play />} tono={ex.ancora ? 'verde' : 'scuro'}
                titolo={ex.nome} valore={`${ex.durataMinuti}'`} />
            ))}
          </Elenco>
          <p className="px-1 text-body-sm text-muted">Da rifare quando vuoi. Quelli con la chiave inglese sono gli strumenti del percorso.</p>
        </div>

        {practicePopup}
      </main>
    );
  }

  // ── Hub ───────────────────────────────────────────────────────────────────
  const resume = findPick(lastId, currentWeek);
  const pick = resume ?? weekPick(currentWeek);

  return (
    <main className="min-h-screen bg-app pb-tabbar-lg">
      {/* Palestra › Mente › Allenamento (8/11, stile B): la cosa da fare, poi le capacità a riquadri */}
      <PalestraTestata parte="mente" scheda="allenamento" corpoBloccato={!trainingAccess} />

      <div className="mx-auto mt-4 max-w-xl space-y-3 px-4">
        {pick && (
          <CardPlay onClick={() => openExercise(pick.cap, pick.ex)} onPlay={() => startPractice(pick)}
            label={`Come si fa: ${pick.ex.nome}`}
            sopra={`${resume ? 'Riprendi' : 'Questa settimana'} · ${pick.ex.durataMinuti} min`}
            titolo={pick.ex.nome} />
        )}

        <TitoloGruppo className="pt-3">Le capacità</TitoloGruppo>
        <GrigliaRiquadri>
          <Riquadro onClick={openMeditation} icona={<Wind />} titolo="Reset rapido"
            valore={<span className="text-body-sm font-semibold text-muted">1&apos;</span>} />
          {CAPACITA.map(c => {
            const aperta = currentWeek >= c.week;
            const n = aperta ? visibleEsercizi(c, currentWeek).length : 0;
            return (
              <Riquadro key={c.id} onClick={aperta ? () => setSelectedCapacita(c) : undefined}
                icona={<IconaCapacita id={c.id} />} titolo={c.principio} bloccato={!aperta}
                sotto={aperta ? undefined : `Settimana ${c.week}`}
                valore={aperta ? <span className="text-body-sm font-semibold text-muted">{n}</span> : undefined} />
            );
          })}
        </GrigliaRiquadri>

        {/* Per chi non ha il Mente: la parte bloccata (la Carta è nel Profilo dall'8/11) */}
        {!mentaleAttivo && provaFino && (
          <Elenco className="mt-3">
            <RigaElenco href="/account" icona={<Check />} tono="verde" titolo={`In prova fino al ${provaFino}`} valore="Dettagli" />
          </Elenco>
        )}
        {!mentaleAttivo && !provaFino && (
          <Elenco className="mt-3">
            <RigaElenco href={conFisico ? '/pricing?pacchetto=completo' : '/pricing?pacchetto=mentale'} icona={<Lock />} tono="verde"
              titolo={conFisico ? 'Aggiungi la testa: il Completo' : 'Il percorso completo'} valore="Sblocca" evidenza />
          </Elenco>
        )}
      </div>

      {practicePopup}
    </main>
  );
}
