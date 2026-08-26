'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Prompt NON bloccante per gli utenti registrati prima dell'age gate:
 * chiede la data di nascita al primo accesso utile. Serve a misurare quanti
 * utenti esistenti sarebbero sotto soglia (dato per la decisione 14 vs 16).
 *
 * Nessun blocco: chi è già registrato continua a usare l'app (spec intervento 1.5).
 * "Più tardi" nasconde il banner per la sessione corrente (sessionStorage) —
 * riappare al prossimo accesso finché la data non è salvata.
 */
export default function BirthdateBanner({
  userId,
  hasBirthDate,
}: {
  userId: string;
  hasBirthDate: boolean;
}) {
  const [birthDate, setBirthDate] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('birthdateBanner.dismissed') === '1';
    } catch {
      return false;
    }
  });

  if (!userId || hasBirthDate || saved || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('birthdateBanner.dismissed', '1');
    } catch { /* non bloccante */ }
  };

  const handleSave = async () => {
    setError('');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      setError('Inserisci una data valida');
      return;
    }
    const [y, m, d] = birthDate.split('-').map(Number);
    const now = new Date();
    let age = now.getFullYear() - y;
    if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
    if (age < 0 || age > 100) {
      setError('Inserisci una data valida');
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ birth_date: birthDate, age })
      .eq('user_id', userId);
    setSaving(false);
    if (updateError) {
      setError('Salvataggio non riuscito, riprova');
      return;
    }
    setSaved(true);
  };

  return (
    <div className="bg-surface border border-divider rounded-2xl p-4 shadow-sm">
      <p className="text-sm font-semibold text-app mb-1">Una cosa veloce 📅</p>
      <p className="text-xs text-muted leading-relaxed mb-3">
        Ci manca la tua data di nascita: è obbligatoria, sia per adattare il percorso
        alla tua età sia per requisiti di legge.
      </p>
      {error && <p className="text-xs text-red-300 mb-2">{error}</p>}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          className="flex-1 px-3 py-2 bg-surface-2 border border-divider rounded-xl focus:ring-2 focus:ring-forest-400 focus:border-transparent outline-none text-sm text-app"
          aria-label="Data di nascita"
        />
        <button
          onClick={handleSave}
          disabled={saving || !birthDate}
          className="bg-forest-500 hover:bg-forest-600 text-white text-sm font-semibold py-2 px-4 rounded-xl transition-all disabled:opacity-50 shrink-0"
        >
          {saving ? '…' : 'Salva'}
        </button>
      </div>
      <button
        onClick={handleDismiss}
        className="text-xs text-faint hover:text-muted mt-2.5 transition-colors"
      >
        Più tardi
      </button>
    </div>
  );
}
