'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { dataLunga } from '@/lib/abbonamento';
import { MOTIVO_INFORTUNIO_MAX } from '@/lib/pausaInviti';
import { resetPaywallCache } from '@/components/PaywallGuard';
import { BarChart3, BookOpen, Check, ChevronRight, IdCard, Pause, Play } from 'lucide-react';
import { AppLoader, BackButton, Button, Card, Field, Textarea } from '@/components/ui';

interface StatoPausa {
  disponibile: boolean;
  skipped?: string;
  inPausa: boolean;
  fino: string | null;
  tipo: 'standard' | 'infortunio' | null;
  puo: { ok: boolean; motivo?: string; dal?: string | null };
  richiesta: boolean;
  mesi: number;
  mesiInfortunioMax: number;
  campo?: boolean;
}

const minuscola = (s: string | null) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : '');

/**
 * La pausa (3/11, Ste: "pausa al posto della disdetta"): 2 mesi, una volta ogni 12, niente addebiti, prezzo bloccato.
 * In pausa l'app è in sola lettura: qui arriva chi apre il percorso o il Coach (PaywallGuard), con la data di ripresa,
 * "Riprendi adesso" e le cose che restano aperte (Carta, risposte, statistiche, storico del Campo). Da fuori pausa la
 * stessa pagina la mette, e chiede quella per infortunio (una riga, la approva Ste).
 */
export default function PausaPage() {
  const router = useRouter();
  const [stato, setStato] = useState<StatoPausa | null>(null);
  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState('');
  const [motivo, setMotivo] = useState('');
  const [richiestaOk, setRichiestaOk] = useState(false);
  const [mostraInfortunio, setMostraInfortunio] = useState(false);

  const carica = useCallback(async () => {
    const res = await authFetch('/api/stripe/pausa');
    if (res.ok) setStato(await res.json());
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      await carica();
    })();
  }, [router, carica]);

  const azione = async (body: Record<string, unknown>) => {
    setLoading(true);
    setErrore('');
    try {
      const res = await authFetch('/api/stripe/pausa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) setErrore(testoErrore(d.error, d.dal));
      else {
        resetPaywallCache();
        if (body.azione === 'infortunio') setRichiestaOk(true);
        await carica();
      }
    } catch {
      setErrore('Non riesco adesso. Riprova tra poco.');
    }
    setLoading(false);
  };

  if (!stato) return <AppLoader />;

  const fino = minuscola(dataLunga(stato.fino));
  const aperte = [
    { href: '/carta', label: 'La tua Carta', icon: IdCard },
    { href: '/risposte', label: 'Le tue risposte', icon: BookOpen },
    { href: '/statistiche', label: 'Le statistiche', icon: BarChart3 },
  ];

  return (
    <main className="min-h-screen bg-app pb-tabbar">
      <div className="max-w-2xl mx-auto px-4 pt-safe space-y-5">
        <div className="flex items-center gap-2 pt-2">
          <BackButton onClick={() => router.push('/profilo')} />
          <h1 className="font-display text-title-1 font-bold text-app">{stato.inPausa ? 'Sei in pausa' : 'La pausa'}</h1>
        </div>

        {!stato.disponibile && (
          <Card variant="warn" padding="sm" className="text-body-sm text-app">La pausa non è ancora attiva. Scrivici a info@foryoufootball.it se ti serve adesso.</Card>
        )}

        {stato.inPausa ? (
          <>
            <Card variant="accent" className="space-y-2">
              <div className="flex items-center gap-2 text-app">
                <Pause size={20} className="text-forest-400" aria-hidden />
                <p className="text-body font-semibold">Fino a {fino || 'fine pausa'}{stato.tipo === 'infortunio' ? ' · pausa per infortunio' : ''}</p>
              </div>
              <p className="text-body-sm text-muted">Niente addebiti e il tuo prezzo resta quello. Il percorso, il Coach e i piani nuovi ripartono quando riprendi; da quel giorno l&apos;abbonamento riparte da solo.</p>
              <Button variant="primary" fullWidth icon={<Play size={18} aria-hidden />} onClick={() => azione({ azione: 'riprendi' })} loading={loading}>Riprendi adesso</Button>
            </Card>
            <section className="space-y-2">
              <h2 className="text-label font-semibold text-muted uppercase tracking-wide px-1">Restano aperte</h2>
              {aperte.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="flex items-center gap-3 min-h-[52px] px-4 rounded-card bg-surface border border-white/6 text-body text-app">
                  <Icon size={20} className="text-forest-400" aria-hidden />
                  <span className="flex-1">{label}</span>
                  <ChevronRight size={18} className="text-muted" aria-hidden />
                </Link>
              ))}
              {stato.campo && <Link href="/allenamento/storico" className="flex items-center gap-3 min-h-[52px] px-4 rounded-card bg-surface border border-white/6 text-body text-app">
                <BarChart3 size={20} className="text-forest-400" aria-hidden />
                <span className="flex-1">Lo storico del Campo</span>
                <ChevronRight size={18} className="text-muted" aria-hidden />
              </Link>}
            </section>
          </>
        ) : (
          <>
            <Card className="space-y-2">
              <p className="text-body font-semibold text-app">Ti devi fermare? Metti in pausa invece di disdire.</p>
              <p className="text-body-sm text-muted">{stato.mesi} mesi, una volta l&apos;anno. Niente addebiti, il tuo prezzo resta bloccato. L&apos;app resta in sola lettura: Carta, risposte e storico.</p>
              {stato.puo.ok ? (
                <Button variant="secondary" fullWidth icon={<Pause size={18} aria-hidden />} onClick={() => azione({ azione: 'pausa' })} loading={loading} disabled={!stato.disponibile}>
                  Metti in pausa {stato.mesi} mesi
                </Button>
              ) : (
                <p className="text-body-sm text-warning">{testoErrore(stato.puo.motivo, stato.puo.dal ?? undefined)}</p>
              )}
            </Card>

            <Card className="space-y-2">
              <p className="text-body font-semibold text-app">Ti sei fatto male?</p>
              <p className="text-body-sm text-muted">La pausa per infortunio dura fino a {stato.mesiInfortunioMax} mesi e non conta come la pausa dell&apos;anno. Scrivi una riga: niente certificati, niente dettagli medici. La approviamo a mano, di solito in giornata.</p>
              {stato.richiesta || richiestaOk ? (
                <p className="text-body-sm text-success flex items-center gap-2"><Check size={16} aria-hidden /> Richiesta mandata: ti avvisiamo quando è attiva.</p>
              ) : mostraInfortunio ? (
                <>
                  <Field label="Cosa è successo, in una riga" htmlFor="motivo" helper={`${motivo.length}/${MOTIVO_INFORTUNIO_MAX}`}>
                    <Textarea id="motivo" rows={2} maxLength={MOTIVO_INFORTUNIO_MAX} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Es. distorsione alla caviglia, fermo un mese" />
                  </Field>
                  <Button variant="secondary" fullWidth onClick={() => azione({ azione: 'infortunio', motivo })} loading={loading} disabled={motivo.trim().length < 3 || !stato.disponibile}>Chiedi la pausa</Button>
                </>
              ) : (
                <Button variant="ghost" fullWidth onClick={() => setMostraInfortunio(true)}>Chiedi la pausa per infortunio</Button>
              )}
            </Card>
          </>
        )}

        {errore && <p className="text-body-sm text-danger" role="alert">{errore}</p>}
      </div>
    </main>
  );
}

function testoErrore(motivo: string | undefined, dal?: string | null): string {
  switch (motivo) {
    case 'in_prova': return 'Durante la prova non c\'è la pausa: se vuoi fermarti, disdici prima della fine e non paghi niente.';
    case 'non_abbonato': return 'La pausa c\'è con un abbonamento attivo.';
    case 'gia_in_pausa': return 'Sei già in pausa.';
    case 'gia_usata': return `Hai già usato la pausa quest'anno${dal ? `: la prossima da ${minuscola(dataLunga(dal))}` : ''}. Se ti sei fatto male, chiedi quella per infortunio.`;
    case 'gia_chiesta': return 'Hai già chiesto la pausa per infortunio: ti avvisiamo quando è attiva.';
    case 'motivo_mancante': return 'Scrivi una riga su cosa è successo.';
    case 'non_in_pausa': return 'Non sei in pausa.';
    default: return 'Non riesco adesso. Riprova tra poco.';
  }
}
