'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { isPaywallActive } from '@/lib/checkAccess';
import { dataLunga, euroTesto } from '@/lib/abbonamento';
import { isPacchetto, type Pacchetto, type LivelloFisico } from '@/lib/listino';
import { SICUREZZA_FISICO, TESTI_PACCHETTI } from '@/lib/pacchettiTesti';
import { trackOnboarding } from '@/lib/onboardingTrack';
import { Check, ChevronDown, Key, Unlock } from 'lucide-react';
import { AppLoader, Badge, Button, Card, Field, Input, Sheet } from '@/components/ui';

export const dynamic = 'force-dynamic';

type TipoPrezzo = 'lancio' | 'codice' | 'listino';
type MotivoNo = 'beta' | 'season1' | 'gia_abbonato' | 'iscrizioni_chiuse' | 'prezzo_mancante' | null;
interface OffertaPacchetto {
  id: Pacchetto;
  nome: string;
  mente: boolean;
  fisico: LivelloFisico | null;
  disponibile: boolean;
  prezzo: { tipo: TipoPrezzo; euro: number | null };
  conCodice: number | null;
  provaGiorni: number;
  puoAbbonarsi: boolean;
  motivo: MotivoNo;
  cambio: { ok: boolean; motivo?: string; tipo?: string; euro?: number | null } | null;
}
interface Offerta {
  pacchetti: OffertaPacchetto[];
  attuale: Pacchetto | null;
  stato: string;
  inPausa: boolean;
}
interface Anteprima { a: Pacchetto; tipo: string; euro: number | null; adesso: number | null; finisceProva: boolean; ritorno: boolean }

const LIVELLI: LivelloFisico[] = ['base', 'medio', 'pro'];
const PACCHETTO_FISICO: Record<LivelloFisico, Pacchetto> = { base: 'fisico_base', medio: 'fisico_medio', pro: 'fisico_pro' };
const NOME_LIV: Record<LivelloFisico, string> = { base: 'Base', medio: 'Medio', pro: 'Pro' };

/**
 * I pacchetti (3/11): Mente, Fisico Base / Medio / Pro, Completo (Pro + Mente). Per ognuno un prezzo solo, il più
 * basso a cui l'utente ha diritto (lancio, con codice o listino), mai sommati; niente prezzi barrati; nessun importo
 * scritto qui: arriva tutto da /api/stripe/offerta, che lo legge da Stripe. Chi ha già un abbonamento cambia
 * pacchetto da qui (conguaglio subito: /api/stripe/cambia-piano), non ne apre un secondo.
 */
function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [offerta, setOfferta] = useState<Offerta | null>(null);
  const [accountEmail, setAccountEmail] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [cambiaEmail, setCambiaEmail] = useState(false);
  const [attesaOk, setAttesaOk] = useState<Pacchetto | null>(null);
  const [codiceScritto, setCodiceScritto] = useState('');
  const [codice, setCodice] = useState<{ codice: string; prezzi: Partial<Record<Pacchetto, number | null>> } | null>(null);
  const [codiceErr, setCodiceErr] = useState('');
  const [codiceLoading, setCodiceLoading] = useState(false);
  const [livello, setLivello] = useState<LivelloFisico>('pro');
  const [scelto, setScelto] = useState<Pacchetto | null>(null);
  const [anteprima, setAnteprima] = useState<Anteprima | null>(null);
  const [cambioFatto, setCambioFatto] = useState<Pacchetto | null>(null);
  // Il prezzo che paga adesso per il suo pacchetto (Price meno il coupon): sulla scheda "Il tuo", non quello di chi entra oggi
  const [mioPrezzo, setMioPrezzo] = useState<number | null>(null);

  const canceled = searchParams.get('checkout') === 'canceled';
  // Pagamento fatto ma webhook non ancora arrivato dopo i 5 tentativi della home
  const pending = searchParams.get('checkout') === 'pending';
  const fromGate = searchParams.get('from') === 'gate';

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      setAccountEmail(session.user.email || '');
      // Se paywall non è attivo (Stripe non configurato), non tenere l'utente qui.
      if (!isPaywallActive()) { router.push('/'); return; }
      try {
        const res = await authFetch('/api/stripe/offerta');
        if (res.ok) {
          const o = await res.json() as Offerta;
          setOfferta(o);
          if (o.attuale) {
            authFetch('/api/stripe/subscription').then((r) => (r.ok ? r.json() : null))
              .then((d) => { if (typeof d?.prezzo?.euro === 'number') setMioPrezzo(d.prezzo.euro); }).catch(() => {});
          }
          // Il pacchetto che si apre: ?pacchetto=, dal Gate il Mente, dal Fisico il Pro, altrimenti il Completo
          const p = searchParams.get('pacchetto');
          const iniziale: Pacchetto = isPacchetto(p) ? p : fromGate ? 'mentale' : searchParams.get('da') === 'fisico' ? 'fisico_pro' : 'completo';
          let primo: Pacchetto = iniziale === o.attuale ? (o.attuale === 'completo' ? 'mentale' : 'completo') : iniziale;
          // Senza una scelta esplicita non si apre su un pacchetto chiuso (il Campo prima dell'apertura): il primo
          // che si può prendere, così il bottone non dice "Avvisami quando apre" a chi arriva per la prova (5/11)
          const vendibile = (id: Pacchetto) => !!o.pacchetti.find((x) => x.id === id && x.disponibile && x.puoAbbonarsi);
          if (!isPacchetto(p) && !o.attuale && !vendibile(primo)) {
            const alt = o.pacchetti.find((x) => x.disponibile && x.puoAbbonarsi);
            if (alt) primo = alt.id;
          }
          setScelto(primo);
          const liv = o.pacchetti.find((x) => x.id === primo)?.fisico;
          if (liv && primo !== 'completo') setLivello(liv);
        }
      } catch { /* la pagina mostra "in apertura" */ }
      trackOnboarding('pricing_view');
    };
    load();
  }, [router, searchParams, fromGate]);

  const per = useMemo(() => new Map((offerta?.pacchetti ?? []).map((p) => [p.id, p])), [offerta]);
  const attuale = offerta?.attuale ?? null;

  /** Il prezzo da mostrare: con il codice se l'ha scritto ed è più basso, altrimenti quello che gli vale già. */
  const prezzoDi = (p: OffertaPacchetto): { tipo: TipoPrezzo; euro: number | null } => {
    const cc = codice?.prezzi[p.id];
    if (cc != null && (p.prezzo.euro == null || cc < p.prezzo.euro)) return { tipo: 'codice', euro: cc };
    return p.prezzo;
  };

  const openPortal = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/stripe/portal', { method: 'POST' });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.url) { window.location.href = d.url; return; }
      setError('Il portale non risponde. Riprova tra poco.');
    } catch {
      setError('Il portale non risponde. Riprova tra poco.');
    }
    setLoading(false);
  };

  const handleCheckout = async (pacchetto: Pacchetto) => {
    setLoading(true);
    setError('');
    try {
      const email = (cambiaEmail ? payerEmail : accountEmail).trim();
      const p = per.get(pacchetto);
      const usaCodice = !!codice && !!p && prezzoDi(p).tipo === 'codice';
      const res = await authFetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: pacchetto, payer_email: email, ...(usaCodice ? { codice: codice!.codice } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 400 && data.error === 'codice_non_valido') {
        setCodice(null);
        setCodiceErr(testoCodice(data.motivo));
        setLoading(false);
        return;
      }
      if (res.status === 409 && data.error === 'iscrizioni_chiuse') {
        setOfferta((o) => (o ? { ...o, pacchetti: o.pacchetti.map((x) => x.id === pacchetto ? { ...x, puoAbbonarsi: false, motivo: 'iscrizioni_chiuse' } : x) } : o));
        setLoading(false);
        return;
      }
      if (!res.ok || !data.url) throw new Error(data.error === 'gia_abbonato' ? 'Hai già un abbonamento: cambia pacchetto da qui sotto.' : data.error || 'Checkout non riuscito');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore inatteso');
      setLoading(false);
    }
  };

  const chiediCambio = async (pacchetto: Pacchetto) => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`/api/stripe/cambia-piano?pacchetto=${pacchetto}`);
      const d = await res.json().catch(() => ({}));
      if (res.ok) setAnteprima(d as Anteprima);
      else setError(testoNoCambio(d.error));
    } catch {
      setError('Non riesco adesso. Riprova tra poco.');
    }
    setLoading(false);
  };

  const confermaCambio = async () => {
    if (!anteprima) return;
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/stripe/cambia-piano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pacchetto: anteprima.a }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setCambioFatto(anteprima.a);
        setAnteprima(null);
        setOfferta((o) => (o ? { ...o, attuale: anteprima.a } : o));
      } else {
        setAnteprima(null);
        setError(d.error === 'pagamento_non_riuscito' ? 'Il pagamento del conguaglio non è passato: controlla la carta nel portale e riprova.' : testoNoCambio(d.error));
      }
    } catch {
      setError('Non riesco adesso. Riprova tra poco.');
    }
    setLoading(false);
  };

  const provaCodice = async () => {
    if (!codiceScritto.trim()) return;
    setCodiceLoading(true);
    setCodiceErr('');
    try {
      const res = await authFetch('/api/stripe/codice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codice: codiceScritto }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.valido && d.prezzi) setCodice({ codice: d.codice, prezzi: d.prezzi });
      else { setCodice(null); setCodiceErr(d.error || testoCodice(d.motivo)); }
    } catch {
      setCodiceErr('Non riesco a controllare il codice adesso. Riprova tra poco.');
    }
    setCodiceLoading(false);
  };

  const listaAttesa = async (pacchetto: Pacchetto) => {
    setLoading(true);
    try {
      const res = await authFetch('/api/stripe/offerta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lista_attesa: true, pacchetto }),
      });
      if (res.ok) setAttesaOk(pacchetto);
    } catch { /* riprova */ }
    setLoading(false);
  };

  const faq = (q: string, a: React.ReactNode) => (
    <details className="group border-t border-divider">
      <summary className="min-h-[48px] flex items-center justify-between gap-3 text-body font-semibold text-app cursor-pointer list-none">
        {q}
        <ChevronDown size={18} className="text-muted shrink-0 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="text-body text-muted pb-3">{a}</div>
    </details>
  );

  if (!offerta || !scelto) return <AppLoader />;

  const sel = per.get(scelto)!;
  const prezzoSel = prezzoDi(sel);
  const euroSel = prezzoSel.euro != null ? euroTesto(prezzoSel.euro) : null;
  const prova = sel.provaGiorni;
  const primoAddebito = (() => {
    const d = new Date();
    d.setDate(d.getDate() + prova);
    return (dataLunga(d.toISOString()) ?? '').toLowerCase();
  })();
  const abbonato = !!attuale;
  const chiuso = !sel.disponibile || sel.motivo === 'iscrizioni_chiuse' || sel.motivo === 'prezzo_mancante';
  const bloccatoPer = sel.motivo === 'beta' || sel.motivo === 'season1';
  const payerEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payerEmail.trim());
  const codiceVisibile = !abbonato && offerta.pacchetti.some((p) => p.conCodice != null);
  const nessunoInVendita = offerta.pacchetti.every((p) => !p.disponibile);

  const etichettaPrezzo = (t: TipoPrezzo) => t === 'lancio' ? 'Prezzo di lancio' : t === 'codice' ? `Con il codice ${codice?.codice ?? ''}`.trim() : null;

  /** Si può comprare adesso (review 12/11: un pacchetto con le iscrizioni chiuse va sotto, con «In arrivo»). */
  const vendibileOra = (p: { id: Pacchetto; disponibile: boolean; puoAbbonarsi: boolean; motivo?: MotivoNo; cambio: { ok: boolean; motivo?: string } | null }) =>
    attuale === p.id || (p.disponibile && (abbonato
      ? !(p.cambio && !p.cambio.ok && p.cambio.motivo === 'iscrizioni_chiuse') // abbonato: chiuso solo se il cambio è chiuso per le iscrizioni
      : p.puoAbbonarsi));

  const giorniProva = abbonato ? 0 : Math.max(0, ...offerta.pacchetti.filter((p) => vendibileOra(p)).map((p) => p.provaGiorni ?? 0));

  /** Una scheda pacchetto: tap = la sceglie; la scelta mostra cosa include. */
  const scheda = (id: Pacchetto, extra?: React.ReactNode) => {
    const p = per.get(id);
    if (!p) return null;
    const t = TESTI_PACCHETTI[id];
    const suoPrezzo = attuale === id && mioPrezzo != null;
    const pr = suoPrezzo ? { tipo: 'listino' as TipoPrezzo, euro: mioPrezzo } : prezzoDi(p);
    const attivo = scelto === id || (id.startsWith('fisico_') && scelto?.startsWith('fisico_'));
    const suo = attuale === id;
    return (
      <Card key={id.startsWith('fisico_') ? 'fisico' : id} variant={attivo ? 'accent' : 'default'} className="space-y-2">
        <button type="button" onClick={() => setScelto(id)} aria-pressed={attivo} aria-label={`Scegli ${t.titolo}`} className="w-full text-left flex items-start justify-between gap-3 min-h-[44px]">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display text-title-3 font-bold text-app">{t.titolo}</span>
              {suo && <Badge tone="success">Il tuo</Badge>}
              {/* Iscrizioni chiuse (review 12/11): «In arrivo» sulla scheda, non dopo averla scelta */}
              {!suo && !vendibileOra(p) ? <Badge tone="neutral">In arrivo</Badge> : <>
                {!suo && id === 'completo' && <Badge tone="accent">Il più completo</Badge>}
                {!suo && pr.tipo === 'lancio' && <Badge tone="info" icon={<Unlock size={12} aria-hidden />}>Lancio</Badge>}
              </>}
            </div>
            <p className="text-body-sm text-muted mt-0.5">{t.sottotitolo}</p>
          </div>
          <div className="text-right shrink-0">
            {p.disponibile && pr.euro != null ? (
              <>
                <div className="font-display text-title-2 font-bold text-app tabular-nums leading-tight">{euroTesto(pr.euro)} €</div>
                <div className="text-caption text-muted">{suoPrezzo ? 'il tuo prezzo' : 'al mese'}</div>
              </>
            ) : <div className="text-caption text-muted">a breve</div>}
          </div>
        </button>
        {extra}
        {attivo && (
          <ul className="space-y-1.5 pt-1">
            {t.include.map((riga, i) => (
              <li key={riga} className={`flex items-start gap-2 ${i === 0 ? 'text-body font-semibold text-app' : 'text-body-sm text-muted'}`}>
                <Check size={16} className="text-forest-400 mt-0.5 shrink-0" aria-hidden />
                <span>{riga}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    );
  };

  // La CTA in fondo: cambio di pacchetto, lista d'attesa, oppure prova / abbonamento
  const cta = (() => {
    if (abbonato) {
      if (scelto === attuale) return { testo: 'È il tuo pacchetto', disabled: true, onClick: () => {} };
      if (offerta.inPausa) return { testo: 'Sei in pausa', disabled: true, onClick: () => {} };
      if (sel.cambio && !sel.cambio.ok) return sel.cambio.motivo === 'iscrizioni_chiuse'
        ? { testo: attesaOk === scelto ? 'Sei in lista' : 'Avvisami quando apre', disabled: attesaOk === scelto, onClick: () => listaAttesa(scelto) }
        : { testo: sel.cambio.motivo === 'non_attivo' ? 'Cambio di pacchetto in arrivo' : 'Non disponibile', disabled: true, onClick: () => {} };
      return { testo: `Passa a ${TESTI_PACCHETTI[scelto].titolo}`, disabled: false, onClick: () => chiediCambio(scelto) };
    }
    if (bloccatoPer) return { testo: 'Ce l\'hai già', disabled: true, onClick: () => {} };
    if (chiuso) return { testo: attesaOk === scelto ? 'Sei in lista' : 'Avvisami quando apre', disabled: attesaOk === scelto, onClick: () => listaAttesa(scelto) };
    return { testo: prova > 0 ? 'Inizia la prova' : 'Abbonati', disabled: cambiaEmail && !payerEmailValid, onClick: () => handleCheckout(scelto) };
  })();
  const prezzoCta = abbonato && sel.cambio?.ok
    ? (sel.cambio.tipo === 'ritorno' ? 'al tuo prezzo di prima' : sel.cambio.euro != null ? `${euroTesto(sel.cambio.euro)} €/mese` : null)
    : euroSel ? `${euroSel} €/mese` : null;

  // La tab bar è nascosta su /pricing: il CTA vive in una barra sticky in fondo.
  return (
    <main className="min-h-screen bg-app flex flex-col">
      <div className="flex-1 pt-safe px-4 pb-6">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="text-center">
            <h1 className="font-display text-title-1 font-bold text-app mb-2">{abbonato ? 'Il tuo pacchetto' : 'Scegli come allenarti'}</h1>
            <p className="text-body text-muted">La testa, il corpo, o tutti e due. Un prezzo al mese, disdici quando vuoi.</p>
          </div>

          {/* La prova detta subito (review 12/11, Ste): la carta serve per attivare, i giorni gratis, la disdetta */}
          {giorniProva > 0 && (
            <Card variant="accent" padding="sm" className="text-body-sm text-app leading-relaxed">
              Inserisci la carta per attivare l&apos;abbonamento: <span className="font-semibold">i primi {giorniProva} giorni sono gratis</span>.
              Se non ti convince, disdici entro i {giorniProva} giorni e non paghi niente.
            </Card>
          )}

          {fromGate && (
            <Card variant="accent" padding="sm" className="flex items-start gap-3 text-body-sm text-app">
              <Key size={20} className="text-forest-400 shrink-0 mt-0.5" aria-hidden />
              <span>Hai finito la settimana 1. Il Gate ti aspetta: si continua con il Mente o con il Completo.</span>
            </Card>
          )}
          {canceled && <Card variant="warn" padding="sm" className="text-body-sm text-warning">Pagamento annullato. Riprova quando vuoi.</Card>}
          {pending && (
            <Card variant="warn" padding="sm" className="text-body-sm text-warning">
              Ricevuto, ma l&apos;attivazione sta tardando. Chiudi e riapri l&apos;app tra un minuto.
              Se non si sblocca, scrivici a <a href="mailto:info@foryoufootball.it" className="underline">info@foryoufootball.it</a>: non serve pagare di nuovo.
            </Card>
          )}
          {cambioFatto && (
            <Card variant="accent" padding="sm" className="text-body-sm text-app flex items-start gap-2">
              <Check size={18} className="text-success shrink-0 mt-0.5" aria-hidden />
              <span>Fatto: adesso hai {TESTI_PACCHETTI[cambioFatto].titolo}. <button className="underline" onClick={() => router.push('/')}>Torna alla home</button></span>
            </Card>
          )}
          {abbonato && offerta.inPausa && (
            <Card variant="warn" padding="sm" className="text-body-sm text-app">
              Sei in pausa: il pacchetto si cambia quando riprendi. <button className="underline" onClick={() => router.push('/pausa')}>Vai alla pausa</button>
            </Card>
          )}
          {nessunoInVendita && !abbonato && (
            <Card variant="warn" className="space-y-1">
              <p className="text-body font-semibold text-app">Le iscrizioni aprono a breve.</p>
              <p className="text-body-sm text-muted">Scegli il pacchetto che ti interessa e lascia il nome in lista: ti avvisiamo quando apre.</p>
            </Card>
          )}

          <section className="flex flex-col gap-3" aria-label="Pacchetti">
            {[{ id: 'completo' as Pacchetto, el: scheda('completo') }, { id: 'mentale' as Pacchetto, el: scheda('mentale') }, { id: PACCHETTO_FISICO[livello], el: scheda(
              PACCHETTO_FISICO[livello],
              (
                <div className="flex gap-2 pt-1" role="radiogroup" aria-label="Livello del Fisico">
                  {LIVELLI.map((l) => {
                    const on = livello === l;
                    return (
                      <button
                        key={l}
                        role="radio"
                        aria-checked={on}
                        onClick={(e) => { e.stopPropagation(); setLivello(l); setScelto(PACCHETTO_FISICO[l]); }}
                        className={`flex-1 min-h-[44px] rounded-btn border text-body-sm font-semibold transition-colors ${on ? 'border-forest-400 bg-forest-500/15 text-app' : 'border-divider text-muted'}`}
                      >
                        {NOME_LIV[l]}
                      </button>
                    );
                  })}
                </div>
              ),
            ) }]
              // Prima quelli che si possono comprare adesso, nello stesso ordine di prima
              .map((x, i) => ({ ...x, i, ok: per.get(x.id) ? vendibileOra(per.get(x.id)!) : false }))
              .sort((a, b) => Number(b.ok) - Number(a.ok) || a.i - b.i)
              .map((x) => <div key={x.i}>{x.el}</div>)}
          </section>

          {scelto.startsWith('fisico_') || scelto === 'completo' ? (
            <p className="text-caption text-muted px-1">{SICUREZZA_FISICO}</p>
          ) : null}

          {!abbonato && !chiuso && !bloccatoPer && prezzoSel.euro != null && (
            <Card className="space-y-1">
              <p className="text-body-sm text-app">
                {prezzoSel.tipo === 'lancio'
                  ? `${etichettaPrezzo('lancio')}: ${euroSel} € al mese, bloccato finché resti iscritto (anche in pausa).`
                  : prezzoSel.tipo === 'codice'
                    ? `${etichettaPrezzo('codice')}: ${euroSel} € al mese, bloccato finché resti iscritto.`
                    : `${euroSel} € al mese. Disdici quando vuoi.`}
              </p>
              {prova > 0 ? (
                <p className="text-body-sm text-muted">
                  <span className="font-semibold text-app">I primi {prova} giorni sono gratis.</span> Inserisci la carta: il primo addebito è {primoAddebito}. Se disdici prima, non paghi niente.
                </p>
              ) : (
                <p className="text-body-sm text-muted">Il primo addebito è oggi, poi ogni mese.</p>
              )}
            </Card>
          )}
          {bloccatoPer && !abbonato && (
            <Card padding="sm" className="text-body-sm text-muted">Il Mente ce l&apos;hai già{sel.motivo === 'season1' ? ' con Season 1' : ''}: puoi aggiungere il Fisico.</Card>
          )}

          {codiceVisibile && (
            <Card className="space-y-2">
              {codice ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-body-sm text-success flex items-center gap-2 min-w-0">
                    <Check size={16} className="shrink-0" aria-hidden /> Codice {codice.codice} applicato
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => { setCodice(null); setCodiceScritto(''); }}>Togli</Button>
                </div>
              ) : (
                <Field label="Hai un codice da un amico?" htmlFor="codice" error={codiceErr || undefined}>
                  <div className="flex gap-2">
                    <Input
                      id="codice"
                      autoCapitalize="characters"
                      autoComplete="off"
                      spellCheck={false}
                      value={codiceScritto}
                      onChange={(e) => { setCodiceScritto(e.target.value); setCodiceErr(''); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') provaCodice(); }}
                      placeholder="Il codice"
                      className="flex-1 min-w-0 uppercase"
                    />
                    <Button variant="secondary" onClick={provaCodice} loading={codiceLoading} disabled={!codiceScritto.trim()}>Usa</Button>
                  </div>
                </Field>
              )}
            </Card>
          )}

          {abbonato && (
            <Card className="flex items-center justify-between gap-3">
              <p className="text-body-sm text-muted min-w-0">Carta, ricevute, disdetta: nel portale. Prima di disdire puoi metterti in pausa da Profilo → Account.</p>
              <Button variant="ghost" size="sm" onClick={openPortal} loading={loading}>Portale</Button>
            </Card>
          )}

          {!abbonato && !chiuso && !bloccatoPer && (
            <Card>
              {cambiaEmail ? (
                <Field label="Email per le ricevute" htmlFor="payer-email" helper="Se paga un genitore, metti la sua: le ricevute arrivano lì. L'account nell'app resta il tuo.">
                  <Input id="payer-email" type="email" inputMode="email" autoComplete="email" value={payerEmail} onChange={(e) => setPayerEmail(e.target.value)} placeholder="nome@esempio.it" />
                </Field>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-body-sm text-muted min-w-0">Le ricevute arrivano a <span className="text-app break-all">{accountEmail}</span></p>
                  <Button variant="ghost" size="sm" onClick={() => { setCambiaEmail(true); setPayerEmail(''); }}>Cambia</Button>
                </div>
              )}
            </Card>
          )}

          <Card className="space-y-1">
            <h2 className="font-display text-title-3 font-bold text-app mb-2">Domande frequenti</h2>
            {faq('È un abbonamento?', <>Sì, mensile: si rinnova da solo ogni mese. Disdici quando vuoi dall&apos;app: Profilo → Account → Gestisci abbonamento. Resti dentro fino alla fine del mese pagato.</>)}
            {faq('Come funziona la prova?', <>Inserisci la carta e hai {prova || 7} giorni. Tre giorni prima della fine ti scriviamo. Se disdici prima della fine non paghi niente. La prova è una sola, su qualunque pacchetto: se passi a un altro pacchetto durante la prova, paghi da quel giorno.</>)}
            {faq('Posso cambiare pacchetto?', <>Sì, da questa pagina, quando vuoi. Paghi subito solo la differenza del mese in corso; se scendi, quello che hai già pagato in più va sulle fatture dopo. Se lasci il Completo per il solo Mente o il solo Fisico, per 6 mesi puoi tornarci al tuo prezzo di prima.</>)}
            {faq('Cos\'è il prezzo bloccato?', <>Il prezzo di lancio e il prezzo con codice restano tuoi finché resti iscritto, anche cambiando pacchetto e in pausa. Se disdici e torni più avanti, paghi il prezzo di quel momento.</>)}
            {faq('E se devo fermarmi?', <>Al posto di disdire puoi metterti in pausa: 2 mesi, una volta l&apos;anno, senza addebiti e con il tuo prezzo. Per un infortunio la pausa può durare fino a 6 mesi: la chiedi da Profilo → Account con una riga.</>)}
            {codiceVisibile && faq('Ho un codice', <>Scrivilo in «Hai un codice da un amico?»: vale il prezzo con codice, bloccato finché resti iscritto. Vale sempre un prezzo solo, il più basso a cui hai diritto: i codici non si sommano al prezzo di lancio.</>)}
            {faq('Pagamento sicuro?', <>I pagamenti passano da Stripe. Apple Pay e Google Pay disponibili.</>)}
          </Card>
        </div>
      </div>

      <div className="sticky bottom-0 z-40 bg-app-bg/95 backdrop-blur border-t border-divider px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto">
          {error && <p className="text-body-sm text-danger mb-2" role="alert">{error}</p>}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-display text-body-lg font-bold text-app leading-tight truncate">{TESTI_PACCHETTI[scelto].titolo}</div>
              <div className="text-caption text-muted tabular-nums">{prezzoCta ?? 'a breve'}{!abbonato && prova > 0 && !chiuso ? ` · ${prova} giorni gratis` : ''}</div>
            </div>
            <Button variant="hero" size="lg" onClick={cta.onClick} loading={loading} disabled={cta.disabled} className="shrink-0">
              {cta.testo}
            </Button>
          </div>
        </div>
      </div>

      <Sheet
        open={!!anteprima}
        onClose={() => setAnteprima(null)}
        title={anteprima ? `Passa a ${TESTI_PACCHETTI[anteprima.a].titolo}` : ''}
        footer={(
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setAnteprima(null)}>Annulla</Button>
            <Button variant="primary" fullWidth onClick={confermaCambio} loading={loading}>Conferma</Button>
          </div>
        )}
      >
        {anteprima && (
          <div className="space-y-3 text-body text-app">
            <p>
              {anteprima.tipo === 'ritorno'
                ? 'Torni al Completo al tuo prezzo di prima.'
                : anteprima.euro != null ? `Da adesso ${euroTesto(anteprima.euro)} € al mese${anteprima.tipo === 'lancio' ? ', prezzo di lancio bloccato' : anteprima.tipo === 'codice' ? ', prezzo con codice bloccato' : ''}.` : null}
            </p>
            {anteprima.adesso != null && (
              <p className="text-body-sm text-muted">
                {anteprima.adesso > 0
                  ? `Oggi paghi ${euroTesto(anteprima.adesso)} €: la differenza per i giorni che restano di questo mese.`
                  : 'Oggi non paghi niente: quello che hai già pagato in più va sulle fatture dopo.'}
              </p>
            )}
            {anteprima.finisceProva && <p className="text-body-sm text-warning">Sei in prova: cambiando pacchetto la prova finisce e l&apos;abbonamento parte oggi.</p>}
            {anteprima.ritorno && <p className="text-body-sm text-muted">Lasci il Completo: per 6 mesi puoi tornarci al tuo prezzo di adesso.</p>}
          </div>
        )}
      </Sheet>
    </main>
  );
}

function testoCodice(motivo: string | undefined): string {
  switch (motivo) {
    case 'scaduto': return 'Questo codice è scaduto.';
    case 'esaurito': return 'Questo codice è già stato usato da tutti quelli che potevano.';
    case 'troppi_tentativi': return 'Troppi tentativi. Riprova tra un\'ora.';
    case 'senza_scadenza':
    case 'non_valido':
    default: return 'Codice non valido. Controlla come l\'hai scritto.';
  }
}

function testoNoCambio(motivo: string | undefined): string {
  switch (motivo) {
    case 'in_pausa': return 'Sei in pausa: il pacchetto si cambia quando riprendi.';
    case 'iscrizioni_chiuse': return 'Questo pacchetto per ora è pieno: lascia il nome in lista.';
    case 'beta': case 'season1': return 'Il Mente ce l\'hai già.';
    case 'stesso_pacchetto': return 'È già il tuo pacchetto.';
    case 'prezzo_mancante': return 'Questo pacchetto non è ancora in vendita.';
    case 'non_attivo': return 'Il cambio di pacchetto dall\'app arriva a breve.';
    default: return 'Non riesco a cambiare pacchetto adesso. Riprova tra poco.';
  }
}

export default function PricingPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <PricingContent />
    </Suspense>
  );
}
