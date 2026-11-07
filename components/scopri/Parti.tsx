import Link from 'next/link';
import { ArrowRight, Bell } from 'lucide-react';
import { AVVISO_FISICO, PERCHE_FISICO, PERCHE_TESTA } from '@/lib/scopri';
import { Espandi } from './Espandi';

/** I pezzi della pagina di vendita (/scopri) che non hanno bisogno del browser. */

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

export function Titolo({ etichetta, children, sotto }: { etichetta?: string; children: React.ReactNode; sotto?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {etichetta && <p className="text-overline uppercase text-forest-400">{etichetta}</p>}
      <h2 className="mt-2 font-display text-[32px] font-bold leading-[38px]">{children}</h2>
      {sotto && <p className="mt-3 text-body-lg text-muted">{sotto}</p>}
    </div>
  );
}

export function Intestazione() {
  return (
    <header className="pt-safe">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <span className="font-display text-title-3 font-bold tracking-tight">For You <span className="text-forest-400">Football</span></span>
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
          <a href="#storia" className="inline-flex min-h-[44px] items-center hover:text-app">La storia</a>
          <Link href="/privacy" className="inline-flex min-h-[44px] items-center hover:text-app">Privacy</Link>
          <Link href="/termini" className="inline-flex min-h-[44px] items-center hover:text-app">Termini</Link>
          <a href="mailto:info@foryoufootball.it" className="inline-flex min-h-[44px] items-center hover:text-app">info@foryoufootball.it</a>
          <Link href="/login" className="inline-flex min-h-[44px] items-center hover:text-app">Entra</Link>
        </nav>
      </div>
    </footer>
  );
}

/** Perché la Testa è fatta così: le strade provate, la domanda, i pilastri. Dentro una scheda della sezione «Il metodo». */
export function PercheTesta() {
  const p = PERCHE_TESTA;
  return (
    <div className="mx-auto max-w-3xl">
      <h3 className="text-center font-display text-title-1 font-bold">{p.titolo}</h3>
      <div className="mt-6 space-y-4 text-body-lg text-muted">
        {p.paragrafi.map((r) => <p key={r}>{r}</p>)}
      </div>
      <Espandi etichetta="Leggi tutto">
        <ul className="mt-6 flex flex-wrap gap-2">
          {p.studi.map((t) => (
            <li key={t} className="rounded-full border border-divider bg-app-bg px-3.5 py-1.5 text-body-sm text-app">{t}</li>
          ))}
        </ul>
        <blockquote className="my-8 border-l-4 border-forest-400 pl-5 font-quote text-[23px] italic leading-[33px] text-app lg:text-[26px] lg:leading-[36px]">{p.domanda}</blockquote>
        <div className="space-y-4 text-body-lg text-muted">
          {p.chiusura.map((r, i) => <p key={r} className={i === p.chiusura.length - 1 ? 'text-app' : ''}>{r}</p>)}
        </div>
      </Espandi>
    </div>
  );
}

/** Perché il Fisico è fatto così: dai preparatori scollegati alle regole con l'AI dentro. Dentro una scheda di «Il metodo». */
export function PercheFisico({ fine }: { fine?: React.ReactNode }) {
  const p = PERCHE_FISICO;
  return (
    <div className="mx-auto max-w-3xl">
      <h3 className="text-center font-display text-title-1 font-bold">{p.titolo}</h3>
      <p className="mt-6 text-body-lg text-muted">{p.intro}</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {p.figure.map((f) => (
          <li key={f.chi} className="rounded-card border border-divider bg-app-bg p-4">
            <span className="block text-body font-semibold text-app">{f.chi}</span>
            <span className="mt-1 block text-body-sm text-muted">{f.limite}</span>
          </li>
        ))}
      </ul>
      <Espandi etichetta="Leggi tutto">
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
        {fine}
      </Espandi>
    </div>
  );
}
