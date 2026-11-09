'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Brain, Dumbbell, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import BackButton from '@/components/ui/BackButton';
import Testata from '@/components/ui/Testata';
import { livelloFisico } from '@/lib/checkAccess';
import { EVENTO as EVENTO_RESOCONTI, pendenteAdesso } from '@/lib/resocontoPendente';

/**
 * Mente | Corpo (8/11, Ste: "l'app è bellissima ma ci sono tante cose e non si capisce come arrivarci"):
 * UN selettore, uguale in Palestra, Chat e Profilo. L'ultima parte scelta resta sul dispositivo, così le tab
 * riaprono dove eri. Il Corpo che non hai ha il lucchetto e porta alla pagina di assaggio (/allenamento).
 * Prima c'era "Testa | Fisico" solo nella Palestra (`palestra.parte`): si legge ancora come ripiego.
 */
export type Parte = 'mente' | 'corpo';

const KEY = 'app.parte';
const KEY_VECCHIA = 'palestra.parte';
const KEY_CORPO = 'app.corpoAperto'; // "1" | "0" + ora: il lucchetto senza aspettare la rete
const CORPO_TTL_MS = 5 * 60 * 1000;
export const EVENTO_PARTE = 'fyf:parte';

export function salvaParte(p: Parte): void {
  try {
    localStorage.setItem(KEY, p);
    window.dispatchEvent(new Event(EVENTO_PARTE));
  } catch { /* private mode */ }
}

export function leggiParte(): Parte | null {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'mente' || v === 'corpo') return v;
    const vecchia = localStorage.getItem(KEY_VECCHIA);
    return vecchia === 'fisico' ? 'corpo' : vecchia === 'testa' ? 'mente' : null;
  } catch { return null; }
}

function leggiCorpoCache(): { aperto: boolean; fresco: boolean } | null {
  try {
    const raw = localStorage.getItem(KEY_CORPO);
    if (!raw) return null;
    const [v, t] = raw.split(':');
    return { aperto: v === '1', fresco: Date.now() - Number(t || 0) < CORPO_TTL_MS };
  } catch { return null; }
}

/** Le pagine che hanno già il profilo lo scrivono qui: il selettore lo legge senza un'altra richiesta. */
export function salvaCorpoAperto(aperto: boolean): void {
  try {
    localStorage.setItem(KEY_CORPO, `${aperto ? 1 : 0}:${Date.now()}`);
    // Il Corpo si è chiuso (fine abbonamento, pausa): le tab Palestra e Chat tornano alla Mente, non all'assaggio
    if (!aperto && leggiParte() === 'corpo') salvaParte('mente');
  } catch { /* ignora */ }
}

/**
 * Il Corpo è aperto per questo utente? Subito dal dispositivo, poi (se la cache è vecchia o manca) dal profilo.
 * `null` finché non si sa: il selettore non mostra il lucchetto a caso.
 */
export function useCorpoAperto(): boolean | null {
  const [aperto, setAperto] = useState<boolean | null>(null);
  useEffect(() => {
    let vivo = true;
    (async () => {
      const c = leggiCorpoCache();
      if (c && vivo) setAperto(c.aperto);
      if (c?.fresco) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: p } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).single();
      const a = !!livelloFisico(p);
      salvaCorpoAperto(a);
      if (vivo) setAperto(a);
    })().catch(() => {});
    return () => { vivo = false; };
  }, []);
  return aperto;
}

/** Il pallino del resoconto da dare (squadra o partita), letto dal dispositivo. */
export function useResocontoPendente(): boolean {
  const [p, setP] = useState(false);
  useEffect(() => {
    const aggiorna = () => setP(pendenteAdesso());
    aggiorna();
    window.addEventListener(EVENTO_RESOCONTI, aggiorna);
    return () => window.removeEventListener(EVENTO_RESOCONTI, aggiorna);
  }, []);
  return p;
}

type Props = {
  parte: Parte;
  /** Con i link: ogni parte è una pagina (Palestra, Chat). */
  hrefs?: { mente: string; corpo: string };
  /** Senza link: la parte si cambia nella stessa pagina (Profilo). */
  onChange?: (p: Parte) => void;
  /** Se non passato si chiede a `useCorpoAperto`. */
  corpoBloccato?: boolean;
  /** Il pallino sul Corpo (resoconto da dare). */
  pendente?: boolean;
  className?: string;
};

export default function ParteSwitch({ parte, hrefs, onChange, corpoBloccato, pendente, className = '' }: Props) {
  const corpoAperto = useCorpoAperto();
  const bloccato = corpoBloccato ?? corpoAperto === false;
  const pallino = useResocontoPendente();
  const conPallino = pendente ?? pallino;

  const voci: { id: Parte; label: string; Icon: typeof Brain; bloccata: boolean }[] = [
    { id: 'mente', label: 'Mente', Icon: Brain, bloccata: false },
    { id: 'corpo', label: 'Corpo', Icon: Dumbbell, bloccata: bloccato },
  ];

  return (
    <div role="tablist" aria-label="Mente o Corpo" className={`flex w-full gap-1 rounded-full border border-divider bg-surface p-1 ${className}`}>
      {voci.map(({ id, label, Icon, bloccata }) => {
        const sel = id === parte;
        const cls = `relative flex h-11 flex-1 items-center justify-center gap-2 rounded-full text-body font-semibold transition-colors ${
          sel ? 'bg-forest-500/20 text-app' : 'text-muted hover:text-app'
        } ${id === 'corpo' ? 'parte-corpo' : ''
        }`;
        const contenuto = (
          <>
            {bloccata ? <Lock size={16} aria-hidden className="shrink-0 opacity-80" /> : <Icon size={18} aria-hidden className={`shrink-0 ${sel ? 'text-forest-300' : ''}`} />}
            <span>{label}</span>
            {id === 'corpo' && conPallino && !sel && !bloccata && (
              <span aria-label="Hai un resoconto da dare" className="absolute right-4 top-2.5 h-2.5 w-2.5 rounded-full bg-accent-glow shadow-glow" />
            )}
          </>
        );
        // Il Corpo bloccato porta sempre all'assaggio, anche dal Profilo
        const href = bloccata ? '/allenamento' : hrefs?.[id];
        if (href) {
          return (
            <Link key={id} href={href} role="tab" aria-selected={sel} aria-current={sel ? 'page' : undefined}
              onClick={() => { if (!bloccata) salvaParte(id); }} className={cls}>
              {contenuto}
            </Link>
          );
        }
        return (
          <button key={id} type="button" role="tab" aria-selected={sel}
            onClick={() => { if (!bloccata) { salvaParte(id); onChange?.(id); } }} className={cls}>
            {contenuto}
          </button>
        );
      })}
    </div>
  );
}

/** Le schede sotto il selettore (Percorso · Allenamento · Quando si fa dura, oppure Allenamento · Test). */
export function SottoSchede({ voci, attiva }: { voci: { id: string; label: string; href: string }[]; attiva: string }) {
  return (
    <nav aria-label="Sezioni" className="-mx-4 mt-2 flex overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {voci.map((v) => {
        const sel = v.id === attiva;
        return (
          <Link key={v.id} href={v.href} aria-current={sel ? 'page' : undefined}
            className={`relative flex min-h-[44px] shrink-0 items-center px-3 text-body font-semibold transition-colors ${sel ? 'text-app' : 'text-muted hover:text-app'}`}>
            {v.label}
            {sel && <span aria-hidden className="absolute bottom-1 left-3 right-3 h-0.5 rounded-full bg-accent-glow" />}
          </Link>
        );
      })}
    </nav>
  );
}

export const SCHEDE_MENTE = [
  { id: 'percorso', label: 'Percorso', href: '/settimane' },
  { id: 'allenamento', label: 'Allenamento', href: '/strumenti' },
  { id: 'dura', label: 'Quando si fa dura', href: '/sos' },
];
export const SCHEDE_CORPO = [
  { id: 'allenamento', label: 'Allenamento', href: '/allenamento' },
  { id: 'test', label: 'Test', href: '/allenamento/test' },
];

const TITOLI: Record<string, string> = {
  'mente:percorso': 'Percorso', 'mente:allenamento': 'Allenamento', 'mente:dura': 'Quando si fa dura',
  'corpo:allenamento': 'Allenamento', 'corpo:test': 'Test',
};

/**
 * La testata delle pagine dentro la Palestra (8/11): da fuori si sceglie con le card con la foto (/palestra),
 * dentro restano solo «Palestra» per tornare e il nome della sezione. Prima qui c'erano selettore e schede.
 * Va in cima a /settimane, /strumenti, /sos (Mente) e /allenamento, /allenamento/test (Corpo).
 * `schede={false}`: niente titolo (il Corpo bloccato ha il suo).
 */
export function PalestraTestata({ parte, scheda, schede = true, corpoBloccato, className = '' }: {
  parte: Parte; scheda?: string; schede?: boolean; corpoBloccato?: boolean; className?: string;
}) {
  useEffect(() => { if (parte === 'mente' || corpoBloccato === false) salvaParte(parte); }, [parte, corpoBloccato]);
  const titolo = schede ? TITOLI[`${parte}:${scheda ?? ''}`] : undefined;
  return (
    <div className={`bg-app px-4 pt-safe ${className}`}>
      <div className="mx-auto max-w-xl">
        {titolo
          ? <Testata indietro={{ href: '/palestra', label: 'Palestra' }} titolo={titolo}
              sopra={<span className="inline-flex items-center gap-1.5">{parte === 'corpo' ? <Dumbbell size={15} aria-hidden /> : <Brain size={15} aria-hidden />}{parte === 'corpo' ? 'Corpo' : 'Mente'}</span>} />
          : <BackButton href="/palestra" label="Palestra" />}
      </div>
    </div>
  );
}
