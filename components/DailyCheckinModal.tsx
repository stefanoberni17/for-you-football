'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import SaveErrorBanner from './SaveErrorBanner';
import { Button, Sheet } from '@/components/ui';

interface DailyCheckinModalProps {
  userId: string;
  onComplete: () => void;
  onSkip: () => void;
}

// Label per i punti chiave degli slider 0-10
const PHYSICAL_LABELS: Record<number, string> = {
  0: 'Esausto', 3: 'Stanco', 5: 'Nella media', 7: 'Bene', 10: 'Perfetto',
};
const RECOVERY_LABELS: Record<number, string> = {
  0: 'Esausto', 3: 'Stanco', 5: 'Normale', 7: 'In forma', 10: 'Fresco al 100%',
};
const MENTAL_LABELS: Record<number, string> = {
  0: 'Testa altrove', 3: 'Un po\' giù', 5: 'Normale', 7: 'Concentrato', 10: 'Lucido e carico',
};

function getSliderLabel(value: number, labels: Record<number, string>): string {
  // Trova la label più vicina
  const keys = Object.keys(labels).map(Number).sort((a, b) => a - b);
  let closest = keys[0];
  for (const k of keys) {
    if (Math.abs(k - value) < Math.abs(closest - value)) closest = k;
  }
  return labels[closest];
}

function getSliderColor(value: number): string {
  if (value <= 3) return 'text-danger';
  if (value <= 5) return 'text-warning';
  if (value <= 7) return 'text-forest-400';
  return 'text-accent-glow';
}

export default function DailyCheckinModal({ userId, onComplete, onSkip }: DailyCheckinModalProps) {
  const [physicalState, setPhysicalState] = useState<number>(5);
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [recoveryQuality, setRecoveryQuality] = useState<number>(5);
  const [mentalState, setMentalState] = useState<number>(5);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  // Consenso esplicito ai dati sulla salute (migration 021): chi si è registrato prima lo dà qui, una volta
  const [needsHealthConsent, setNeedsHealthConsent] = useState(false);
  const [healthConsent, setHealthConsent] = useState(false);
  useEffect(() => {
    authFetch('/api/consent').then(async (r) => {
      if (!r.ok) return;
      const c = await r.json();
      if (c && c.health_data === false) setNeedsHealthConsent(true);
    }).catch(() => { /* no-op: in dubbio non si blocca il check-in */ });
  }, []);

  const handleSave = async () => {
    if (needsHealthConsent && !healthConsent) return;
    setSaving(true);
    setSaveError(false);
    try {
      if (needsHealthConsent) {
        const rc = await authFetch('/api/consent', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document: 'health_data', channel: 'checkin' }),
        });
        if (!rc.ok) throw new Error('consent failed');
        setNeedsHealthConsent(false);
      }
      const res = await authFetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          physicalState,
          sleepHours,
          recoveryQuality,
          mentalState,
        }),
      });
      if (!res.ok) throw new Error('checkin failed');
      onComplete();
    } catch {
      // Il check-in NON è stato salvato: dirlo, non chiudere come se lo fosse.
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const sliderRow = (
    emoji: string,
    title: string,
    value: number,
    setValue: (v: number) => void,
    labels: Record<number, string>,
    edges: [string, string, string]
  ) => (
    <div className="w-full">
      <div className="flex items-end justify-between gap-3 mb-1">
        <span className="text-body font-semibold text-app">
          <span className="mr-1.5" aria-hidden>{emoji}</span>
          {title}
        </span>
        <span className="text-right">
          <span className={`font-display text-title-1 font-bold tabular-nums ${getSliderColor(value)}`}>
            {value}<span className="text-body-sm font-semibold text-muted">/10</span>
          </span>
          <span className="block text-body-sm text-muted">{getSliderLabel(value, labels)}</span>
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={e => setValue(parseInt(e.target.value))}
        aria-label={title}
        className="w-full cursor-pointer"
      />
      <div className="flex justify-between text-caption text-faint">
        <span>{edges[0]}</span>
        <span>{edges[1]}</span>
        <span>{edges[2]}</span>
      </div>
    </div>
  );

  return (
    <Sheet
      open
      title="Come stai oggi?"
      subtitle="30 secondi di onestà — il Coach li userà per supportarti"
      footer={
        <>
          {saveError && (
            <SaveErrorBanner
              message="Check-in non salvato. Riprova o salta per oggi."
              onRetry={handleSave}
            />
          )}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleSave}
            loading={saving}
            disabled={needsHealthConsent && !healthConsent}
          >
            {saving ? 'Salvataggio…' : 'Salva e continua'}
          </Button>
          <Button variant="ghost" fullWidth onClick={onSkip}>
            Salta per oggi
          </Button>
        </>
      }
    >
      <div className="space-y-5 pt-2">
        {sliderRow('💪', 'Fisico', physicalState, setPhysicalState, PHYSICAL_LABELS, ['Esausto', 'Nella media', 'Perfetto'])}

        {/* Sonno (scala diversa: ore) */}
        <div className="w-full">
          <div className="flex items-end justify-between gap-3 mb-1">
            <span className="text-body font-semibold text-app">
              <span className="mr-1.5" aria-hidden>😴</span>
              Sonno
            </span>
            <span className="text-right">
              <span className="font-display text-title-1 font-bold tabular-nums text-app">
                {sleepHours}<span className="text-body-sm font-semibold text-muted">h</span>
              </span>
              <span className="block text-body-sm text-muted">
                {sleepHours < 6 ? 'poco' : sleepHours >= 8 ? 'ottimo' : 'nella norma'}
              </span>
            </span>
          </div>
          <input
            type="range"
            min={4}
            max={12}
            step={0.5}
            value={sleepHours}
            onChange={e => setSleepHours(parseFloat(e.target.value))}
            aria-label="Sonno"
            className="w-full cursor-pointer"
          />
          <div className="flex justify-between text-caption text-faint">
            <span>4h</span>
            <span>8h</span>
            <span>12h</span>
          </div>
        </div>

        {sliderRow('🦵', 'Recupero muscolare', recoveryQuality, setRecoveryQuality, RECOVERY_LABELS, ['Esausto', 'Normale', 'Fresco'])}
        {sliderRow('🧠', 'Mentale', mentalState, setMentalState, MENTAL_LABELS, ['Testa altrove', 'Normale', 'Lucido'])}

        {needsHealthConsent && (
          <label className="flex items-start gap-3 min-h-[44px] py-2 text-body-sm text-app leading-relaxed cursor-pointer">
            <input type="checkbox" checked={healthConsent} onChange={(e) => setHealthConsent(e.target.checked)}
              className="mt-0.5 w-6 h-6 accent-forest-500 shrink-0" />
            <span>Acconsento a salvare questi dati sulla salute (come sto, sonno, recupero). Servono solo a regolare il percorso. Lo chiediamo una volta sola.</span>
          </label>
        )}
      </div>
    </Sheet>
  );
}
