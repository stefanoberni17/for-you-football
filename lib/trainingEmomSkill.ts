/**
 * EMOM Skill — costruito sulle scale skill dell'atleta (Ste, 17/9/2026).
 *
 * "L'EMOM serve a migliorare le skill con poche reps e 1 minuto di recupero. Va fatto con la
 * skill successiva all'ultima testata (o con quella con cui non è arrivato al tetto): io farei
 * proprio con quella dopo, visto che sono poche reps."
 *
 * Per ogni catena (spinta, tirata, core, lombari) si prende l'esercizio del gradino DOPO
 * l'ultimo testato (scala skill o test base); in cima alla scala resta l'ultimo. Ne esce un
 * blocco virtuale `emom-skill` che il planner v2 vede accanto ai blocchi di Ste: 3 giri, un
 * minuto per esercizio, 3 reps di qualità (le tenute 20"), il resto del minuto è recupero.
 * Si ricostruisce a ogni piano dai risultati correnti: sale da solo quando l'atleta ritesta.
 */
import { catenaByArea, type AreaForza, type TrainingExercise } from './trainingCatalog';
import { LADDER_AREE, ladderForArea, type TestResultRow } from './trainingEngine';
import type { Blocco, BloccoItem } from './trainingBlocks';

export const EMOM_SKILL_ID = 'emom-skill';
export const EMOM_SKILL_GIRI = 3;
export const EMOM_SKILL_REPS = 3;        // poche reps di qualità (max 3-4)
export const EMOM_SKILL_TENUTA_SEC = 20; // tenute: pochi secondi puliti, non a cedimento

/** Esercizio del gradino dopo l'ultimo testato della catena (null = catena mai testata). */
export function skillSuccessiva(results: TestResultRow[], area: AreaForza): TrainingExercise | null {
  const l = ladderForArea(results, area);
  if (!l) return null;
  const catena = catenaByArea(area);
  const dopo = catena.filter((e) => e.gradino > l.gradinoEsecuzione).sort((a, b) => a.gradino - b.gradino)[0];
  return dopo ?? catena.find((e) => e.gradino === l.gradinoEsecuzione) ?? null;
}

export function costruisciEmomSkill(results: TestResultRow[], opts: { hasSbarra: boolean }): Blocco | null {
  const items: BloccoItem[] = [];
  const qualitaSet: Partial<Record<Blocco['qualita'], number>> = {};
  for (const area of LADDER_AREE) {
    if (area === 'tirata' && !opts.hasSbarra) continue;
    const e = skillSuccessiva(results, area);
    if (!e) continue;
    const tenuta = e.unita === 'secondi';
    items.push({
      esercizio_id: e.id, nomeEverfit: e.nome, serie: EMOM_SKILL_GIRI,
      quantita: tenuta ? EMOM_SKILL_TENUTA_SEC : EMOM_SKILL_REPS, unita: tenuta ? 'secondi' : 'reps',
      recupero_sec: 0, schema: 'emom', emomGruppo: EMOM_SKILL_ID, ...(e.perLato ? { perLato: true } : {}),
      nota: `Gradino ${e.gradino} della scala ${area}: il passo dopo l'ultimo che hai testato.`,
    });
    const q = area === 'spinta' || area === 'tirata' ? 'forza-parte-alta' : 'core';
    qualitaSet[q] = (qualitaSet[q] ?? 0) + EMOM_SKILL_GIRI;
  }
  if (items.length < 2) return null; // con una sola scala testata non è un circuito
  const minuti = items.reduce((a, it) => a + it.serie, 0);
  return {
    id: EMOM_SKILL_ID, nome: 'EMOM Skill', nomeEverfit: 'EMOM Skill', famiglia: 'EMOM Skill',
    qualita: 'forza-parte-alta', qualitaSet, livello: null, progressione: null, variante: 'full',
    durataMin: minuti + 3, attrezzatura: items.some((it) => it.esercizio_id?.startsWith('pull-')) ? ['sbarra'] : [],
    inCoppia: false, items, completo: true, mancanti: [], tags: ['skill'],
    descrizione: `Costruito sui tuoi gradini: ${items.map((it) => it.nomeEverfit).join(' · ')}. ${EMOM_SKILL_GIRI} giri, un minuto per esercizio.`,
  };
}

/** Riga per il prompt del planner: cosa c'è dentro e da dove viene. */
export function emomSkillTesto(b: Blocco): string {
  return `${b.id} = ${b.nome} (~${b.durataMin}', costruito sui gradini dell'atleta): ${b.items.map((it) => `${it.nomeEverfit} ${it.serie}×${it.quantita}${it.unita === 'secondi' ? '"' : ' reps'}/min`).join(' · ')}`;
}
