import type { Metadata } from 'next';
import { Check } from 'lucide-react';
import { loadListino } from '@/lib/prezziServer';
import { contaIscrittiCampo, contaIscrittiMente, loadImpostazioni } from '@/lib/appSettings';
import { euroTesto, IMPOSTAZIONI_DEFAULT } from '@/lib/abbonamento';
import { MIN_AGE } from '@/lib/constants';
import {
  APERTURA, CHIUSURA, CONOSCI_CHIUSURA, domandeFrequenti, FISICO_TEASER, MENTE_INCLUDE, MOMENTI_APP, MOMENTI_CONOSCI, MOMENTI_FISICO,
  MOMENTI_TESTA, NOTA_CODICE, NOTA_VALORE, passiIngresso, prezziPubblici, RACCONTI, STORIA, STORIA_FOTO, type PrezzoPubblico,
} from '@/lib/scopri';
import { TelefonoCiclo } from '@/components/scopri/Telefono';
import { Tour } from '@/components/scopri/Tour';
import { Fischietto, PallaPersa, PalloneCheArriva, SeraPrima } from '@/components/scopri/Disegni';
import { Espandi } from '@/components/scopri/Espandi';
import { BottoneAvviso, BottoneProva, FotoStoriaCard, Intestazione, LinkApprofondisci, PiePagina, Titolo } from '@/components/scopri/Parti';

/**
 * La pagina di vendita pubblica (6/11; testi v2 di Ste del 7/11, funnel: Notion «Funnel di vendita: mappa e piano»).
 * Testi v3 (7/11): mi riconosco, Ste mi capisce, ha costruito qualcosa di concreto, può servire a me, posso provarlo.
 * Corta (7/11, Ste: «uno deve vedere solo le cose essenziali e poi approfondire quello che vuole»): apertura, le scene, il giro
 * dell'app (Testa | Fisico, un telefono, tocchi un momento), chi c'è dietro in breve, prezzi, domande, chiusura. La storia intera,
 * il perché della Testa e del Fisico, dove ti porta il lavoro e «non è pensiero positivo» stanno in /scopri/storia.
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

/** Quante domande restano in vista; le altre dietro «Tutte le domande». */
const DOMANDE_IN_VISTA = 4;

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
  const fotoApertura = STORIA_FOTO.find((f) => f.prima === 0);
  const mente = prezzi?.mentale;
  const fisici = [prezzi?.fisico_base, prezzi?.fisico_medio, prezzi?.fisico_pro];
  const campoAperto = !!prezzi?.fisico_pro?.aperto || !!prezzi?.completo?.aperto;
  const lancioCampo = fisici.every((p) => p?.tipo === 'lancio') && prezzi?.completo?.tipo === 'lancio';

  return (
    <main className="scopri-pagina min-h-screen overflow-x-clip bg-app-bg text-app">
      <Intestazione />

      {/* 1. Apertura */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(26,150,96,0.28),transparent)]" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-6 lg:grid-cols-2 lg:pb-24 lg:pt-12">
          <div className="scopri-entra text-center lg:text-left">
            <p className="text-overline uppercase text-forest-400">{APERTURA.etichetta}</p>
            <h1 className="mt-3 font-display text-[34px] font-bold leading-[40px] tracking-tight lg:text-[50px] lg:leading-[56px]">
              {titoloA}{titoloB && <> <span className="font-quote text-[38px] font-semibold italic tracking-normal text-forest-300 lg:text-[56px]">{titoloB}</span></>}
            </h1>
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
        <div className="mx-auto max-w-3xl px-4 py-14 lg:py-16">
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

      {/* 3. Il giro dell'app: Testa | Fisico, un telefono, tocchi un momento */}
      <section id="come-funziona" className="scroll-mt-4">
        <div className="mx-auto max-w-6xl px-4 py-16 lg:py-20">
          <Titolo etichetta="Dentro l'app" sotto="Scegli una parte e tocca un momento.">Come funziona</Titolo>
          <div className="mt-8">
            <Tour
              parti={[
                { id: 'testa', nome: 'La Testa', momenti: MOMENTI_TESTA },
                {
                  id: 'fisico', nome: 'Il Fisico', nota: campoAperto ? undefined : FISICO_TEASER.quando.toLowerCase(), momenti: MOMENTI_FISICO,
                  piede: <LinkApprofondisci href="/scopri/storia#fisico">Perché il Fisico è fatto così</LinkApprofondisci>,
                },
              ]}
            />
          </div>
          <p className="mt-8 text-center text-caption text-faint">Schermate dell&apos;app, con i dati di un giocatore di esempio.</p>
        </div>
      </section>

      {/* 4. Chi c'è dietro, in breve: la storia intera è in /scopri/storia */}
      <section className="border-t border-divider bg-surface/40">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:py-20">
          {fotoApertura && <FotoStoriaCard foto={fotoApertura} className="w-[min(100%,320px)]" />}
          <div className={fotoApertura ? '' : 'sm:col-span-2'}>
            <p className="text-overline uppercase text-forest-400">Chi c&apos;è dietro</p>
            <blockquote className="mt-3 font-quote text-[24px] italic leading-[33px] text-app lg:text-[28px] lg:leading-[38px]">{STORIA.citazione}</blockquote>
            <p className="mt-5 text-body-lg text-muted">{STORIA.paragrafi[0]}</p>
            <div className="mt-6">
              <LinkApprofondisci href="/scopri/storia">Leggi la mia storia e perché è nato il metodo</LinkApprofondisci>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Cosa dicono i primi: solo con racconti veri e il consenso scritto (lib/scopri.ts, RACCONTI) */}
      {RACCONTI.length > 0 && (
        <section className="border-t border-divider">
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

      {/* 6. Prezzi, con i tre passi per iniziare */}
      <section id="prezzi" className="scroll-mt-4 border-t border-divider bg-surface/60">
        <div className="mx-auto max-w-5xl px-4 py-16 lg:py-20">
          <Titolo etichetta="Prezzi">Un prezzo al mese. Disdici quando vuoi.</Titolo>
          <ol className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-3">
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

          <div className="mt-8 grid items-start gap-5 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
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
              <div className="mt-7 flex flex-col items-center gap-2">
                <BottoneProva />
                <span className="text-caption text-muted">{notaCta}</span>
              </div>
            </div>

            <div id="prezzi-fisico" className="scroll-mt-4 rounded-card border border-divider bg-app-bg p-5">
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

          <p className="mx-auto mt-8 max-w-xl text-center text-body text-muted">{NOTA_VALORE}</p>
          <p className="mx-auto mt-2 max-w-xl text-center text-body-sm text-muted">{NOTA_CODICE}</p>
        </div>
      </section>

      {/* 7. Le domande di chi inizia: le prime in vista, le altre dietro «Tutte le domande» */}
      <section>
        <div className="mx-auto max-w-3xl px-4 py-16 lg:py-20">
          <Titolo>Le domande di chi inizia</Titolo>
          <ListaDomande domande={domande.slice(0, DOMANDE_IN_VISTA)} className="mt-8" />
          {domande.length > DOMANDE_IN_VISTA && (
            <Espandi etichetta="Tutte le domande">
              <ListaDomande domande={domande.slice(DOMANDE_IN_VISTA)} className="mt-3" />
            </Espandi>
          )}
        </div>
      </section>

      {/* 8. Chiusura */}
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

      <PiePagina />
    </main>
  );
}

function ListaDomande({ domande, className = '' }: { domande: { domanda: string; risposta: string }[]; className?: string }) {
  return (
    <div className={`divide-y divide-divider rounded-card border border-divider bg-surface ${className}`}>
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
  );
}
