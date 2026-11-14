'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { NUMERI_UTILI_RIGA } from '@/lib/constants';
import { authFetch } from '@/lib/authFetch';
import { readCache } from '@/lib/clientCache';
import { useMeditation } from '@/components/MeditationContext';
import { MessageCircle, Zap, Activity, RotateCcw, Armchair, Megaphone, LifeBuoy } from 'lucide-react';
import { AppLoader, Badge, Button, Card, CardPlay, GrigliaRiquadri, Riquadro, SectionTitle, Testata, TitoloGruppo } from '@/components/ui';
import { PalestraTestata } from '@/components/ParteSwitch';
import EmptyState from '@/components/EmptyState';

interface Layer {
  sbloccoSettimana: number;
  strumento: string;
  titoloLayer: string;
  unlocked: boolean;
  apertura: string;
  pratica: string[];
  chiusura: string;
  coachPrompt: string;
}
interface SosCard {
  id: string;
  difficolta: string;
  emoji: string;
  sottotitolo: string;
  unlockedCount: number;
  totalCount: number;
  layers: Layer[];
}

function Steps({ steps, size = 'lg' }: { steps: string[]; size?: 'lg' | 'md' }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-forest-500 text-white text-label font-bold flex items-center justify-center mt-0.5 tabular-nums" aria-hidden="true">
            {i + 1}
          </span>
          <p className={`${size === 'lg' ? 'text-body-lg' : 'text-body'} text-app leading-relaxed`}>{step}</p>
        </li>
      ))}
    </ol>
  );
}

/** L'icona di una difficoltà dal suo nome (le emoji di Notion restano fuori: l'app usa le icone). */
function iconaDifficolta(nome: string) {
  const n = nome.toLowerCase();
  if (n.includes('ansia')) return <Activity />;
  if (n.includes('error')) return <RotateCcw />;
  if (n.includes('panchina')) return <Armchair />;
  if (n.includes('mister') || n.includes('allenatore')) return <Megaphone />;
  return <LifeBuoy />;
}

/**
 * Come affrontare le difficoltà (review 16/9, blocco 3): in una schermata di
 * emergenza si esegue, non si legge. Il dettaglio apre con gli step del layer
 * "Adesso" e il Reset; scena e chiusura vengono dopo; i layer bloccati sono
 * una riga in fondo. La scheda aperta vive nell'URL (?card=) come prima.
 */
function SosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openMeditation } = useMeditation();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<SosCard[]>([]);
  const selectedId = searchParams.get('card');

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      // Le schede in cache (scritte dalla Palestra) si mostrano subito; la rete le
      // aggiorna appena risponde (i layer sbloccati dipendono dalla settimana).
      const cached = readCache<{ week: number; cards: SosCard[] }>('difficolta');
      if (cached?.cards?.length) {
        setCards(cached.cards);
        setLoading(false);
      }
      try {
        const res = await authFetch('/api/difficolta');
        if (res.ok) {
          const data = await res.json();
          setCards(data.cards || []);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) {
    return <AppLoader />;
  }

  const selected = cards.find(c => c.id === selectedId) || null;

  // ── Dettaglio scheda: prima gli step, poi il resto ────────────────────────
  if (selected) {
    const unlockedLayers = selected.layers.filter(l => l.unlocked);
    const lockedLayers = selected.layers.filter(l => !l.unlocked);
    const [now, ...others] = unlockedLayers;
    const coachPrompt = now?.coachPrompt || '';
    const nextWeek = lockedLayers.length > 0 ? Math.min(...lockedLayers.map(l => l.sbloccoSettimana)) : null;

    return (
      <main className="min-h-screen bg-app pt-safe px-4 pb-tabbar-lg">
        <div className="mx-auto max-w-xl space-y-4">
          <Testata indietro={{ href: '/sos', label: 'Quando si fa dura' }} titolo={selected.difficolta} sotto={selected.sottotitolo || undefined} />

          {/* ── Fai questo, adesso: gli step e il Reset ── */}
          <CardPlay funzione="reset" onClick={openMeditation} label="Fai il Reset ora" sopra="Adesso · 1 minuto" titolo="Fai il Reset ora" />
          {now && now.pratica.length > 0 && (
            <>
              <TitoloGruppo className="pt-2">Fai questo{now.strumento ? ` · ${now.strumento}` : ''}</TitoloGruppo>
              <Card padding="md" as="section" aria-label="Fai questo, adesso"><Steps steps={now.pratica} /></Card>
            </>
          )}
          {now && (now.apertura || now.chiusura) && (
            <div className="space-y-3 px-1">
              {now.apertura && <p className="whitespace-pre-line text-body leading-relaxed text-muted">{now.apertura}</p>}
              {now.chiusura && <p className="font-quote text-body-lg leading-relaxed text-forest-300">{now.chiusura}</p>}
            </div>
          )}

          {/* ── Gli altri modi sbloccati, uno dopo l'altro ── */}
          {others.map((layer, i) => (
            <Card key={i} padding="md" as="section" aria-label={layer.titoloLayer}>
              <SectionTitle
                title={layer.titoloLayer}
                action={layer.strumento ? <Badge tone="accent" className="mt-1.5 mr-2">{layer.strumento}</Badge> : undefined}
                className="mb-3"
              />
              {layer.apertura && (
                <p className="text-body-sm text-muted leading-relaxed whitespace-pre-line mb-3">{layer.apertura}</p>
              )}
              {layer.pratica.length > 0 && <Steps steps={layer.pratica} size="md" />}
              {layer.chiusura && (
                <p className="font-quote text-body-lg text-forest-300 leading-relaxed mt-4">{layer.chiusura}</p>
              )}
            </Card>
          ))}

          {lockedLayers.length > 0 && (
            <p className="text-caption text-muted px-1">
              {lockedLayers.length === 1 ? 'Un altro modo si sblocca' : `Altri ${lockedLayers.length} modi si sbloccano`} avanzando
              {nextWeek !== null ? ` (Settimana ${nextWeek})` : ''}.
            </p>
          )}

          {coachPrompt && (
            <Button
              variant="ghost"
              fullWidth
              href={`/chat?prompt=${encodeURIComponent(coachPrompt)}`}
              icon={<MessageCircle size={18} aria-hidden="true" />}
            >
              Parlane col Coach
            </Button>
          )}

          <div className="h-4" />
        </div>
      </main>
    );
  }

  // ── Lista difficoltà ──────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-app pb-tabbar-lg">
      {/* Palestra › Mente › Quando si fa dura (8/11) */}
      <PalestraTestata parte="mente" scheda="dura" />

      <div className="max-w-xl mx-auto px-4 mt-4 space-y-3">
        {cards.length === 0 && (
          <EmptyState
            icon={<Zap size={24} aria-hidden="true" />}
            iconBg="bg-warning/15"
            iconColor="text-warning"
            title="Nessuna guida disponibile adesso"
            subtitle="Le guide arrivano con il percorso. Se hai una situazione tosta, il Coach c'è sempre."
            cta={{ label: 'Scrivi al Coach', href: '/chat' }}
          />
        )}
        <GrigliaRiquadri>
          {cards.map(card => (
            <Riquadro key={card.id} href={`/sos?card=${card.id}`} icona={iconaDifficolta(card.difficolta)} titolo={card.difficolta}
              valore={card.totalCount > 1 ? <span className="text-body-sm font-semibold text-muted">{card.unlockedCount}/{card.totalCount}</span> : undefined} />
          ))}
        </GrigliaRiquadri>

        {cards.length > 0 && (
          <Button variant="ghost" fullWidth href="/chat" icon={<MessageCircle size={18} aria-hidden="true" />}>
            Non c&apos;è la tua? Scrivi al Coach
          </Button>
        )}
        <div className="h-4" />
        {/* Una riga sola, discreta (Ste, 8/10): i contatti reali stanno qui, niente banner altrove */}
        <p className="text-caption text-faint leading-relaxed px-1 pt-2">Se è un momento davvero difficile, parla con una persona reale: {NUMERI_UTILI_RIGA}.</p>
      </div>
    </main>
  );
}

export default function SosPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <SosContent />
    </Suspense>
  );
}
