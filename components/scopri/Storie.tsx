'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowRight, Bell, ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import { bloccaScroll } from '@/lib/scrollLock';
import {
  AVVISO_FISICO, DOVE_PORTA, MOMENTI_FISICO, MOMENTI_TESTA, STORIA, type FotoStoria, type MomentoApp,
} from '@/lib/scopri';

/**
 * Le storie della pagina di vendita, come su Instagram (7/11, Ste: «dinamica», «prendi spunto da Instagram»): i cerchi «in
 * evidenza» sotto l'apertura e la griglia delle foto di Ste aprono un visore a tutto schermo. Una schermata alla volta, le
 * barrette in alto che si riempiono, tocco a destra avanti e a sinistra indietro, tenendo premuto si ferma, Esc o la X
 * chiudono; alla fine di un gruppo il bottone per provare e il gruppo dopo. Fermo con prefers-reduced-motion.
 * Un solo visore per pagina (`VisoreStorie`), aperto da qualunque punto con `apriStoria(gruppo, schermata)`.
 */

export type Schermata = {
  testo: string;
  sotto?: string;
  etichetta?: string;
  titolo?: string;
  foto?: FotoStoria;
  schermo?: { src: string; alt: string };
  stile?: 'citazione' | 'grande' | 'normale';
};
export type Gruppo = { id: string; nome: string; copertina: { src?: string; testo?: string }; schermate: Schermata[]; fine: 'prova' | 'avviso' };

function daMomenti(momenti: MomentoApp[], parte: string): Schermata[] {
  return momenti.map((m, i) => ({
    etichetta: `${parte} · ${i + 1} di ${momenti.length}`,
    titolo: m.titolo,
    testo: m.testo,
    sotto: m.inCampo ? `In campo: ${m.inCampo}` : undefined,
    schermo: { src: `/scopri/${m.id}.webp`, alt: m.alt },
  }));
}

export const GRUPPI: Gruppo[] = [
  {
    id: 'storia', nome: 'La mia storia', copertina: { src: STORIA.capitoli[0].foto?.src }, fine: 'prova',
    schermate: [
      { testo: STORIA.citazione, sotto: STORIA.intro, foto: STORIA.fotoCitazione, stile: 'citazione' },
      ...STORIA.capitoli.map((c): Schermata => ({ testo: c.testo, foto: c.foto, stile: c.foto ? 'normale' : 'grande' })),
      { testo: STORIA.finale, stile: 'grande' },
    ],
  },
  { id: 'testa', nome: 'La Testa', copertina: { src: '/scopri/percorso.webp' }, fine: 'prova', schermate: daMomenti(MOMENTI_TESTA, 'La Testa') },
  {
    id: 'dove', nome: 'Dove ti porta', copertina: { testo: '→' }, fine: 'prova',
    schermate: [
      { titolo: DOVE_PORTA.titolo, testo: DOVE_PORTA.intro, stile: 'grande' },
      ...DOVE_PORTA.punti.map((p): Schermata => ({ testo: p.charAt(0).toUpperCase() + p.slice(1).replace(/;$/, '.'), stile: 'grande' })),
      { testo: DOVE_PORTA.chiusura, stile: 'grande' },
    ],
  },
  { id: 'fisico', nome: 'Il Fisico', copertina: { src: '/scopri/seduta.webp' }, fine: 'avviso', schermate: daMomenti(MOMENTI_FISICO, 'Il Fisico') },
];

const EVENTO = 'scopri:storia';
export function apriStoria(gruppo: string, schermata = 0) {
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: { gruppo, schermata } }));
}

const MQ_RIDOTTO = '(prefers-reduced-motion: reduce)';
function iscriviMovimento(cb: () => void) {
  const mq = window.matchMedia(MQ_RIDOTTO);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
const movimentoRidotto = () => window.matchMedia(MQ_RIDOTTO).matches;

function durata(s: Schermata) {
  const lettere = s.testo.length + (s.sotto?.length ?? 0) + (s.titolo?.length ?? 0);
  return Math.min(11000, Math.max(4500, lettere * 55));
}

// I gruppi già visti (il cerchio diventa grigio, come sui social). Solo in memoria, per questa visita.
const visti = new Set<string>();
const ascoltaVisti = new Set<() => void>();
function segnaVisto(id: string) { visti.add(id); ascoltaVisti.forEach((f) => f()); }
function useVisti() {
  return useSyncExternalStore(
    (cb) => { ascoltaVisti.add(cb); return () => { ascoltaVisti.delete(cb); }; },
    () => visti.size,
    () => 0,
  );
}

/** I cerchi «in evidenza», sotto l'apertura. */
export function InEvidenza({ notaFisico }: { notaFisico?: string }) {
  useVisti();
  return (
    <div className="scopri-nastro -mx-4 overflow-x-auto px-4">
      <ul className="mx-auto flex w-max gap-5 py-1 lg:gap-7">
        {GRUPPI.map((g) => (
          <li key={g.id}>
            <button type="button" onClick={() => apriStoria(g.id)} className="group flex w-[76px] flex-col items-center gap-2 lg:w-[88px]" aria-label={`Guarda: ${g.nome}`}>
              <span className={`rounded-full p-[3px] transition-transform group-hover:scale-105 ${visti.has(g.id) ? 'bg-divider' : 'bg-gradient-to-tr from-forest-600 via-forest-400 to-[#c9f27a]'}`}>
                <span className="block rounded-full bg-app-bg p-[3px]">
                  {g.copertina.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.copertina.src} alt="" className="h-16 w-16 rounded-full object-cover object-top lg:h-[76px] lg:w-[76px]" />
                  ) : (
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-forest-500 to-forest-700 font-display text-title-1 font-bold text-white lg:h-[76px] lg:w-[76px]">{g.copertina.testo}</span>
                  )}
                </span>
              </span>
              <span className="text-caption font-semibold leading-tight text-app">
                {g.nome}
                {g.id === 'fisico' && notaFisico && <span className="block font-normal text-faint">{notaFisico}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Il visore a tutto schermo: uno per pagina. */
export function VisoreStorie({ cta, notaCta }: { cta: string; notaCta: string }) {
  const [aperto, setAperto] = useState<{ g: number; i: number } | null>(null);

  useEffect(() => {
    const apri = (e: Event) => {
      const { gruppo, schermata } = (e as CustomEvent<{ gruppo: string; schermata: number }>).detail;
      const g = Math.max(0, GRUPPI.findIndex((x) => x.id === gruppo));
      setAperto({ g, i: schermata });
    };
    window.addEventListener(EVENTO, apri);
    return () => window.removeEventListener(EVENTO, apri);
  }, []);

  useEffect(() => {
    if (!aperto) return;
    return bloccaScroll();
  }, [aperto]);

  if (!aperto) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={GRUPPI[aperto.g].nome}>
      <Lettore
        key={`${aperto.g}-${aperto.i}`}
        gruppo={aperto.g}
        inizio={aperto.i}
        cta={cta}
        notaCta={notaCta}
        onChiudi={() => setAperto(null)}
        onGruppo={(g) => setAperto({ g, i: 0 })}
      />
    </div>
  );
}

function Lettore({ gruppo, inizio, cta, notaCta, onChiudi, onGruppo }: {
  gruppo: number; inizio: number; cta: string; notaCta: string; onChiudi: () => void; onGruppo: (g: number) => void;
}) {
  const g = GRUPPI[gruppo];
  const schermate = g.schermate;
  const n = schermate.length;
  const [i, setI] = useState(Math.min(inizio, n - 1));
  const [pausa, setPausa] = useState(false);
  const [tenuto, setTenuto] = useState(false);
  const ridotto = useSyncExternalStore(iscriviMovimento, movimentoRidotto, () => false);
  const box = useRef<HTMLDivElement>(null);
  const giu = useRef(0);
  const prossimo = GRUPPI[gruppo + 1];

  const vai = useCallback((k: number) => {
    if (k < 0) { if (gruppo > 0) onGruppo(gruppo - 1); return; }
    setI(Math.min(n - 1, k));
  }, [n, gruppo, onGruppo]);
  const ultima = i === n - 1;
  const ferma = pausa || tenuto || ridotto || ultima;

  useEffect(() => { box.current?.focus(); }, []);
  useEffect(() => { if (ultima) segnaVisto(g.id); }, [ultima, g.id]);

  const tastiera = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onChiudi();
    if (e.key === 'ArrowRight') vai(i + 1);
    if (e.key === 'ArrowLeft') vai(i - 1);
    if (e.key === ' ') { e.preventDefault(); setPausa((x) => !x); }
  };
  const tocco = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('a,button')) return;
    if (Date.now() - giu.current > 350) return;
    const r = e.currentTarget.getBoundingClientRect();
    vai(e.clientX - r.left < r.width / 3 ? i - 1 : i + 1);
  };

  const s = schermate[i];
  const conFoto = !!s.foto;

  return (
    <div
      ref={box}
      tabIndex={-1}
      onKeyDown={tastiera}
      className="relative h-[100dvh] w-full select-none overflow-hidden bg-[#0b120e] outline-none sm:h-[min(92vh,860px)] sm:w-auto sm:aspect-[9/16] sm:rounded-[28px] sm:border sm:border-white/10"
      onPointerDown={() => { giu.current = Date.now(); setTenuto(true); }}
      onPointerUp={(e) => { setTenuto(false); tocco(e); }}
      onPointerLeave={() => setTenuto(false)}
      onPointerCancel={() => setTenuto(false)}
    >
      {/* Le foto del gruppo, in dissolvenza */}
      {schermate.map((x, k) => x.foto && (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={k} src={x.foto.src} alt={k === i ? x.foto.alt : ''} aria-hidden={k !== i} decoding="async"
          className={`scopri-storia-foto absolute inset-0 h-full w-full object-cover ${k === i ? 'opacity-100' : 'opacity-0'} ${k === i && !ridotto ? 'scopri-storia-zoom' : ''}`}
          style={{ animationPlayState: ferma ? 'paused' : 'running' }} />
      ))}
      <div className={`absolute inset-0 bg-[radial-gradient(90%_70%_at_30%_15%,rgba(26,150,96,0.5),transparent),linear-gradient(160deg,#10241a,#0b120e)] transition-opacity duration-700 ${conFoto ? 'opacity-0' : 'opacity-100'}`} aria-hidden />
      <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/40 transition-opacity duration-700 ${conFoto ? 'opacity-100' : 'opacity-0'}`} aria-hidden />

      {/* Barrette */}
      <div className="absolute inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex gap-1" aria-hidden>
        {schermate.map((x, k) => (
          <span key={k} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
            <span
              key={k === i ? `a${i}` : `f${k}`}
              className={`block h-full rounded-full bg-white ${k < i ? 'w-full' : k > i ? 'w-0' : ultima || ridotto ? 'w-full' : 'scopri-storia-barra'}`}
              style={k === i && !ultima && !ridotto ? { animationDuration: `${durata(x)}ms`, animationPlayState: ferma ? 'paused' : 'running' } : undefined}
              onAnimationEnd={k === i ? () => vai(i + 1) : undefined}
            />
          </span>
        ))}
      </div>

      {/* Chi parla, pausa, chiudi */}
      <div className="absolute inset-x-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+0.75rem)] z-10 flex items-center justify-between">
        <span className="flex items-center gap-2 text-body-sm font-semibold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-500 font-display text-caption font-bold">SB</span>
          {g.nome}
        </span>
        <span className="flex items-center">
          {!ridotto && !ultima && (
            <button type="button" onClick={() => setPausa((x) => !x)} aria-label={pausa ? 'Riprendi' : 'Pausa'} className="tap flex items-center justify-center text-white/90 hover:text-white">
              {pausa ? <Play size={20} aria-hidden /> : <Pause size={20} aria-hidden />}
            </button>
          )}
          <button type="button" onClick={onChiudi} aria-label="Chiudi" className="tap flex items-center justify-center text-white/90 hover:text-white">
            <X size={24} aria-hidden />
          </button>
        </span>
      </div>

      {/* Il contenuto della schermata */}
      <div key={`${gruppo}-${i}`} className={`scopri-storia-testo absolute inset-x-0 z-10 px-6 ${s.schermo ? 'inset-y-0 flex flex-col pb-8 pt-24' : conFoto ? 'bottom-0 pb-10' : 'inset-y-0 flex flex-col justify-center pb-10'}`}>
        {s.schermo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.schermo.src} alt={s.schermo.alt} className="mx-auto min-h-0 flex-1 rounded-[18px] border-[5px] border-black object-contain object-top shadow-e3" />
        )}
        <div className={s.schermo ? 'mt-5 shrink-0' : ''}>
          {s.etichetta && <p className="text-overline uppercase text-forest-300">{s.etichetta}</p>}
          {s.titolo && <p className="mt-1 font-display text-title-2 font-bold text-white">{s.titolo}</p>}
          <p className={
            s.stile === 'citazione' ? 'font-quote text-[28px] italic leading-[35px] text-white'
              : s.stile === 'grande' ? 'mt-2 font-quote text-[29px] italic leading-[37px] text-white'
                : s.schermo ? 'mt-2 text-body text-white/90' : 'text-[19px] leading-[28px] text-white'
          }>{s.testo}</p>
          {s.sotto && <p className={`mt-3 ${s.schermo ? 'text-body-sm text-forest-200' : 'text-body-lg text-white/85'}`}>{s.sotto}</p>}
          {ultima && (
            <div className="mt-7 flex flex-col items-center gap-3">
              {g.fine === 'prova' ? (
                <Link href={cta} className="inline-flex min-h-[52px] items-center gap-2 rounded-btn bg-gradient-to-br from-forest-400 to-forest-600 px-6 text-body-lg font-bold text-white shadow-glow">
                  Prova la prima settimana <ArrowRight size={20} aria-hidden />
                </Link>
              ) : (
                <a href={AVVISO_FISICO} className="inline-flex min-h-[52px] items-center gap-2 rounded-btn border border-white/40 px-6 text-body-lg font-semibold text-white">
                  <Bell size={18} aria-hidden /> Avvisami quando apre
                </a>
              )}
              {g.fine === 'prova' && <span className="text-caption text-white/75">{notaCta}</span>}
              {prossimo && (
                <button type="button" onClick={() => onGruppo(gruppo + 1)} className="inline-flex min-h-[44px] items-center gap-1.5 px-3 text-body-sm font-semibold text-white/85 hover:text-white">
                  Poi: {prossimo.nome} <ChevronRight size={16} aria-hidden />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Frecce col mouse */}
      <button type="button" onClick={() => vai(i - 1)} disabled={i === 0 && gruppo === 0} aria-label="Indietro" className="tap absolute left-1 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center text-white/70 hover:text-white disabled:opacity-0 sm:flex">
        <ChevronLeft size={30} aria-hidden />
      </button>
      <button type="button" onClick={() => vai(i + 1)} disabled={ultima} aria-label="Avanti" className="tap absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center text-white/70 hover:text-white disabled:opacity-0 sm:flex">
        <ChevronRight size={30} aria-hidden />
      </button>
    </div>
  );
}

/** Un bottone qualsiasi che apre una storia (la griglia delle foto, «Guarda la mia storia»). */
export function ApriStoria({ gruppo, schermata = 0, className = '', children, etichetta }: {
  gruppo: string; schermata?: number; className?: string; children: React.ReactNode; etichetta?: string;
}) {
  return (
    <button type="button" onClick={() => apriStoria(gruppo, schermata)} className={className} aria-label={etichetta}>
      {children}
    </button>
  );
}
