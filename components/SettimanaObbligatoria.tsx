'use client';

import { useState } from 'react';
import { DAY_SHORT_NAMES } from '@/lib/constants';
import { riassuntoSettimana, type PropostaSettimana } from '@/lib/settimanaCalendario';
import { Button, Sheet } from '@/components/ui';
import { GiornoSegno, LegendaSettimana } from '@/components/SettimanaVista';
import SaveErrorBanner from './SaveErrorBanner';

/**
 * La settimana con la squadra, obbligatoria (10/11, Ste: «obbligatorio il setup della settimana con la squadra e un
 * pulsante "come la scorsa" per comodità»). Alla prima apertura della settimana, finché il ragazzo non risponde: il
 * foglio non si chiude. Tre strade: «Come la scorsa» (un tocco), «Cambia i giorni» (l'editor), «Niente squadra né
 * partita» (una risposta vera: Home, Corpo e Coach non usano più i giorni del setup al suo posto).
 */
export default function SettimanaObbligatoria({ proposta, periodo, onSalva, onCambia }: {
  proposta: PropostaSettimana | null;
  periodo?: string;                       // «Dal 10 al 16 novembre»
  onSalva: (trainingDays: number[], matchDays: number[]) => Promise<void>;
  onCambia: () => void;
}) {
  const [salvando, setSalvando] = useState<null | 'proposta' | 'niente'>(null);
  const [errore, setErrore] = useState<null | 'proposta' | 'niente'>(null);

  const salva = async (cosa: 'proposta' | 'niente') => {
    if (salvando) return;
    setSalvando(cosa); setErrore(null);
    try {
      if (cosa === 'proposta' && proposta) await onSalva(proposta.trainingDays, proposta.matchDays);
      else await onSalva([], []);
    } catch {
      setErrore(cosa);
    } finally {
      setSalvando(null);
    }
  };

  return (
    <Sheet
      open
      title="Questa settimana"
      subtitle={periodo}
      ariaLabel="Questa settimana: squadra e partita"
      footer={
        <>
          {errore && <SaveErrorBanner message="Non salvato. Riprova." onRetry={() => salva(errore)} />}
          {proposta ? (
            <Button variant="primary" size="lg" fullWidth loading={salvando === 'proposta'} onClick={() => salva('proposta')}>
              {proposta.fonte === 'scorsa' ? 'Come la scorsa settimana' : 'Come nel mio setup'}
            </Button>
          ) : (
            <Button variant="primary" size="lg" fullWidth onClick={onCambia}>Scegli i giorni</Button>
          )}
          {proposta && <Button variant="secondary" fullWidth onClick={onCambia}>Cambia i giorni</Button>}
          <Button variant="ghost" fullWidth loading={salvando === 'niente'} onClick={() => salva('niente')}>
            Niente squadra né partita
          </Button>
        </>
      }
    >
      <p className="text-body text-app pt-1 mb-4">
        Quando ti alleni con la squadra e quando giochi? Home, Corpo e Coach usano questi giorni per tutta la settimana.
      </p>
      {proposta && (
        <div className="bg-surface-2 rounded-card p-3 border border-divider">
          <p className="text-label font-semibold text-muted mb-2">
            {proposta.fonte === 'scorsa' ? 'La scorsa settimana' : 'Il tuo setup del Corpo'}
          </p>
          <div className="grid grid-cols-7 gap-1" aria-hidden>
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <div key={d} className="flex flex-col items-center gap-1">
                <span className="text-caption text-faint">{DAY_SHORT_NAMES[d]}</span>
                <GiornoSegno squadra={proposta.trainingDays.includes(d)} partita={proposta.matchDays.includes(d)} />
              </div>
            ))}
          </div>
          <p className="text-body-sm text-app mt-3">{riassuntoSettimana(proposta)}</p>
          <LegendaSettimana className="mt-2" conSeduta={false} />
        </div>
      )}
    </Sheet>
  );
}
