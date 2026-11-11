'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Check, ChevronRight, Gauge, MessageCircle } from 'lucide-react';
import { GiornoSegno, LegendaSettimana, type StatoSedutaVista } from '@/components/SettimanaVista';
import { authFetch } from '@/lib/authFetch';
import { euroTesto } from '@/lib/abbonamento';
import { isPaywallActive } from '@/lib/checkAccess';
import { TESTI_PACCHETTI } from '@/lib/pacchettiTesti';
import { DAY_SHORT_NAMES } from '@/lib/constants';
import { Button, Card } from '@/components/ui';
import { PalestraTestata } from '@/components/ParteSwitch';

const INTERESSE_KEY = 'campo.interesse';

/**
 * Il Fisico per chi non ha il Campo (20/10, Ste: "farla bloccata per chi non ce l'ha potrebbe invogliare"):
 * cos'è in una riga, cosa ti dà in tre, una settimana finta per far vedere com'è dentro, e "Mi interessa".
 * Dal 3/11 il Fisico si vende a tre livelli (Base, Medio, Pro) e nel Completo: con le iscrizioni del Campo aperte la
 * pagina mostra i tre livelli con il prezzo che gli vale e porta a /pricing; chiuse, "Mi interessa" mette in lista
 * d'attesa (i fondatori del Mente in testa) e registra l'evento `campo_interesse`.
 */
type LivelloOfferta = { id: 'fisico_base' | 'fisico_medio' | 'fisico_pro' | 'completo'; disponibile: boolean; puoAbbonarsi: boolean; prezzo: { euro: number | null }; cambio?: { ok: boolean; euro?: number | null } | null };
export default function FisicoBloccato() {
  const [fatto, setFatto] = useState(false);
  const [sending, setSending] = useState(false);
  const [livelli, setLivelli] = useState<LivelloOfferta[] | null>(null);
  const [giaMente, setGiaMente] = useState(false);
  useEffect(() => { try { setFatto(localStorage.getItem(INTERESSE_KEY) === '1'); } catch { /* private mode */ } }, []);
  useEffect(() => {
    if (!isPaywallActive()) return;
    authFetch('/api/stripe/offerta').then((r) => (r.ok ? r.json() : null)).then((o) => {
      if (!o?.pacchetti) return;
      // Ha già il Mente: il Fisico si aggiunge passando al Completo (il Completo esiste solo con il Pro)
      const giaMente = o.attuale === 'mentale';
      setGiaMente(giaMente);
      setLivelli((o.pacchetti as LivelloOfferta[])
        .filter((p) => giaMente ? p.id === 'completo' : (p.id === 'fisico_base' || p.id === 'fisico_medio' || p.id === 'fisico_pro' || p.id === 'completo'))
        .map((p) => giaMente && p.cambio?.ok ? { ...p, puoAbbonarsi: true, prezzo: { euro: p.cambio.euro ?? p.prezzo.euro } } : p));
    }).catch(() => {});
  }, []);
  const inVendita = !!livelli?.some((p) => p.disponibile && p.puoAbbonarsi);

  const miInteressa = async () => {
    setSending(true);
    try {
      await Promise.all([
        authFetch('/api/onboarding/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'campo_interesse' }) }).catch(() => null),
        // la lista d'attesa del Campo: Ste invita a gruppi (Telegram /invita_campo)
        authFetch('/api/stripe/offerta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lista_attesa: true, pacchetto: 'fisico_pro' }) }).catch(() => null),
      ]);
      try { localStorage.setItem(INTERESSE_KEY, '1'); } catch { /* private mode */ }
      setFatto(true);
    } finally { setSending(false); }
  };

  // Settimana finta, solo da guardare, con i segni della settimana dell'app (10/11): lun/mer/ven con l'app (lunedì fatta),
  // mar/gio squadra, sabato partita
  const finta: Record<number, { squadra?: boolean; partita?: boolean; seduta?: StatoSedutaVista }> = {
    1: { seduta: 'fatta' }, 2: { squadra: true }, 3: { seduta: 'oggi' }, 4: { squadra: true }, 5: { seduta: 'futura' }, 6: { partita: true }, 7: {},
  };

  return (
    <main className="min-h-screen bg-app pb-tabbar-lg">
      <PalestraTestata parte="corpo" schede={false} corpoBloccato />
      <div className="max-w-md mx-auto px-5 mt-5">
        <h1 className="font-display text-display font-bold text-app mb-1">Il Corpo</h1>
        <p className="text-body text-muted leading-relaxed mb-5">
          Un piano di allenamento fisico e tecnico, settimana per settimana, costruito sul tuo calendario con la squadra, sulla partita e sui tuoi test.
        </p>

        <Card variant="hero" padding="md" className="mb-3 pointer-events-none select-none" aria-hidden>
          <p className="text-overline uppercase tracking-wider font-semibold text-forest-100 mb-1">Oggi · Mercoledì</p>
          <h2 className="font-display text-title-1 font-bold leading-tight mb-1.5">Forza parte bassa</h2>
          <p className="text-body text-forest-50/90">~50&apos; · Apertura + Gambe dalle scale + Pliometria (versione breve)</p>
          <div className="mt-4 h-14 rounded-btn bg-white/90 text-forest-700 font-semibold flex items-center justify-center text-body">Inizia la seduta</div>
        </Card>
        <Card padding="sm" className="mb-5 pointer-events-none select-none" aria-hidden>
          <p className="text-label font-semibold text-muted mb-2">La settimana, decisa sul tuo calendario</p>
          <div className="grid grid-cols-7 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => {
              const g = finta[d];
              return (
                <span key={d} className="flex flex-col items-center">
                  <span className="block text-overline uppercase text-faint mb-1">{DAY_SHORT_NAMES[d]}</span>
                  <span className="w-full [&>span]:h-10"><GiornoSegno piccolo squadra={!!g.squadra} partita={!!g.partita} seduta={g.seduta ?? null} /></span>
                </span>
              );
            })}
          </div>
          <LegendaSettimana className="mt-3" />
        </Card>

        <ul className="space-y-3 mb-6">
          {([
            [Gauge, 'I test e la tua Card', 'Forza, velocità, resistenza, tecnica: i test dicono il tuo livello e da lì parte tutto.'],
            [CalendarDays, 'Una settimana che si adatta', 'Giorni con la squadra, partita, come ti senti: la seduta di oggi cambia con te, non con un foglio fisso.'],
            [MessageCircle, 'Un preparatore a cui chiedere', 'Esecuzione, dolori, dubbi: risponde sapendo cosa hai fatto e cosa ti aspetta.'],
          ] as const).map(([Icona, t, s]) => (
            <li key={t} className="flex gap-3">
              <span className="w-9 h-9 rounded-full bg-forest-500/15 text-forest-400 flex items-center justify-center shrink-0 mt-0.5" aria-hidden><Icona size={18} /></span>
              <span><span className="block text-body font-semibold text-app">{t}</span><span className="block text-body-sm text-muted leading-relaxed">{s}</span></span>
            </li>
          ))}
        </ul>

        {inVendita ? (
          <section className="space-y-2" aria-label="I livelli del Fisico">
            {livelli!.map((p) => (
              <Link key={p.id} href={`/pricing?pacchetto=${p.id}`} className="flex items-center gap-3 min-h-[60px] px-4 py-3 rounded-card bg-surface border border-white/6">
                <span className="flex-1 min-w-0">
                  <span className="block text-body font-semibold text-app">{TESTI_PACCHETTI[p.id].titolo}</span>
                  <span className="block text-body-sm text-muted">{TESTI_PACCHETTI[p.id].sottotitolo}</span>
                </span>
                {p.prezzo.euro != null && <span className="text-body font-semibold text-app tabular-nums shrink-0">{euroTesto(p.prezzo.euro)} €</span>}
                <ChevronRight size={18} className="text-muted shrink-0" aria-hidden />
              </Link>
            ))}
            <Button size="lg" fullWidth href={giaMente ? '/pricing?pacchetto=completo' : '/pricing?da=fisico'}>{giaMente ? 'Aggiungi il Fisico: passa al Completo' : 'Scegli il tuo Fisico'}</Button>
            <p className="text-body-sm text-muted text-center">{giaMente ? 'Oggi paghi solo la differenza per i giorni che restano del mese.' : '7 giorni di prova con la carta. Disdici quando vuoi.'}</p>
          </section>
        ) : fatto ? (
          <Card variant="accent" padding="sm">
            <p className="text-body text-forest-300 flex items-center gap-2"><Check size={18} aria-hidden /> Ti avviso quando apre.</p>
            <p className="text-body-sm text-muted mt-1">Il Campo si apre a gruppi: chi è in lista entra per primo.</p>
          </Card>
        ) : (
          <>
            <Button size="lg" fullWidth onClick={miInteressa} loading={sending}>Mi interessa</Button>
            <p className="text-body-sm text-muted text-center mt-2">Non è ancora aperto a tutti. Ti avviso quando tocca a te.</p>
          </>
        )}
      </div>
    </main>
  );
}
