'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart3, BookOpen, CalendarRange, ChevronRight, History, IdCard, Settings, SlidersHorizontal } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { livelloFisico } from '@/lib/checkAccess';
import { PLAYER_LEVELS, PLAYER_ROLES, SPORT_ROLES } from '@/lib/constants';
import ParteSwitch, { leggiParte, salvaCorpoAperto, type Parte } from '@/components/ParteSwitch';
import { AppLoader, Card } from '@/components/ui';

/**
 * Il Profilo (8/11, Ste: "profilo diviso corpo e mente, e un tab in alto a destra con le cose dell'account").
 * In cima chi sei; sotto lo stesso selettore Mente | Corpo della Palestra e della Chat, con le TUE cose di quella
 * parte (Carta, risposte, dati, storico, setup). Dati personali, abbonamento, Telegram, notifiche, esci e
 * cancella stanno in /account, dietro "Account" in alto a destra.
 */

function Riga({ href, icon, titolo, sotto }: { href: string; icon: ReactNode; titolo: string; sotto: string }) {
  return (
    <Card padding="sm" href={href} aria-label={titolo}>
      <span className="flex min-h-[44px] items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-forest-400" aria-hidden>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-body-lg font-semibold text-app">{titolo}</span>
          <span className="block text-body-sm text-muted">{sotto}</span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-faint" aria-hidden />
      </span>
    </Card>
  );
}

export default function ProfiloPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [chi, setChi] = useState('');
  const [settimana, setSettimana] = useState(1);
  const [corpoAperto, setCorpoAperto] = useState(false);
  const [parte, setParte] = useState<Parte>('mente');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data: p } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).single();
      const aperto = !!livelloFisico(p);
      salvaCorpoAperto(aperto);
      setCorpoAperto(aperto);
      setParte(aperto && leggiParte() === 'corpo' ? 'corpo' : 'mente');
      setNome(p?.name || '');
      setSettimana(p?.current_week || 1);
      const ruoliOpz = SPORT_ROLES[p?.sport || 'calcio'] || PLAYER_ROLES;
      const ruoli = String(p?.role || '').split(',').filter(Boolean)
        .map((v) => ruoliOpz.find((r) => r.value === v)?.label || v);
      const livello = PLAYER_LEVELS.find((l) => l.value === p?.level)?.label;
      setChi([ruoli.join(', '), livello].filter(Boolean).join(' · '));
      setLoading(false);
    })();
  }, [router]);

  if (loading) return <AppLoader />;

  return (
    <main className="min-h-screen bg-app pt-safe px-4 pb-tabbar-lg">
      <div className="mx-auto max-w-xl">
        {/* ── Chi sei, e l'account in alto a destra ── */}
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-forest-500 to-forest-600 shadow-e1" aria-hidden>
            <span className="font-display text-title-2 font-bold text-white">{nome ? nome.charAt(0).toUpperCase() : '⚽'}</span>
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <h1 className="truncate font-display text-title-1 font-bold text-app">{nome || 'Il tuo profilo'}</h1>
            <p className="text-body text-muted">{chi || `Settimana ${settimana}`}</p>
          </div>
          <Link href="/account" aria-label="Account: dati, abbonamento, notifiche"
            className="-mr-2 flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-body-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-app">
            <Settings size={20} aria-hidden /> Account
          </Link>
        </div>

        <ParteSwitch parte={parte} onChange={setParte} corpoBloccato={!corpoAperto} className="mb-5" />

        {parte === 'mente' ? (
          <div className="space-y-3">
            <Riga href="/carta?vista=mente" icon={<IdCard size={18} />} titolo="La tua Carta" sotto="Il tuo gioco mentale, scritto da te" />
            <Riga href="/risposte" icon={<BookOpen size={18} />} titolo="Le tue risposte" sotto="Quello che hai scritto nei giorni e nei Gate" />
            <Riga href="/statistiche" icon={<BarChart3 size={18} />} titolo="I tuoi dati" sotto="Check-in, sonno, le tue azioni" />
          </div>
        ) : (
          <div className="space-y-3">
            <Riga href="/carta?vista=corpo" icon={<IdCard size={18} />} titolo="La tua Carta" sotto="Il rombo: forza, velocità, resistenza, tecnica" />
            <Riga href="/allenamento/storico" icon={<History size={18} />} titolo="Lo storico" sotto="Sedute, esercizi, test, squadra e partite" />
            <Riga href="/allenamento/mese" icon={<CalendarRange size={18} />} titolo="Le settimane passate" sotto="Cosa hai allenato, settimana per settimana" />
            <Riga href="/allenamento/setup" icon={<SlidersHorizontal size={18} />} titolo="Il tuo setup" sotto="Attrezzi, giorni, obiettivi, limitazioni" />
          </div>
        )}
      </div>
    </main>
  );
}
