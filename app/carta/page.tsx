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
import StatoRecente from '@/components/StatoRecente';
import { hasActiveAccess } from '@/lib/checkAccess';
import { PenLine } from 'lucide-react';
import ModificaRispostaSheet from '@/components/ModificaRispostaSheet';
import { campiCarta, type CampoCarta, type CampoCartaValore, type RispostaRow } from '@/lib/risposteChiave';

/**
 * La Carta del Giocatore — il documento personale che resta a fine percorso.
 * Dal 29/9 (docs/carta-360.md) in cima c'è la Carta a 360°: rombo Mente (abitudini e check-in),
 * Recupero (la base), rombo Corpo (i test del Campo) e la carta completa a sette punte.
 * Sotto, le SUE cose scritte durante il percorso (mantra, mappa, firma, Protocollo): quella parte si stampa.
 */

interface CartaData {
  nome: string;
  ruoli: string[];
  /** I riquadri scritti da lui (26/10, Carta modificabile: ultima versione per campo, da /api/risposte?chiavi=1) */
  campi: Record<CampoCarta, CampoCartaValore>;
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

function FieldBlock({ label, value, placeholder, quote = false, meta, onEdit }: { label: string; value: string | null; placeholder: string; quote?: boolean; meta?: string | null; onEdit?: () => void }) {
  return (
    <div className="border border-divider print:border-gray-300 rounded-card p-4">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-overline font-semibold uppercase tracking-wider text-forest-400 print:text-green-700">
          {label}
        </p>
        {onEdit && (
          <button type="button" onClick={onEdit} className="no-print min-h-[44px] -mt-2.5 -mr-2 px-2 inline-flex items-center gap-1 text-label font-semibold text-forest-300" aria-label={value ? `Modifica: ${label}` : `Scrivi: ${label}`}>
            <PenLine size={14} aria-hidden /> {value ? 'Modifica' : 'Scrivi'}
          </button>
        )}
      </div>
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
      {meta && <p className="text-caption text-faint print:hidden mt-2">{meta}</p>}
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
  // Carta modificabile (26/10): le righe delle risposte chiave e il riquadro in modifica
  const [rows, setRows] = useState<RispostaRow[]>([]);
  const [modifica, setModifica] = useState<CampoCarta | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const uid = session.user.id;

      const [{ data: profile }, { data: progress }, r360, risposteRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('name, sport, role, is_beta_free, season1_access, subscription_status')
          .eq('user_id', uid)
          .single(),
        supabase
          .from('user_day_progress')
          .select('week_number, day_number, completed')
          .eq('user_id', uid),
        authFetch('/api/carta').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        // I riquadri scritti da lui: ultima versione per campo (26/10)
        authFetch('/api/risposte?chiavi=1').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      const risposteRows: RispostaRow[] = Array.isArray(risposteRes?.risposte) ? risposteRes.risposte : [];
      setRows(risposteRows);

      // Vista iniziale (20/10): A 360° con tutte e due le parti, Mente con la sola Testa, Corpo con il solo Fisico
      const corpoCeLa = !!r360?.corpo && (r360.corpo.testFatti ?? 0) > 0;
      setVista(corpoCeLa ? (hasActiveAccess(profile) ? '360' : 'corpo') : 'mente');
      const roleOptions = SPORT_ROLES[profile?.sport || 'calcio'] || PLAYER_ROLES;
      const ruoli = (profile?.role || '')
        .split(',')
        .filter(Boolean)
        .map((v: string) => roleOptions.find((r: { value: string; label: string }) => r.value === v)?.label || v);

      setCarta({
        nome: profile?.name || 'Giocatore',
        ruoli,
        campi: campiCarta(risposteRows),
        giorniCompletati: (progress || []).filter(p => p.completed).length,
      });
      if (r360 && r360.mente) setC360(r360 as Carta360);
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

            {/* Nessun livello della persona per la mente (regola del metodo, 8/10): resta solo il livello del Corpo, che viene dai test */}
            {haCorpo && (
              <Card padding="sm">
                <p className="text-overline uppercase tracking-wider font-semibold text-faint">Corpo, dai test</p>
                <p className="font-display text-title-1 font-bold text-app leading-tight">{c360.corpo!.livello}</p>
                <p className="text-caption text-muted">{LIVELLO_CORPO_LABEL[c360.corpo!.livello] || c360.corpo!.livello}</p>
              </Card>
            )}

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

          {(() => {
            const campi = carta.campi;
            const meta = (v: CampoCartaValore) => v.aggiornataIl ? `Aggiornata il ${new Date(v.aggiornataIl).toLocaleDateString('it-IT')}${v.versioni ? ` · ${v.versioni} versioni` : ''}` : null;
            return (
              <>
                <FieldBlock label="Il mio mantra" value={campi.mantra.testo} quote meta={meta(campi.mantra)} onEdit={() => setModifica('mantra')}
                  placeholder="La parola che mi riporta qui (la scegli al Giorno 3 della Settimana 1):" />
                <FieldBlock label="La mia mappa" value={campi.mappa.testo} meta={meta(campi.mappa)} onEdit={() => setModifica('mappa')}
                  placeholder="Dove porta la tensione il mio corpo in campo (la trovi nella Settimana 3):" />
                <FieldBlock label="La mia firma del gioco libero" value={campi.firma.testo} meta={meta(campi.firma)} onEdit={() => setModifica('firma')}
                  placeholder="Come si sente il mio corpo quando gioco libero (Settimana 3, Giorno 3):" />
                <FieldBlock label="Il mio Protocollo" value={campi.protocollo.testo} meta={meta(campi.protocollo)} onEdit={() => setModifica('protocollo')}
                  placeholder="SENTI → NOMINA → TORNA, nelle mie parole (lo scrivi alla Settimana 4):" />
                <FieldBlock label="Chi sono, oltre la maglia" value={campi.cose.testo} meta={meta(campi.cose)} onEdit={() => setModifica('cose')}
                  placeholder="Le cose che sono anche senza il pallone (le scrivi alla Settimana 8):" />
                <FieldBlock label="Il mio Protocollo For You" value={campi.protocolloForYou.testo} meta={meta(campi.protocolloForYou)} onEdit={() => setModifica('protocolloForYou')}
                  placeholder="Prima, durante, dopo, quando non funziona, fuori dal campo (lo scrivi alla Settimana 11):" />
              </>
            );
          })()}

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

        {/* Il tuo stato (ultimi 7 check-in): dalla home alla Carta (20/10), qui con tutti gli altri dati */}
        <StatoRecente className="no-print" />

        <p className="no-print text-body-sm text-muted text-center leading-relaxed px-4">
          Stampala e mettila nell&apos;armadietto. I campi vuoti si riempiono andando avanti nel percorso — o a penna.
        </p>

        <div className="h-4" />
      </div>
          {/* Carta modificabile (26/10): ogni riquadro si modifica (o si scrive a posteriori) con la stessa API delle risposte chiave, con le versioni datate */}
      {modifica && carta && (
        <ModificaRispostaSheet
          week={carta.campi[modifica].chiave.week}
          day={carta.campi[modifica].chiave.day}
          testoIniziale={carta.campi[modifica].testo || ''}
          open
          onClose={() => setModifica(null)}
          onSalvata={(t) => {
            const chiave = carta.campi[modifica].chiave;
            const lista = [...rows];
            const i = lista.findIndex((r) => r.week === chiave.week && r.day === chiave.day);
            const base: RispostaRow = i >= 0 ? lista[i] : { week: chiave.week, day: chiave.day, domanda: null, risposta: null, prePratica: null, gate: null, completedAt: null };
            const nuova: RispostaRow = chiave.gateQ
              ? { ...base, gateQ: { ...(base.gateQ ?? {}), [chiave.gateQ]: t }, versioni: (base.versioni || 0) + 1, aggiornataIl: new Date().toISOString() }
              : { ...base, risposta: t, versioni: (base.versioni || 0) + 1, aggiornataIl: new Date().toISOString() };
            if (i >= 0) lista[i] = nuova; else lista.push(nuova);
            setRows(lista);
            setCarta({ ...carta, campi: campiCarta(lista) });
          }}
        />
      )}
    </main>
  );
}
