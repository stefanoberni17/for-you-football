'use client';

import { useEffect, useState } from 'react';
import { Check, Dumbbell, Goal, Trophy } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { DAY_SHORT_NAMES } from '@/lib/constants';
import { Button, Card } from '@/components/ui';
import PalestraSwitch from '@/components/PalestraSwitch';

const INTERESSE_KEY = 'campo.interesse';

/**
 * Il Fisico per chi non ha il Campo (20/10, Ste: "farla bloccata per chi non ce l'ha potrebbe invogliare"):
 * cos'è in una riga, cosa ti dà in tre, una settimana finta per far vedere com'è dentro, e "Mi interessa".
 * Il Campo non è in vendita: il bottone registra l'evento `campo_interesse` (Ste lo legge da Supabase e decide
 * i pacchetti con un numero in mano). Quando si venderà, lo stesso bottone diventa "Sblocca".
 */
export default function FisicoBloccato() {
  const [fatto, setFatto] = useState(false);
  const [sending, setSending] = useState(false);
  useEffect(() => { try { setFatto(localStorage.getItem(INTERESSE_KEY) === '1'); } catch { /* private mode */ } }, []);

  const miInteressa = async () => {
    setSending(true);
    try {
      await authFetch('/api/onboarding/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: 'campo_interesse' }) }).catch(() => null);
      try { localStorage.setItem(INTERESSE_KEY, '1'); } catch { /* private mode */ }
      setFatto(true);
    } finally { setSending(false); }
  };

  // Settimana finta, solo da guardare: lun/mer/ven con l'app, mar/gio squadra, sab partita
  const finta: Record<number, 'app' | 'fatta' | 'squadra' | 'partita' | null> = { 1: 'fatta', 2: 'squadra', 3: 'app', 4: 'squadra', 5: 'app', 6: 'partita', 7: null };

  return (
    <main className="min-h-screen bg-app pt-safe pb-tabbar-lg px-5">
      <div className="max-w-md mx-auto">
        <PalestraSwitch parte="fisico" fisicoBloccato className="mb-5" />
        <h1 className="font-display text-title-1 font-bold text-app mb-1">Il Campo</h1>
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
              const k = finta[d];
              return (
                <span key={d} className="text-center">
                  <span className="block text-overline uppercase text-faint mb-1">{DAY_SHORT_NAMES[d]}</span>
                  <span className={`h-10 rounded-btn flex items-center justify-center ${
                    k === 'partita' ? 'bg-warning/20 text-warning' : k === 'squadra' ? 'bg-surface-3 text-muted' : k ? 'bg-forest-500/20 text-forest-300' : 'bg-surface-2 text-faint'
                  }`}>
                    {k === 'partita' ? <Trophy className="w-4 h-4" /> : k === 'fatta' ? <Check className="w-4 h-4" strokeWidth={3} /> : k === 'app' ? <Dumbbell className="w-4 h-4" /> : k === 'squadra' ? <span className="text-caption font-bold">S</span> : '·'}
                  </span>
                </span>
              );
            })}
          </div>
        </Card>

        <ul className="space-y-3 mb-6">
          {[
            ['I test e la tua Card', 'Forza, velocità, resistenza, tecnica: i test dicono il tuo livello e da lì parte tutto.'],
            ['Una settimana che si adatta', 'Giorni con la squadra, partita, come ti senti: la seduta di oggi cambia con te, non con un foglio fisso.'],
            ['Un preparatore a cui chiedere', 'Esecuzione, dolori, dubbi: risponde sapendo cosa hai fatto e cosa ti aspetta.'],
          ].map(([t, s]) => (
            <li key={t} className="flex gap-3">
              <span className="w-9 h-9 rounded-full bg-forest-500/15 text-forest-400 flex items-center justify-center shrink-0 mt-0.5" aria-hidden><Goal size={18} /></span>
              <span><span className="block text-body font-semibold text-app">{t}</span><span className="block text-body-sm text-muted leading-relaxed">{s}</span></span>
            </li>
          ))}
        </ul>

        {fatto ? (
          <Card variant="accent" padding="sm">
            <p className="text-body text-forest-300 flex items-center gap-2"><Check size={18} aria-hidden /> Ti avviso quando apre.</p>
            <p className="text-body-sm text-muted mt-1">Il Campo si apre a gruppi: chi ha detto che gli interessa entra per primo.</p>
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
