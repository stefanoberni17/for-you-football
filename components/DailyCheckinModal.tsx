'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import SaveErrorBanner from './SaveErrorBanner';
import { Button, Card, Sheet } from '@/components/ui';

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

  // Ogni cursore in una card sollevata: nome, valore grande a destra, descrizione, slider
  const sliderCard = (
    id: string,
    title: string,
    display: React.ReactNode,
    description: string,
    valueColor: string,
    input: React.ReactNode,
    edges: [string, string, string],
  ) => (
    <Card variant="raised" padding="sm">
      <div className="flex items-start justify-between gap-3">
        <label htmlFor={id} className="text-label font-semibold text-muted uppercase tracking-wide pt-1.5">{title}</label>
        <span className={`font-display text-title-1 font-bold tabular-nums ${valueColor}`}>{display}</span>
      </div>
      <p className="text-body-sm text-app mb-2">{description}</p>
      {input}
      <div className="flex justify-between text-caption text-faint mt-1">
        <span>{edges[0]}</span>
        <span>{edges[1]}</span>
        <span>{edges[2]}</span>
      </div>
    </Card>
  );

  const slider = (id: string, value: number, setValue: (v: number) => void) => (
    <input
      id={id}
      type="range"
      min={0}
      max={10}
      step={1}
      value={value}
      onChange={e => setValue(parseInt(e.target.value))}
      className="w-full cursor-pointer"
    />
  );

  return (
    <Sheet
      open
      title="Come stai oggi?"
      subtitle="20 secondi. Poi si va in campo."
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
            Salva
          </Button>
          <Button variant="ghost" fullWidth onClick={onSkip}>
            Salta per oggi
          </Button>
        </>
      }
    >
      <div className="space-y-3 pt-1">
        {sliderCard(
          'checkin-fisico', 'Fisico',
          <>{physicalState}<span className="text-body-sm font-semibold text-muted">/10</span></>,
          getSliderLabel(physicalState, PHYSICAL_LABELS), getSliderColor(physicalState),
          slider('checkin-fisico', physicalState, setPhysicalState),
          ['Esausto', 'Nella media', 'Perfetto'],
        )}

        {sliderCard(
          'checkin-sonno', 'Sonno',
          <>{sleepHours}<span className="text-body-sm font-semibold text-muted">h</span></>,
          sleepHours < 6 ? 'Poco' : sleepHours >= 8 ? 'Ottimo' : 'Nella norma',
          sleepHours < 6 ? 'text-warning' : sleepHours >= 8 ? 'text-accent-glow' : 'text-forest-400',
          <input
            id="checkin-sonno"
            type="range"
            min={4}
            max={12}
            step={0.5}
            value={sleepHours}
            onChange={e => setSleepHours(parseFloat(e.target.value))}
            className="w-full cursor-pointer"
          />,
          ['4h', '8h', '12h'],
        )}

        {sliderCard(
          'checkin-recupero', 'Recupero',
          <>{recoveryQuality}<span className="text-body-sm font-semibold text-muted">/10</span></>,
          getSliderLabel(recoveryQuality, RECOVERY_LABELS), getSliderColor(recoveryQuality),
          slider('checkin-recupero', recoveryQuality, setRecoveryQuality),
          ['Esausto', 'Normale', 'Fresco'],
        )}

        {sliderCard(
          'checkin-mentale', 'Testa',
          <>{mentalState}<span className="text-body-sm font-semibold text-muted">/10</span></>,
          getSliderLabel(mentalState, MENTAL_LABELS), getSliderColor(mentalState),
          slider('checkin-mentale', mentalState, setMentalState),
          ['Altrove', 'Normale', 'Lucido'],
        )}

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
