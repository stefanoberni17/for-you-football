'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, LifeBuoy, Route, Timer, Wind, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { livelloFisico } from '@/lib/checkAccess';
import { salvaCorpoAperto, useResocontoPendente } from '@/components/ParteSwitch';
import { useMeditation } from '@/components/MeditationContext';
import { AppLoader, GrigliaRiquadri, Riquadro, TitoloGruppo } from '@/components/ui';

/**
 * La Palestra (8/11, stile B delle bozze, Ste: «vai come proposto»): Mente e Corpo nella stessa pagina, ognuno con
 * i suoi riquadri piccoli, niente selettore. Il riquadro verde è la cosa principale del gruppo. Le spiegazioni
 * stanno dentro le sezioni. Chi non ha il Corpo vede i riquadri col lucchetto, che portano alla pagina di assaggio.
 */
export default function PalestraPage() {
  const router = useRouter();
  const { openMeditation } = useMeditation();
  const [pronto, setPronto] = useState(false);
  const [corpoAperto, setCorpoAperto] = useState(false);
  const [settimana, setSettimana] = useState(1);
  const [oggi, setOggi] = useState<string | null>(null);
  const pendente = useResocontoPendente();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { data: p } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).single();
      const aperto = !!livelloFisico(p);
      salvaCorpoAperto(aperto);
      setCorpoAperto(aperto);
      setSettimana(p?.current_week || 1);
      setPronto(true);
      if (aperto) {
        // Una parola sul riquadro del Corpo: la seduta di oggi, se c'è (lettura leggera)
        authFetch('/api/training/oggi').then((r) => (r.ok ? r.json() : null)).then((o) => {
          if (o?.painHold) setOggi('In pausa');
          else if (o?.seduta?.stato === 'oggi') setOggi(`Oggi · ~${o.seduta.durataMin}'`);
          else if (o?.seduta?.stato === 'recuperabile') setOggi('Da recuperare');
        }).catch(() => {});
      }
    })();
  }, [router]);

  if (!pronto) return <AppLoader />;

  return (
    <main className="min-h-screen bg-app pt-safe px-4 pb-tabbar-lg">
      <div className="mx-auto max-w-xl space-y-3">
        <h1 className="mb-3 font-display text-display font-bold text-app">Palestra</h1>

        <TitoloGruppo>Mente</TitoloGruppo>
        <GrigliaRiquadri>
          <Riquadro href="/settimane" tono="verde" icona={<Route />} titolo="Percorso"
            valore={<span className="text-body-sm font-semibold text-forest-100">{settimana > 12 ? 'Fatto' : `Sett. ${settimana}`}</span>} />
          <Riquadro href="/strumenti" icona={<Wind />} titolo="Allenamento" />
          <Riquadro href="/sos" icona={<LifeBuoy />} titolo="Quando si fa dura" />
          <Riquadro onClick={openMeditation} icona={<Zap />} titolo="Reset rapido"
            valore={<span className="text-body-sm font-semibold text-muted">1&apos;</span>} />
        </GrigliaRiquadri>

        <TitoloGruppo className="pt-4">Corpo</TitoloGruppo>
        <GrigliaRiquadri>
          <Riquadro href="/allenamento" tono={corpoAperto ? 'verde' : 'scuro'} bloccato={!corpoAperto} icona={<Dumbbell />} titolo="Allenamento"
            pallino={corpoAperto && pendente}
            valore={oggi ? <span className="text-body-sm font-semibold text-forest-100">{oggi}</span> : undefined} />
          <Riquadro href={corpoAperto ? '/allenamento/test' : '/allenamento'} bloccato={!corpoAperto} icona={<Timer />} titolo="Test" />
        </GrigliaRiquadri>
      </div>
    </main>
  );
}
