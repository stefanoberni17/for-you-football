import type { Metadata } from 'next';
import Link from 'next/link';
import localFont from 'next/font/local';
import { ArrowRight, Bell, Check } from 'lucide-react';
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
import { CerchioCentrocampo, Fischietto, Fregio, MezzoCampo, PallaPersa, Pallone, PalloneCheArriva, SeraPrima, Stemma } from '@/components/scopri/Disegni';

/** Crimson Pro tondo, solo per questa pagina: i titoli con le grazie (7/11, Ste: «più classico, quasi vintage»). */
const serif = localFont({ src: '../fonts/crimson-pro-latin-wght.woff2', display: 'swap', weight: '200 900', variable: '--font-scopri-serif' });

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
    <Link href={CTA} className="scopri-bottone inline-flex min-h-[56px] items-center gap-2 rounded-[6px] bg-forest-600 px-7 text-body-lg font-semibold text-[#f7f1e4] transition-colors hover:bg-forest-700">
      Prova la prima settimana <ArrowRight size={20} aria-hidden />
    </Link>
  );
}

function BottoneAvviso() {
  return (
    <a href={AVVISO_FISICO} className="inline-flex min-h-[48px] items-center gap-2 rounded-[6px] border border-forest-600 px-5 text-body font-semibold text-forest-600 transition-colors hover:bg-forest-600 hover:text-[#f7f1e4]">
      <Bell size={18} aria-hidden /> Avvisami quando apre
    </a>
  );
}

/** L'etichetta sopra i titoli: maiuscoletto spaziato, come sui programmi delle partite. */
function Etichetta({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`scopri-etichetta text-forest-500 ${className}`}>{children}</p>;
}

function Titolo({ etichetta, children }: { etichetta?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {etichetta && <Etichetta>{etichetta}</Etichetta>}
      <h2 className="scopri-serif mt-3 text-balance text-[36px] font-semibold leading-[40px] lg:text-[44px] lg:leading-[48px]">{children}</h2>
    </div>
  );
}

/** Una foto della storia di Ste: stampa con il bordo bianco, appena storta, la data e due parole scritte sotto. */
function FotoAlbum({ foto, lato }: { foto: FotoStoria; lato: 'destra' | 'sinistra' }) {
  const storta = lato === 'destra' ? 'rotate-[1.6deg]' : '-rotate-[1.4deg]';
  return (
    <figure className={`scopri-stampa mx-auto w-[min(100%,380px)] ${storta}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={foto.src} alt={foto.alt} loading="lazy" decoding="async" className="block w-full" />
      <figcaption className="px-1 pb-1 pt-3 text-center">
        <span className="scopri-etichetta block text-[var(--scopri-ruggine)]">{foto.quando}</span>
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

/** Le quattro scene, ognuna con il suo momento e il suo disegno. */
const SCENE: { quando: string; Disegno: (p: { className?: string }) => React.ReactElement }[] = [
  { quando: 'Il primo pallone', Disegno: PalloneCheArriva },
  { quando: 'Dopo l\'errore', Disegno: PallaPersa },
  { quando: 'La sera prima', Disegno: SeraPrima },
  { quando: 'Al fischio finale', Disegno: Fischietto },
];

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
    <main className={`scopri-carta ${serif.variable} min-h-screen overflow-x-clip`}>
      {/* Barra in alto */}
      <header className="pt-safe">
        <div className="mx-auto flex max-w-6xl items-center justify-between border-b border-divider px-4 py-4">
          <span className="flex items-center gap-2.5">
            <Pallone className="h-8 w-8 text-forest-600" />
            <span className="scopri-serif text-[22px] font-semibold tracking-tight">For You Football</span>
          </span>
          <Link href="/login" className="tap inline-flex items-center rounded-[6px] px-3 text-body-sm font-semibold text-muted hover:text-app">Entra</Link>
        </div>
      </header>

      {/* 1. Apertura */}
      <section className="relative">
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 lg:grid-cols-2 lg:pb-24 lg:pt-16">
          <div className="scopri-entra text-center lg:text-left">
            <Etichetta>{APERTURA.etichetta}</Etichetta>
            <h1 className="scopri-serif mt-4 text-balance text-[40px] font-semibold leading-[44px] tracking-tight lg:text-[60px] lg:leading-[62px]">{APERTURA.titolo}</h1>
            <p className="mx-auto mt-6 max-w-xl text-body-lg text-muted lg:mx-0">{APERTURA.sotto}</p>
            <div className="mt-8 flex flex-col items-center gap-3 lg:items-start">
              <BottoneProva />
              <span className="text-caption text-muted">{notaCta}</span>
            </div>
          </div>
          <div className="relative flex justify-center">
            <CerchioCentrocampo className="pointer-events-none absolute left-1/2 top-1/2 w-[560px] max-w-none -translate-x-1/2 -translate-y-1/2 text-forest-500 opacity-25" />
            <TelefonoCiclo momenti={MOMENTI_APP} />
          </div>
        </div>
      </section>

      {/* 2. Le scene */}
      <section className="border-y border-divider bg-surface/70">
        <div className="mx-auto max-w-5xl px-4 py-16 lg:py-24">
          <Etichetta className="text-center">Lo conosci questo momento?</Etichetta>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2">
            {MOMENTI_CONOSCI.map((m, i) => {
              const { quando, Disegno } = SCENE[i] ?? SCENE[0];
              return (
                <li key={m} className="scopri-foglio flex flex-col p-6">
                  <Disegno className="h-16 w-24 text-forest-600" />
                  <span className="scopri-etichetta mt-4 text-[var(--scopri-ruggine)]">{quando}</span>
                  <p className="mt-2 font-quote text-[22px] italic leading-[31px] text-app">{m}</p>
                </li>
              );
            })}
          </ul>
          <p className="scopri-serif mx-auto mt-12 max-w-2xl text-center text-[24px] leading-[32px] text-app">{CONOSCI_CHIUSURA}</p>
        </div>
      </section>

      {/* 3. Chi c'è dietro */}
      <section>
        <div className="mx-auto max-w-3xl px-4 py-16 lg:py-24">
          <Fregio />
          <Etichetta className="mt-8 text-center">Chi c&apos;è dietro</Etichetta>
          <blockquote className="mt-6 text-center font-quote text-[28px] italic leading-[37px] text-app lg:text-[36px] lg:leading-[46px]">{STORIA.citazione}</blockquote>
          {STORIA_FOTO.length > 0 ? (
            <div className="mt-14 space-y-14 text-body-lg leading-[28px] text-muted lg:-mx-24">
              {capitoliStoria().map((c, i) => (
                <div key={i} className={c.foto ? 'grid items-center gap-8 sm:grid-cols-2 sm:gap-12' : ''}>
                  {c.foto && <FotoAlbum foto={c.foto} lato={i % 2 === 0 ? 'destra' : 'sinistra'} />}
                  <div className={`space-y-5 ${c.foto && i % 2 === 0 ? 'sm:order-first' : ''}`}>
                    {c.paragrafi.map(({ testo, n }) => <p key={n} className={n === 0 ? 'scopri-capolettera text-app' : ''}>{testo}</p>)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-12 flex flex-col items-center gap-8 sm:flex-row sm:items-start">
              <div className="scopri-timbro flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full text-forest-600" aria-hidden>
                <span className="scopri-serif text-[30px] font-semibold leading-none">SB</span>
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em]">Ste</span>
              </div>
              <div className="space-y-5 text-body-lg leading-[28px] text-muted">
                {STORIA.paragrafi.map((p, i) => <p key={i} className={i === 0 ? 'scopri-capolettera text-app' : ''}>{p}</p>)}
              </div>
            </div>
          )}
          {VIDEO_PRINCIPALE && (
            <video className="scopri-foto mt-12 w-full" src={VIDEO_PRINCIPALE.src} poster={VIDEO_PRINCIPALE.poster} muted autoPlay playsInline controls preload="metadata">
              {VIDEO_PRINCIPALE.sottotitoli && <track kind="captions" src={VIDEO_PRINCIPALE.sottotitoli} srcLang="it" label="Italiano" default />}
            </video>
          )}
        </div>
      </section>

      {/* 4. Dove ti porta il lavoro */}
      <section className="relative border-t border-divider bg-surface/70">
        <MezzoCampo className="pointer-events-none absolute left-1/2 top-0 w-[720px] max-w-none -translate-x-1/2 text-forest-500 opacity-[0.12]" />
        <div className="relative mx-auto max-w-3xl px-4 py-16 lg:py-24">
          <Titolo>{DOVE_PORTA.titolo}</Titolo>
          <p className="mt-6 text-center text-body-lg text-muted">{DOVE_PORTA.intro}</p>
          <ol className="mx-auto mt-8 max-w-xl">
            {DOVE_PORTA.punti.map((r, i) => (
              <li key={r} className="flex items-baseline gap-5 border-b border-divider py-5 last:border-b-0">
                <span className="scopri-serif w-8 shrink-0 text-right text-[28px] font-semibold leading-none text-[var(--scopri-ruggine)]">{i + 1}</span>
                <span className="scopri-serif text-[22px] leading-[30px] text-app">{r}</span>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-center text-body-lg text-muted">{DOVE_PORTA.chiusura}</p>
        </div>
      </section>

      {/* 5. Non è pensiero positivo */}
      <section className="border-y border-divider">
        <div className="mx-auto max-w-2xl px-4 py-16 lg:py-24">
          <Titolo>{NON_POSITIVO.titolo}</Titolo>
          <div className="mt-8 space-y-5 text-center text-body-lg leading-[28px] text-muted">
            {NON_POSITIVO.paragrafi.map((p, i) => <p key={i} className={i === 1 ? 'scopri-serif text-[23px] leading-[33px] text-app' : ''}>{p}</p>)}
          </div>
          <Fregio className="mt-12" />
        </div>
      </section>

      {/* 6. Come funziona: la Testa */}
      <section id="come-funziona" className="scroll-mt-4">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-24">
          <Titolo etichetta="Dentro l'app · La Testa">Come funziona</Titolo>
          <div className="mt-12">
            <ComeFunziona momenti={MOMENTI_TESTA} />
          </div>
          <p className="mt-8 text-center text-caption text-faint">Schermate dell&apos;app, con i dati di un giocatore di esempio.</p>
        </div>
      </section>

      {/* 6b. Il Fisico: apre a dicembre, intanto si vede com'è (schermate e testi in MOMENTI_FISICO) */}
      <section id="fisico" className="scroll-mt-4 border-t border-divider bg-surface/70">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-24">
          <Titolo etichetta={campoAperto ? `Dentro l'app · ${FISICO_TEASER.titolo}` : `${FISICO_TEASER.titolo} · ${FISICO_TEASER.quando.toLowerCase()}`}>{FISICO_SEZIONE.titolo}</Titolo>
          <p className="mx-auto mt-5 max-w-2xl text-center text-body-lg text-muted">{FISICO_SEZIONE.intro}</p>
          <ul className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-3">
            {FISICO_SEZIONE.origine.map((r, i) => (
              <li key={r} className="scopri-foglio p-5 text-body text-app">
                <span className="scopri-serif block text-[26px] font-semibold leading-none text-[var(--scopri-ruggine)]">{['I', 'II', 'III'][i]}</span>
                <span className="mt-3 block">{r}</span>
              </li>
            ))}
          </ul>
          <div className="mt-14">
            <ComeFunziona momenti={MOMENTI_FISICO} invertito />
          </div>
          <p className="mt-8 text-center text-caption text-faint">Schermate dell&apos;app, con i dati di un giocatore di esempio.</p>
          <p className="mt-4 text-center">
            <a href="#prezzi-fisico" className="inline-flex min-h-[44px] items-center gap-1.5 text-body font-semibold text-forest-600 underline decoration-forest-600/40 underline-offset-4 hover:decoration-forest-600">
              I prezzi del Fisico <ArrowRight size={16} aria-hidden />
            </a>
          </p>
        </div>
      </section>

      {/* 7. Cosa dicono i primi: solo con racconti veri e il consenso scritto (lib/scopri.ts, RACCONTI) */}
      {RACCONTI.length > 0 && (
        <section className="border-t border-divider">
          <div className="mx-auto max-w-5xl px-4 py-16 lg:py-20">
            <Titolo>Cosa dicono i primi</Titolo>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {RACCONTI.map((r) => (
                <figure key={r.chi + r.testo} className="scopri-foglio p-6">
                  <blockquote className="font-quote text-[21px] italic leading-[30px] text-app">«{r.testo}»</blockquote>
                  <figcaption className="mt-4 text-body-sm text-muted">{r.chi} · {r.ruolo} · {r.categoria}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. Come si inizia */}
      <section className="border-t border-divider">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-24">
          <Titolo>Come si inizia</Titolo>
          <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6">
            {passi.map((p, i) => (
              <li key={p.titolo} className="text-center">
                <span className="scopri-timbro scopri-serif mx-auto flex h-16 w-16 items-center justify-center rounded-full text-[28px] font-semibold text-forest-600">{i + 1}</span>
                <h3 className="scopri-serif mt-5 text-[26px] font-semibold leading-[30px]">{p.titolo}</h3>
                <p className="mx-auto mt-3 max-w-xs text-body text-muted">{p.testo}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 9. Prezzi: il biglietto */}
      <section id="prezzi" className="scroll-mt-4 border-t border-divider bg-surface/70">
        <div className="mx-auto max-w-3xl px-4 py-16 lg:py-24">
          <Titolo etichetta="Prezzi">Un prezzo al mese. Disdici quando vuoi.</Titolo>

          <div className="scopri-biglietto mx-auto mt-12 max-w-xl">
            <div className="flex items-start justify-between gap-4 border-b border-dashed border-divider pb-5">
              <div>
                <span className="scopri-etichetta text-[var(--scopri-ruggine)]">Ingresso · Season 1</span>
                <h3 className="scopri-serif mt-1 text-[40px] font-semibold leading-none">Mente</h3>
                {mente?.euro != null && mente.tipo === 'lancio' && (
                  <span className="mt-3 inline-block rounded-[4px] border border-forest-600/50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-forest-600">Prezzo di lancio</span>
                )}
              </div>
              {mente?.euro != null ? (
                <div className="shrink-0 text-right">
                  <div className="scopri-serif whitespace-nowrap text-[48px] font-semibold leading-none tabular-nums">{euroTesto(mente.euro)} €</div>
                  <div className="mt-1 text-caption text-muted">al mese</div>
                </div>
              ) : <span className="text-body-sm font-semibold text-muted">Per ora chiuso</span>}
            </div>
            {mente?.euro != null && mente.tipo === 'lancio' && <p className="mt-4 text-body-sm text-app">Bloccato finché resti iscritto.</p>}
            {mente && !mente.aperto && mente.euro != null && <p className="mt-4 text-body-sm text-muted">Le iscrizioni sono chiuse per ora: registrati e ti avvisiamo quando riaprono.</p>}
            <ul className="mt-5 space-y-3">
              {MENTE_INCLUDE.map((r) => (
                <li key={r} className="flex items-start gap-3 text-body text-app">
                  <Check size={18} className="mt-0.5 shrink-0 text-forest-600" aria-hidden />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col items-center gap-2">
              <BottoneProva />
              <span className="text-caption text-muted">{notaCta}</span>
            </div>
          </div>

          <p className="mx-auto mt-8 max-w-xl text-center text-body text-muted">{NOTA_VALORE}</p>
          <p className="mx-auto mt-2 max-w-xl text-center text-body-sm text-muted">{NOTA_CODICE}</p>

          <div id="prezzi-fisico" className="scopri-foglio mx-auto mt-10 max-w-xl scroll-mt-4 p-6">
            <span className="scopri-etichetta text-forest-500">{campoAperto ? FISICO_TEASER.titolo : `${FISICO_TEASER.quando} · ${FISICO_TEASER.titolo}`}</span>
            <p className="mt-2 text-body text-muted">{FISICO_TEASER.testo}</p>
            <ul className="mt-4 divide-y divide-dashed divide-divider">
              <li className="flex items-baseline justify-between gap-3 py-3">
                <span className="text-body text-app"><span className="scopri-serif text-[20px] font-semibold">Completo</span> <span className="text-muted">· Mente + Fisico Pro</span></span>
                <span className="shrink-0 text-right text-body-sm tabular-nums text-muted">{importi([prezzi?.completo]) ?? 'a breve'}</span>
              </li>
              <li className="flex items-baseline justify-between gap-3 py-3">
                <span className="text-body text-app"><span className="scopri-serif text-[20px] font-semibold">Fisico</span> <span className="text-muted">· tre livelli</span></span>
                <span className="shrink-0 text-right text-body-sm tabular-nums text-muted">{importi(fisici) ?? 'a breve'}</span>
              </li>
            </ul>
            {lancioCampo && <p className="mt-1 text-caption text-muted">Prezzi di lancio, al mese.</p>}
            <div className="mt-4">{campoAperto ? <BottoneProva /> : <BottoneAvviso />}</div>
          </div>
        </div>
      </section>

      {/* 10. Le domande di chi inizia */}
      <section className="border-t border-divider">
        <div className="mx-auto max-w-3xl px-4 py-16 lg:py-24">
          <Titolo>Le domande di chi inizia</Titolo>
          <div className="mt-10 border-t border-divider">
            {domande.map((d) => (
              <details key={d.domanda} className="group border-b border-divider">
                <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-3 py-3 [&::-webkit-details-marker]:hidden">
                  <span className="scopri-serif text-[21px] font-semibold leading-[27px] text-app">{d.domanda}</span>
                  <span className="scopri-serif text-[28px] leading-none text-[var(--scopri-ruggine)] transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="pb-6 text-body-lg leading-[27px] text-muted">{d.risposta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 11. Chiusura */}
      <section className="border-t border-divider bg-surface/70">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center lg:py-28">
          <Stemma className="mx-auto h-36 w-36 text-forest-600" />
          <p className="mt-10 font-quote text-[26px] italic leading-[36px] text-app lg:text-[30px] lg:leading-[41px]">{CHIUSURA[0]}</p>
          <p className="scopri-serif mt-6 text-[30px] font-semibold leading-[36px]">{CHIUSURA[1]}</p>
          <div className="mt-10 flex flex-col items-center gap-2">
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
