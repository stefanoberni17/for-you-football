'use client';

import { useEffect, useState } from 'react';
import { Activity, Brain, ChevronRight, Moon, Zap } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { Button, Card, SectionTitle } from '@/components/ui';

interface CheckinRow { physical_state: number | null; sleep_hours: number | null; recovery_quality: number | null; mental_state: number | null }

function media(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}
function tendenza(values: number[]): 'up' | 'down' | 'stable' {
  if (values.length < 3) return 'stable';
  const half = Math.floor(values.length / 2);
  const diff = media(values.slice(half)) - media(values.slice(0, half));
  if (diff > 0.3) return 'up';
  if (diff < -0.3) return 'down';
  return 'stable';
}

/**
 * "Il tuo stato" (ultimi 7 check-in): le 4 medie con la tendenza. Stava nella home (20/10 spostato nella Carta,
 * dove ci sono già tutti i dati del ragazzo): la home resta sulle cose di oggi. Si carica da solo; senza
 * almeno 2 check-in non si vede.
 */
export default function StatoRecente({ className = '' }: { className?: string }) {
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  useEffect(() => {
    authFetch('/api/checkin/history?days=7').then((r) => (r.ok ? r.json() : null)).then((j) => { if (j?.checkins) setCheckins(j.checkins); }).catch(() => {});
  }, []);
  const righe = checkins.length >= 2 ? [
    { Icon: Activity, label: 'Fisico', values: checkins.filter((c) => c.physical_state !== null).map((c) => c.physical_state as number), unit: '/10', color: 'var(--color-accent-glow)' },
    { Icon: Moon, label: 'Sonno', values: checkins.filter((c) => c.sleep_hours !== null).map((c) => Number(c.sleep_hours)), unit: 'h', color: 'var(--color-info)' },
    { Icon: Zap, label: 'Recupero', values: checkins.filter((c) => c.recovery_quality !== null).map((c) => c.recovery_quality as number), unit: '/10', color: 'var(--color-warning)' },
    { Icon: Brain, label: 'Mentale', values: checkins.filter((c) => c.mental_state !== null).map((c) => c.mental_state as number), unit: '/10', color: '#a78bfa' },
  ].map((r) => ({ ...r, avg: media(r.values) })).filter((r) => r.values.length >= 2) : [];
  if (!righe.length) return null;
  return (
    <Card padding="md" className={className}>
      <SectionTitle title="Il tuo stato" subtitle="Media degli ultimi 7 check-in" className="mb-3" />
      <div className="grid grid-cols-4 gap-2">
        {righe.map((r) => {
          const t = tendenza(r.values);
          const Icon = r.Icon;
          return (
            <div key={r.label} className="rounded-btn bg-surface-2 px-2 py-2.5 text-center">
              <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: r.color }} aria-hidden="true" />
              <p className="font-display text-title-3 font-bold text-app tabular-nums leading-none">
                {r.avg}<span className="text-caption text-muted font-normal">{r.unit}</span>
                <span className={`text-caption ml-0.5 ${t === 'up' ? 'text-success' : t === 'down' ? 'text-danger' : 'text-faint'}`}>{t === 'up' ? '↑' : t === 'down' ? '↓' : ''}</span>
              </p>
              <p className="text-overline uppercase tracking-wider text-muted mt-1">{r.label}</p>
            </div>
          );
        })}
      </div>
      <Button variant="ghost" size="sm" fullWidth className="mt-2" iconRight={<ChevronRight size={16} aria-hidden />} href="/statistiche">
        Tutti i tuoi dati
      </Button>
    </Card>
  );
}
