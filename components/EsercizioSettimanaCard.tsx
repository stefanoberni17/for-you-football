'use client';

import { useEffect, useState } from 'react';
import { AlarmClock, Bell, BellOff, Check, Eye } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { conteggioTesto, TESTO_SVEGLIA_TELEFONO } from '@/lib/esercizioSettimana';
import type { EsercizioStato } from '@/lib/esercizioServer';
import { Button, Card, Riquadro, Sheet } from '@/components/ui';

/**
 * L'esercizio della settimana in home (31/10): il testo da Notion, "Fatto oggi" (una spunta al giorno) e "N su 7".
 * Compare solo dopo il G1 della settimana. In W5, W6, W8 e W10 una riga ricorda di mettere la sveglia sul telefono
 * (la mette il ragazzo, l'app non la manda). In fondo l'interruttore dei promemoria del mattino e della sera.
 */
export default function EsercizioSettimanaCard({ variante = 'card' }: { variante?: 'card' | 'riquadro' } = {}) {
  const [stato, setStato] = useState<EsercizioStato | null>(null);
  const [salvando, setSalvando] = useState<'fatto' | 'notifiche' | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [aperto, setAperto] = useState(false);
  const [foglio, setFoglio] = useState(false); // variante riquadro: il testo intero e «Fatto oggi» in un foglio

  useEffect(() => {
    authFetch('/api/esercizio').then((r) => (r.ok ? r.json() : null)).then((d) => {
      setStato((d?.esercizio ?? null) as EsercizioStato | null);
    }).catch(() => {});
  }, []);

  if (!stato?.visibile) return null;

  const manda = async (tipo: 'fatto' | 'notifiche', body: Record<string, unknown>) => {
    setSalvando(tipo);
    setErrore(null);
    try {
      const res = await authFetch('/api/esercizio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json().catch(() => ({}));
      if (d?.esercizio) setStato(d.esercizio);
      else if (d?.skipped) setErrore('Non riesco ancora a salvare: questa parte dell’app si sta accendendo.');
      else if (!res.ok) setErrore('Non sono riuscito a salvare. Riprova tra poco.');
    } catch {
      setErrore('Non sono riuscito a salvare. Riprova tra poco.');
    } finally {
      setSalvando(null);
    }
  };

  const card = (
    <Card padding="sm">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <p className="text-overline uppercase tracking-wider font-semibold text-forest-300 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          Esercizio della settimana
        </p>
        <span className="text-label text-muted tabular-nums" aria-label={`Fatto ${conteggioTesto(stato.giorni)} giorni`}>{conteggioTesto(stato.giorni)}</span>
      </div>
      {/* Chiuso a due righe (8/11, Ste: "le scritte sono tantissime da fuori"): il testo intero a un tocco */}
      <button type="button" onClick={() => setAperto((a) => !a)} aria-expanded={aperto} className="block w-full text-left">
        <p className={`text-body text-app leading-relaxed whitespace-pre-line ${aperto ? '' : 'line-clamp-2'}`}>{stato.testo}</p>
        {!aperto && <span className="mt-1 inline-block text-body-sm font-semibold text-forest-300">Leggi tutto</span>}
      </button>

      {stato.sveglia && (
        <p className="mt-3 rounded-btn bg-surface-2 px-3 py-2.5 text-body-sm text-app flex items-start gap-2">
          <AlarmClock className="w-4 h-4 mt-0.5 shrink-0 text-forest-300" aria-hidden="true" />
          {TESTO_SVEGLIA_TELEFONO}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3">
        <Button
          size="sm"
          variant="secondary"
          icon={<Check className="w-4 h-4" aria-hidden="true" />}
          loading={salvando === 'fatto'}
          disabled={stato.fattoOggi}
          onClick={() => manda('fatto', { fatto: true })}
        >
          Fatto oggi
        </Button>
        <button
          type="button"
          onClick={() => manda('notifiche', { notifiche: !stato.notifiche })}
          disabled={salvando === 'notifiche'}
          className="tap ml-auto inline-flex items-center gap-1.5 text-caption text-muted"
          aria-label={stato.notifiche ? 'Spegni i promemoria dell’esercizio' : 'Accendi i promemoria dell’esercizio'}
        >
          {stato.notifiche ? <Bell className="w-4 h-4" aria-hidden="true" /> : <BellOff className="w-4 h-4" aria-hidden="true" />}
          {stato.notifiche ? 'Promemoria attivi' : 'Promemoria spenti'}
        </button>
      </div>
      {errore && <p className="mt-2 text-caption text-danger">{errore}</p>}
    </Card>
  );

  // Home a riquadri (8/11): un riquadro piccolo con «N/7»; toccato apre il testo intero, «Fatto oggi» e i promemoria
  if (variante === 'riquadro') {
    return (
      <>
        <Riquadro alto onClick={() => { setAperto(true); setFoglio(true); }} icona={<Eye />} etichetta="Presenza" titolo="Esercizio della settimana"
          valore={<>{Math.min(stato.giorni, 7)}<span className="text-body text-muted">/7</span></>} />
        <Sheet open={foglio} onClose={() => setFoglio(false)} title="Esercizio della settimana">
          {card}
        </Sheet>
      </>
    );
  }
  return card;
}
