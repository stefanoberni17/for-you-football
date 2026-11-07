import type { Metadata } from 'next';
import { Check } from 'lucide-react';
import { ALBUM_FOTO, DOVE_PORTA, FISICO_SEZIONE, NON_POSITIVO, PERCHE_TESTA, STORIA, STORIA_FOTO } from '@/lib/scopri';
import { BottoneProva, Capitolo, capitoliStoria, Intestazione, LinkApprofondisci, PercheFisico, PiePagina, Titolo } from '@/components/scopri/Parti';

/**
 * La storia e il perché del metodo (7/11): quello che la pagina di vendita non dice per intero. Ci si arriva da «Chi c'è
 * dietro» e dal Fisico nel giro dell'app. Tutto aperto: chi è qui ha scelto di leggere. Statica, niente prezzi (stanno in /scopri).
 */
export const metadata: Metadata = {
  title: 'La storia · For You Football',
  description: 'Perché è nato For You Football: la storia di Ste, il perché della Testa e del Fisico.',
};

/** Il video principale di Ste (2-3 minuti, parte muto con i sottotitoli), in fondo alla storia. Finché non c'è, niente. */
const VIDEO_PRINCIPALE: { src: string; sottotitoli?: string; poster?: string } | null = null;

export default function Storia() {
  return (
    <main className="scopri-pagina min-h-screen overflow-x-clip bg-app-bg text-app">
      <Intestazione indietro />

      {/* La storia di Ste, con le foto */}
      <section>
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 lg:pb-20 lg:pt-10">
          <p className="text-overline uppercase text-forest-400">Chi c&apos;è dietro</p>
          <h1 className="mt-4 font-quote text-[28px] italic leading-[37px] text-app lg:text-[36px] lg:leading-[46px]">{STORIA.citazione}</h1>
          {STORIA_FOTO.length > 0 ? (
            <div className="mt-10 space-y-12 text-body-lg text-muted lg:-mx-24">
              {capitoliStoria().map((c, i) => <Capitolo key={i} c={c} i={i} />)}
              {ALBUM_FOTO.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {ALBUM_FOTO.map((f) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={f.src} src={f.src} alt={f.alt} loading="lazy" decoding="async" className="aspect-square w-full rounded-btn border border-divider object-cover sm:rounded-card" />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-8 space-y-4 text-body-lg text-muted">
              {STORIA.paragrafi.map((p, i) => <p key={i} className={i === 0 ? 'text-app' : ''}>{p}</p>)}
            </div>
          )}
          {VIDEO_PRINCIPALE && (
            <video className="mt-10 w-full rounded-card shadow-e3" src={VIDEO_PRINCIPALE.src} poster={VIDEO_PRINCIPALE.poster} muted playsInline controls preload="metadata">
              {VIDEO_PRINCIPALE.sottotitoli && <track kind="captions" src={VIDEO_PRINCIPALE.sottotitoli} srcLang="it" label="Italiano" default />}
            </video>
          )}
        </div>
      </section>

      {/* Perché la Testa */}
      <section id="testa" className="scroll-mt-4 border-t border-divider bg-surface/40">
        <div className="mx-auto max-w-3xl px-4 py-16 lg:py-20">
          <Titolo etichetta={PERCHE_TESTA.etichetta}>{PERCHE_TESTA.titolo}</Titolo>
          <div className="mt-8 space-y-4 text-body-lg text-muted">
            {PERCHE_TESTA.paragrafi.map((p) => <p key={p}>{p}</p>)}
          </div>
          <ul className="mt-6 flex flex-wrap gap-2">
            {PERCHE_TESTA.studi.map((t) => (
              <li key={t} className="rounded-full border border-divider bg-app-bg px-3.5 py-1.5 text-body-sm text-app">{t}</li>
            ))}
          </ul>
          <blockquote className="my-10 border-l-4 border-forest-400 pl-5 font-quote text-[23px] italic leading-[33px] text-app lg:text-[26px] lg:leading-[36px]">{PERCHE_TESTA.domanda}</blockquote>
          <div className="space-y-4 text-body-lg text-muted">
            {PERCHE_TESTA.chiusura.map((p, i) => <p key={p} className={i === PERCHE_TESTA.chiusura.length - 1 ? 'text-app' : ''}>{p}</p>)}
          </div>
        </div>
      </section>

      {/* Non è pensiero positivo */}
      <section className="border-t border-divider">
        <div className="mx-auto max-w-3xl px-4 py-16 lg:py-20">
          <Titolo>{NON_POSITIVO.titolo}</Titolo>
          <div className="mt-8 space-y-4 text-center text-body-lg text-muted">
            {NON_POSITIVO.paragrafi.map((p, i) => <p key={i} className={i === 1 ? 'text-app' : ''}>{p}</p>)}
          </div>
        </div>
      </section>

      {/* Dove ti porta il lavoro */}
      <section className="border-t border-divider bg-surface/40">
        <div className="mx-auto max-w-3xl px-4 py-16 lg:py-20">
          <Titolo>{DOVE_PORTA.titolo}</Titolo>
          <p className="mt-6 text-center text-body-lg text-muted">{DOVE_PORTA.intro}</p>
          <ul className="mx-auto mt-6 max-w-xl space-y-3">
            {DOVE_PORTA.punti.map((r) => (
              <li key={r} className="flex items-start gap-3 rounded-card border border-divider bg-app-bg px-5 py-4 text-body-lg text-app">
                <Check size={20} className="mt-1 shrink-0 text-forest-400" aria-hidden />
                <span>{r}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center text-body-lg text-muted">{DOVE_PORTA.chiusura}</p>
        </div>
      </section>

      {/* Perché il Fisico */}
      <section id="fisico" className="scroll-mt-4 border-t border-divider">
        <div className="mx-auto max-w-5xl px-4 py-16 lg:py-20">
          <PercheFisico />
          <ul className="mx-auto mt-12 grid max-w-4xl gap-3 md:grid-cols-3">
            {FISICO_SEZIONE.origine.map((r) => (
              <li key={r} className="flex gap-2.5 rounded-card border border-divider bg-app-bg p-4 text-body-sm text-muted">
                <Check size={16} className="mt-0.5 shrink-0 text-forest-400" aria-hidden />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Chiusura */}
      <section className="relative border-t border-divider">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_70%_at_50%_100%,rgba(26,150,96,0.25),transparent)]" aria-hidden />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-20 text-center">
          <BottoneProva />
          <LinkApprofondisci href="/scopri#come-funziona">Guarda come funziona l&apos;app</LinkApprofondisci>
        </div>
      </section>

      <PiePagina />
    </main>
  );
}
