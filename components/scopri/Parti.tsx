import Link from 'next/link';
import { ArrowLeft, ArrowRight, Bell } from 'lucide-react';
import { AVVISO_FISICO, PERCHE_FISICO, STORIA, STORIA_FOTO, type FotoStoria } from '@/lib/scopri';

/** I pezzi in comune tra la pagina di vendita (/scopri) e la pagina della storia (/scopri/storia). */

export const CTA = '/register';

export function BottoneProva() {
  return (
    <Link href={CTA} className="inline-flex min-h-[56px] items-center gap-2 rounded-btn bg-gradient-to-br from-forest-400 to-forest-600 px-7 text-body-lg font-bold text-white shadow-glow transition-transform hover:scale-[1.02]">
      Prova la prima settimana <ArrowRight size={20} aria-hidden />
    </Link>
  );
}

export function BottoneAvviso() {
  return (
    <a href={AVVISO_FISICO} className="inline-flex min-h-[48px] items-center gap-2 rounded-btn border border-forest-400/50 px-5 text-body font-semibold text-forest-300 transition-colors hover:border-forest-400 hover:text-forest-200">
      <Bell size={18} aria-hidden /> Avvisami quando apre
    </a>
  );
}

/** Un link che porta a leggere di più: verde, con la freccia. */
export function LinkApprofondisci({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-[48px] items-center gap-2 rounded-btn border border-forest-400/50 px-5 text-body font-semibold text-forest-300 transition-colors hover:border-forest-400 hover:text-forest-200">
      {children} <ArrowRight size={18} aria-hidden />
    </Link>
  );
}

export function Titolo({ etichetta, children, sotto }: { etichetta?: string; children: React.ReactNode; sotto?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {etichetta && <p className="text-overline uppercase text-forest-400">{etichetta}</p>}
      <h2 className="mt-2 font-display text-[32px] font-bold leading-[38px]">{children}</h2>
      {sotto && <p className="mt-3 text-body-lg text-muted">{sotto}</p>}
    </div>
  );
}

export function Intestazione({ indietro = false }: { indietro?: boolean }) {
  return (
    <header className="pt-safe">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        {indietro ? (
          <Link href="/scopri" className="tap inline-flex items-center gap-1.5 rounded-btn pr-3 text-body-sm font-semibold text-muted hover:text-app">
            <ArrowLeft size={18} aria-hidden /> For You <span className="text-forest-400">Football</span>
          </Link>
        ) : (
          <span className="font-display text-title-3 font-bold tracking-tight">For You <span className="text-forest-400">Football</span></span>
        )}
        <Link href="/login" className="tap inline-flex items-center rounded-btn px-3 text-body-sm font-semibold text-muted hover:text-app">Entra</Link>
      </div>
    </header>
  );
}

export function PiePagina() {
  return (
    <footer className="border-t border-divider" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-center text-caption text-muted md:flex-row md:text-left">
        <span>For You Football · Season 1: Play Free · For You Football non è un servizio sanitario né psicologico</span>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          <Link href="/scopri/storia" className="inline-flex min-h-[44px] items-center hover:text-app">La storia</Link>
          <Link href="/privacy" className="inline-flex min-h-[44px] items-center hover:text-app">Privacy</Link>
          <Link href="/termini" className="inline-flex min-h-[44px] items-center hover:text-app">Termini</Link>
          <a href="mailto:info@foryoufootball.it" className="inline-flex min-h-[44px] items-center hover:text-app">info@foryoufootball.it</a>
          <Link href="/login" className="inline-flex min-h-[44px] items-center hover:text-app">Entra</Link>
        </nav>
      </div>
    </footer>
  );
}

/** Una foto della storia di Ste, con l'anno e due parole sue sotto (se le ha scritte). */
export function FotoStoriaCard({ foto, className = '' }: { foto: FotoStoria; className?: string }) {
  return (
    <figure className={`mx-auto w-[min(100%,380px)] overflow-hidden rounded-card border border-divider bg-surface shadow-e2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={foto.src} alt={foto.alt} loading="lazy" decoding="async" className="block w-full" />
      {(foto.quando || foto.didascalia) && (
        <figcaption className="px-4 pb-4 pt-3">
          {foto.quando && <span className="block text-overline uppercase text-forest-400">{foto.quando}</span>}
          {foto.didascalia && <span className="mt-1 block font-quote text-[18px] italic leading-[24px] text-app">{foto.didascalia}</span>}
        </figcaption>
      )}
    </figure>
  );
}

export type CapitoloStoria = { foto?: FotoStoria; paragrafi: { testo: string; n: number }[] };

/** La storia a capitoli: ogni foto con i paragrafi che la seguono, fino alla foto dopo; quelli prima della prima foto da soli. */
export function capitoliStoria(): CapitoloStoria[] {
  const foto = [...STORIA_FOTO].sort((x, y) => x.prima - y.prima);
  const par = STORIA.paragrafi.map((testo, n) => ({ testo, n }));
  const capitoli: CapitoloStoria[] = [];
  const primaFoto = foto[0]?.prima ?? par.length;
  if (primaFoto > 0) capitoli.push({ paragrafi: par.slice(0, primaFoto) });
  foto.forEach((f, k) => capitoli.push({ foto: f, paragrafi: par.slice(f.prima, foto[k + 1]?.prima ?? par.length) }));
  return capitoli;
}

/** Un capitolo della storia: una foto accanto ai suoi paragrafi, a lati alterni. */
export function Capitolo({ c, i }: { c: CapitoloStoria; i: number }) {
  return (
    <div className={c.foto ? 'grid items-center gap-8 sm:grid-cols-2 sm:gap-10' : ''}>
      {c.foto && <FotoStoriaCard foto={c.foto} />}
      <div className={`space-y-4 ${c.foto && i % 2 === 0 ? 'sm:order-first' : ''}`}>
        {c.paragrafi.map(({ testo, n }) => <p key={n} className={n === 0 ? 'text-app' : ''}>{testo}</p>)}
      </div>
    </div>
  );
}

/** Perché il Fisico è fatto così: la storia di Ste, dai preparatori scollegati alle regole con l'AI dentro. */
export function PercheFisico() {
  const p = PERCHE_FISICO;
  return (
    <div className="mx-auto max-w-3xl">
      <Titolo etichetta={p.etichetta}>{p.titolo}</Titolo>
      <p className="mt-8 text-body-lg text-muted">{p.intro}</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {p.figure.map((f) => (
          <li key={f.chi} className="rounded-card border border-divider bg-app-bg p-4">
            <span className="block text-body font-semibold text-app">{f.chi}</span>
            <span className="mt-1 block text-body-sm text-muted">{f.limite}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 space-y-2 rounded-card border border-divider bg-app-bg p-5">
        {p.altalena.map((r) => <p key={r} className="font-quote text-[20px] italic leading-[29px] text-app">{r}</p>)}
      </div>
      <p className="mt-6 text-body-lg text-muted">{p.scelta}</p>
      <p className="mt-6 text-body-lg text-muted">{p.problema}</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {p.variabili.map((v) => (
          <li key={v} className="rounded-full border border-divider bg-app-bg px-3.5 py-1.5 text-body-sm text-app">{v}</li>
        ))}
      </ul>
      <blockquote className="my-10 border-l-4 border-forest-400 pl-5 font-quote text-[23px] italic leading-[33px] text-app lg:text-[26px] lg:leading-[36px]">{p.domanda}</blockquote>
      <div className="space-y-4 text-body-lg text-muted">
        {p.ai.map((r, i) => <p key={r} className={i === p.ai.length - 1 ? 'text-app' : ''}>{r}</p>)}
      </div>
    </div>
  );
}
