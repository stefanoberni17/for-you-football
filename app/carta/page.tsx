'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SPORT_ROLES, PLAYER_ROLES } from '@/lib/constants';
import { Download } from 'lucide-react';

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
  giorniCompletati: number;
}

function FieldBlock({ label, value, placeholder }: { label: string; value: string | null; placeholder: string }) {
  return (
    <div className="border border-divider print:border-gray-300 rounded-2xl p-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-forest-400 print:text-green-700 mb-1.5">
        {label}
      </p>
      {value ? (
        <p className="text-sm text-app print:text-black italic leading-relaxed whitespace-pre-line">
          &ldquo;{value}&rdquo;
        </p>
      ) : (
        <div>
          <p className="text-xs text-faint print:text-gray-500 mb-2">{placeholder}</p>
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
        .map((v: string) => roleOptions.find((r: any) => r.value === v)?.label || v);

      const day = (w: number, d: number) =>
        progress?.find(p => p.week_number === w && p.day_number === d);

      setCarta({
        nome: profile?.name || 'Giocatore',
        ruoli,
        mantra: day(1, 3)?.response || null,
        mappa: day(3, 7)?.gate_answers?.q1 || null,
        firma: day(3, 3)?.response || null,
        protocollo: day(4, 6)?.response || null,
        giorniCompletati: (progress || []).filter(p => p.completed).length,
      });
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading || !carta) {
    return (
      <main className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-ball-bounce">⚽</div>
          <p className="text-muted">Caricamento...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-app print:bg-white pt-safe px-4 pb-tabbar-lg print:p-0">
      <div className="max-w-xl mx-auto space-y-4">

        {/* Controlli — mai in stampa */}
        <div className="no-print flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-muted hover:text-forest-400 transition-colors"
          >
            ← Indietro
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-forest-500 hover:bg-forest-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            Scarica PDF
          </button>
        </div>

        {/* ── LA CARTA ──────────────────────────────────────────────────────── */}
        <div className="bg-surface print:bg-white rounded-3xl print:rounded-none shadow-xl print:shadow-none border-2 border-forest-500/40 print:border-green-700 p-6 md:p-8 space-y-5">

          {/* Intestazione */}
          <div className="text-center border-b border-divider print:border-gray-300 pb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-forest-400 print:text-green-700 mb-2">
              For You Football · Season 1
            </p>
            <h1 className="text-3xl font-bold text-app print:text-black leading-tight">
              {carta.nome}
            </h1>
            {carta.ruoli.length > 0 && (
              <p className="text-sm text-muted print:text-gray-600 mt-1">
                {carta.ruoli.join(' · ')}
              </p>
            )}
            <p className="text-xs text-faint print:text-gray-500 mt-3">
              Carta del Giocatore — il mio gioco mentale, scritto da me
            </p>
          </div>

          <FieldBlock
            label="🌬️ Il mio mantra"
            value={carta.mantra}
            placeholder="La parola che mi riporta qui (la scegli al Giorno 3 della Settimana 1):"
          />

          <FieldBlock
            label="🦵 La mia mappa"
            value={carta.mappa}
            placeholder="Dove porta la tensione il mio corpo in campo (la trovi nella Settimana 3):"
          />

          <FieldBlock
            label="✨ La mia firma del gioco libero"
            value={carta.firma}
            placeholder="Come si sente il mio corpo quando gioco libero (Settimana 3, Giorno 3):"
          />

          <FieldBlock
            label="🛡️ Il mio Protocollo"
            value={carta.protocollo}
            placeholder="SENTI → NOMINA → TORNA, nelle mie parole (lo scrivi alla Settimana 4):"
          />

          {/* Footer carta */}
          <div className="flex items-center justify-between border-t border-divider print:border-gray-300 pt-4">
            <p className="text-xs text-faint print:text-gray-500">
              {carta.giorniCompletati} giorni di percorso completati
            </p>
            <p className="text-xs font-bold text-forest-400 print:text-green-700">
              ⚽ Play Free
            </p>
          </div>
        </div>

        <p className="no-print text-xs text-faint text-center leading-relaxed px-4">
          Stampala e mettila nell&apos;armadietto. I campi vuoti si riempiono andando avanti nel percorso — o a penna.
        </p>

        <div className="h-4" />
      </div>
    </main>
  );
}
