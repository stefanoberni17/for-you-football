'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Calendar } from 'lucide-react';
import { Banner, Button, Field, Input } from '@/components/ui';

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
    <Banner
      tone="info"
      icon={<Calendar size={20} />}
      title="Una cosa veloce"
      secondary={{ label: 'Più tardi', onClick: handleDismiss }}
    >
      <p>
        Ci manca la tua data di nascita: è obbligatoria, sia per adattare il percorso
        alla tua età sia per requisiti di legge.
      </p>
      <div className="flex flex-col gap-3 mt-3">
        <Field label="Data di nascita" htmlFor="birthdate-banner" error={error || undefined}>
          <Input
            id="birthdate-banner"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            invalid={!!error}
          />
        </Field>
        <Button variant="primary" fullWidth onClick={handleSave} disabled={!birthDate} loading={saving}>
          Salva
        </Button>
      </div>
    </Banner>
  );
}
