'use client';

import { useEffect, useMemo, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { Chip, Field, Input, Textarea } from '@/components/ui';
import {
  ALTRO_SCELTA, componiRisposta, leggiRisposta, partiCompilate,
  type RispostaGuidata as Guida, type ValoriGuidati,
} from '@/lib/risposteGuidate';
import type { RispostaRow } from '@/lib/risposteChiave';

/**
 * La risposta guidata di un giorno (23/10): per ogni parte i chip delle opzioni e un campo libero,
 * sotto l'aiuto "lo avevi scritto così" preso dalle risposte dei giorni precedenti (/api/risposte).
 * Il valore che esce è il testo composto (`componiRisposta`): la pagina lo salva come una risposta normale.
 */
export default function RispostaGuidata({ guida, value, onChange, disabled = false }: {
  guida: Guida; value: string; onChange: (testo: string) => void; disabled?: boolean;
}) {
  const [valori, setValori] = useState<ValoriGuidati>(() => leggiRisposta(guida, value));
  const [hints, setHints] = useState<Record<string, string>>({});

  // Il testo salvato arriva dopo il primo render (fetch del giorno): si rilegge quando cambia da fuori
  useEffect(() => {
    if (value !== componiRisposta(guida, valori)) setValori(leggiRisposta(guida, value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (disabled || !guida.parti.some((p) => p.hintDa)) return;
    let vivo = true;
    (async () => {
      try {
        const res = await authFetch('/api/risposte');
        const data = await res.json();
        if (!vivo || !res.ok || !Array.isArray(data?.risposte)) return;
        const rows = data.risposte as RispostaRow[];
        const h: Record<string, string> = {};
        for (const p of guida.parti) {
          if (!p.hintDa) continue;
          const row = rows.find((r) => r.week === p.hintDa![0] && r.day === p.hintDa![1]);
          const t = row?.risposta?.trim();
          if (t) h[p.key] = t.length > 160 ? t.slice(0, 160) + '…' : t;
        }
        setHints(h);
      } catch { /* niente aiuti: il modulo funziona lo stesso */ }
    })();
    return () => { vivo = false; };
  }, [guida, disabled]);

  const aggiorna = (key: string, patch: { scelta?: string; altro?: string }) => {
    const next = { ...valori, [key]: { ...(valori[key] || {}), ...patch } };
    setValori(next);
    onChange(componiRisposta(guida, next));
  };

  const fatte = useMemo(() => partiCompilate(guida, valori), [guida, valori]);

  return (
    <div className="space-y-5">
      <p className="text-caption text-muted">{guida.titolo} · {fatte} su {guida.parti.length}</p>
      {guida.parti.map((p, i) => {
        const v = valori[p.key] || {};
        const altroAttivo = p.altro === 'scelta' ? v.scelta === ALTRO_SCELTA : true;
        if (p.tipo === 'testo') {
          return (
            <div key={p.key} className="space-y-2">
              <p className="text-body font-semibold text-app">{i + 1}. {p.label}</p>
              {p.aiuto && <p className="text-body-sm text-muted">{p.aiuto}</p>}
              <Textarea
                id={`guida-${p.key}`}
                aria-label={p.label}
                value={v.altro || ''}
                onChange={(e) => aggiorna(p.key, { scelta: ALTRO_SCELTA, altro: e.target.value })}
                disabled={disabled}
                rows={p.righe ?? 4}
                maxLength={1500}
                placeholder={p.altroPlaceholder}
              />
            </div>
          );
        }
        return (
          <div key={p.key} className="space-y-2">
            <p className="text-body font-semibold text-app">{i + 1}. {p.label}</p>
            {p.aiuto && <p className="text-body-sm text-muted">{p.aiuto}</p>}
            {hints[p.key] && (
              <p className="text-caption text-forest-300">{p.hintLabel || 'Avevi scritto'}: <span className="text-muted">«{hints[p.key]}»</span></p>
            )}
            <div className="flex flex-wrap gap-2">
              {p.opzioni.map((o) => (
                <Chip key={o} selected={v.scelta === o} disabled={disabled} onClick={() => aggiorna(p.key, { scelta: v.scelta === o ? undefined : o })}>{o}</Chip>
              ))}
              {p.altro === 'scelta' && (
                <Chip selected={v.scelta === ALTRO_SCELTA} disabled={disabled} onClick={() => aggiorna(p.key, { scelta: v.scelta === ALTRO_SCELTA ? undefined : ALTRO_SCELTA })}>{p.altroLabel}</Chip>
              )}
            </div>
            {altroAttivo && (
              <Field label={p.altro === 'scelta' ? 'La tua parola' : p.altroLabel} htmlFor={`guida-${p.key}`} optional={p.altro === 'nota'}>
                <Input
                  id={`guida-${p.key}`}
                  value={v.altro || ''}
                  onChange={(e) => aggiorna(p.key, { altro: e.target.value })}
                  disabled={disabled}
                  maxLength={200}
                  placeholder={p.altroPlaceholder}
                />
              </Field>
            )}
          </div>
        );
      })}
    </div>
  );
}
