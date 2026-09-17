'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SPORT_ROLES, PLAYER_ROLES } from '@/lib/constants';
import { Download } from 'lucide-react';
import { AppLoader, BackButton, Button } from '@/components/ui';

/**
 * La Carta del Giocatore — il documento personale che resta a fine percorso.
 * Non un certificato generico: le SUE cose, scritte da lui durante il percorso
 * (mantra, mappa della tensione, firma del gioco libero, Protocollo personale).
 * Print-friendly: "Scarica PDF" = window.print() con stylesheet dedicato.
 */

interface CartaData {
  nome: string;
  ruoli: string[];
  mantra: string | null; // risposta W1-G3 (giorno del mantra)
  mappa: string | null; // gate W3 q1 (dove porta la tensione il corpo)
  firma: string | null; // risposta W3-G3 (firma del gioco libero)
  protocollo: string | null; // risposta W4-G6 (il protocollo personale in 3 righe)
  cinqueCose: string | null; // risposta W8-G6 (le cinque cose oltre al calciatore)
  giorniCompletati: number;
}

function FieldBlock({ label, value, placeholder, quote = false }: { label: string; value: string | null; placeholder: string; quote?: boolean }) {
  return (
    <div className="border border-divider print:border-gray-300 rounded-card p-4">
      <p className="text-overline font-semibold uppercase tracking-wider text-forest-400 print:text-green-700 mb-1.5">
        {label}
      </p>
      {value ? (
        <p className={`text-body text-app print:text-black leading-relaxed whitespace-pre-line ${quote ? 'font-quote italic text-body-lg' : ''}`}>
          &ldquo;{value}&rdquo;
        </p>
      ) : (
        <div>
          <p className="text-body-sm text-muted print:text-gray-500 mb-2">{placeholder}</p>
          <div className="border-b border-dashed border-divider print:border-gray-400 h-5" />
          <div className="border-b border-dashed border-divider print:border-gray-400 h-5" />
        </div>
      )}
    </div>
  );
}

export default function CartaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [carta, setCarta] = useState<CartaData | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const uid = session.user.id;

      const [{ data: profile }, { data: progress }] = await Promise.all([
        supabase
          .from('profiles')
          .select('name, sport, role')
          .eq('user_id', uid)
          .single(),
        supabase
          .from('user_day_progress')
          .select('week_number, day_number, response, gate_answers, completed')
          .eq('user_id', uid),
      ]);

      const roleOptions = SPORT_ROLES[profile?.sport || 'calcio'] || PLAYER_ROLES;
      const ruoli = (profile?.role || '')
        .split(',')
        .filter(Boolean)
        .map((v: string) => roleOptions.find((r: { value: string; label: string }) => r.value === v)?.label || v);

      const day = (w: number, d: number) =>
        progress?.find(p => p.week_number === w && p.day_number === d);

      setCarta({
        nome: profile?.name || 'Giocatore',
        ruoli,
        mantra: day(1, 3)?.response || null,
        mappa: day(3, 7)?.gate_answers?.q1 || null,
        firma: day(3, 3)?.response || null,
        protocollo: day(4, 6)?.response || null,
        cinqueCose: day(8, 6)?.response || null,
        giorniCompletati: (progress || []).filter(p => p.completed).length,
      });
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading || !carta) {
    return <AppLoader />;
  }

  return (
    <main className="min-h-screen bg-app print:bg-white pt-safe px-4 pb-tabbar-lg print:p-0">
      <div className="max-w-xl mx-auto space-y-4">

        {/* Controlli — mai in stampa */}
        <div className="no-print flex items-center justify-between">
          <BackButton onClick={() => router.back()} label="Indietro" />
          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
            icon={<Download size={18} aria-hidden="true" />}
          >
            Scarica PDF
          </Button>
        </div>

        {/* ── LA CARTA ──────────────────────────────────────────────────────── */}
        <div className="bg-surface print:bg-white rounded-card print:rounded-none shadow-e2 print:shadow-none border-2 border-forest-500/40 print:border-green-700 p-6 md:p-8 space-y-5">

          {/* Intestazione */}
          <div className="text-center border-b border-divider print:border-gray-300 pb-5">
            <p className="text-overline font-semibold uppercase tracking-wider text-forest-400 print:text-green-700 mb-2">
              For You Football · Season 1
            </p>
            <h1 className="font-display text-display font-bold text-app print:text-black leading-tight">
              {carta.nome}
            </h1>
            {carta.ruoli.length > 0 && (
              <p className="text-body text-muted print:text-gray-600 mt-1">
                {carta.ruoli.join(' · ')}
              </p>
            )}
            <p className="text-body-sm text-muted print:text-gray-500 mt-3">
              Carta del Giocatore — il mio gioco mentale, scritto da me
            </p>
          </div>

          <FieldBlock
            label="Il mio mantra"
            value={carta.mantra}
            quote
            placeholder="La parola che mi riporta qui (la scegli al Giorno 3 della Settimana 1):"
          />

          <FieldBlock
            label="La mia mappa"
            value={carta.mappa}
            placeholder="Dove porta la tensione il mio corpo in campo (la trovi nella Settimana 3):"
          />

          <FieldBlock
            label="La mia firma del gioco libero"
            value={carta.firma}
            placeholder="Come si sente il mio corpo quando gioco libero (Settimana 3, Giorno 3):"
          />

          <FieldBlock
            label="Il mio Protocollo"
            value={carta.protocollo}
            placeholder="SENTI → NOMINA → TORNA, nelle mie parole (lo scrivi alla Settimana 4):"
          />

          <FieldBlock
            label="Chi sono, oltre la maglia"
            value={carta.cinqueCose}
            placeholder="Le cinque cose che sono anche senza il pallone (le scrivi alla Settimana 8):"
          />

          {/* Footer carta */}
          <div className="flex items-center justify-between border-t border-divider print:border-gray-300 pt-4">
            <p className="text-caption text-faint print:text-gray-500 tabular-nums">
              {carta.giorniCompletati} giorni di percorso completati
            </p>
            <p className="text-caption font-bold text-forest-400 print:text-green-700">
              Play Free
            </p>
          </div>
        </div>

        <p className="no-print text-body-sm text-muted text-center leading-relaxed px-4">
          Stampala e mettila nell&apos;armadietto. I campi vuoti si riempiono andando avanti nel percorso — o a penna.
        </p>

        <div className="h-4" />
      </div>
    </main>
  );
}
