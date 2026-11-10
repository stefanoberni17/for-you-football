import type { Metadata } from 'next';
import { Check, ChevronDown } from 'lucide-react';
import { loadListino } from '@/lib/prezziServer';
import { contaIscrittiCampo, contaIscrittiMente, loadImpostazioni } from '@/lib/appSettings';
import { euroTesto, IMPOSTAZIONI_DEFAULT } from '@/lib/abbonamento';
import { MIN_AGE } from '@/lib/constants';
import {
  APERTURA, CHIUSURA, CONOSCI_CHIUSURA, domandeFrequenti, FISICO_TEASER, MENTE_INCLUDE, MOMENTI_APP, MOMENTI_CONOSCI, MOMENTI_FISICO,
  MOMENTI_TESTA, NON_POSITIVO, NOTA_CODICE, NOTA_VALORE, passiIngresso, prezziPubblici, RACCONTI, STORIA,
  type PrezzoPubblico,
} from '@/lib/scopri';
import { TelefonoCiclo } from '@/components/scopri/Telefono';
import { Tour } from '@/components/scopri/Tour';
import { Fischietto, PallaPersa, PalloneCheArriva, SeraPrima } from '@/components/scopri/Disegni';
import { ApriStoria, Cerchio, VisoreStorie } from '@/components/scopri/Storie';
import { Carosello } from '@/components/scopri/Carosello';
import { BarraProva } from '@/components/scopri/BarraProva';
import { Rivela } from '@/components/scopri/Rivela';
import { BottoneAvviso, BottoneProva, CTA, Intestazione, PiePagina, Titolo } from '@/components/scopri/Parti';

/**
 * La pagina di vendita pubblica (6/11; testi v2 di Ste del 7/11, funnel: Notion «Funnel di vendita: mappa e piano»).
 * Testi v3 (7/11): mi riconosco, Ste mi capisce, ha costruito qualcosa di concreto, può servire a me, posso provarlo.
 * Corta e viva (7/11, Ste: «solo le cose essenziali, poi approfondire quello che vuole»; «dinamica, non classica con i link»):
 * apertura, le scene a carosello, Ste come un profilo con la griglia delle foto, il giro dell'app Testa | Corpo (Tour.tsx),
 * «Il metodo» con tre cerchi, prezzi, domande, chiusura. I cerchi stanno nella loro sezione (8/11) e aprono le storie a tutto
 * schermo come sui social (Storie.tsx); su telefono il bottone resta in basso (BarraProva.tsx). Su telefono ogni sezione è
 * una schermata e la pagina si ferma a ognuna (`.scopri-schermo` in globals.css): niente su e giù dentro una sezione.
 * Tutto in una pagina, niente link per approfondire; le sezioni entrano mentre scorri (Rivela.tsx).
 * Chi apre il sito senza essere entrato arriva qui (app/page.tsx). Si vende il Mente; il Fisico e il Completo sono
 * annunciati nei prezzi finché il Campo non apre. Prezzi da Stripe e iscrizioni da app_settings con le stesse regole della pagina
 * prezzi (lib/scopri.ts), riletti ogni 5 minuti. Nessuna richiesta esterna dal browser, nessun cookie.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'For You Football · Mental training per calciatori',
  description: APERTURA.sotto,
};

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

/** Il titolo d'apertura in due tempi: la prima frase dritta, la seconda in corsivo. */
function dividiTitolo(t: string): [string, string] {
  const i = t.indexOf('. ');
  return i < 0 ? [t, ''] : [t.slice(0, i + 1), t.slice(i + 2)];
}

/** I disegnini accanto alle quattro scene, nello stesso ordine di MOMENTI_CONOSCI. */
const DISEGNI_SCENE = [PalloneCheArriva, PallaPersa, SeraPrima, Fischietto];

/** Ste come un profilo: i numeri e le righe sotto il nome. Solo cose vere e sue. */
const NUMERI = [
  { numero: '100+', etichetta: 'calciatori' },
  { numero: '12', etichetta: 'settimane' },
  { numero: '300+', etichetta: 'esercizi' },
];
const BIO = [
  'Ex calciatore professionista e semiprofessionista, esordio in Serie C con la Reggiana.',
  'Corso da mental coach, studi da personal trainer.',
  'Fondatore di For You Football.',
];
/** La griglia: le foto dei capitoli (quella della presentazione è già la foto del profilo); ognuna apre la storia dalla sua schermata (prima ci sono presentazione e citazione). */
const fotoCapitoli = STORIA.capitoli.flatMap((c, k) => (c.foto ? [{ ...c.foto, schermata: k + 2 }] : []));
/** Righe intere da tre: una foto in più non resta da sola in fondo. */
const grigliaStoria = fotoCapitoli.slice(0, Math.max(3, Math.floor(fotoCapitoli.length / 3) * 3));

/** Le foto della griglia che restano su telefono (una riga: la schermata non deve scorrere). */
const FOTO_SU_TELEFONO = 3;

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
  const [titoloA, titoloB] = dividiTitolo(APERTURA.titolo);
  const mente = prezzi?.mentale;
  const fisici = [prezzi?.fisico_base, prezzi?.fisico_medio, prezzi?.fisico_pro];
  const campoAperto = !!prezzi?.fisico_pro?.aperto || !!prezzi?.completo?.aperto;
  const lancioCampo = fisici.every((p) => p?.tipo === 'lancio') && prezzi?.completo?.tipo === 'lancio';
  const notaFisico = campoAperto ? undefined : FISICO_TEASER.quando.toLowerCase();

  return (
    <main className="scopri-pagina min-h-screen overflow-x-clip bg-app-bg text-app">
      {/* 1. Apertura: su telefono il telefono spunta dal fondo della schermata */}
      <section className="scopri-schermo scopri-schermo-pieno relative flex flex-col overflow-hidden lg:overflow-visible">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(26,150,96,0.28),transparent)]" aria-hidden />
        <div className="relative"><Intestazione /></div>
        <div className="relative mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-6 px-4 pt-1 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:pb-24 lg:pt-12">
          <div className="scopri-entra text-center lg:text-left">
            <p className="text-overline uppercase text-forest-400">{APERTURA.etichetta}</p>
            <h1 className="mt-3 font-display text-[32px] font-bold leading-[38px] tracking-tight lg:text-[50px] lg:leading-[56px]">
              {titoloA}{titoloB && <> <span className="font-quote text-[36px] font-semibold italic tracking-normal text-forest-300 lg:text-[56px]">{titoloB}</span></>}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-body-lg text-muted lg:mx-0 lg:mt-5">{APERTURA.sotto}</p>
            <div className="mt-6 flex flex-col items-center gap-2 lg:mt-8 lg:items-start lg:gap-3">
              <BottoneProva />
              <span className="text-caption text-muted">{notaCta}</span>
            </div>
          </div>
          <div className="relative min-h-[140px] flex-1 lg:flex lg:justify-center">
            <div className="absolute inset-x-0 top-2 flex justify-center lg:static">
              <TelefonoCiclo momenti={MOMENTI_APP} className="w-[min(64vw,290px)] lg:w-[min(340px,calc((100vh-150px)*0.47))]" />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-app-bg to-transparent lg:hidden" aria-hidden />
            <ChevronDown size={22} className="absolute bottom-3 left-1/2 -translate-x-1/2 text-muted lg:hidden" aria-hidden />
          </div>
        </div>
      </section>

      {/* 2. Le scene */}
      <section className="scopri-schermo border-y border-divider bg-surface/60">
        <div className="mx-auto w-full max-w-3xl px-4 lg:py-16">
          <p className="text-center text-overline uppercase text-forest-400">Lo conosci questo momento?</p>
          <div className="mt-5 lg:mt-6">
            <Carosello
              etichetta="Quattro momenti che conosci"
              schede={MOMENTI_CONOSCI.map((m, i) => {
                const Disegno = DISEGNI_SCENE[i];
                return (
                  <div key={m} className="flex h-[clamp(220px,calc(100svh-430px),420px)] flex-col justify-between rounded-card border border-divider bg-[radial-gradient(80%_60%_at_20%_10%,rgba(26,150,96,0.22),transparent)] bg-app-bg p-6 lg:aspect-[5/4] lg:h-auto">
                    {Disegno && <Disegno className="scopri-basso-via h-20 w-28 text-forest-400" />}
                    <p className="font-quote text-[25px] italic leading-[34px] text-app">{m}</p>
                    <span className="text-caption text-faint">{i + 1} / {MOMENTI_CONOSCI.length}</span>
                  </div>
                );
              })}
            />
          </div>
          <p className="mt-5 text-center text-body-lg text-muted lg:mt-8">{CONOSCI_CHIUSURA}</p>
        </div>
      </section>

      {/* 3. Ste, come un profilo: il cerchio della sua storia, due righe, i numeri, la griglia delle foto che apre la storia */}
      <section id="storia" className="scopri-schermo scroll-mt-4">
        <Rivela className="mx-auto w-full max-w-3xl px-4 lg:py-20">
          <p className="text-center text-overline uppercase text-forest-400">Chi c&apos;è dietro</p>
          <div className="mt-5 flex items-center gap-5 sm:gap-8">
            <ApriStoria gruppo="storia" etichetta="Guarda la storia di Ste" className="shrink-0 rounded-full bg-gradient-to-tr from-forest-600 via-forest-400 to-[#c9f27a] p-[3px] transition-transform hover:scale-105">
              <span className="block rounded-full bg-app-bg p-[3px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={STORIA.fotoCitazione.src} alt="" className="h-20 w-20 rounded-full object-cover object-top sm:h-28 sm:w-28" />
              </span>
            </ApriStoria>
            <div className="min-w-0">
              <h2 className="font-display text-title-1 font-bold">Ste</h2>
              <ul className="mt-2 flex gap-5 sm:gap-8">
                {NUMERI.map((x) => (
                  <li key={x.etichetta} className="text-center">
                    <span className="block font-display text-title-3 font-bold tabular-nums">{x.numero}</span>
                    <span className="block text-caption text-muted">{x.etichetta}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 space-y-1 text-body text-app">
            {BIO.map((r) => <p key={r}>{r}</p>)}
          </div>
          <p className="scopri-basso-via mt-3 font-quote text-[21px] italic leading-[30px] text-app">{STORIA.citazione}</p>
          <ApriStoria gruppo="storia" className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-btn bg-surface-2 text-body font-semibold text-app transition-colors hover:bg-surface-3">
            Guarda la mia storia
          </ApriStoria>
          <ul className="mt-4 grid grid-cols-3 gap-1 sm:gap-1.5 lg:mt-6">
            {grigliaStoria.map((f, i) => (
              <li key={f.src} className={i >= FOTO_SU_TELEFONO ? 'max-lg:hidden' : ''}>
                <ApriStoria gruppo="storia" schermata={f.schermata} etichetta={`Apri la storia da qui: ${f.alt}`} className="group relative block aspect-square w-full overflow-hidden rounded-[4px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.src} alt={f.alt} loading="lazy" decoding="async" className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                </ApriStoria>
              </li>
            ))}
          </ul>
        </Rivela>
      </section>

      {/* 4. Il giro dell'app: Testa | Corpo (fisico e tecnica), un telefono, tocchi un momento */}
      <section id="come-funziona" className="scopri-schermo scroll-mt-4">
        <div className="mx-auto w-full max-w-6xl px-4 lg:py-20">
          <p className="text-center text-overline uppercase text-forest-400">Dentro l&apos;app</p>
          <h2 className="mt-1 text-center font-display text-title-1 font-bold lg:mt-2 lg:text-[32px] lg:leading-[38px]">Come funziona</h2>
          <div className="mt-4 lg:mt-8">
            <Tour
              parti={[
                { id: 'testa', nome: 'La Testa', sotto: 'mentale', momenti: MOMENTI_TESTA },
                { id: 'fisico', nome: 'Il Corpo', sotto: 'fisico e tecnica', nota: campoAperto ? undefined : FISICO_TEASER.quando, momenti: MOMENTI_FISICO },
              ]}
            />
          </div>
          <p className="mt-3 text-center text-caption text-faint lg:mt-8">Schermate dell&apos;app, con i dati di un giocatore di esempio.</p>
        </div>
      </section>

      {/* 5. Il metodo: tre cerchi che aprono le storie (dove ti porta, perché la Testa, perché il Corpo) */}
      <section id="metodo" className="scopri-schermo scroll-mt-4 border-t border-divider bg-surface/40">
        <Rivela className="mx-auto w-full max-w-5xl px-4 lg:py-20">
          <Titolo etichetta="Il metodo">{NON_POSITIVO.titolo}</Titolo>
          <p className="mx-auto mt-4 max-w-2xl text-center text-body-lg text-muted">{NON_POSITIVO.paragrafi[1]}</p>
          <div className="mt-8 flex justify-center gap-3 sm:gap-10">
            <Cerchio gruppo="dove" grande />
            <Cerchio gruppo="perche-testa" grande />
            <Cerchio gruppo="perche-fisico" grande />
          </div>
          <p className="mt-4 text-center text-caption text-faint">Tocca un cerchio</p>
        </Rivela>
      </section>

      {/* 6. Cosa dicono i primi: solo con racconti veri e il consenso scritto (lib/scopri.ts, RACCONTI) */}
      {RACCONTI.length > 0 && (
        <section className="scopri-schermo border-t border-divider">
          <div className="mx-auto w-full max-w-5xl px-4 lg:py-20">
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

      {/* 7. Prezzi: su telefono tre schermate (i passi, Mente, Fisico); su schermo largo una sezione */}
      <section id="prezzi" className="scroll-mt-4 border-t border-divider bg-surface/60">
        <div className="mx-auto max-w-5xl px-4 lg:py-20">
          <div className="scopri-schermo">
            <Titolo etichetta="Prezzi">Un prezzo al mese. Disdici quando vuoi.</Titolo>
            <ol className="mx-auto mt-6 grid w-full max-w-4xl gap-3 sm:grid-cols-3 lg:mt-8">
              {passi.map((p, i) => (
                <li key={p.titolo} className="flex items-start gap-3 rounded-card border border-divider bg-app-bg p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-500/20 font-display text-body font-bold text-forest-300">{i + 1}</span>
                  <span>
                    <span className="block text-body font-semibold text-app">{p.titolo}</span>
                    <span className="mt-0.5 block text-body-sm text-muted">{p.testo}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="lg:mt-8 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start lg:gap-5">
            <div className="scopri-schermo">
              <div className="rounded-card border border-forest-400/60 bg-forest-500/10 p-6 shadow-glow">
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
                <div className="mt-6 flex flex-col items-center gap-2 lg:mt-7">
                  <BottoneProva />
                  <span className="text-caption text-muted">{notaCta}</span>
                </div>
              </div>
              <p className="scopri-basso-via mt-5 text-center text-body text-muted lg:hidden">{NOTA_VALORE}</p>
            </div>

            <div className="scopri-schermo">
              <div id="prezzi-fisico" className="parte-corpo scroll-mt-4 rounded-card border border-forest-400/30 bg-app-bg p-5">
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
              <div className="mt-6 flex justify-center lg:hidden"><Cerchio gruppo="fisico" nome="Guarda il Corpo" sotto={notaFisico} /></div>
              <p className="mt-5 text-center text-body-sm text-muted lg:hidden">{NOTA_CODICE}</p>
            </div>
          </div>

          <p className="mx-auto mt-8 hidden max-w-xl text-center text-body text-muted lg:block">{NOTA_VALORE}</p>
          <p className="mx-auto mt-2 hidden max-w-xl text-center text-body-sm text-muted lg:block">{NOTA_CODICE}</p>
        </div>
      </section>

      {/* 8. Le domande di chi inizia: una aperta alla volta, così su telefono restano dentro la schermata */}
      <section className="scopri-schermo">
        <div className="mx-auto w-full max-w-3xl px-4 lg:py-20">
          <Titolo>Le domande di chi inizia</Titolo>
          <ListaDomande domande={domande} className="mt-5 lg:mt-8" />
        </div>
      </section>

      {/* 9. Chiusura, con il piè di pagina nella stessa schermata */}
      <div className="scopri-schermo scopri-schermo-pieno flex flex-col">
        <section className="relative flex flex-1 flex-col justify-center border-t border-divider">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_70%_at_50%_100%,rgba(26,150,96,0.25),transparent)]" aria-hidden />
          <div className="relative mx-auto max-w-3xl px-4 py-10 text-center lg:py-20">
            <p className="font-quote text-[24px] italic leading-[34px] text-app lg:text-[28px] lg:leading-[38px]">{CHIUSURA[0]}</p>
            <p className="mt-5 font-display text-title-1 font-bold">{CHIUSURA[1]}</p>
            <div className="mt-8 flex flex-col items-center gap-2">
              <BottoneProva />
              <span className="text-caption text-muted">{notaCta}</span>
            </div>
          </div>
        </section>
        <PiePagina />
      </div>

      <VisoreStorie cta={CTA} notaCta={notaCta} />
      <BarraProva href={CTA} nota={notaCta} />
    </main>
  );
}

/** Le domande: una aperta alla volta (`name` sui details), su telefono più strette. */
function ListaDomande({ domande, className = '' }: { domande: { domanda: string; risposta: string }[]; className?: string }) {
  return (
    <div className={`divide-y divide-divider rounded-card border border-divider bg-surface ${className}`}>
      {domande.map((d) => (
        <details key={d.domanda} name="domande" className="group px-4 lg:px-5">
          <summary className="flex min-h-[46px] cursor-pointer list-none items-center justify-between gap-3 py-2 text-body font-semibold text-app lg:min-h-[56px] lg:text-body-lg [&::-webkit-details-marker]:hidden">
            {d.domanda}
            <span className="text-forest-400 transition-transform group-open:rotate-45" aria-hidden>+</span>
          </summary>
          <p className="pb-4 text-body-sm text-muted lg:pb-5 lg:text-body">{d.risposta}</p>
        </details>
      ))}
    </div>
  );
}
