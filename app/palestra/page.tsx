'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { livelloFisico } from '@/lib/checkAccess';
import ParteSwitch, { leggiParte, salvaCorpoAperto, salvaParte, useResocontoPendente, type Parte } from '@/components/ParteSwitch';
import { AppLoader } from '@/components/ui';

/**
 * La Palestra (8/11, Ste: "fare qualcosa tipo così [le card grandi con la foto] … le scritte sono davvero tantissime
 * soprattutto da fuori, prima che uno entri dentro alle cose"). Fuori solo il selettore Mente | Corpo e una card
 * con la foto per ogni sezione: il nome e, se serve, una riga di stato. Le spiegazioni stanno dentro.
 * Le foto sono quelle di Ste della pagina di vendita, per la prova.
 */
type Tessera = { href: string; nome: string; foto: string; stato?: string; alta?: boolean; posizione?: string; pallino?: boolean };

function Card({ t }: { t: Tessera }) {
  return (
    <Link href={t.href} aria-label={t.nome}
      className={`group relative block overflow-hidden rounded-card bg-surface ${t.alta ? 'row-span-2' : ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={t.foto} alt="" className={`absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${t.posizione ?? 'object-top'}`} />
      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      {t.pallino && <span aria-label="Hai un resoconto da dare" className="absolute right-3 top-3 h-3 w-3 rounded-full bg-accent-glow shadow-glow ring-2 ring-black/40" />}
      <span className="absolute inset-x-0 bottom-0 p-4">
        <span className="block font-display text-title-1 font-bold uppercase leading-none tracking-tight text-white [text-shadow:0_1px_8px_rgba(0,0,0,.5)]">{t.nome}</span>
        {t.stato && <span className="mt-1.5 block text-body font-medium text-white/85">{t.stato}</span>}
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

  const mente: Tessera[] = [
    { href: '/settimane', nome: 'Percorso', foto: '/scopri/storia/sguardo.webp', stato: settimana > 12 ? 'Fatto' : `Settimana ${settimana}`, alta: true },
    { href: '/strumenti', nome: 'Allenamento', foto: '/scopri/storia/reggiana.webp' },
    { href: '/sos', nome: 'Quando si fa dura', foto: '/scopri/storia/colpo-di-testa.webp', posizione: 'object-[50%_20%]' },
  ];
  const corpo: Tessera[] = [
    { href: '/allenamento', nome: 'Allenamento', foto: '/scopri/storia/conduzione.webp', stato: oggi ?? undefined, alta: true, pallino: pendente },
    { href: '/allenamento/test', nome: 'Test', foto: '/scopri/storia/tiro.webp', alta: true, posizione: 'object-[60%_30%]' },
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
