'use client';

import { useEffect, useState } from 'react';
import { AlarmClock, Bell, BellOff, Check, Eye } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { attivaPush, statoPush, type StatoPush } from '@/lib/pushClient';
import { conteggioTesto, TESTO_SVEGLIA_FINE, TESTO_SVEGLIA_INIZIO } from '@/lib/esercizioSettimana';
import type { EsercizioStato } from '@/lib/esercizioServer';
import { Button, Card } from '@/components/ui';

/**
 * L'esercizio della settimana in home (31/10): il testo da Notion, "Fatto oggi" (una spunta al giorno) e "N su 7".
 * Compare solo dopo il G1 della settimana. In W5, W6, W8 e W10 c'è la sveglia dell'app: l'orario si sceglie qui, uno
 * per settimana, e si può cambiare. In fondo l'interruttore delle notifiche dell'esercizio.
 */
export default function EsercizioSettimanaCard() {
  const [stato, setStato] = useState<EsercizioStato | null>(null);
  const [salvando, setSalvando] = useState<'fatto' | 'sveglia' | 'notifiche' | 'push' | null>(null);
  const [ora, setOra] = useState('');
  const [modificaOra, setModificaOra] = useState(false);
  const [push, setPush] = useState<StatoPush>('non_supportate');
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    setPush(statoPush());
    authFetch('/api/esercizio').then((r) => (r.ok ? r.json() : null)).then((d) => {
      const e = (d?.esercizio ?? null) as EsercizioStato | null;
      setStato(e);
      setOra(e?.sveglia.ora ?? '');
    }).catch(() => {});
  }, []);

  if (!stato?.visibile) return null;

  const manda = async (tipo: 'fatto' | 'sveglia' | 'notifiche', body: Record<string, unknown>) => {
    setSalvando(tipo);
    setErrore(null);
    try {
      const res = await authFetch('/api/esercizio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json().catch(() => ({}));
      if (d?.esercizio) { setStato(d.esercizio); setOra(d.esercizio.sveglia.ora ?? ''); }
      else if (d?.skipped) setErrore('Non riesco ancora a salvare: questa parte dell’app si sta accendendo.');
      else if (!res.ok) setErrore('Non sono riuscito a salvare. Riprova tra poco.');
      if (tipo === 'sveglia') setModificaOra(false);
    } catch {
      setErrore('Non sono riuscito a salvare. Riprova tra poco.');
    } finally {
      setSalvando(null);
    }
  };

  const chiediPush = async () => {
    setSalvando('push');
    try { await attivaPush(); } catch { /* il permesso negato si vede da statoPush */ }
    setPush(statoPush());
    setSalvando(null);
  };

  const { sveglia } = stato;
  const mostraSceltaOra = sveglia.settimana && (!sveglia.ora || modificaOra);

  return (
    <Card padding="sm">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <p className="text-overline uppercase tracking-wider font-semibold text-forest-300 flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          Esercizio della settimana
        </p>
        <span className="text-label text-muted tabular-nums" aria-label={`Fatto ${conteggioTesto(stato.giorni)} giorni`}>{conteggioTesto(stato.giorni)}</span>
      </div>
      <p className="text-body text-app leading-relaxed whitespace-pre-line">{stato.testo}</p>

      {sveglia.settimana && (
        <div className="mt-3 rounded-btn bg-surface-2 px-3 py-2.5">
          <p className="text-label font-semibold text-app flex items-center gap-1.5">
            <AlarmClock className="w-4 h-4 text-forest-300" aria-hidden="true" />
            La tua sveglia
          </p>
          {mostraSceltaOra ? (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="time"
                value={ora}
                onChange={(e) => setOra(e.target.value)}
                aria-label="Orario della sveglia"
                className="min-h-[44px] rounded-btn bg-surface border border-divider px-3 text-body text-app"
              />
              <Button size="sm" variant="secondary" loading={salvando === 'sveglia'} disabled={!ora} onClick={() => manda('sveglia', { sveglia: ora })}>
                Salva
              </Button>
              {sveglia.ora && <Button size="sm" variant="ghost" onClick={() => { setModificaOra(false); setOra(sveglia.ora ?? ''); }}>Annulla</Button>}
            </div>
          ) : (
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-body-sm text-muted">
                Ogni giorno alle <span className="text-app font-semibold tabular-nums">{sveglia.ora}</span>
                {sveglia.fineMin ? `, la fine dopo ${sveglia.fineMin} minuti` : ''}
              </p>
              <Button size="sm" variant="ghost" onClick={() => setModificaOra(true)}>Cambia</Button>
            </div>
          )}
          <p className="mt-1.5 text-caption text-faint">
            «{TESTO_SVEGLIA_INIZIO}»{sveglia.fineMin ? ` · dopo ${sveglia.fineMin}': «${TESTO_SVEGLIA_FINE}»` : ''}
          </p>
          {stato.notifiche && push !== 'attive' && (
            <p className="mt-1.5 text-caption text-warning">
              {push === 'da_chiedere' && <>La sveglia arriva come notifica. <button type="button" onClick={chiediPush} className="underline font-semibold">Attiva le notifiche</button></>}
              {push === 'negate' && 'Le notifiche sono bloccate nelle impostazioni del telefono: senza, la sveglia non arriva.'}
              {push === 'non_supportate' && 'Su iPhone le notifiche arrivano solo con l’app aggiunta alla schermata Home.'}
            </p>
          )}
        </div>
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
          aria-label={stato.notifiche ? 'Spegni le notifiche dell’esercizio' : 'Accendi le notifiche dell’esercizio'}
        >
          {stato.notifiche ? <Bell className="w-4 h-4" aria-hidden="true" /> : <BellOff className="w-4 h-4" aria-hidden="true" />}
          {stato.notifiche ? 'Notifiche attive' : 'Notifiche spente'}
        </button>
      </div>
      {errore && <p className="mt-2 text-caption text-danger">{errore}</p>}
    </Card>
  );
}
