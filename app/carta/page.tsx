'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { SPORT_ROLES, PLAYER_ROLES } from '@/lib/constants';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { ArrowDownRight, ArrowUpRight, Download, Minus } from 'lucide-react';
import { AppLoader, BackButton, Badge, Button, Card, Chip } from '@/components/ui';
import type { Punta, Punta360, RomboMente } from '@/lib/carta';
import type { Incrocio } from '@/lib/incroci';

/**
 * La Carta del Giocatore — il documento personale che resta a fine percorso.
 * Dal 29/9 (docs/carta-360.md) in cima c'è la Carta a 360°: rombo Mente (abitudini e check-in),
 * Recupero (la base), rombo Corpo (i test del Campo) e la carta completa a sette punte.
 * Sotto, le SUE cose scritte durante il percorso (mantra, mappa, firma, Protocollo): quella parte si stampa.
 */

interface CartaData {
  nome: string;
  ruoli: string[];
  mantra: string | null; // risposta W1-G3 (giorno del mantra)
  mappa: string | null; // gate W3 q1 (dove porta la tensione il corpo)
  firma: string | null; // risposta W3-G3 (firma del gioco libero)
  protocollo: string | null; // risposta W4-G6 (il protocollo personale in 3 righe)
  cinqueCose: string | null; // risposta W8-G6 (le cinque cose oltre al calciatore)
  giorniCompletati: number;
}

interface RomboCorpoPunta { key: string; label: string; score: number | null; scoreIniziale: number | null; delta: number | null; fatti: number; totali: number }
interface Carta360 {
  inizio: string | null;
  mente: RomboMente;
  recupero: Punta;
  corpo: { dettaglio: RomboCorpoPunta[]; base: RomboCorpoPunta[]; livello: string; testFatti: number } | null;
  tre60: Punta360[];
  incroci?: Incrocio[]; // frasi vere dai suoi dati (max 2), dove testa e corpo si toccano
}

type Vista = 'mente' | 'corpo' | '360';
const LIVELLO_CORPO_LABEL: Record<string, string> = { B: 'Base', A: 'Avanzato', PRO: 'PRO' };
const ROMBO_SHORT: Record<string, string> = { forza_pa: 'Forza alta', forza_pb: 'Forza bassa', prevenzione: 'Prevenz.', forza_max: 'Forza max', esplosiva: 'Esplosiv.', resistenza: 'Resist.', lucidita: 'Lucidità' };

function FieldBlock({ label, value, placeholder, quote = false }: { label: string; value: string | null; placeholder: string; quote?: boolean }) {
  return (
    <div className="border border-divider print:border-gray-300 rounded-card p-4">
      <p className="text-overline font-semibold uppercase tracking-wider text-forest-400 print:text-green-700 mb-1.5">
        {label}
      </p>
      {value ? (
        <p className={`text-body text-app print:text-black leading-relaxed whitespace-pre-line ${quote ? 'font-quote italic text-body-lg' : ''}`}>
          &ldquo;{value}&rdquo;
        </p>
      ) : (
        <div>
          <p className="text-body-sm text-muted print:text-gray-500 mb-2">{placeholder}</p>
          <div className="border-b border-dashed border-divider print:border-gray-400 h-5" />
          <div className="border-b border-dashed border-divider print:border-gray-400 h-5" />
        </div>
      )}
    </div>
  );
}

const Tendenza = ({ t }: { t: Punta['tendenza'] }) => t === 'su'
  ? <ArrowUpRight size={14} className="text-forest-400" aria-label="in salita negli ultimi 7 giorni" />
  : t === 'giu' ? <ArrowDownRight size={14} className="text-warning" aria-label="in calo negli ultimi 7 giorni" />
    : t === 'stabile' ? <Minus size={14} className="text-faint" aria-label="stabile" /> : null;

const Delta = ({ d }: { d: number | null | undefined }) => d == null || d === 0 ? null
  : <span className={`ml-1 text-caption font-bold ${d > 0 ? 'text-forest-300' : 'text-warning/80'}`}>{d > 0 ? `+${d}` : d}</span>;

const valoreTesto = (p: Punta) => p.valore === null ? 'ancora niente'
  : p.unita === '%' ? `${Math.round(p.valore)} %` : p.unita === '/10' ? `${p.valore}/10` : `${p.valore} settimane`;

export default function CartaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [carta, setCarta] = useState<CartaData | null>(null);
  const [c360, setC360] = useState<Carta360 | null>(null);
  const [vista, setVista] = useState<Vista>('mente');

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const uid = session.user.id;

      const [{ data: profile }, { data: progress }, r360] = await Promise.all([
        supabase
          .from('profiles')
          .select('name, sport, role')
          .eq('user_id', uid)
          .single(),
        supabase
          .from('user_day_progress')
          .select('week_number, day_number, response, gate_answers, completed')
          .eq('user_id', uid),
        authFetch('/api/carta').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);

      const roleOptions = SPORT_ROLES[profile?.sport || 'calcio'] || PLAYER_ROLES;
      const ruoli = (profile?.role || '')
        .split(',')
        .filter(Boolean)
        .map((v: string) => roleOptions.find((r: { value: string; label: string }) => r.value === v)?.label || v);

      const day = (w: number, d: number) =>
        progress?.find(p => p.week_number === w && p.day_number === d);

      setCarta({
        nome: profile?.name || 'Giocatore',
        ruoli,
        mantra: day(1, 3)?.response || null,
        mappa: day(3, 7)?.gate_answers?.q1 || null,
        firma: day(3, 3)?.response || null,
        protocollo: day(4, 6)?.response || null,
        cinqueCose: day(8, 6)?.response || null,
        giorniCompletati: (progress || []).filter(p => p.completed).length,
      });
      if (r360 && r360.mente) {
        setC360(r360 as Carta360);
        // Chi ha il Campo con i test parte dalla vista completa
        if ((r360 as Carta360).corpo && (r360 as Carta360).corpo!.testFatti > 0) setVista('360');
      }
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading || !carta) {
    return <AppLoader />;
  }

  // ── Dati del rombo per la vista scelta (scala 0-100 fissa, ombra "partenza" sotto) ──
  const haCorpo = !!c360?.corpo && c360.corpo.testFatti > 0;
  const punteMente: Punta[] = c360 ? [...c360.mente.punte, c360.recupero] : [];
  const haPartenza = !!c360 && (vista === 'mente' ? c360.mente.haPartenza : vista === 'corpo' ? (c360.corpo?.base || []).some((p) => p.scoreIniziale !== null && p.scoreIniziale !== p.score) : c360.tre60.some((p) => p.scoreIniziale !== null && p.scoreIniziale !== p.score));
  const radar: { key: string; label: string; value: number; partenza: number }[] = !c360 ? []
    : vista === 'mente' ? punteMente.map((p) => ({ key: p.key, label: ROMBO_SHORT[p.key] || p.label, value: p.score ?? 0, partenza: p.scoreIniziale ?? p.score ?? 0 }))
      : vista === 'corpo' ? (c360.corpo?.base || []).map((p) => ({ key: p.key, label: ROMBO_SHORT[p.key] || p.label, value: p.score ?? 0, partenza: p.scoreIniziale ?? p.score ?? 0 }))
        : c360.tre60.map((p) => ({ key: p.key, label: ROMBO_SHORT[p.key] || p.label, value: p.score ?? 0, partenza: p.scoreIniziale ?? p.score ?? 0 }));

  return (
    <main className="min-h-screen bg-app print:bg-white pt-safe px-4 pb-tabbar-lg print:p-0">
      <div className="max-w-xl mx-auto space-y-4">

        {/* Controlli — mai in stampa */}
        <div className="no-print flex items-center justify-between">
          <BackButton onClick={() => router.back()} label="Indietro" />
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
            icon={<Download size={18} aria-hidden="true" />}
          >
            Scarica PDF
          </Button>
        </div>

        {/* ── LA CARTA A 360° (docs/carta-360.md) — non in stampa: la stampa è il documento sotto ── */}
        {c360 && (
          <section className="no-print space-y-3" aria-label="La tua Carta a 360°">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-title-2 font-bold text-app">La tua Carta</h2>
                <p className="text-body-sm text-muted">Mente e corpo, dagli stessi dati: come ti stai allenando.</p>
              </div>
            </div>

            {/* Livelli affiancati: mente dal blocco del percorso, corpo dai test */}
            <div className="grid grid-cols-2 gap-2">
              <Card padding="sm">
                <p className="text-overline uppercase tracking-wider font-semibold text-faint">Mente</p>
                <p className="font-display text-title-1 font-bold text-app leading-tight">{c360.mente.livello}</p>
                <p className="text-caption text-muted">{c360.mente.livelloLabel}</p>
              </Card>
              <Card padding="sm">
                <p className="text-overline uppercase tracking-wider font-semibold text-faint">Corpo</p>
                {haCorpo ? (
                  <>
                    <p className="font-display text-title-1 font-bold text-app leading-tight">{c360.corpo!.livello}</p>
                    <p className="text-caption text-muted">{LIVELLO_CORPO_LABEL[c360.corpo!.livello] || c360.corpo!.livello}</p>
                  </>
                ) : (
                  <p className="text-body-sm text-muted leading-snug pt-1">{c360.corpo ? 'Fai i test nel Campo' : 'Si apre con il Campo'}</p>
                )}
              </Card>
            </div>

            {haCorpo && (
              <div className="flex gap-2" role="tablist" aria-label="Vista della Carta">
                {([['mente', 'Mente'], ['corpo', 'Corpo'], ['360', 'A 360°']] as [Vista, string][]).map(([v, label]) => (
                  <Chip key={v} selected={vista === v} showCheck={false} onClick={() => setVista(v)} className="flex-1">{label}</Chip>
                ))}
              </div>
            )}

            <Card padding="sm">
              <div className="h-64 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radar} outerRadius="70%">
                    <PolarGrid stroke="var(--color-divider)" />
                    <PolarAngleAxis dataKey="label" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    {haPartenza && <Radar dataKey="partenza" stroke="var(--color-text-faint)" strokeDasharray="4 3" fill="var(--color-text-faint)" fillOpacity={0.15} isAnimationActive={false} />}
                    <Radar dataKey="value" stroke="var(--color-accent-glow)" fill="var(--color-accent-glow)" fillOpacity={0.35} isAnimationActive={false} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-body-sm text-muted mb-2">
                Scala 0-100: 40 = intermedio · 60 = avanzato · 80 = PRO.
                {vista === 'mente' ? ' Mente misura quanto ti alleni di testa, non quanto sei forte di testa.' : vista === 'corpo' ? ' Ogni punta è la media dei suoi test.' : ' Il corpo dai test, la mente dalle abitudini: stessa scala, senso diverso.'}
                {haPartenza ? ' In grigio: la partenza.' : ''}
              </p>

              {/* Legenda per punta */}
              {vista === 'mente' && (
                <div className="space-y-2">
                  {punteMente.map((p) => (
                    <div key={p.key} className="flex items-start justify-between gap-3 py-1.5 border-t border-divider first:border-t-0">
                      <div className="min-w-0">
                        <p className="text-body font-semibold text-app flex items-center gap-1.5">{p.label} <Tendenza t={p.tendenza} /></p>
                        <p className="text-caption text-muted leading-snug">{p.spiegazione}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-body font-bold tabular-nums text-app">{p.score === null ? '—' : Math.round(p.score)}<Delta d={p.delta} /></p>
                        <p className="text-caption text-faint tabular-nums">{valoreTesto(p)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {vista === 'corpo' && c360.corpo && (
                <div className="grid grid-cols-2 gap-2">
                  {c360.corpo.base.map((p) => (
                    <div key={p.key} className="flex items-baseline justify-between gap-2 py-1">
                      <span className="text-body-sm text-app">{p.label}</span>
                      <span className="text-body-sm font-semibold tabular-nums text-muted">{p.score === null ? '—' : Math.round(p.score)}<Delta d={p.delta} /> <span className="text-faint">· {p.fatti}/{p.totali}</span></span>
                    </div>
                  ))}
                  <div className="col-span-2 pt-1">
                    <Button variant="ghost" size="sm" href="/allenamento">Vedi il Campo</Button>
                  </div>
                </div>
              )}
              {vista === '360' && (
                <div className="space-y-1.5">
                  {c360.tre60.map((p) => (
                    <div key={p.key} className="flex items-baseline justify-between gap-3 py-1 border-t border-divider first:border-t-0">
                      <div className="min-w-0">
                        <span className="text-body font-semibold text-app">{p.label}</span>
                        <span className="text-caption text-muted"> · {p.da}</span>
                      </div>
                      <span className="text-body font-bold tabular-nums text-app shrink-0">{p.score === null ? '—' : p.score}<Delta d={p.delta} /></span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {vista === 'mente' && punteMente.some((p) => p.score === null) && (
              <p className="text-body-sm text-muted leading-relaxed px-1">
                Le punte a &ldquo;—&rdquo; si riempiono da sole: check-in al mattino, le tue 5 azioni, le pratiche del percorso, il Reset.
              </p>
            )}
            {c360.mente.punte.some((p) => p.tendenza) && (
              <p className="text-caption text-faint px-1 flex items-center gap-2"><Badge tone="neutral">7 giorni</Badge> le frecce dicono se gli ultimi 7 giorni vanno meglio o peggio delle ultime 4 settimane.</p>
            )}

            {/* Gli incroci: dove testa e corpo si toccano, solo con abbastanza dati e una differenza netta */}
            {(c360.incroci?.length ?? 0) > 0 && (
              <Card variant="accent">
                <p className="text-overline font-semibold uppercase tracking-wider text-forest-300 mb-2">Cosa dicono i tuoi dati</p>
                <ul className="space-y-2">
                  {c360.incroci!.map((x) => (
                    <li key={x.key} className="text-body text-app leading-relaxed">{x.frase}</li>
                  ))}
                </ul>
                <p className="text-caption text-muted mt-2">Calcolato dai tuoi check-in, azioni, pratiche e sedute delle ultime 8 settimane. Il Coach li conosce.</p>
              </Card>
            )}
          </section>
        )}

        {/* ── IL DOCUMENTO (si stampa) ──────────────────────────────────────── */}
        <div className="bg-surface print:bg-white rounded-card print:rounded-none shadow-e2 print:shadow-none border-2 border-forest-500/40 print:border-green-700 p-6 md:p-8 space-y-5">

          {/* Intestazione */}
          <div className="text-center border-b border-divider print:border-gray-300 pb-5">
            <p className="text-overline font-semibold uppercase tracking-wider text-forest-400 print:text-green-700 mb-2">
              For You Football · Season 1
            </p>
            <h1 className="font-display text-display font-bold text-app print:text-black leading-tight">
              {carta.nome}
            </h1>
            {carta.ruoli.length > 0 && (
              <p className="text-body text-muted print:text-gray-600 mt-1">
                {carta.ruoli.join(' · ')}
              </p>
            )}
            <p className="text-body-sm text-muted print:text-gray-500 mt-3">
              Carta del Giocatore — il mio gioco mentale, scritto da me
            </p>
          </div>

          <FieldBlock
            label="Il mio mantra"
            value={carta.mantra}
            quote
            placeholder="La parola che mi riporta qui (la scegli al Giorno 3 della Settimana 1):"
          />

          <FieldBlock
            label="La mia mappa"
            value={carta.mappa}
            placeholder="Dove porta la tensione il mio corpo in campo (la trovi nella Settimana 3):"
          />

          <FieldBlock
            label="La mia firma del gioco libero"
            value={carta.firma}
            placeholder="Come si sente il mio corpo quando gioco libero (Settimana 3, Giorno 3):"
          />

          <FieldBlock
            label="Il mio Protocollo"
            value={carta.protocollo}
            placeholder="SENTI → NOMINA → TORNA, nelle mie parole (lo scrivi alla Settimana 4):"
          />

          <FieldBlock
            label="Chi sono, oltre la maglia"
            value={carta.cinqueCose}
            placeholder="Le cinque cose che sono anche senza il pallone (le scrivi alla Settimana 8):"
          />

          {/* Footer carta */}
          <div className="flex items-center justify-between border-t border-divider print:border-gray-300 pt-4">
            <p className="text-caption text-faint print:text-gray-500 tabular-nums">
              {carta.giorniCompletati} giorni di percorso completati
            </p>
            <p className="text-caption font-bold text-forest-400 print:text-green-700">
              Play Free
            </p>
          </div>
        </div>

        <p className="no-print text-body-sm text-muted text-center leading-relaxed px-4">
          Stampala e mettila nell&apos;armadietto. I campi vuoti si riempiono andando avanti nel percorso — o a penna.
        </p>

        <div className="h-4" />
      </div>
    </main>
  );
}
