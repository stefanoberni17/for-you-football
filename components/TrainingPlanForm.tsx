'use client';

import { useState, type ReactNode } from 'react';
import { DAY_SHORT_NAMES, DAY_NAMES } from '@/lib/constants';
import { DURATE, FOCUS_OPZIONI, FOCUS_TUTTO, MODIFICA_TIPI, SEDUTE_MAX, toggleFocus, type FocusId, type ModificaTipo, type RichiestaGuidata } from '@/lib/trainingRequest';
import { Button, Card, Chip, Input } from '@/components/ui';

interface SedutaLite { giorno: number; titolo: string; modificabile: boolean }

/** Etichetta corta di un gruppo di chip; la parentetica va sotto, in caption. */
function Label({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-2">
      <p className="text-label font-semibold text-app">{children}</p>
      {hint && <p className="text-caption text-muted mt-0.5">{hint}</p>}
    </div>
  );
}

/**
 * Maschera guidata per generare o modificare la settimana: pochi campi che compongono
 * la richiesta al planner (e i vincoli per il validatore). Niente testo libero,
 * salvo una nota corta.
 */
export default function TrainingPlanForm({ hasPlan, sedute, oggiDow, calendario, maxSedute, maxSeduteFisiche, focusSetup, preferenzeSetup, generating, onSubmit, onClose }: {
  hasPlan: boolean;
  sedute: SedutaLite[];      // tutte le sedute della settimana (anche passate: i loro giorni non sono liberi)
  oggiDow: number;
  calendario?: { trainingDays: number[]; matchDays: number[] };  // settimana squadra caricata dall'utente
  maxSedute?: number;        // giornate totali richiedibili (fisiche + leggere)
  maxSeduteFisiche?: number; // di cui con blocchi fisici (tetto della fase)
  focusSetup?: FocusId[];    // obiettivi della fase dal setup: chip già selezionati, un cambio vale solo per questa settimana
  preferenzeSetup?: { giorni: number[]; sedute: number | null; durataMin: number | null }; // dal setup (migration 025): già compilati, un cambio vale per questa settimana
  generating: boolean;
  onSubmit: (r: RichiestaGuidata) => void;
  onClose?: () => void;
}) {
  const [modo, setModo] = useState<'nuova' | 'modifica'>(hasPlan ? 'modifica' : 'nuova');
  const [giorni, setGiorni] = useState<number[]>(preferenzeSetup?.giorni ?? []);
  const [nSedute, setNSedute] = useState<number | null>(preferenzeSetup?.sedute ?? null);
  const [durata, setDurata] = useState<number | null>(preferenzeSetup?.durataMin ?? null);
  const [focus, setFocus] = useState<FocusId[]>(focusSetup ?? []);
  const [note, setNote] = useState('');
  const [tipo, setTipo] = useState<ModificaTipo>('sposta');
  const modificabili = sedute.filter((s) => s.modificabile);
  const [mGiorno, setMGiorno] = useState<number | null>(modificabili[0]?.giorno ?? null);
  const [mA, setMA] = useState<number | null>(null);
  const [mFocus, setMFocus] = useState<FocusId>('gambe');
  const [mDurata, setMDurata] = useState<number>(45);

  const toggle = <T,>(arr: T[], v: T, max?: number) => arr.includes(v) ? arr.filter((x) => x !== v) : (max && arr.length >= max ? arr : [...arr, v]);
  const giorniLiberi = [1, 2, 3, 4, 5, 6, 7].filter((d) => d >= oggiDow && !sedute.some((s) => s.giorno === d));

  const squadra = calendario?.trainingDays ?? [];
  const partite = calendario?.matchDays ?? [];
  const haCalendario = squadra.length > 0 || partite.length > 0;
  const tettoSedute = Math.max(1, Math.min(SEDUTE_MAX, maxSedute ?? SEDUTE_MAX));
  const marker = (d: number) => partite.includes(d) ? ' ⚽' : squadra.includes(d) ? ' ·S' : '';

  const valida = (): string | null => {
    if (modo === 'nuova') {
      if (nSedute && giorni.length && giorni.length < nSedute) return `Hai scelto ${nSedute} sedute ma solo ${giorni.length} giorni: aggiungi giorni o togli sedute`;
      return null;
    }
    if ((tipo === 'sposta' || tipo === 'togli_giorno') && !modificabili.length) return 'Nessuna seduta ancora da fare questa settimana';
    if (tipo === 'sposta' && !giorniLiberi.length) return 'Nessun giorno libero da qui a domenica';
    if (tipo === 'sposta' && (!mGiorno || !mA)) return 'Scegli la seduta e il giorno nuovo';
    if (tipo === 'togli_giorno' && !mGiorno) return 'Scegli la seduta da togliere';
    return null;
  };
  const errore = valida();

  const submit = () => {
    if (errore) return;
    if (modo === 'nuova') {
      onSubmit({ modo, giorni: giorni.length ? giorni : undefined, sedute: nSedute ?? undefined, durataMax: durata ?? undefined, focus: focus.length ? focus : undefined, note: note.trim() || undefined });
      return;
    }
    const modifica: NonNullable<RichiestaGuidata['modifica']> = { tipo };
    if (tipo === 'sposta') { modifica.giorno = mGiorno!; modifica.a = mA!; }
    if (tipo === 'togli_giorno') modifica.giorno = mGiorno!;
    if (tipo === 'cambia_focus') modifica.focus = mFocus;
    if (tipo === 'meno_tempo') modifica.durataMax = mDurata;
    onSubmit({ modo, modifica, note: note.trim() || undefined });
  };

  return (
    <Card padding="sm" className="mb-5">
      {hasPlan && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {(['modifica', 'nuova'] as const).map((m) => (
            <Chip key={m} size="lg" selected={modo === m} onClick={() => setModo(m)} className="w-full">
              {m === 'modifica' ? 'Modifica la settimana' : 'Rifai da capo'}
            </Chip>
          ))}
        </div>
      )}

      {modo === 'nuova' ? (
        <>
          {/* La settimana squadra caricata dall'utente: si vede PRIMA di scegliere i giorni */}
          <Card variant="raised" padding="sm" className="mb-4">
            <p className="text-label font-semibold text-muted mb-2">La tua settimana con la squadra</p>
            {haCalendario ? (
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                  const p = partite.includes(d), s = squadra.includes(d);
                  return (
                    <span key={d} className={`text-caption rounded-full px-2.5 py-1 border ${p ? 'bg-warning/15 border-warning/40 text-warning' : s ? 'bg-forest-500/15 border-forest-500/40 text-forest-300' : 'border-divider text-muted'}`}>
                      {DAY_SHORT_NAMES[d]}{p ? ' ⚽ partita' : s ? ' · squadra' : ''}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-body-sm text-muted">Nessun calendario caricato: impostalo dalla home (card calendario), così le sedute girano intorno a squadra e partita.</p>
            )}
          </Card>

          <Label hint={`Vuoto = decide il preparatore. Massimo ${tettoSedute}: ${maxSeduteFisiche ?? tettoSedute} con forza o corsa, le altre solo fascia, tecnica o recupero.`}>Quante giornate a settimana?</Label>
          <div className="flex flex-wrap gap-2 mb-4">
            {Array.from({ length: tettoSedute }, (_, i) => i + 1).map((n) => (
              <Chip key={n} selected={nSedute === n} showCheck={false} onClick={() => setNSedute(nSedute === n ? null : n)}>{n}</Chip>
            ))}
          </div>

          <Label hint="Vuoto = decide il preparatore.">Quando puoi allenarti con l&apos;app?</Label>
          <div className="flex flex-wrap gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <Chip key={d} selected={giorni.includes(d)} showCheck={false} onClick={() => setGiorni(toggle(giorni, d).sort())}>{DAY_SHORT_NAMES[d]}{marker(d)}</Chip>
            ))}
          </div>
          <Label>Tempo per seduta</Label>
          <div className="flex flex-wrap gap-2 mb-4">
            {DURATE.map((d) => (
              <Chip key={d} selected={durata === d} showCheck={false} onClick={() => setDurata(durata === d ? null : d)}>{d}&apos;</Chip>
            ))}
          </div>
          <Label hint={`Nell'ordine in cui li scegli, oppure "Tutto".${focusSetup?.length ? ' Già impostati dal tuo setup: cambiali solo per questa settimana.' : ''}`}>Su cosa vuoi lavorare questa settimana?</Label>
          <div className="flex flex-wrap gap-2 mb-4">
            {FOCUS_OPZIONI.map((f) => {
              const idx = focus.indexOf(f.id);
              return (
                <Chip key={f.id} selected={idx >= 0} onClick={() => setFocus(toggleFocus(focus, f.id))}
                  className={idx < 0 && f.id === FOCUS_TUTTO ? '!border-forest-500/50 !text-forest-300' : ''}>
                  {idx >= 0 && focus.length > 1 ? `${idx + 1}. ` : ''}{f.label}
                </Chip>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <Label hint="Una cosa alla volta.">Cosa vuoi cambiare?</Label>
          <div className="flex flex-wrap gap-2 mb-4">
            {MODIFICA_TIPI.map((t) => (
              <Chip key={t.id} selected={tipo === t.id} onClick={() => setTipo(t.id)}>{t.label}</Chip>
            ))}
          </div>
          {(tipo === 'sposta' || tipo === 'togli_giorno') && (
            <div className="mb-4">
              <Label>Quale seduta</Label>
              <div className="flex flex-wrap gap-2">
                {modificabili.map((s) => (
                  <Chip key={s.giorno} selected={mGiorno === s.giorno} onClick={() => { setMGiorno(s.giorno); setMA(null); }}>
                    {DAY_SHORT_NAMES[s.giorno]} · {s.titolo.slice(0, 18)}
                  </Chip>
                ))}
              </div>
            </div>
          )}
          {tipo === 'sposta' && (
            <div className="mb-4">
              <Label hint="Solo giorni liberi.">A quale giorno</Label>
              <div className="flex flex-wrap gap-2">
                {giorniLiberi.map((d) => (
                  <Chip key={d} selected={mA === d} onClick={() => setMA(d)}>{DAY_NAMES[d]}</Chip>
                ))}
              </div>
            </div>
          )}
          {tipo === 'cambia_focus' && (
            <div className="flex flex-wrap gap-2 mb-4">
              {FOCUS_OPZIONI.map((f) => (
                <Chip key={f.id} selected={mFocus === f.id} onClick={() => setMFocus(f.id)}>{f.label}</Chip>
              ))}
            </div>
          )}
          {tipo === 'meno_tempo' && (
            <div className="flex flex-wrap gap-2 mb-4">
              {DURATE.map((d) => (
                <Chip key={d} selected={mDurata === d} showCheck={false} onClick={() => setMDurata(d)}>{d}&apos;</Chip>
              ))}
            </div>
          )}
        </>
      )}

      <Input value={note} onChange={(e) => setNote(e.target.value)} maxLength={160}
        placeholder="Una nota breve, se serve (es. 'sabato torneo') — opzionale" aria-label="Nota per il preparatore"
        className="mb-3" />
      {errore && <p className="text-body-sm text-warning mb-3">{errore}</p>}
      <Button fullWidth onClick={submit} disabled={!!errore} loading={generating}>
        {generating ? 'Sto preparando la tua settimana…' : modo === 'modifica' ? 'Applica la modifica' : hasPlan ? 'Rifai la settimana' : 'Genera il piano della settimana'}
      </Button>
      {onClose && !generating && (
        <Button variant="ghost" fullWidth onClick={onClose} className="mt-2">Annulla</Button>
      )}
    </Card>
  );
}
