import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowDown, ArrowRight, Check, Lock } from 'lucide-react';
import { loadListino } from '@/lib/prezziServer';
import { contaIscrittiCampo, contaIscrittiMente, loadImpostazioni } from '@/lib/appSettings';
import { euroTesto, IMPOSTAZIONI_DEFAULT } from '@/lib/abbonamento';
import { MIN_AGE } from '@/lib/constants';
import { TESTI_PACCHETTI, SICUREZZA_FISICO } from '@/lib/pacchettiTesti';
import { domandeFrequenti, MOMENTI_APP, passiIngresso, prezziPubblici, type PrezzoPubblico } from '@/lib/scopri';
import type { Pacchetto } from '@/lib/listino';
import { ComeFunziona, TelefonoCiclo } from '@/components/scopri/Telefono';

/**
 * La pagina di vendita pubblica (6/11, funnel: Notion «Funnel di vendita: mappa e piano»). Chi apre il sito senza
 * essere entrato arriva qui (app/page.tsx). Prezzi da Stripe e iscrizioni da app_settings con le stesse regole
 * della pagina prezzi (lib/scopri.ts), riletti ogni 5 minuti. Nessuna richiesta esterna dal browser, nessun cookie.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'For You Football · Mental training e preparazione per calciatori',
  description: "Pochi minuti al giorno per 12 settimane: pratiche guidate, un Coach che ti risponde e, se vuoi, il piano fisico costruito sulla tua settimana di partite. La prima settimana è gratis.",
};

const CTA = '/register';

async function caricaPrezzi() {
  try {
    const [listino, imp, iscrittiMente, iscrittiCampo] = await Promise.all([
      loadListino(), loadImpostazioni(), contaIscrittiMente().catch(() => 0), contaIscrittiCampo().catch(() => 0),
    ]);
    return { prezzi: prezziPubblici({ listino, imp, iscrittiMente, iscrittiCampo }), imp };
  } catch {
    return { prezzi: null, imp: IMPOSTAZIONI_DEFAULT };
  }
}

function Prezzo({ p }: { p: PrezzoPubblico | undefined }) {
  // Come la pagina prezzi: l'importo si vede anche con le iscrizioni chiuse (la riga sotto il nome lo dice)
  if (!p || p.euro == null) return <span className="text-body-sm font-semibold text-muted">Per ora chiuso</span>;
  return (
    <span className="text-right">
      <span className="block font-display text-title-1 font-bold tabular-nums text-app">{euroTesto(p.euro)} €</span>
      <span className="block text-caption text-muted">al mese</span>
    </span>
  );
}

function SchedaPacchetto({ id, p, evidenza = false, children }: { id: Pacchetto; p: PrezzoPubblico | undefined; evidenza?: boolean; children?: React.ReactNode }) {
  const t = TESTI_PACCHETTI[id];
  const chiuso = !p?.aperto;
  return (
    <div className={`flex flex-col rounded-card border p-5 ${evidenza ? 'border-forest-400/60 bg-forest-500/10 shadow-glow' : 'border-divider bg-surface'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-title-2 font-bold text-app">{t.titolo}</h3>
          {p?.euro != null && p.tipo === 'lancio' && <span className="mt-1 inline-block rounded-full bg-forest-500/20 px-2 py-0.5 text-overline uppercase text-forest-300">Prezzo di lancio</span>}
          {chiuso && <span className="mt-1 inline-flex items-center gap-1 text-caption text-muted"><Lock size={12} aria-hidden /> Iscrizioni chiuse per ora</span>}
        </div>
        <Prezzo p={p} />
      </div>
      <p className="mt-2 text-body-sm text-muted">{t.sottotitolo}</p>
      <ul className="mt-4 space-y-2">
        {t.include.map((r) => (
          <li key={r} className="flex items-start gap-2 text-body-sm text-app">
            <Check size={16} className="mt-0.5 shrink-0 text-forest-400" aria-hidden />
            <span>{r}</span>
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}

export default async function Scopri() {
  const { prezzi, imp } = await caricaPrezzi();
  const prova = imp.provaGiorni;
  const lancio = prezzi && Object.values(prezzi).some((p) => p.aperto && p.tipo === 'lancio');
  const fisicoLivelli: Pacchetto[] = ['fisico_base', 'fisico_medio', 'fisico_pro'];
  const passi = passiIngresso(prova);
  const domande = domandeFrequenti(MIN_AGE);
  const notaCta = prova > 0 ? `${prova} giorni gratis · disdici in un tap` : 'La prima settimana è gratis';

  return (
    <main className="min-h-screen overflow-x-clip bg-app-bg text-app">
      {/* Barra in alto */}
      <header className="pt-safe">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="font-display text-title-3 font-bold tracking-tight">For You <span className="text-forest-400">Football</span></span>
          <Link href="/login" className="tap inline-flex items-center rounded-btn px-3 text-body-sm font-semibold text-muted hover:text-app">Entra</Link>
        </div>
      </header>

      {/* Apertura */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(26,150,96,0.28),transparent)]" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-6 lg:grid-cols-2 lg:pb-24 lg:pt-12">
          <div className="scopri-entra text-center lg:text-left">
            <p className="text-overline uppercase text-forest-400">Mental training e preparazione per calciatori</p>
            <h1 className="mt-3 font-display text-[40px] font-bold leading-[44px] tracking-tight lg:text-[56px] lg:leading-[60px]">
              Allena la testa come alleni le gambe.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-body-lg text-muted lg:mx-0">
              Pochi minuti al giorno per 12 settimane: una pratica guidata, un Coach che ti risponde quando serve e, se vuoi,
              il piano fisico costruito sulla tua settimana di partite.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 lg:items-start">
              <Link href={CTA} className="inline-flex min-h-[56px] items-center gap-2 rounded-btn bg-gradient-to-br from-forest-400 to-forest-600 px-7 text-body-lg font-bold text-white shadow-glow transition-transform hover:scale-[1.02]">
                Prova la prima settimana <ArrowRight size={20} aria-hidden />
              </Link>
              <span className="text-caption text-muted">{notaCta}</span>
              <a href="#come-funziona" className="mt-2 inline-flex min-h-[44px] items-center gap-1 text-body-sm font-semibold text-forest-300">
                Guarda come funziona <ArrowDown size={16} aria-hidden />
              </a>
            </div>
          </div>
          <div className="flex justify-center">
            <TelefonoCiclo momenti={MOMENTI_APP} />
          </div>
        </div>
      </section>

      {/* La storia */}
      <section className="border-y border-divider bg-surface/60">
        <div className="mx-auto max-w-3xl px-4 py-16 lg:py-20">
          <p className="text-overline uppercase text-forest-400">Chi c&apos;è dietro</p>
          <blockquote className="mt-4 font-quote text-[26px] italic leading-[34px] text-app lg:text-[32px] lg:leading-[42px]">
            «Sono passato da vomitare prima delle partite, terrorizzato e bloccato dalla paura, a giocare davanti a diecimila persone.»
          </blockquote>
          <div className="mt-8 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-forest-500 to-forest-700 font-display text-title-3 font-bold text-white" aria-hidden>SB</div>
            <div className="space-y-3 text-body-lg text-muted">
              <p><span className="font-semibold text-app">Sono Stefano, Ste.</span> Ho giocato in Serie C. Non è successo in una settimana e non è successo per magia: è successo allenando la testa, come si allena qualsiasi altra cosa.</p>
              <p>For You Football è il percorso che avrei voluto avere: lo stesso lavoro, un giorno alla volta, dentro un&apos;app.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Come funziona l'app */}
      <section id="come-funziona" className="scroll-mt-4">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-overline uppercase text-forest-400">Dentro l&apos;app</p>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-[38px]">La testa e il corpo, nello stesso posto</h2>
            <p className="mt-3 text-body-lg text-muted">Sette momenti della tua settimana con For You Football.</p>
          </div>
          <div className="mt-12">
            <ComeFunziona momenti={MOMENTI_APP} />
          </div>
          <p className="mt-8 text-center text-caption text-faint">Schermate dell&apos;app, con i dati di un giocatore di esempio.</p>
        </div>
      </section>

      {/* Tre passi */}
      <section className="border-y border-divider bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
          <h2 className="text-center font-display text-[32px] font-bold leading-[38px]">Come si inizia</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {passi.map((p, i) => (
              <li key={p.titolo} className="rounded-card border border-divider bg-app-bg p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-500/20 font-display text-title-3 font-bold text-forest-300">{i + 1}</span>
                <h3 className="mt-4 font-display text-title-2 font-bold">{p.titolo}</h3>
                <p className="mt-2 text-body text-muted">{p.testo}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pacchetti */}
      <section id="prezzi" className="scroll-mt-4">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-overline uppercase text-forest-400">Prezzi</p>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-[38px]">La testa, il corpo, o tutti e due</h2>
            <p className="mt-3 text-body-lg text-muted">
              Un prezzo al mese, disdici quando vuoi.{lancio ? ' Il prezzo di lancio resta bloccato finché resti iscritto.' : ''}
            </p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            <SchedaPacchetto id="mentale" p={prezzi?.mentale} evidenza />
            <SchedaPacchetto id="completo" p={prezzi?.completo} />
            <SchedaPacchetto id="fisico_pro" p={prezzi?.fisico_pro}>
              <div className="mt-5 border-t border-divider pt-4">
                <p className="text-caption text-muted">Il Fisico ha tre livelli:</p>
                <ul className="mt-2 space-y-1.5">
                  {fisicoLivelli.map((id) => {
                    const p = prezzi?.[id];
                    return (
                      <li key={id} className="flex items-center justify-between text-body-sm">
                        <span className="text-app">{TESTI_PACCHETTI[id].titolo}</span>
                        <span className="tabular-nums text-muted">{p?.euro != null ? `${euroTesto(p.euro)} €/mese` : 'a breve'}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </SchedaPacchetto>
          </div>
          <p className="mx-auto mt-6 max-w-3xl text-center text-caption text-muted">{SICUREZZA_FISICO}</p>
          <div className="mt-10 flex flex-col items-center gap-3">
            <Link href={CTA} className="inline-flex min-h-[56px] items-center gap-2 rounded-btn bg-gradient-to-br from-forest-400 to-forest-600 px-7 text-body-lg font-bold text-white shadow-glow transition-transform hover:scale-[1.02]">
              Prova la prima settimana <ArrowRight size={20} aria-hidden />
            </Link>
            <span className="text-caption text-muted">{notaCta}. Il pacchetto lo scegli dopo esserti registrato.</span>
          </div>
        </div>
      </section>

      {/* Domande */}
      <section className="border-t border-divider bg-surface/60">
        <div className="mx-auto max-w-3xl px-4 py-16 lg:py-20">
          <h2 className="text-center font-display text-[32px] font-bold leading-[38px]">Le domande di chi inizia</h2>
          <div className="mt-8 divide-y divide-divider rounded-card border border-divider bg-app-bg">
            {domande.map((d) => (
              <details key={d.domanda} className="group px-5">
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 text-body-lg font-semibold text-app">
                  {d.domanda}
                  <span className="text-forest-400 transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="pb-5 text-body text-muted">{d.risposta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Chiusura */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_70%_at_50%_100%,rgba(26,150,96,0.25),transparent)]" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center">
          <h2 className="font-display text-[36px] font-bold leading-[42px]">Il Giorno 1 dura tre minuti.</h2>
          <p className="mt-3 text-body-lg text-muted">Respiri, e ci dici com&apos;è andata. Il resto viene un giorno alla volta.</p>
          <Link href={CTA} className="mt-8 inline-flex min-h-[56px] items-center gap-2 rounded-btn bg-gradient-to-br from-forest-400 to-forest-600 px-7 text-body-lg font-bold text-white shadow-glow transition-transform hover:scale-[1.02]">
            Prova la prima settimana <ArrowRight size={20} aria-hidden />
          </Link>
        </div>
      </section>

      <footer className="border-t border-divider" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-caption text-muted md:flex-row">
          <span>For You Football · Season 1: Play Free</span>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <Link href="/privacy" className="inline-flex min-h-[44px] items-center hover:text-app">Privacy</Link>
            <Link href="/termini" className="inline-flex min-h-[44px] items-center hover:text-app">Termini</Link>
            <a href="mailto:info@foryoufootball.it" className="inline-flex min-h-[44px] items-center hover:text-app">info@foryoufootball.it</a>
            <Link href="/login" className="inline-flex min-h-[44px] items-center hover:text-app">Entra</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
