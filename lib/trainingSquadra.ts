/**
 * FYF Training — "Gli allenamenti con la squadra" (facoltativo, Ste 14/9).
 *
 * L'atleta può descrivere, per ogni giorno di allenamento con la squadra, quanto è
 * impegnativo (sforzo 1-10) e su cosa lavora il mister (resistenza, forza, rapidità…).
 * Serve al preparatore AI per bilanciare la settimana e alla stima del carico squadra
 * (prima: 90' × RPE 6 fisso per ogni allenamento).
 *
 * Salvato in profiles.training_squadra (JSONB, migration 023) per giorno della settimana
 * (1=Lun … 7=Dom): è un'abitudine stabile, il calendario invece si svuota ogni lunedì.
 * Non è mai un divieto: "non bloccherei l'allenamento il giorno dopo" (Ste).
 */

export const SQUADRA_QUALITA = [
  { id: 'resistenza', label: 'Resistenza' },
  { id: 'forza', label: 'Forza in campo' },
  { id: 'velocita', label: 'Rapidità e velocità' },
  { id: 'tecnica', label: 'Tecnica' },
  { id: 'tattica', label: 'Tattica / partitella' },
  { id: 'prevenzione', label: 'Prevenzione / core' },
] as const;
export type SquadraQualitaId = (typeof SQUADRA_QUALITA)[number]['id'];

export interface SquadraGiorno {
  rpe: number | null;          // sforzo stimato 1-10 (null = non indicato)
  qualita: SquadraQualitaId[]; // su cosa lavora la squadra quel giorno
}
/** Chiave = giorno della settimana 1-7 */
export type SquadraSettimana = Record<number, SquadraGiorno>;

const qualitaLabel = (id: SquadraQualitaId) => SQUADRA_QUALITA.find((q) => q.id === id)!.label;

/** Normalizza il JSONB (o un body client): solo giorni 1-7, sforzo intero 1-10, qualità note. */
export function parseSquadra(raw: unknown): SquadraSettimana {
  const out: SquadraSettimana = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const giorno = Number(k);
    if (!Number.isInteger(giorno) || giorno < 1 || giorno > 7 || !v || typeof v !== 'object') continue;
    const o = v as { rpe?: unknown; qualita?: unknown };
    const rpeNum = o.rpe == null ? null : Number(o.rpe);
    const rpe = rpeNum !== null && Number.isInteger(rpeNum) && rpeNum >= 1 && rpeNum <= 10 ? rpeNum : null;
    const qualita = Array.isArray(o.qualita)
      ? [...new Set(o.qualita.filter((q): q is SquadraQualitaId => SQUADRA_QUALITA.some((s) => s.id === q)))]
      : [];
    if (rpe === null && qualita.length === 0) continue;
    out[giorno] = { rpe, qualita };
  }
  return out;
}

export function squadraVuota(s: SquadraSettimana): boolean {
  return Object.keys(s).length === 0;
}

/** "lunedì (sforzo 7/10: resistenza), martedì (sforzo 8/10: forza in campo, resistenza)" — per i prompt. */
export function squadraTesto(trainingDays: number[], squadra: SquadraSettimana, dayNames: Record<number, string>): string {
  if (!trainingDays.length) return 'nessuno';
  return trainingDays.map((d) => {
    const g = squadra[d];
    if (!g) return dayNames[d];
    const parti = [g.rpe !== null ? `sforzo ${g.rpe}/10` : '', g.qualita.length ? g.qualita.map(qualitaLabel).join(', ') : ''].filter(Boolean);
    return parti.length ? `${dayNames[d]} (${parti.join(': ')})` : dayNames[d];
  }).join(', ');
}
