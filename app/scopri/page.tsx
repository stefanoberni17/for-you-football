import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Bell, Brain, Check, Dumbbell } from 'lucide-react';
import { loadListino } from '@/lib/prezziServer';
import { contaIscrittiCampo, contaIscrittiMente, loadImpostazioni } from '@/lib/appSettings';
import { euroTesto, IMPOSTAZIONI_DEFAULT } from '@/lib/abbonamento';
import { MIN_AGE } from '@/lib/constants';
import {
  APERTURA, AVVISO_FISICO, CHIUSURA, CONOSCI_CHIUSURA, domandeFrequenti, DOVE_PORTA, FISICO_SEZIONE, FISICO_TEASER, MENTE_INCLUDE, MOMENTI_APP,
  MOMENTI_FISICO,
  MOMENTI_CONOSCI, MOMENTI_TESTA, NON_POSITIVO, NOTA_CODICE, NOTA_VALORE, passiIngresso, prezziPubblici, RACCONTI, STORIA, STORIA_FOTO,
  type FotoStoria,
  type PrezzoPubblico,
} from '@/lib/scopri';
import { ComeFunziona, TelefonoCiclo } from '@/components/scopri/Telefono';
import { Fischietto, PallaPersa, PalloneCheArriva, SeraPrima } from '@/components/scopri/Disegni';

/**
 * La pagina di vendita pubblica (6/11; testi v2 di Ste del 7/11, funnel: Notion «Funnel di vendita: mappa e piano»).
 * Testi v3 (7/11): mi riconosco, Ste mi capisce, ha costruito qualcosa di concreto, può servire a me, posso provarlo.
 * Chi apre il sito senza essere entrato arriva qui (app/page.tsx). Si vende il Mente; il Fisico e il Completo sono
 * annunciati nei prezzi finché il Campo non apre. Prezzi da Stripe e iscrizioni da app_settings con le stesse regole della pagina
 * prezzi (lib/scopri.ts), riletti ogni 5 minuti. Nessuna richiesta esterna dal browser, nessun cookie.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'For You Football · Mental training per calciatori',
  description: APERTURA.sotto,
};

const CTA = '/register';

/** Il video principale di Ste (2-3 minuti, parte muto con i sottotitoli), in fondo alla storia. Finché non c'è, niente. */
const VIDEO_PRINCIPALE: { src: string; sottotitoli?: string; poster?: string } | null = null;

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

function BottoneProva() {
  return (
    <Link href={CTA} className="inline-flex min-h-[56px] items-center gap-2 rounded-btn bg-gradient-to-br from-forest-400 to-forest-600 px-7 text-body-lg font-bold text-white shadow-glow transition-transform hover:scale-[1.02]">
      Prova la prima settimana <ArrowRight size={20} aria-hidden />
    </Link>
  );
}

function BottoneAvviso() {
  return (
    <a href={AVVISO_FISICO} className="inline-flex min-h-[48px] items-center gap-2 rounded-btn border border-forest-400/50 px-5 text-body font-semibold text-forest-300 transition-colors hover:border-forest-400 hover:text-forest-200">
      <Bell size={18} aria-hidden /> Avvisami quando apre
    </a>
  );
}

function Titolo({ etichetta, children }: { etichetta?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {etichetta && <p className="text-overline uppercase text-forest-400">{etichetta}</p>}
      <h2 className="mt-2 font-display text-[32px] font-bold leading-[38px]">{children}</h2>
    </div>
  );
}

/** I disegnini accanto alle quattro scene, nello stesso ordine di MOMENTI_CONOSCI. */
const DISEGNI_SCENE = [PalloneCheArriva, PallaPersa, SeraPrima, Fischietto];

/** Una foto della storia di Ste, con l'anno e due parole sue sotto. */
function FotoStoriaCard({ foto }: { foto: FotoStoria }) {
  return (
    <figure className="mx-auto w-[min(100%,380px)] overflow-hidden rounded-card border border-divider bg-surface">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={foto.src} alt={foto.alt} loading="lazy" decoding="async" className="block w-full" />
      <figcaption className="px-4 pb-4 pt-3">
        <span className="block text-overline uppercase text-forest-400">{foto.quando}</span>
        <span className="mt-1 block font-quote text-[18px] italic leading-[24px] text-app">{foto.didascalia}</span>
      </figcaption>
    </figure>
  );
}

/** La storia a capitoli: ogni foto con i paragrafi che la seguono, fino alla foto dopo; quelli prima della prima foto da soli. */
function capitoliStoria(): { foto?: FotoStoria; paragrafi: { testo: string; n: number }[] }[] {
  const foto = [...STORIA_FOTO].sort((x, y) => x.prima - y.prima);
  const par = STORIA.paragrafi.map((testo, n) => ({ testo, n }));
  const capitoli: { foto?: FotoStoria; paragrafi: { testo: string; n: number }[] }[] = [];
  const primaFoto = foto[0]?.prima ?? par.length;
  if (primaFoto > 0) capitoli.push({ paragrafi: par.slice(0, primaFoto) });
  foto.forEach((f, k) => capitoli.push({ foto: f, paragrafi: par.slice(f.prima, foto[k + 1]?.prima ?? par.length) }));
  return capitoli;
}

/** «da 9 € a 39 €» o «44 €», dai prezzi della configurazione. */
function importi(ps: (PrezzoPubblico | undefined)[]): string | null {
  const e = ps.map((p) => p?.euro).filter((x): x is number => x != null);
  if (!e.length) return null;
  const min = Math.min(...e), max = Math.max(...e);
  return min === max ? `${euroTesto(min)} €` : `da ${euroTesto(min)} € a ${euroTesto(max)} €`;
}

export default async function Scopri() {
  const { prezzi, imp } = await caricaPrezzi();
  const prova = imp.provaGiorni;
  const passi = passiIngresso(prova);
  const domande = domandeFrequenti(MIN_AGE);
  const notaCta = prova > 0 ? `${prova} giorni gratis · disdici con un tocco` : 'La prima settimana è gratis';
  const mente = prezzi?.mentale;
  const fisici = [prezzi?.fisico_base, prezzi?.fisico_medio, prezzi?.fisico_pro];
  const campoAperto = !!prezzi?.fisico_pro?.aperto || !!prezzi?.completo?.aperto;
  const lancioCampo = fisici.every((p) => p?.tipo === 'lancio') && prezzi?.completo?.tipo === 'lancio';

  return (
    <main className="scopri-pagina min-h-screen overflow-x-clip bg-app-bg text-app">
      {/* Barra in alto */}
      <header className="pt-safe">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="font-display text-title-3 font-bold tracking-tight">For You <span className="text-forest-400">Football</span></span>
          <Link href="/login" className="tap inline-flex items-center rounded-btn px-3 text-body-sm font-semibold text-muted hover:text-app">Entra</Link>
        </div>
      </header>

      {/* 1. Apertura */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(26,150,96,0.28),transparent)]" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-6 lg:grid-cols-2 lg:pb-24 lg:pt-12">
          <div className="scopri-entra text-center lg:text-left">
            <p className="text-overline uppercase text-forest-400">{APERTURA.etichetta}</p>
            <h1 className="mt-3 font-display text-[34px] font-bold leading-[40px] tracking-tight lg:text-[50px] lg:leading-[56px]">{APERTURA.titolo}</h1>
            <p className="mx-auto mt-5 max-w-xl text-body-lg text-muted lg:mx-0">{APERTURA.sotto}</p>
            <div className="mt-8 flex flex-col items-center gap-3 lg:items-start">
              <BottoneProva />
              <span className="text-caption text-muted">{notaCta}</span>
            </div>
          </div>
          <div className="flex justify-center">
            <TelefonoCiclo momenti={MOMENTI_APP} />
          </div>
        </div>
      </section>

      {/* 2. Le scene */}
      <section className="border-y border-divider bg-surface/60">
        <div className="mx-auto max-w-3xl px-4 py-16 lg:py-20">
          <ul className="space-y-3">
            {MOMENTI_CONOSCI.map((m, i) => {
              const Disegno = DISEGNI_SCENE[i];
              return (
                <li key={m} className="flex items-center gap-4 rounded-card border border-divider bg-app-bg px-5 py-4">
                  {Disegno && <Disegno className="h-10 w-14 shrink-0 text-forest-400" />}
                  <span className="font-quote text-[21px] italic leading-[30px] text-app">{m}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-8 text-center text-body-lg text-muted">{CONOSCI_CHIUSURA}</p>
        </div>
      </section>

      {/* 3. Chi c'è dietro */}
      <section>
        <div className="mx-auto max-w-3xl px-4 py-16 lg:py-20">
          <p className="text-overline uppercase text-forest-400">Chi c&apos;è dietro</p>
          <blockquote className="mt-4 font-quote text-[26px] italic leading-[34px] text-app lg:text-[32px] lg:leading-[42px]">{STORIA.citazione}</blockquote>
          {STORIA_FOTO.length > 0 ? (
            <div className="mt-10 space-y-12 text-body-lg text-muted lg:-mx-24">
              {capitoliStoria().map((c, i) => (
                <div key={i} className={c.foto ? 'grid items-center gap-8 sm:grid-cols-2 sm:gap-10' : ''}>
                  {c.foto && <FotoStoriaCard foto={c.foto} />}
                  <div className={`space-y-4 ${c.foto && i % 2 === 0 ? 'sm:order-first' : ''}`}>
                    {c.paragrafi.map(({ testo, n }) => <p key={n} className={n === 0 ? 'text-app' : ''}>{testo}</p>)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-forest-500 to-forest-700 font-display text-title-3 font-bold text-white" aria-hidden>SB</div>
              <div className="space-y-4 text-body-lg text-muted">
                {STORIA.paragrafi.map((p, i) => <p key={i} className={i === 0 ? 'text-app' : ''}>{p}</p>)}
              </div>
            </div>
          )}
          {VIDEO_PRINCIPALE && (
            <video className="mt-10 w-full rounded-card shadow-e3" src={VIDEO_PRINCIPALE.src} poster={VIDEO_PRINCIPALE.poster} muted autoPlay playsInline controls preload="metadata">
              {VIDEO_PRINCIPALE.sottotitoli && <track kind="captions" src={VIDEO_PRINCIPALE.sottotitoli} srcLang="it" label="Italiano" default />}
            </video>
          )}
        </div>
      </section>

      {/* 4. Dove ti porta il lavoro */}
      <section className="border-t border-divider">
        <div className="mx-auto max-w-3xl px-4 py-16 lg:py-20">
          <Titolo>{DOVE_PORTA.titolo}</Titolo>
          <p className="mt-6 text-center text-body-lg text-muted">{DOVE_PORTA.intro}</p>
          <ul className="mx-auto mt-6 max-w-xl space-y-3">
            {DOVE_PORTA.punti.map((r) => (
              <li key={r} className="flex items-start gap-3 rounded-card border border-divider bg-surface px-5 py-4 text-body-lg text-app">
                <Check size={20} className="mt-1 shrink-0 text-forest-400" aria-hidden />
                <span>{r}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center text-body-lg text-muted">{DOVE_PORTA.chiusura}</p>
        </div>
      </section>

      {/* 5. Non è pensiero positivo */}
      <section className="border-y border-divider bg-surface/60">
        <div className="mx-auto max-w-3xl px-4 py-16 lg:py-20">
          <Titolo>{NON_POSITIVO.titolo}</Titolo>
          <div className="mt-8 space-y-4 text-center text-body-lg text-muted">
            {NON_POSITIVO.paragrafi.map((p, i) => <p key={i} className={i === 1 ? 'text-app' : ''}>{p}</p>)}
          </div>
        </div>
      </section>

      {/* 6. Come funziona */}
      <section id="come-funziona" className="scroll-mt-4">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="inline-flex items-center gap-1.5 text-overline uppercase text-forest-400"><Brain size={14} aria-hidden /> Dentro l&apos;app · La Testa</p>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-[38px]">Come funziona</h2>
          </div>
          <div className="mt-12">
            <ComeFunziona momenti={MOMENTI_TESTA} />
          </div>
          <p className="mt-8 text-center text-caption text-faint">Schermate dell&apos;app, con i dati di un giocatore di esempio.</p>
        </div>
      </section>

      {/* 6b. Il Fisico: apre a dicembre, intanto si vede com'è (schermate e testi in MOMENTI_FISICO) */}
      <section id="fisico" className="scroll-mt-4 border-t border-divider bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="inline-flex items-center gap-1.5 text-overline uppercase text-forest-400">
              <Dumbbell size={14} aria-hidden /> {campoAperto ? FISICO_TEASER.titolo : `${FISICO_TEASER.titolo} · ${FISICO_TEASER.quando.toLowerCase()}`}
            </p>
            <h2 className="mt-2 font-display text-[32px] font-bold leading-[38px]">{FISICO_SEZIONE.titolo}</h2>
            <p className="mt-3 text-body-lg text-muted">{FISICO_SEZIONE.intro}</p>
          </div>
          <ul className="mx-auto mt-8 grid max-w-4xl gap-3 md:grid-cols-3">
            {FISICO_SEZIONE.origine.map((r) => (
              <li key={r} className="flex gap-2.5 rounded-card border border-divider bg-app-bg p-4 text-body-sm text-muted">
                <Check size={16} className="mt-0.5 shrink-0 text-forest-400" aria-hidden />
                <span>{r}</span>
              </li>
            ))}
          </ul>
          <div className="mt-12">
            <ComeFunziona momenti={MOMENTI_FISICO} invertito />
          </div>
          <p className="mt-8 text-center text-caption text-faint">Schermate dell&apos;app, con i dati di un giocatore di esempio.</p>
          <p className="mt-4 text-center">
            <a href="#prezzi-fisico" className="inline-flex min-h-[44px] items-center gap-1.5 text-body font-semibold text-forest-300 hover:text-forest-200">
              I prezzi del Fisico <ArrowRight size={16} aria-hidden />
            </a>
          </p>
        </div>
      </section>

      {/* 7. Cosa dicono i primi: solo con racconti veri e il consenso scritto (lib/scopri.ts, RACCONTI) */}
      {RACCONTI.length > 0 && (
        <section className="border-y border-divider bg-surface/60">
          <div className="mx-auto max-w-5xl px-4 py-16 lg:py-20">
            <Titolo>Cosa dicono i primi</Titolo>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {RACCONTI.map((r) => (
                <figure key={r.chi + r.testo} className="rounded-card border border-divider bg-app-bg p-6">
                  <blockquote className="font-quote text-[20px] italic leading-[29px] text-app">«{r.testo}»</blockquote>
                  <figcaption className="mt-4 text-body-sm text-muted">{r.chi} · {r.ruolo} · {r.categoria}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. Come si inizia */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
          <Titolo>Come si inizia</Titolo>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {passi.map((p, i) => (
              <li key={p.titolo} className="rounded-card border border-divider bg-surface p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-500/20 font-display text-title-3 font-bold text-forest-300">{i + 1}</span>
                <h3 className="mt-4 font-display text-title-2 font-bold">{p.titolo}</h3>
                <p className="mt-2 text-body text-muted">{p.testo}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 9. Prezzi */}
      <section id="prezzi" className="scroll-mt-4 border-t border-divider bg-surface/60">
        <div className="mx-auto max-w-3xl px-4 py-16 lg:py-24">
          <Titolo etichetta="Prezzi">Un prezzo al mese. Disdici quando vuoi.</Titolo>

          <div className="mx-auto mt-10 max-w-xl rounded-card border border-forest-400/60 bg-forest-500/10 p-6 shadow-glow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-title-1 font-bold">Mente</h3>
                {mente?.euro != null && mente.tipo === 'lancio' && (
                  <span className="mt-1 inline-block rounded-full bg-forest-500/20 px-2 py-0.5 text-overline uppercase text-forest-300">Prezzo di lancio</span>
                )}
              </div>
              {mente?.euro != null ? (
                <div className="shrink-0 text-right">
                  <div className="whitespace-nowrap font-display text-[36px] font-bold leading-none tabular-nums">{euroTesto(mente.euro)} €</div>
                  <div className="mt-1 text-caption text-muted">al mese</div>
                </div>
              ) : <span className="text-body-sm font-semibold text-muted">Per ora chiuso</span>}
            </div>
            {mente?.euro != null && mente.tipo === 'lancio' && <p className="mt-3 text-body-sm text-app">Bloccato finché resti iscritto.</p>}
            {mente && !mente.aperto && mente.euro != null && <p className="mt-3 text-body-sm text-muted">Le iscrizioni sono chiuse per ora: registrati e ti avvisiamo quando riaprono.</p>}
            <ul className="mt-5 space-y-2.5">
              {MENTE_INCLUDE.map((r) => (
                <li key={r} className="flex items-start gap-2.5 text-body text-app">
                  <Check size={18} className="mt-0.5 shrink-0 text-forest-400" aria-hidden />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-col items-center gap-2">
              <BottoneProva />
              <span className="text-caption text-muted">{notaCta}</span>
            </div>
          </div>

          <p className="mx-auto mt-6 max-w-xl text-center text-body text-muted">{NOTA_VALORE}</p>
          <p className="mx-auto mt-2 max-w-xl text-center text-body-sm text-muted">{NOTA_CODICE}</p>

          <div id="prezzi-fisico" className="mx-auto mt-10 max-w-xl scroll-mt-4 rounded-card border border-divider bg-app-bg p-5">
            <p className="text-overline uppercase text-forest-400">{campoAperto ? FISICO_TEASER.titolo : `${FISICO_TEASER.quando} · ${FISICO_TEASER.titolo}`}</p>
            <p className="mt-2 text-body text-muted">{FISICO_TEASER.testo}</p>
            <ul className="mt-4 space-y-3">
              <li className="flex items-baseline justify-between gap-3">
                <span className="text-body text-app"><span className="font-semibold">Completo</span> <span className="text-muted">· Mente + Fisico Pro</span></span>
                <span className="shrink-0 text-right text-body-sm tabular-nums text-muted">{importi([prezzi?.completo]) ?? 'a breve'}</span>
              </li>
              <li className="flex items-baseline justify-between gap-3">
                <span className="text-body text-app"><span className="font-semibold">Fisico</span> <span className="text-muted">· tre livelli</span></span>
                <span className="shrink-0 text-right text-body-sm tabular-nums text-muted">{importi(fisici) ?? 'a breve'}</span>
              </li>
            </ul>
            {lancioCampo && <p className="mt-2 text-caption text-muted">Prezzi di lancio, al mese.</p>}
            <div className="mt-4">{campoAperto ? <BottoneProva /> : <BottoneAvviso />}</div>
          </div>
        </div>
      </section>

      {/* 10. Le domande di chi inizia */}
      <section>
        <div className="mx-auto max-w-3xl px-4 py-16 lg:py-20">
          <Titolo>Le domande di chi inizia</Titolo>
          <div className="mt-8 divide-y divide-divider rounded-card border border-divider bg-surface">
            {domande.map((d) => (
              <details key={d.domanda} className="group px-5">
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 text-body-lg font-semibold text-app [&::-webkit-details-marker]:hidden">
                  {d.domanda}
                  <span className="text-forest-400 transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="pb-5 text-body text-muted">{d.risposta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 11. Chiusura */}
      <section className="relative border-t border-divider">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_70%_at_50%_100%,rgba(26,150,96,0.25),transparent)]" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="font-quote text-[24px] italic leading-[34px] text-app lg:text-[28px] lg:leading-[38px]">{CHIUSURA[0]}</p>
          <p className="mt-5 font-display text-title-1 font-bold">{CHIUSURA[1]}</p>
          <div className="mt-8 flex flex-col items-center gap-2">
            <BottoneProva />
            <span className="text-caption text-muted">{notaCta}</span>
          </div>
        </div>
      </section>

      <footer className="border-t border-divider" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-center text-caption text-muted md:flex-row md:text-left">
          <span>For You Football · Season 1: Play Free · For You Football non è un servizio sanitario né psicologico</span>
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
