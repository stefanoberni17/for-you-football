'use client';

import { useState } from 'react';
import { DAY_SHORT_NAMES, DAY_NAMES } from '@/lib/constants';
import { DURATE, FOCUS_MAX, FOCUS_OPZIONI, MODIFICA_TIPI, SEDUTE_MAX, type FocusId, type ModificaTipo, type RichiestaGuidata } from '@/lib/trainingRequest';

interface SedutaLite { giorno: number; titolo: string; modificabile: boolean }

/**
 * Maschera guidata per generare o modificare la settimana: pochi campi che compongono
 * la richiesta al planner (e i vincoli per il validatore). Niente testo libero,
 * salvo una nota corta.
 */
export default function TrainingPlanForm({ hasPlan, sedute, oggiDow, calendario, maxSedute, generating, onSubmit, onClose }: {
  hasPlan: boolean;
  sedute: SedutaLite[];      // tutte le sedute della settimana (anche passate: i loro giorni non sono liberi)
  oggiDow: number;
  calendario?: { trainingDays: number[]; matchDays: number[] };  // settimana squadra caricata dall'utente
  maxSedute?: number;        // tetto sedute fisiche della fase
  generating: boolean;
  onSubmit: (r: RichiestaGuidata) => void;
  onClose?: () => void;
}) {
  const [modo, setModo] = useState<'nuova' | 'modifica'>(hasPlan ? 'modifica' : 'nuova');
  const [giorni, setGiorni] = useState<number[]>([]);
  const [nSedute, setNSedute] = useState<number | null>(null);
  const [durata, setDurata] = useState<number | null>(null);
  const [focus, setFocus] = useState<FocusId[]>([]);
  const [note, setNote] = useState('');
  const [tipo, setTipo] = useState<ModificaTipo>('sposta');
  const modificabili = sedute.filter((s) => s.modificabile);
  const [mGiorno, setMGiorno] = useState<number | null>(modificabili[0]?.giorno ?? null);
  const [mA, setMA] = useState<number | null>(null);
  const [mFocus, setMFocus] = useState<FocusId>('gambe');
  const [mDurata, setMDurata] = useState<number>(45);

  const toggle = <T,>(arr: T[], v: T, max?: number) => arr.includes(v) ? arr.filter((x) => x !== v) : (max && arr.length >= max ? arr : [...arr, v]);
  const giorniLiberi = [1, 2, 3, 4, 5, 6, 7].filter((d) => d >= oggiDow && !sedute.some((s) => s.giorno === d));
  const chip = (active: boolean) => `text-xs font-semibold rounded-full px-3 py-1.5 border transition-colors ${active ? 'bg-forest-500/25 border-forest-400/60 text-forest-200' : 'bg-surface-2 border-divider text-muted'}`;

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
    <div className="bg-surface rounded-2xl border border-divider p-4 mb-5">
      {hasPlan && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {(['modifica', 'nuova'] as const).map((m) => (
            <button key={m} type="button" onClick={() => setModo(m)}
              className={`text-xs font-bold rounded-xl py-2 border ${modo === m ? 'bg-forest-500/25 border-forest-400/60 text-forest-200' : 'bg-surface-2 border-divider text-muted'}`}>
              {m === 'modifica' ? 'Modifica la settimana' : 'Rifai da capo'}
            </button>
          ))}
        </div>
      )}

      {modo === 'nuova' ? (
        <>
          {/* La settimana squadra caricata dall'utente: si vede PRIMA di scegliere i giorni */}
          <div className="bg-surface-2 border border-divider rounded-xl px-3 py-2.5 mb-3">
            <p className="text-[11px] font-semibold text-muted mb-1">La tua settimana con la squadra</p>
            {haCalendario ? (
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                  const p = partite.includes(d), s = squadra.includes(d);
                  return (
                    <span key={d} className={`text-[11px] rounded-full px-2 py-1 border ${p ? 'bg-amber-500/15 border-amber-500/40 text-amber-200' : s ? 'bg-forest-500/15 border-forest-500/40 text-forest-200' : 'border-divider text-faint'}`}>
                      {DAY_SHORT_NAMES[d]}{p ? ' ⚽ partita' : s ? ' · squadra' : ''}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-faint">Nessun calendario caricato: impostalo dalla home (card calendario), così le sedute girano intorno a squadra e partita.</p>
            )}
          </div>

          <p className="text-xs font-semibold text-app mb-1.5">Quante sedute a settimana? <span className="text-faint font-normal">(vuoto = decide il preparatore, massimo {tettoSedute} in questa fase)</span></p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Array.from({ length: tettoSedute }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" onClick={() => setNSedute(nSedute === n ? null : n)} className={chip(nSedute === n)}>{n}</button>
            ))}
          </div>

          <p className="text-xs font-semibold text-app mb-1.5">Quando puoi allenarti con l&apos;app? <span className="text-faint font-normal">(vuoto = decide il preparatore)</span></p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <button key={d} type="button" onClick={() => setGiorni(toggle(giorni, d).sort())} className={chip(giorni.includes(d))}>{DAY_SHORT_NAMES[d]}{marker(d)}</button>
            ))}
          </div>
          <p className="text-xs font-semibold text-app mb-1.5">Tempo per seduta</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {DURATE.map((d) => (
              <button key={d} type="button" onClick={() => setDurata(durata === d ? null : d)} className={chip(durata === d)}>{d}&apos;</button>
            ))}
          </div>
          <p className="text-xs font-semibold text-app mb-1.5">Su cosa vuoi lavorare? <span className="text-faint font-normal">(fino a {FOCUS_MAX}, nell&apos;ordine in cui li scegli)</span></p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {FOCUS_OPZIONI.map((f) => {
              const idx = focus.indexOf(f.id);
              return (
                <button key={f.id} type="button" onClick={() => setFocus(toggle(focus, f.id, FOCUS_MAX))} className={chip(idx >= 0)}>
                  {idx >= 0 && focus.length > 1 ? `${idx + 1}. ` : ''}{f.label}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <p className="text-xs font-semibold text-app mb-1.5">Cosa vuoi cambiare? <span className="text-faint font-normal">(una cosa alla volta)</span></p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {MODIFICA_TIPI.map((t) => (
              <button key={t.id} type="button" onClick={() => setTipo(t.id)} className={chip(tipo === t.id)}>{t.label}</button>
            ))}
          </div>
          {(tipo === 'sposta' || tipo === 'togli_giorno') && (
            <div className="mb-3">
              <p className="text-xs text-muted mb-1.5">Quale seduta</p>
              <div className="flex flex-wrap gap-1.5">
                {modificabili.map((s) => (
                  <button key={s.giorno} type="button" onClick={() => { setMGiorno(s.giorno); setMA(null); }} className={chip(mGiorno === s.giorno)}>
                    {DAY_SHORT_NAMES[s.giorno]} · {s.titolo.slice(0, 18)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {tipo === 'sposta' && (
            <div className="mb-3">
              <p className="text-xs text-muted mb-1.5">A quale giorno <span className="text-faint">(solo giorni liberi)</span></p>
              <div className="flex flex-wrap gap-1.5">
                {giorniLiberi.map((d) => (
                  <button key={d} type="button" onClick={() => setMA(d)} className={chip(mA === d)}>{DAY_NAMES[d]}</button>
                ))}
              </div>
            </div>
          )}
          {tipo === 'cambia_focus' && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {FOCUS_OPZIONI.map((f) => (
                <button key={f.id} type="button" onClick={() => setMFocus(f.id)} className={chip(mFocus === f.id)}>{f.label}</button>
              ))}
            </div>
          )}
          {tipo === 'meno_tempo' && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {DURATE.map((d) => (
                <button key={d} type="button" onClick={() => setMDurata(d)} className={chip(mDurata === d)}>{d}&apos;</button>
              ))}
            </div>
          )}
        </>
      )}

      <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={160}
        placeholder="Una nota breve, se serve (es. 'sabato torneo') — opzionale"
        className="w-full px-3 py-2.5 bg-surface-2 border border-divider rounded-xl text-sm text-app outline-none focus:ring-2 focus:ring-forest-400 mb-2" />
      {errore && <p className="text-[11px] text-amber-300 mb-2">{errore}</p>}
      <button type="button" onClick={submit} disabled={generating || !!errore}
        className="w-full bg-gradient-to-r from-forest-500 to-forest-600 text-white font-bold py-3 rounded-xl disabled:opacity-60">
        {generating ? 'Sto preparando la tua settimana…' : modo === 'modifica' ? 'Applica la modifica' : hasPlan ? 'Rifai la settimana' : 'Genera il piano della settimana'}
      </button>
      {onClose && !generating && (
        <button type="button" onClick={onClose} className="w-full text-xs text-muted mt-2 py-1">Annulla</button>
      )}
    </div>
  );
}
