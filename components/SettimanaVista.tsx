'use client';

import Link from 'next/link';
import { ChevronRight, Dumbbell } from 'lucide-react';
import { DAY_NAMES } from '@/lib/constants';
import { durataLabel } from '@/lib/trainingLabels';
import { Badge, Button, Sheet } from '@/components/ui';

/**
 * La tua settimana (9/11, fase 1a della revisione dell'esperienza): la settimana in SOLA LETTURA, con i colori di Ste
 * accompagnati da simboli ed etichette (il colore da solo non basta: arancio e rosso si confondono al sole e per chi
 * non distingue bene i colori). Squadra giallo-arancio con la S, partita rosso con la P, seduta dell'app blu con il
 * manubrio (contorno = in programma, pieno = fatta, tratteggiato = saltata), pallino verde = pratica del percorso fatta.
 * Un giorno con due cose ha il riquadro diviso a metà. La modifica di squadra e partita è un passo a parte.
 */

export type StatoSedutaVista = 'fatta' | 'oggi' | 'recuperabile' | 'saltata' | 'futura';

export type GiornoSettimana = {
  giorno: number;              // 1 = lunedì … 7 = domenica
  data: string;                // AAAA-MM-GG
  squadra: boolean;
  partita: boolean;
  seduta?: { titolo: string; durataMin: number; stato: StatoSedutaVista } | null;
  percorso: boolean;           // pratica del percorso fatta quel giorno
};

type Parte = 'partita' | 'squadra' | 'seduta';

const segnoSeduta = (stato: StatoSedutaVista | undefined) =>
  stato === 'fatta' ? 'bg-forest-500 text-white'
    : stato === 'saltata' ? 'border border-dashed border-forest-400/50 text-forest-400/60'
      : 'border-2 border-forest-400 text-forest-300';

/** Il riquadro di un giorno: pieno, o diviso in parti uguali quando le cose sono due (o tre). */
export function GiornoSegno({ squadra, partita, seduta, piccolo = false }: {
  squadra: boolean; partita: boolean; seduta?: StatoSedutaVista | null; piccolo?: boolean;
}) {
  const parti: Parte[] = [...(partita ? ['partita' as const] : []), ...(squadra ? ['squadra' as const] : []), ...(seduta ? ['seduta' as const] : [])];
  const dim = piccolo ? 'h-8 w-full rounded-md' : 'h-12 w-12 rounded-btn';
  if (!parti.length) return <span aria-hidden className={`${dim} block bg-app-bg/70 border border-divider`} />;
  const conSimbolo = !piccolo || parti.length < 3;
  return (
    <span aria-hidden className={`${dim} flex flex-col overflow-hidden gap-px`}>
      {parti.map((p) => (
        <span key={p}
          className={`flex flex-1 min-h-0 items-center justify-center font-bold leading-none ${piccolo ? 'text-overline' : 'text-label'} ${
            p === 'partita' ? 'bg-danger text-app-bg' : p === 'squadra' ? 'bg-warning text-app-bg' : `parte-corpo ${segnoSeduta(seduta ?? undefined)}`
          } ${parti.length === 1 ? '' : 'first:rounded-t-[inherit] last:rounded-b-[inherit]'}`}>
          {conSimbolo && (p === 'partita' ? 'P' : p === 'squadra' ? 'S' : <Dumbbell size={piccolo ? 11 : 15} strokeWidth={2.5} />)}
        </span>
      ))}
    </span>
  );
}

/** La legenda, una riga sola che va a capo. */
export function LegendaSettimana({ conSeduta = true, conPercorso = false, className = '' }: { conSeduta?: boolean; conPercorso?: boolean; className?: string }) {
  const voce = (segno: React.ReactNode, testo: string) => (
    <span className="inline-flex items-center gap-1.5 text-caption text-muted">
      <span className="h-5 w-5 shrink-0 [&>span]:h-5 [&>span]:w-5 [&>span]:rounded-[6px]">{segno}</span>{testo}
    </span>
  );
  return (
    <div className={`flex flex-wrap gap-x-3 gap-y-1.5 ${className}`}>
      {voce(<GiornoSegno piccolo squadra partita={false} />, 'Squadra')}
      {voce(<GiornoSegno piccolo squadra={false} partita />, 'Partita')}
      {conSeduta && voce(<GiornoSegno piccolo squadra={false} partita={false} seduta="futura" />, 'Seduta in programma')}
      {conSeduta && voce(<GiornoSegno piccolo squadra={false} partita={false} seduta="fatta" />, 'Seduta fatta')}
      {conPercorso && (
        <span className="inline-flex items-center gap-1.5 text-caption text-muted">
          <span aria-hidden className="h-2 w-2 rounded-full bg-forest-400" />Percorso fatto
        </span>
      )}
    </div>
  );
}

const STATO_TESTO: Record<StatoSedutaVista, string> = {
  fatta: 'fatta', oggi: 'oggi', recuperabile: 'da recuperare', saltata: 'saltata', futura: 'in programma',
};

const dataBreve = (ymd: string) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString('it-IT', { day: 'numeric', timeZone: 'UTC' });
const dataMese = (ymd: string) => new Date(`${ymd}T12:00:00Z`).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', timeZone: 'UTC' });

/** Le righe testuali di un giorno, come le legge anche lo screen reader. */
export function righeGiorno(g: GiornoSettimana, o: { squadraDaSetup?: boolean; partitaDaSetup?: boolean } = {}): string[] {
  const r: string[] = [];
  if (g.partita) r.push(o.partitaDaSetup ? 'Partita (dal tuo setup)' : 'Partita');
  if (g.squadra) r.push(o.squadraDaSetup ? 'Allenamento con la squadra (dal tuo setup)' : 'Allenamento con la squadra');
  if (g.seduta) r.push(`Seduta: ${g.seduta.titolo} · ~${durataLabel(g.seduta.durataMin)} · ${STATO_TESTO[g.seduta.stato]}`);
  if (g.percorso) r.push('Percorso: pratica fatta');
  if (!r.length) r.push('Niente in programma');
  return r;
}

export default function SettimanaVista({
  giorni, oggiDow, onModifica, onClose, conCorpo, sedutaHref, squadraDaSetup, partitaDaSetup,
}: {
  giorni: GiornoSettimana[];
  oggiDow: number;
  onModifica: () => void;
  onClose: () => void;
  conCorpo: boolean;
  /** Link alla pagina della seduta (sola lettura anche quella: aprirla non avvia niente). Null = nessun link. */
  sedutaHref?: (giorno: number) => string | null;
  squadraDaSetup?: boolean;
  partitaDaSetup?: boolean;
}) {
  const primo = giorni[0]?.data, ultimo = giorni[giorni.length - 1]?.data;
  return (
    <Sheet
      open
      onClose={onClose}
      closeLabel="Chiudi"
      title="La tua settimana"
      subtitle={primo && ultimo ? `Dal ${dataBreve(primo)} al ${dataMese(ultimo)}` : undefined}
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onModifica}>Modifica squadra e partita</Button>
          <Button variant="ghost" fullWidth onClick={onClose}>Chiudi</Button>
        </>
      }
    >
      <LegendaSettimana conSeduta={conCorpo} conPercorso className="mb-4 pt-1" />
      {(squadraDaSetup || partitaDaSetup) && (
        <p className="text-body-sm text-muted mb-3">
          {squadraDaSetup && partitaDaSetup ? 'Squadra e partita vengono' : squadraDaSetup ? 'Gli allenamenti con la squadra vengono' : 'La partita viene'} dal tuo setup del Corpo: se questa settimana è diversa, cambiala con «Modifica squadra e partita».
        </p>
      )}
      <ol className="space-y-1.5" aria-label="I sette giorni">
        {giorni.map((g) => {
          const righe = righeGiorno(g, { squadraDaSetup, partitaDaSetup });
          const href = g.seduta && sedutaHref ? sedutaHref(g.giorno) : null;
          const oggi = g.giorno === oggiDow;
          const corpo = (
            <>
              <GiornoSegno squadra={g.squadra} partita={g.partita} seduta={g.seduta?.stato ?? null} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-body font-semibold text-app">{DAY_NAMES[g.giorno]} {dataBreve(g.data)}</span>
                  {oggi && <Badge tone="accent">Oggi</Badge>}
                  {g.percorso && <span aria-hidden className="h-2 w-2 rounded-full bg-forest-400" />}
                </span>
                {righe.map((t) => <span key={t} className="block text-body-sm text-muted leading-snug">{t}</span>)}
              </span>
              {href && <ChevronRight size={18} className="shrink-0 text-muted" aria-hidden />}
            </>
          );
          const cls = `flex items-center gap-3 rounded-card px-3 py-2.5 ${oggi ? 'bg-surface-2' : ''}`;
          return (
            <li key={g.giorno} aria-label={`${DAY_NAMES[g.giorno]} ${dataBreve(g.data)}${oggi ? ', oggi' : ''}: ${righe.join('; ')}`}>
              {href
                ? <Link href={href} className={`${cls} hover:bg-surface-3 transition-colors`}>{corpo}</Link>
                : <div className={cls}>{corpo}</div>}
            </li>
          );
        })}
      </ol>
    </Sheet>
  );
}

/** Per la riga «Percorso 3 di 7 · Sedute 1 di 3» e l'etichetta del riquadro in Home. */
export function riassuntoSettimana(giorni: GiornoSettimana[], percorsoFatti: number, totPercorso: number): { breve: string; esteso: string } {
  const sedute = giorni.filter((g) => g.seduta);
  const fatte = sedute.filter((g) => g.seduta!.stato === 'fatta').length;
  return sedute.length
    ? { breve: `Percorso ${percorsoFatti}/${totPercorso} · Sedute ${fatte}/${sedute.length}`, esteso: `Percorso ${percorsoFatti} giorni su ${totPercorso}, sedute ${fatte} su ${sedute.length}` }
    : { breve: `Percorso ${percorsoFatti}/${totPercorso}`, esteso: `Percorso ${percorsoFatti} giorni su ${totPercorso}` };
}

