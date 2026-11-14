'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { livelloFisico } from '@/lib/checkAccess';
import { PLAYER_LEVELS, PLAYER_ROLES, SPORT_ROLES } from '@/lib/constants';
import { salvaCorpoAperto } from '@/components/ParteSwitch';
import { AppLoader, Elenco, RigaElenco, TitoloGruppo } from '@/components/ui';

/**
 * Il Profilo (8/11, Ste: "profilo diviso corpo e mente, e un tab in alto a destra con le cose dell'account";
 * poi lo stile delle bozze: elenchi a righe per le liste). In cima chi sei, poi UNA Carta (dentro si passa da Mente a
 * Corpo a 360°, 9/11) e due elenchi, Mente (risposte, dati) e Corpo (storico, settimane passate). Il setup del Corpo
 * sta nella scheda Setup dell'Allenamento. Dati personali, abbonamento, Telegram,
 * notifiche, esci e cancella stanno in /account, dietro "Account" in alto a destra.
 */
export default function ProfiloPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [chi, setChi] = useState('');
  const [settimana, setSettimana] = useState(1);
  const [corpoAperto, setCorpoAperto] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data: p } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).single();
      const aperto = !!livelloFisico(p);
      salvaCorpoAperto(aperto);
      setCorpoAperto(aperto);
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

        <div className="space-y-3">
          {/* Una Carta sola (9/11): dentro si passa da Mente a Corpo a 360° */}
          <Elenco>
            <RigaElenco href="/carta" tono="verde" funzione="carta" titolo="La tua Carta" valore={corpoAperto ? 'Mente · Corpo' : 'Mente'} />
          </Elenco>

          <TitoloGruppo grande parte="mente" className="pt-4">Mente</TitoloGruppo>
          <Elenco>
            <RigaElenco href="/risposte" funzione="risposte" titolo="Le tue risposte" />
            <RigaElenco href="/statistiche" funzione="dati" titolo="I tuoi dati" />
          </Elenco>

          <TitoloGruppo grande parte="corpo" className="pt-4">Corpo</TitoloGruppo>
          <div className="parte-corpo">
          {corpoAperto ? (
            <Elenco>
              <RigaElenco href="/allenamento/storico" funzione="storico" titolo="Lo storico" />
              <RigaElenco href="/allenamento/mese" funzione="settimanePassate" titolo="Le settimane passate" />
            </Elenco>
          ) : (
            <Elenco>
              <RigaElenco href="/allenamento" bloccato icona={null} titolo="Allenamento fisico e tecnico" valore="Scopri" />
            </Elenco>
          )}
          </div>
        </div>
      </div>
    </main>
  );
}
