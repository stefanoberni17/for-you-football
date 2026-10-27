/**
 * Il piano della settimana COME LO VEDE IL RAGAZZO (27/10): gli strati che `/api/training/state` applica alla
 * lettura sopra il piano salvato, in un posto solo e in un ordine solo. Il piano salvato non cambia mai.
 *
 * Prima ogni strato era scritto nella route e nessun test li provava insieme: una stessa seduta poteva
 * prendere il resoconto (serie ×0,7) e poi il dolore (serie ×0,7 di nuovo), un esercizio della zona
 * dolorante poteva salire di un passo (M5) per poi essere ridotto, e una serie test al massimo poteva
 * finire nel giorno alleggerito dopo una partita dura o sulla zona che fa male.
 *
 * Ordine e regole:
 *   1. resoconti squadra e partita (`applicaResoconti`): serie facoltative, giorni più leggeri, recupero
 *   2. dolore e limitazioni (`riduciPerDolore`): la zona segnalata e quelle del setup; un item già alleggerito
 *      dal resoconto non perde altre serie (vale la riduzione più forte), solo i kg
 *   3. aumenti nella settimana (M5, `aumentiNellaSettimana`): mai sugli esercizi ridotti per dolore o limitazione
 *   4. ri-test in seduta (`inserisciSerieTest`), solo nelle settimane di ri-test: mai nei giorni alleggeriti dal
 *      resoconto, mai sul distretto della zona dolorante, mai un massimale con i kg sul distretto di una limitazione
 */
import type { PlanSession, WeekPlan } from './trainingEngine';
import type { SetLogRow } from './trainingAdapt';
import { applicaResoconti, type Resoconto } from './trainingResoconto';
import { aumentiNellaSettimana } from './trainingAumenti';
import { inserisciSerieTest, type SerieTest } from './trainingRitest';
import { distrettiZona, doloreAttivo, riduciPerDolore, type Dolore, type Limitazioni } from './trainingDolore';
import { distrettoEsercizio, type Distretto } from './trainingSquilibri';
import type { SquadraSettimana } from './trainingSquadra';

export interface OpzioniLettura {
  weekStart: string;
  oggi: string;
  oggiDow: number;
  fatteGiorni: ReadonlySet<number>;
  resoconti: readonly Resoconto[];
  squadra?: SquadraSettimana | null;
  logs: readonly SetLogRow[];
  votiSedute?: ReadonlyMap<number, number | null>;
  dolore?: Dolore | null;
  limitazioni?: Limitazioni | null;
  /** Solo nelle settimane di ri-test: le serie test candidate e i giorni partita. */
  ritest?: { matchDays: readonly number[]; candidati: { forza: SerieTest[]; palestra: SerieTest[]; campo: SerieTest[] } } | null;
}

export interface EsitoLettura {
  plan: WeekPlan;
  ritest: ReturnType<typeof inserisciSerieTest> | null;
}

/** Un giorno alleggerito dal resoconto (fatica alta, recupero dopo la partita): niente serie test lì. */
export function giornoAlleggerito(s: PlanSession): boolean {
  return s.tipo === 'recupero' || !!s.proposte?.some((p) => p.tipo === 'leggera' || p.tipo === 'yoga-recupero');
}

/** I distretti da non testare: quello della zona dolorante (tutti i test) e quelli delle limitazioni (solo i massimali). */
function distrettiDaEvitare(o: OpzioniLettura): { dolore: Set<Distretto>; limitazioni: Set<Distretto> } {
  const dolore = new Set<Distretto>(doloreAttivo(o.dolore, o.oggi) ? distrettiZona(o.dolore.zona) : []);
  const limitazioni = new Set<Distretto>((o.limitazioni?.zone ?? []).flatMap((z) => distrettiZona(z)));
  return { dolore, limitazioni };
}

export function pianoPerLettura(plan: WeekPlan, o: OpzioniLettura): EsitoLettura {
  // 1. resoconti
  let p = applicaResoconti(plan, { weekStart: o.weekStart, oggi: o.oggi, resoconti: o.resoconti, squadra: o.squadra, fatteGiorni: o.fatteGiorni }).plan;
  // 2. dolore e limitazioni
  const r = riduciPerDolore(p, { dolore: o.dolore, limitazioni: o.limitazioni, oggi: o.oggi, oggiDow: o.oggiDow, fatteGiorni: o.fatteGiorni });
  if (r.ridotti) p = r.plan;
  // 3. aumenti nella settimana (salta da solo gli item 'dolore' e 'limitazione')
  p = aumentiNellaSettimana(p, { weekStart: o.weekStart, oggi: o.oggi, logs: o.logs, fatteGiorni: o.fatteGiorni, votiSedute: o.votiSedute }).plan;
  // 4. ri-test in seduta
  let ritest: EsitoLettura['ritest'] = null;
  if (o.ritest) {
    const evita = distrettiDaEvitare(o);
    const filtra = (lista: SerieTest[]) => lista.filter((t) => {
      const d = distrettoEsercizio(t.esercizio_id);
      if (d && evita.dolore.has(d)) return false;
      if (d && t.tipo === 'lift' && evita.limitazioni.has(d)) return false;
      return true;
    });
    ritest = inserisciSerieTest(p, {
      weekStart: o.weekStart, oggi: o.oggi, fatteGiorni: o.fatteGiorni, matchDays: o.ritest.matchDays,
      candidati: { forza: filtra(o.ritest.candidati.forza), palestra: filtra(o.ritest.candidati.palestra), campo: filtra(o.ritest.candidati.campo) },
      giorniEsclusi: new Set(p.sedute.filter(giornoAlleggerito).map((s) => s.giorno)),
    });
    p = ritest.plan;
  }
  return { plan: p, ritest };
}
