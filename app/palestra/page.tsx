'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { livelloFisico } from '@/lib/checkAccess';
import ParteSwitch, { leggiParte, salvaCorpoAperto, salvaParte, useResocontoPendente, type Parte } from '@/components/ParteSwitch';
import { AppLoader } from '@/components/ui';
import { Dumbbell, LifeBuoy, Route, Timer, Wind, type LucideIcon } from 'lucide-react';

/**
 * La Palestra (8/11, Ste: "fare qualcosa tipo così [le card grandi] … le scritte sono davvero tantissime soprattutto
 * da fuori, prima che uno entri dentro alle cose"; poi: "non mettiamo immagini di persone: stilizzati o tipo icone").
 * Fuori solo il selettore Mente | Corpo e una card per sezione: sfondo verde del brand in tonalità diverse, il campo
 * disegnato a linee sottili, un'icona grande, il nome e al massimo una riga di stato. Le spiegazioni stanno dentro.
 */
type Tessera = {
  href: string; nome: string; Icona: LucideIcon; sfondo: string; campo: 'centro' | 'area' | 'porta' | 'fascia';
  stato?: string; alta?: boolean; pallino?: boolean;
};

/** Il campo stilizzato, a linee bianche quasi trasparenti: un pezzo diverso per card. */
function Campo({ tipo }: { tipo: Tessera['campo'] }) {
  const linea = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 } as const;
  return (
    <svg aria-hidden viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full text-white/[0.09]">
      {tipo === 'centro' && <><line x1="0" y1="150" x2="200" y2="150" {...linea} /><circle cx="100" cy="150" r="48" {...linea} /><circle cx="100" cy="150" r="3" fill="currentColor" /></>}
      {tipo === 'area' && <><rect x="30" y="-2" width="140" height="80" {...linea} /><rect x="65" y="-2" width="70" height="30" {...linea} /><path d="M70 78 A40 40 0 0 0 130 78" {...linea} /><circle cx="100" cy="55" r="3" fill="currentColor" /></>}
      {tipo === 'porta' && <><rect x="40" y="220" width="120" height="82" {...linea} /><rect x="70" y="270" width="60" height="32" {...linea} /><path d="M75 220 A35 35 0 0 1 125 220" {...linea} /></>}
      {tipo === 'fascia' && <><line x1="0" y1="80" x2="200" y2="80" {...linea} /><circle cx="200" cy="80" r="60" {...linea} /><line x1="20" y1="0" x2="20" y2="300" {...linea} /></>}
    </svg>
  );
}

function Card({ t }: { t: Tessera }) {
  const { Icona } = t;
  return (
    <Link href={t.href} aria-label={t.nome}
      className={`group relative block overflow-hidden rounded-card ${t.sfondo} ${t.alta ? 'row-span-2' : ''}`}>
      <Campo tipo={t.campo} />
      <Icona aria-hidden strokeWidth={1.25}
        className={`absolute text-white/90 transition-transform duration-300 group-hover:scale-105 ${t.alta ? 'left-4 top-5 h-20 w-20' : 'left-4 top-4 h-14 w-14'}`} />
      {t.pallino && <span aria-label="Hai un resoconto da dare" className="absolute right-3 top-3 h-3 w-3 rounded-full bg-accent-glow shadow-glow ring-2 ring-black/30" />}
      <span className="absolute inset-x-0 bottom-0 p-4">
        <span className="block break-words font-display text-title-2 font-bold uppercase leading-tight tracking-tight text-white min-[400px]:text-title-1">{t.nome}</span>
        {t.stato && <span className="mt-1.5 block text-body font-medium text-white/80">{t.stato}</span>}
      </span>
    </Link>
  );
}

export default function PalestraPage() {
  const router = useRouter();
  const [pronto, setPronto] = useState(false);
  const [parte, setParte] = useState<Parte>('mente');
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
      setParte(aperto && leggiParte() === 'corpo' ? 'corpo' : 'mente');
      setPronto(true);
      if (aperto) {
        // Una riga sola sulla card del Corpo: la seduta di oggi, se c'è (lettura leggera)
        authFetch('/api/training/oggi').then((r) => (r.ok ? r.json() : null)).then((o) => {
          if (o?.painHold) setOggi('In pausa');
          else if (o?.seduta?.stato === 'oggi') setOggi(`Oggi: ${o.seduta.titolo}`);
          else if (o?.seduta?.stato === 'recuperabile') setOggi('Una seduta da recuperare');
        }).catch(() => {});
      }
    })();
  }, [router]);

  if (!pronto) return <AppLoader />;

  // Tutto nel verde del brand, in tonalità diverse: una card si riconosce dall'icona e dal pezzo di campo
  const mente: Tessera[] = [
    { href: '/settimane', nome: 'Percorso', Icona: Route, campo: 'centro', alta: true,
      sfondo: 'bg-gradient-to-b from-forest-500 to-forest-800', stato: settimana > 12 ? 'Fatto' : `Settimana ${settimana}` },
    { href: '/strumenti', nome: 'Allenamento', Icona: Wind, campo: 'area', sfondo: 'bg-gradient-to-br from-forest-700 to-forest-900' },
    { href: '/sos', nome: 'Quando si fa dura', Icona: LifeBuoy, campo: 'porta', sfondo: 'bg-gradient-to-br from-surface-3 to-surface' },
  ];
  const corpo: Tessera[] = [
    { href: '/allenamento', nome: 'Allenamento', Icona: Dumbbell, campo: 'fascia', alta: true, pallino: pendente,
      sfondo: 'bg-gradient-to-b from-forest-500 to-forest-800', stato: oggi ?? undefined },
    { href: '/allenamento/test', nome: 'Test', Icona: Timer, campo: 'centro', alta: true, sfondo: 'bg-gradient-to-b from-forest-700 to-forest-900' },
  ];

  return (
    <main className="min-h-screen bg-app pt-safe px-4 pb-tabbar-lg">
      <div className="mx-auto max-w-xl">
        <ParteSwitch parte={parte} corpoBloccato={!corpoAperto}
          onChange={(p) => { salvaParte(p); setParte(p); }} className="mb-4" />
        <div className="grid grid-cols-2 gap-3 [grid-auto-rows:clamp(170px,calc((100svh-230px)/2),300px)]">
          {(parte === 'mente' ? mente : corpo).map((t) => <Card key={t.href} t={t} />)}
        </div>
      </div>
    </main>
  );
}
