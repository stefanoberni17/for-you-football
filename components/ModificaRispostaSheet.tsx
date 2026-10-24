'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { Button, Field, Sheet, Textarea } from '@/components/ui';
import RispostaGuidata from '@/components/RispostaGuidata';
import { guidaPer } from '@/lib/risposteGuidate';
import { rispostaChiaveInfo } from '@/lib/risposteChiave';

/**
 * Modifica (o scrivi adesso) una risposta chiave (24/10, Ste: "in G6 e nel Gate il Protocollo
 * scritto in W11-G4 si deve poter MODIFICARE direttamente lì"). Stesso testo pre-compilato, salva
 * → POST /api/risposte: nuova versione + ultima versione dove la leggono tutti. Se il giorno ha
 * una guida (W4-G6, W11-G4) si scrive nelle sue parti, altrimenti in un campo libero.
 */
export default function ModificaRispostaSheet({ week, day, testoIniziale, open, onClose, onSalvata }: {
  week: number; day: number; testoIniziale: string; open: boolean; onClose: () => void; onSalvata: (testo: string) => void;
}) {
  const guida = guidaPer(week, day);
  const info = rispostaChiaveInfo(week, day);
  const [testo, setTesto] = useState(testoIniziale);
  const [saving, setSaving] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => { if (open) { setTesto(testoIniziale); setErrore(null); } }, [open, testoIniziale]);

  const salva = async () => {
    if (!testo.trim()) { setErrore('Scrivi qualcosa prima di salvare.'); return; }
    setSaving(true); setErrore(null);
    try {
      const res = await authFetch('/api/risposte', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ week, day, testo }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrore(data?.error === 'giorno_non_aperto' ? 'Questo giorno non è ancora stato aperto: scrivilo da lì.' : 'Non sono riuscito a salvare. Riprova.');
        return;
      }
      onSalvata(testo.trim());
      onClose();
    } catch {
      setErrore('Non sono riuscito a salvare. Controlla la connessione e riprova.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={saving ? undefined : onClose}
      eyebrow={`Settimana ${week} · giorno ${day}`}
      title={testoIniziale ? `Modifica: ${info?.label ?? 'la tua risposta'}` : `Scrivilo adesso: ${info?.label ?? 'la tua risposta'}`}
      subtitle="Ogni modifica resta salvata con la sua data. Carta, Coach e i giorni dopo usano l'ultima."
      fullscreen
      footer={(
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Annulla</Button>
          <Button variant="primary" fullWidth onClick={salva} loading={saving}>Salva</Button>
        </div>
      )}
    >
      <div className="space-y-4">
        {guida ? (
          <RispostaGuidata guida={guida} value={testo} onChange={setTesto} />
        ) : (
          <Field label="La tua risposta" htmlFor="modifica-risposta">
            <Textarea id="modifica-risposta" value={testo} onChange={(e) => setTesto(e.target.value)} rows={8} maxLength={4000} placeholder="Scrivi qui…" />
          </Field>
        )}
        {errore && <p className="text-body-sm text-danger">{errore}</p>}
      </div>
    </Sheet>
  );
}
