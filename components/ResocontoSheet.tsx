'use client';

import { useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { DAY_NAMES } from '@/lib/constants';
import { SQUADRA_QUALITA, type SquadraQualitaId } from '@/lib/trainingSquadra';
import { ZONE_FASCIA } from '@/lib/trainingFascia';
import { dowDi, type Stanchezza, type Testa, type TipoResoconto } from '@/lib/trainingResoconto';
import { Button, Chip, Sheet, Textarea } from '@/components/ui';
import RpeScale from '@/components/ui/RpeScale';

/**
 * "Com'è andata?" dopo l'allenamento con la squadra o la partita (campo-da-fare 17, Ste 14/10; soglie 19/10).
 * Parte obbligatoria breve (fatica, minuti, cosa si è fatto / stanchezza, fastidio), poi i dettagli in un <details>
 * (testa per il Coach, voti tecnica e fisico). POST /api/training/resoconto; "Salta" resta sul dispositivo.
 */
const DURATE_SQUADRA = [60, 75, 90, 105, 120];
const MINUTI_PARTITA = [0, 15, 30, 45, 60, 90];
const STANCHEZZE: { id: Stanchezza; label: string }[] = [{ id: 'fresco', label: 'Fresco' }, { id: 'normale', label: 'Normale' }, { id: 'cotto', label: 'Cotto' }];
const TESTE: { id: Testa; label: string }[] = [{ id: 'bene', label: 'Bene' }, { id: 'alti_bassi', label: 'Alti e bassi' }, { id: 'fatica', label: 'Fatica' }];

export default function ResocontoSheet({ open, data, tipo, onClose, onSaved, onSkip }: {
  open: boolean; data: string; tipo: TipoResoconto; onClose: () => void; onSaved: () => void; onSkip: () => void;
}) {
  const [rpe, setRpe] = useState<number | null>(null);
  const [durata, setDurata] = useState<number | null>(null);
  const [minutiLiberi, setMinutiLiberi] = useState('');
  const [qualita, setQualita] = useState<SquadraQualitaId[]>([]);
  const [stanchezza, setStanchezza] = useState<Stanchezza | null>(null);
  const [fastidio, setFastidio] = useState<boolean | null>(null);
  const [zona, setZona] = useState<string | null>(null);
  const [testa, setTesta] = useState<Testa | null>(null);
  const [testaNota, setTestaNota] = useState('');
  const [votoTecnica, setVotoTecnica] = useState<number | null>(null);
  const [votoFisico, setVotoFisico] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const partita = tipo === 'partita';
  const giorno = DAY_NAMES[dowDi(data)] ?? data;
  const minuti = durata ?? (minutiLiberi !== '' && Number.isFinite(Number(minutiLiberi)) ? Math.round(Number(minutiLiberi)) : null);
  const pronto = rpe !== null && (partita ? minuti !== null : true) && (fastidio !== true || !!zona);

  const salva = async () => {
    if (!pronto || saving) return;
    setSaving(true); setErrore(null);
    try {
      const res = await authFetch('/api/training/resoconto', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data, tipo, rpe, durata_min: minuti, qualita: partita ? undefined : qualita, stanchezza: partita ? stanchezza : undefined,
          fastidio_zona: fastidio ? zona : null, testa, testa_nota: testaNota.trim() || null,
          voti: votoTecnica || votoFisico ? { tecnica: votoTecnica ? { generale: votoTecnica } : undefined, fisico: votoFisico ? { generale: votoFisico } : undefined } : null,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setErrore(j.error || 'Non sono riuscito a salvare'); return; }
      if (j.skipped) { setErrore('Il resoconto non è ancora attivo su questo account (manca la tabella): lo segno come saltato.'); onSkip(); return; }
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <Sheet open={open} onClose={saving ? undefined : onClose}
      title={partita ? `Com'è andata la partita di ${giorno.toLowerCase()}?` : `Com'è andata con la squadra ${giorno.toLowerCase()}?`}
      subtitle="30 secondi: da qui la settimana si adatta davvero."
      footer={
        <>
          {errore && <p className="text-body-sm text-warning">{errore}</p>}
          <Button size="lg" fullWidth onClick={salva} disabled={!pronto} loading={saving}>Salva</Button>
          <div className="mt-1 flex justify-center"><Button variant="ghost" size="sm" onClick={onSkip}>Salta per questa volta</Button></div>
        </>
      }
    >
      <RpeScale value={rpe} onChange={setRpe} tipo="sforzo" label="Quanta fatica hai fatto davvero?" className="mb-4" />

      <p className="text-label font-semibold text-muted mb-2">{partita ? 'Quanti minuti hai giocato?' : 'Quanto è durato?'}</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {(partita ? MINUTI_PARTITA : DURATE_SQUADRA).map((m) => (
          <Chip key={m} selected={durata === m} showCheck={false} onClick={() => { setDurata(durata === m ? null : m); setMinutiLiberi(''); }}>{m}&apos;</Chip>
        ))}
      </div>
      {partita && (
        <input type="number" inputMode="numeric" min={0} max={120} placeholder="oppure scrivi i minuti" value={minutiLiberi}
          onChange={(e) => { setMinutiLiberi(e.target.value); setDurata(null); }}
          className="w-full min-h-[48px] rounded-btn bg-surface-2 border border-divider px-3 text-body text-app mb-4" aria-label="Minuti giocati" />
      )}
      {!partita && <div className="mb-2" />}

      {partita ? (
        <>
          <p className="text-label font-semibold text-muted mb-2">Come ti senti?</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {STANCHEZZE.map((s) => <Chip key={s.id} selected={stanchezza === s.id} onClick={() => setStanchezza(stanchezza === s.id ? null : s.id)}>{s.label}</Chip>)}
          </div>
        </>
      ) : (
        <>
          <p className="text-label font-semibold text-muted mb-2">Cosa avete fatto?</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {SQUADRA_QUALITA.map((q) => (
              <Chip key={q.id} selected={qualita.includes(q.id)} onClick={() => setQualita(qualita.includes(q.id) ? qualita.filter((x) => x !== q.id) : [...qualita, q.id])}>{q.label}</Chip>
            ))}
          </div>
        </>
      )}

      <p className="text-label font-semibold text-muted mb-2">Hai sentito un fastidio?</p>
      <div className="flex flex-wrap gap-2 mb-2">
        <Chip selected={fastidio === false} onClick={() => { setFastidio(false); setZona(null); }}>No</Chip>
        <Chip selected={fastidio === true} onClick={() => setFastidio(true)}>Sì</Chip>
      </div>
      {fastidio && (
        <div className="flex flex-wrap gap-2 mb-4">
          {ZONE_FASCIA.map((z) => <Chip key={z} selected={zona === z} showCheck={false} onClick={() => setZona(zona === z ? null : z)}>{z}</Chip>)}
        </div>
      )}
      {fastidio && <p className="text-body-sm text-muted mb-4">Se il fastidio resta o peggiora, parlane con il fisioterapista o il medico: l&apos;app non fa diagnosi.</p>}

      <details className="mt-2 mb-2">
        <summary className="text-body font-semibold text-forest-300 cursor-pointer py-2 tap">Dettagli (facoltativi): testa, tecnica, fisico</summary>
        <div className="pt-2">
          <p className="text-label font-semibold text-muted mb-2">Com&apos;è andata di testa?</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {TESTE.map((t) => <Chip key={t.id} selected={testa === t.id} onClick={() => setTesta(testa === t.id ? null : t.id)}>{t.label}</Chip>)}
          </div>
          <Textarea value={testaNota} onChange={(e) => setTestaNota(e.target.value.slice(0, 200))} placeholder="Una riga, se vuoi (la legge il Coach)" rows={2} className="mb-4" />
          <RpeScale value={votoTecnica} onChange={setVotoTecnica} tipo="giudizio" label="Tecnicamente come sei andato?" ariaPrefix="Tecnica" className="mb-4" />
          <RpeScale value={votoFisico} onChange={setVotoFisico} tipo="giudizio" label="Fisicamente come sei andato?" ariaPrefix="Fisico" />
        </div>
      </details>
    </Sheet>
  );
}
