'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { DAY_SHORT_NAMES, DAY_NAMES } from '@/lib/constants';
import { ATTREZZATURA_LABEL, ATTREZZATURA_OPZIONI, FASE_LABEL, FASI, type TrainingSetup } from '@/lib/trainingSetup';
import { SQUADRA_QUALITA, type SquadraSettimana, type SquadraQualitaId } from '@/lib/trainingSquadra';
import { DURATE, FOCUS_OPZIONI, FOCUS_TUTTO, toggleFocus } from '@/lib/trainingRequest';
import { AppLoader, BackButton, Button, Card, Chip, Field, Input, SectionTitle } from '@/components/ui';
import type { TrainingState } from '@/app/allenamento/page';

// Dal /api/training/state (stessa chiamata dell'hub) servono solo setup, calendario, tetti e squadra
type SetupState = Pick<TrainingState, 'setup' | 'setupDisponibile' | 'calendario' | 'maxSeduteFisiche' | 'maxSeduteTotali' | 'squadra'>;

// Etichetta di un gruppo di controlli (chip, Sì/No): label corta + parentetica sotto
function GroupLabel({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="text-label font-semibold text-muted">{children}</p>
      {hint && <p className="text-caption text-muted mt-0.5">{hint}</p>}
    </div>
  );
}

const NON_ATTIVA = 'Questa parte non è ancora attiva.';
const siNo = ([true, false] as const);

/**
 * "Il tuo setup" (sottopagina del Campo): attrezzatura, esperienza, fase, obiettivi, quando,
 * peso e gli allenamenti con la squadra. Salva con gli stessi POST a /api/training/setup
 * che usava l'hub (setup + focus + preferenze in un colpo, squadra a parte).
 */
export default function SetupPage() {
  const router = useRouter();
  const [state, setState] = useState<SetupState | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupDraft, setSetupDraft] = useState<TrainingSetup | null>(null);
  const [squadraDraft, setSquadraDraft] = useState<SquadraSettimana>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  // Parti che dipendono da colonne non ancora presenti (migration mancante): si dice solo "non ancora attiva"
  const [nonAttive, setNonAttive] = useState<{ setup?: boolean; obiettivi?: boolean; quando?: boolean; squadra?: boolean }>({});

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    const res = await authFetch('/api/training/state');
    if (res.status === 403) { router.push('/strumenti'); return; }
    if (res.ok) {
      const data: SetupState = await res.json();
      setState(data);
      setSetupDraft({ ...data.setup });
      setSquadraDraft({ ...(data.squadra || {}) });
    }
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const setupDirty = !!state && !!setupDraft && JSON.stringify(setupDraft) !== JSON.stringify(state.setup);
  const squadraDirty = !!state && JSON.stringify(squadraDraft) !== JSON.stringify(state.squadra || {});
  const dirty = setupDirty || squadraDirty;

  const salva = async () => {
    if (!state || !setupDraft || !dirty) return;
    setSaving(true); setErrore(null); setSaved(false);
    const avvisi: typeof nonAttive = {};
    let ok = true;
    try {
      if (setupDirty) {
        const res = await authFetch('/api/training/setup', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(setupDraft),
        });
        const d = await res.json().catch(() => ({}));
        if (res.ok) {
          if (d.focusSalvato === false) avvisi.obiettivi = true;
          if (d.preferenzeSalvate === false) avvisi.quando = true;
        } else {
          const msg: string = d.error || '';
          // "manca la migration 024/025" → quella parte non è ancora attiva (il resto del setup è passato)
          if (/migration 024/.test(msg)) avvisi.obiettivi = true;
          else if (/migration 025/.test(msg)) avvisi.quando = true;
          else if (/migration/.test(msg)) avvisi.setup = true;
          else { ok = false; setErrore(msg || 'Non sono riuscito a salvare. Riprova.'); }
        }
      }
      if (squadraDirty && ok) {
        const res = await authFetch('/api/training/setup', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ squadra: squadraDraft }),
        });
        const d = await res.json().catch(() => ({}));
        if (res.ok && d.squadraSalvata !== false) { /* ok */ }
        else if (d.squadraSalvata === false || /migration/.test(d.error || '')) avvisi.squadra = true;
        else { ok = false; setErrore(d.error || 'Non sono riuscito a salvare. Riprova.'); }
      }
      setNonAttive(avvisi);
      if (ok) {
        await load();
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } finally { setSaving(false); }
  };

  if (loading || !state || !setupDraft) return <AppLoader />;

  const giorniSquadra = state.calendario?.trainingDays ?? [];
  const maxTotali = state.maxSeduteTotali ?? state.maxSeduteFisiche ?? 3;
  const disabilitato = !state.setupDisponibile;

  return (
    <main className="min-h-screen bg-app pt-safe pb-tabbar-lg px-5">
      <div className="max-w-md mx-auto">
        <BackButton href="/allenamento" label="Campo" className="mb-2" />
        <h1 className="font-display text-title-1 font-bold text-app mb-1">Il tuo setup</h1>
        <p className="text-body text-muted mb-5">Cambia quando cambia la tua stagione.</p>

        {disabilitato && <p className="text-body-sm text-warning mb-4">{NON_ATTIVA}</p>}

        <div className={`space-y-4 ${disabilitato ? 'opacity-60 pointer-events-none' : ''}`}>
          {/* Dove ti alleni */}
          <Card padding="sm">
            <SectionTitle title="Dove ti alleni" className="mb-3" />
            <div className="space-y-5">
              <div>
                <GroupLabel hint="Il corpo libero c'è sempre.">Cosa hai a disposizione?</GroupLabel>
                <div className="flex flex-wrap gap-2">
                  {ATTREZZATURA_OPZIONI.map((a) => {
                    const on = setupDraft.attrezzatura.includes(a);
                    return (
                      <Chip key={a} selected={on} onClick={() => setSetupDraft({ ...setupDraft, attrezzatura: on ? setupDraft.attrezzatura.filter((x) => x !== a) : [...setupDraft.attrezzatura, a] })}>
                        {ATTREZZATURA_LABEL[a]}
                      </Chip>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <GroupLabel>Esperienza in palestra?</GroupLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {siNo.map((v) => (
                      <Chip key={String(v)} selected={setupDraft.esperienzaPalestra === v} onClick={() => setSetupDraft({ ...setupDraft, esperienzaPalestra: v })} className="w-full">
                        {v ? 'Sì' : 'No'}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <GroupLabel>Ti alleni con un compagno?</GroupLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {siNo.map((v) => (
                      <Chip key={String(v)} selected={setupDraft.compagno === v} onClick={() => setSetupDraft({ ...setupDraft, compagno: v })} className="w-full">
                        {v ? 'Sì' : 'No'}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-body-sm text-muted leading-relaxed">
                Servono per scegliere solo esercizi che puoi fare davvero e per dosare i carichi in sicurezza (fino ai 18 anni o senza esperienza in palestra: massimo il 60% del tuo massimale).
              </p>
              {nonAttive.setup && <p className="text-body-sm text-warning">{NON_ATTIVA}</p>}
            </div>
          </Card>

          {/* La tua stagione */}
          <Card padding="sm">
            <SectionTitle title="La tua stagione" className="mb-3" />
            <GroupLabel>In che fase sei?</GroupLabel>
            <div className="grid grid-cols-1 gap-2">
              {FASI.map((f) => (
                <Chip key={f} selected={setupDraft.fase === f} onClick={() => setSetupDraft({ ...setupDraft, fase: f })} className="w-full">
                  {FASE_LABEL[f]}
                </Chip>
              ))}
            </div>
          </Card>

          {/* Su cosa vuoi lavorare */}
          <Card padding="sm">
            <SectionTitle title="Su cosa vuoi lavorare" subtitle="In questa fase, nell'ordine in cui li scegli. Oppure &quot;Tutto&quot;." className="mb-3" />
            <div className="flex flex-wrap gap-2">
              {FOCUS_OPZIONI.map((f) => {
                const idx = setupDraft.focus.indexOf(f.id);
                const on = idx >= 0;
                return (
                  <Chip key={f.id} selected={on} onClick={() => setSetupDraft({ ...setupDraft, focus: toggleFocus(setupDraft.focus, f.id) })}
                    className={!on && f.id === FOCUS_TUTTO ? '!border-forest-500/50 !text-forest-300' : ''}>
                    {on && setupDraft.focus.length > 1 ? `${idx + 1}. ` : ''}{f.label}
                  </Chip>
                );
              })}
            </div>
            <p className="text-body-sm text-muted mt-3">Entrano in ogni settimana, anche in quella preparata da sola il lunedì: i primi due ci sono sempre, gli altri dove c&apos;è spazio. In &quot;Rifai da capo&quot; puoi cambiarli per una settimana sola.</p>
            {nonAttive.obiettivi && <p className="text-body-sm text-warning mt-2">{NON_ATTIVA}</p>}
          </Card>

          {/* Quando */}
          <Card padding="sm">
            <SectionTitle title="Quando" subtitle="Vuoto = decide il preparatore." className="mb-3" />
            <div className="space-y-5">
              <div>
                <GroupLabel>Quando puoi allenarti con l&apos;app?</GroupLabel>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                    const on = (setupDraft.giorni ?? []).includes(d);
                    const mark = state.calendario?.matchDays.includes(d) ? ' ⚽' : state.calendario?.trainingDays.includes(d) ? ' ·S' : '';
                    return (
                      <Chip key={d} selected={on} showCheck={false} onClick={() => setSetupDraft({ ...setupDraft, giorni: on ? (setupDraft.giorni ?? []).filter((x) => x !== d) : [...(setupDraft.giorni ?? []), d].sort((a, b) => a - b) })}>
                        {DAY_SHORT_NAMES[d]}{mark}
                      </Chip>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <GroupLabel hint={`Massimo ${maxTotali}.`}>Giornate a settimana</GroupLabel>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: maxTotali }, (_, i) => i + 1).map((n) => (
                      <Chip key={n} selected={setupDraft.sedute === n} showCheck={false} onClick={() => setSetupDraft({ ...setupDraft, sedute: setupDraft.sedute === n ? null : n })}>{n}</Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <GroupLabel>Tempo per seduta</GroupLabel>
                  <div className="flex flex-wrap gap-2">
                    {DURATE.map((d) => (
                      <Chip key={d} selected={setupDraft.durataMin === d} showCheck={false} onClick={() => setSetupDraft({ ...setupDraft, durataMin: setupDraft.durataMin === d ? null : d })}>{d}&apos;</Chip>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-body-sm text-muted">Valgono per ogni settimana, anche per il piano preparato da solo il lunedì. In &quot;Rifai da capo&quot; li trovi già compilati e puoi cambiarli per una settimana sola. Oltre le {state.maxSeduteFisiche ?? 3} giornate con forza o corsa, le altre sono solo fascia, tecnica o recupero.</p>
              {nonAttive.quando && <p className="text-body-sm text-warning">{NON_ATTIVA}</p>}
            </div>
          </Card>

          {/* Il tuo corpo */}
          <Card padding="sm">
            <SectionTitle title="Il tuo corpo" subtitle="Serve per i massimali in palestra." className="mb-3" />
            <Field label="Peso corporeo (kg)" htmlFor="setup-peso">
              <Input id="setup-peso" type="text" inputMode="decimal" value={setupDraft.pesoKg ?? ''} placeholder="es. 62"
                onChange={(e) => { const v = e.target.value.replace(',', '.').replace(/[^0-9.]/g, ''); setSetupDraft({ ...setupDraft, pesoKg: v === '' ? null : Number(v) }); }}
                className="tabular-nums" />
            </Field>
          </Card>

          {/* Con la squadra */}
          <Card padding="sm">
            <SectionTitle title="Con la squadra" subtitle="Facoltativo: il piano non raddoppia quello che fa già il mister." className="mb-3" />
            <div className="space-y-4">
              <Field label="Quanto dura un allenamento con la squadra (min)" htmlFor="setup-squadra-min">
                <Input id="setup-squadra-min" type="text" inputMode="numeric" value={setupDraft.squadraDurataMin ?? ''} placeholder="es. 90"
                  onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); setSetupDraft({ ...setupDraft, squadraDurataMin: v === '' ? null : Number(v) }); }}
                  className="tabular-nums" />
              </Field>
              {giorniSquadra.length === 0 ? (
                <p className="text-body-sm text-muted leading-relaxed">
                  Prima imposta i giorni di allenamento con la squadra dal calendario in home: qui poi puoi dire quanto è impegnativo ognuno.
                </p>
              ) : (
                <>
                  <p className="text-body-sm text-muted leading-relaxed">
                    Per ogni giorno con la squadra: quanto è impegnativo di solito (1 = leggero, 10 = massimo) e su cosa lavorate.
                  </p>
                  {giorniSquadra.map((d) => {
                    const g = squadraDraft[d] || { rpe: null, qualita: [] as SquadraQualitaId[] };
                    const setG = (next: { rpe: number | null; qualita: SquadraQualitaId[] }) => {
                      const copia = { ...squadraDraft };
                      if (next.rpe === null && next.qualita.length === 0) delete copia[d]; else copia[d] = next;
                      setSquadraDraft(copia);
                    };
                    return (
                      <Card key={d} variant="raised" padding="sm">
                        <p className="text-body font-bold text-app mb-2">{DAY_NAMES[d]}{state.calendario?.matchDays.includes(d) ? ' · anche partita' : ''}</p>
                        <p className="text-caption text-muted mb-1.5">Sforzo{g.rpe !== null ? ` · ${g.rpe}/10` : ''}</p>
                        <div className="grid grid-cols-5 gap-1.5 mb-3">
                          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                            <button key={n} type="button" onClick={() => setG({ ...g, rpe: g.rpe === n ? null : n })} aria-pressed={g.rpe === n}
                              className={`h-11 rounded-btn text-body-sm font-semibold tabular-nums border transition-colors ${g.rpe === n ? 'bg-forest-500 border-forest-500 text-white' : g.rpe !== null && n < g.rpe ? 'bg-forest-500/25 border-forest-500/30 text-forest-300' : 'bg-surface border-divider text-muted'}`}>
                              {n}
                            </button>
                          ))}
                        </div>
                        <p className="text-caption text-muted mb-1.5">Su cosa lavorate</p>
                        <div className="flex flex-wrap gap-2">
                          {SQUADRA_QUALITA.map((q) => {
                            const on = g.qualita.includes(q.id);
                            return (
                              <Chip key={q.id} selected={on}
                                onClick={() => setG({ ...g, qualita: on ? g.qualita.filter((x) => x !== q.id) : [...g.qualita, q.id] })}>
                                {q.label}
                              </Chip>
                            );
                          })}
                        </div>
                      </Card>
                    );
                  })}
                </>
              )}
              {nonAttive.squadra && <p className="text-body-sm text-warning">{NON_ATTIVA}</p>}
            </div>
          </Card>
        </div>

        {/* Salva sticky sopra la tab bar: attivo solo se qualcosa è cambiato */}
        <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-10 -mx-5 px-5 mt-5 pt-3 pb-2 bg-app-bg/90 backdrop-blur">
          {errore && <p className="text-body-sm text-warning mb-2">{errore}</p>}
          <Button size="lg" fullWidth onClick={salva} loading={saving} disabled={!dirty || disabilitato}>
            {saved ? 'Salvato' : 'Salva'}
          </Button>
        </div>
      </div>
    </main>
  );
}
