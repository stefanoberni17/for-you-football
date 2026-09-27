'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { resetDeletedCache } from '@/components/PaywallGuard';
import { AppLoader, Button, Card } from '@/components/ui';
import { RotateCcw, LogOut } from 'lucide-react';
import { ACCOUNT_GRACE_DAYS } from '@/lib/constants';

/**
 * /riattiva — l'account è in cancellazione (profiles.deleted_at, migration 028): i dati restano
 * ACCOUNT_GRACE_DAYS giorni. Da qui si riattiva (POST /api/account/reactivate) o si esce.
 * PaywallGuard manda qui da ogni altra pagina finché deleted_at è impostato.
 */
export default function RiattivaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [scadenza, setScadenza] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }
      try {
        const res = await authFetch('/api/account/status');
        const data = await res.json();
        if (!data?.deletedAt) { resetDeletedCache(); router.replace('/'); return; } // non è in cancellazione
        setName(data.name);
        setScadenza(data.scadenza);
      } catch { setError('Non riesco a leggere lo stato dell\'account. Riprova tra un minuto.'); }
      setLoading(false);
    })();
  }, [router]);

  const riattiva = async () => {
    if (working) return;
    setWorking(true); setError('');
    try {
      const res = await authFetch('/api/account/reactivate', { method: 'POST' });
      if (!res.ok) throw new Error('reactivate_failed');
      resetDeletedCache();
      router.replace('/');
    } catch {
      setError('Non sono riuscito a riattivare l\'account. Riprova tra un minuto, o scrivi a info@foryoufootball.it.');
      setWorking(false);
    }
  };

  const esci = async () => {
    await supabase.auth.signOut().catch(() => {});
    router.replace('/login');
  };

  if (loading) return <AppLoader label="Un attimo…" />;
  const dataScadenza = scadenza ? new Date(scadenza).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  return (
    <main className="min-h-screen bg-app pt-safe px-4 pb-10 flex flex-col items-center justify-center">
      <Card className="w-full max-w-sm space-y-5">
        <div>
          <h1 className="font-display text-title-1 font-bold text-app">{name ? `${name}, ` : ''}il tuo account è in cancellazione</h1>
          <p className="text-muted text-body-sm mt-2">
            I tuoi dati (percorso, riflessioni, conversazioni col Coach, allenamenti) restano {ACCOUNT_GRACE_DAYS} giorni{dataScadenza ? `, fino al ${dataScadenza}` : ''}. Poi spariscono per sempre.
          </p>
          <p className="text-muted text-body-sm mt-2">Se ci hai ripensato, riattivalo: ritrovi tutto com&apos;era, e se stavi pagando a rate riprendono da dove si erano fermate.</p>
        </div>
        {error && (
          <div className="bg-danger/15 border border-danger/30 text-danger px-4 py-3 rounded-btn text-body-sm" role="alert">{error}</div>
        )}
        <Button variant="hero" fullWidth loading={working} onClick={riattiva} icon={<RotateCcw size={18} aria-hidden="true" />}>
          Riattiva l&apos;account
        </Button>
        <Button variant="ghost" fullWidth onClick={esci} icon={<LogOut size={18} aria-hidden="true" />}>
          Lascia com&apos;è ed esci
        </Button>
      </Card>
    </main>
  );
}
