'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowRight, Bell, ChevronLeft, ChevronRight, Compass, Pause, Play, X } from 'lucide-react';
import { Pallone } from '@/components/scopri/Disegni';
import { bloccaScroll } from '@/lib/scrollLock';
import IconaCorpo, { IconaMente } from '@/components/ui/IconaCorpo';
import {
  AVVISO_FISICO, DOVE_PORTA, FISICO_SEZIONE, MOMENTI_FISICO, MOMENTI_TESTA, NON_POSITIVO, PERCHE_FISICO, PERCHE_TESTA, STORIA, type FotoStoria,
  type MomentoApp,
} from '@/lib/scopri';

/**
 * Le storie della pagina di vendita, come su Instagram (7/11, Ste: «dinamica», «prendi spunto da Instagram»; 8/11: «i pallini
 * nei vari settori», «il carattere tutto in corsivo»): i cerchi di ogni sezione e la griglia delle foto di Ste aprono un
 * visore a tutto schermo. Una schermata alla volta, le
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
export type Gruppo = { id: string; nome: string; copertina: { src?: string; testo?: string; icona?: 'mente' | 'corpo' | 'storia' | 'dove' }; schermate: Schermata[]; fine: 'prova' | 'avviso' };

function daMomenti(momenti: MomentoApp[], parte: string): Schermata[] {
  return momenti.map((m, i) => ({
    etichetta: `${parte} · ${i + 1} di ${momenti.length}`,
    titolo: m.titolo,
    testo: m.testo,
    sotto: m.inCampo ? `In campo: ${m.inCampo}` : undefined,
    schermo: { src: `/scopri/${m.id}.webp`, alt: m.alt },
  }));
}

const maiuscola = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export const GRUPPI: Gruppo[] = [
  {
    id: 'storia', nome: 'La mia storia', copertina: { icona: 'storia' }, fine: 'prova',
    schermate: [
      { testo: STORIA.presentazione.testo, sotto: STORIA.presentazione.sotto, foto: STORIA.fotoCitazione, stile: 'citazione' },
      { testo: STORIA.citazione, sotto: STORIA.intro, stile: 'grande' },
      ...STORIA.capitoli.map((c): Schermata => ({ testo: c.testo, foto: c.foto, stile: c.foto ? 'normale' : 'grande' })),
      { testo: STORIA.finale, stile: 'grande' },
    ],
  },
  { id: 'testa', nome: 'La Testa', copertina: { icona: 'mente' }, fine: 'prova', schermate: daMomenti(MOMENTI_TESTA, 'La Testa') },
  { id: 'fisico', nome: 'Il Corpo', copertina: { icona: 'corpo' }, fine: 'avviso', schermate: daMomenti(MOMENTI_FISICO, 'Il Corpo') },
  {
    id: 'dove', nome: 'Dove ti porta', copertina: { icona: 'dove' }, fine: 'prova',
    schermate: [
      { titolo: DOVE_PORTA.titolo, testo: DOVE_PORTA.intro, stile: 'grande' },
      ...DOVE_PORTA.punti.map((p): Schermata => ({ testo: maiuscola(p).replace(/;$/, '.'), stile: 'grande' })),
      { testo: NON_POSITIVO.paragrafi[0], stile: 'grande' },
      { testo: DOVE_PORTA.chiusura, sotto: NON_POSITIVO.paragrafi[2], stile: 'grande' },
    ],
  },
  {
    id: 'perche-testa', nome: 'Perché la Testa', copertina: { icona: 'mente' }, fine: 'prova',
    schermate: [
      { titolo: PERCHE_TESTA.titolo, testo: PERCHE_TESTA.paragrafi[0], stile: 'grande' },
      { testo: PERCHE_TESTA.paragrafi[1], sotto: PERCHE_TESTA.studi.join(' · '), stile: 'grande' },
      { testo: PERCHE_TESTA.domanda, stile: 'grande' },
      ...PERCHE_TESTA.chiusura.map((t): Schermata => ({ testo: t, stile: 'grande' })),
    ],
  },
  {
    id: 'perche-fisico', nome: 'Perché il Corpo', copertina: { icona: 'corpo' }, fine: 'avviso',
    schermate: [
      { titolo: PERCHE_FISICO.titolo, testo: PERCHE_FISICO.intro, stile: 'grande' },
      ...PERCHE_FISICO.figure.map((f): Schermata => ({ titolo: f.chi, testo: f.limite, stile: 'grande' })),
      ...PERCHE_FISICO.altalena.map((t): Schermata => ({ testo: t, stile: 'grande' })),
      { testo: PERCHE_FISICO.scelta, stile: 'grande' },
      { testo: PERCHE_FISICO.problema, sotto: PERCHE_FISICO.variabili.join(' · '), stile: 'grande' },
      { testo: PERCHE_FISICO.domanda, stile: 'grande' },
      ...PERCHE_FISICO.ai.map((t): Schermata => ({ testo: t, stile: 'grande' })),
      { titolo: FISICO_SEZIONE.titolo, testo: FISICO_SEZIONE.origine[0], sotto: FISICO_SEZIONE.origine.slice(1).join(' '), stile: 'grande' },
    ],
  },
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

/**
 * Un cerchio come gli «in evidenza» dei social: copertina, anello verde (grigio se già vista), nome sotto. Di solito apre la sua
 * storia; nel giro dell'app fa da linguetta (`onClick`, `attivo`: quello scelto ha l'anello, l'altro è spento).
 */
/**
 * Le due parti con le icone dell'app (10/11, Ste: «al posto delle mie foto su corpo e mente metti quello usato in app»):
 * il disco pieno del colore della parte, verde la Mente, blu il Corpo (dentro `.parte-corpo`), l'icona in bianco.
 */
export function IconaParte({ parte, className = 'h-16 w-16', piccola = false }: { parte: 'mente' | 'corpo'; className?: string; piccola?: boolean }) {
  const Icona = parte === 'corpo' ? IconaCorpo : IconaMente;
  return (
    <span className={`flex ${className} items-center justify-center rounded-full bg-gradient-to-br from-forest-400 to-forest-700 text-white ${parte === 'corpo' ? 'parte-corpo' : ''}`}>
      <Icona size={piccola ? 18 : '52%'} aria-hidden />
    </span>
  );
}

/** Le storie del Corpo (10/11, Ste: «allinea i colori all'app»): blu come il Corpo nell'app (`.parte-corpo`), le altre verdi. */
export const GRUPPI_CORPO = new Set(['fisico', 'perche-fisico']);

export function Cerchio({ gruppo, nome, sotto, grande = false, onClick, attivo }: {
  gruppo: string; nome?: string; sotto?: string; grande?: boolean; onClick?: () => void; attivo?: boolean;
}) {
  useVisti();
  const g = GRUPPI.find((x) => x.id === gruppo);
  if (!g) return null;
  const misura = grande ? 'h-[72px] w-[72px]' : 'h-16 w-16';
  const corpo = GRUPPI_CORPO.has(g.id);
  const anello = attivo === false ? 'bg-divider opacity-60' : visti.has(g.id) && attivo === undefined ? 'bg-divider' : `bg-gradient-to-tr from-forest-600 via-forest-400 ${corpo ? 'to-forest-200' : 'to-[#c9f27a]'}`;
  return (
    <button
      type="button"
      onClick={onClick ?? (() => apriStoria(g.id))}
      aria-pressed={attivo}
      className={`group flex w-[92px] flex-col items-center gap-1.5 ${corpo ? 'parte-corpo' : ''}`}
      aria-label={onClick ? (nome ?? g.nome) : `Guarda: ${nome ?? g.nome}`}
    >
      <span className={`rounded-full p-[3px] transition-transform group-hover:scale-105 ${anello}`}>
        <span className="block rounded-full bg-app-bg p-[3px]">
          {g.copertina.icona === 'storia' || g.copertina.icona === 'dove' ? (
            // 11/11, Ste: nei cerchi solo disegni, niente sue foto («stonano»)
            <span className={`flex ${misura} items-center justify-center rounded-full bg-gradient-to-br from-forest-400 to-forest-700 text-white`}>
              {g.copertina.icona === 'storia' ? <Pallone cuoio={false} className="h-[58%] w-[58%]" /> : <Compass className="h-[52%] w-[52%]" strokeWidth={1.8} aria-hidden />}
            </span>
          ) : g.copertina.icona ? (
            <IconaParte parte={g.copertina.icona} className={misura} />
          ) : g.copertina.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={g.copertina.src} alt="" className={`${misura} rounded-full object-cover object-top`} />
          ) : (
            <span className={`flex ${misura} items-center justify-center rounded-full bg-gradient-to-br from-forest-500 to-forest-700 font-display text-title-1 font-bold text-white`}>{g.copertina.testo}</span>
          )}
        </span>
      </span>
      <span className={`text-caption font-semibold leading-tight ${attivo === false ? 'text-muted' : 'text-app'}`}>
        {nome ?? g.nome}
        {sotto && <span className="block font-normal text-faint">{sotto}</span>}
      </span>
    </button>
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
  const corpoStoria = GRUPPI_CORPO.has(g?.id);
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
      className={`relative h-[100dvh] w-full select-none overflow-hidden outline-none sm:h-[min(92vh,860px)] sm:w-auto sm:aspect-[9/16] sm:rounded-[28px] sm:border sm:border-white/10 ${corpoStoria ? 'parte-corpo bg-[#0b0f14]' : 'bg-[#0b120e]'}`}
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
      <div className={`absolute inset-0 ${corpoStoria ? 'bg-[radial-gradient(90%_70%_at_30%_15%,rgba(47,109,171,0.45),transparent),linear-gradient(160deg,#121c28,#0b0f14)]' : 'bg-[radial-gradient(90%_70%_at_30%_15%,rgba(26,150,96,0.5),transparent),linear-gradient(160deg,#10241a,#0b120e)]'} transition-opacity duration-700 ${conFoto ? 'opacity-0' : 'opacity-100'}`} aria-hidden />
      <div className={`absolute inset-0 bg-black/55 transition-opacity duration-700 ${conFoto ? 'opacity-100' : 'opacity-0'}`} aria-hidden />

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
      <div className="absolute inset-x-3 top-[calc(max(0.75rem,env(safe-area-inset-top))+0.75rem)] z-30 flex items-center justify-between">
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
      <div key={`${gruppo}-${i}`} className={`scopri-storia-testo pointer-events-none absolute inset-x-0 z-10 px-6 [&_a]:pointer-events-auto [&_button]:pointer-events-auto ${s.schermo ? 'inset-y-0 flex flex-col pb-8 pt-24' : conFoto ? 'inset-y-0 flex flex-col justify-center pb-10 [text-shadow:0_1px_14px_rgba(0,0,0,0.65)]' : 'inset-y-0 flex flex-col justify-center pb-10'}`}>
        {s.schermo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={s.schermo.src} alt={s.schermo.alt} className="mx-auto min-h-0 flex-1 rounded-[18px] border-[5px] border-black object-contain object-top shadow-e3" />
        )}
        <div className={s.schermo ? 'mt-5 shrink-0' : ''}>
          {s.etichetta && <p className="text-overline uppercase text-forest-300">{s.etichetta}</p>}
          {s.titolo && <p className="mt-1 font-quote text-[26px] font-semibold italic leading-[31px] text-white">{s.titolo}</p>}
          <p className={`font-quote italic text-white ${
            s.stile === 'citazione' ? 'text-[28px] leading-[35px]'
              : s.stile === 'grande' ? 'mt-2 text-[28px] leading-[36px]'
                : s.schermo ? 'mt-2 text-[19px] leading-[26px] text-white/90' : 'text-[23px] leading-[31px]'
          }`}>{s.testo}</p>
          {s.sotto && <p className={`mt-3 font-quote italic ${s.schermo ? 'text-[17px] leading-[23px] text-forest-200' : 'text-[20px] leading-[28px] text-white/85'}`}>{s.sotto}</p>}
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
      <button type="button" onClick={() => vai(i - 1)} disabled={i === 0 && gruppo === 0} aria-label="Indietro" className="tap absolute left-1 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center text-white/70 hover:text-white disabled:opacity-0 sm:flex">
        <ChevronLeft size={30} aria-hidden />
      </button>
      <button type="button" onClick={() => vai(i + 1)} disabled={ultima} aria-label="Avanti" className="tap absolute right-1 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center text-white/70 hover:text-white disabled:opacity-0 sm:flex">
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
