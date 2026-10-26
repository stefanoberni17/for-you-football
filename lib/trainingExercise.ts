/**
 * Vista unificata di un esercizio per la UI (player, anteprima seduta):
 * risolve gli id del catalogo v1 (trainingCatalog) e v2 (trainingCatalogV2).
 * Client-safe (nessun import server).
 */
import { esercizioById, testById } from './trainingCatalog';
import { esercizioV2ById, type SchedaEsercizio } from './trainingCatalogV2';
import { testV2ById } from './trainingTestsV2';

export interface EsercizioView {
  id: string;
  nome: string;
  unita: string;          // reps | secondi | minuti | metri
  perLato: boolean;
  sensazioni?: string[];  // opzioni "dove l'hai sentito?" a fine esercizio
  videoUrl?: string;
  videoMp4: boolean;      // true = file .mp4 diretto (libreria Everfit), non YouTube
  videoSchermoUrl?: string; // video dei segnali da mettere sul telefono davanti ai cinesini (visione e reattività; punto 20, 20/10)
  descrizione?: string;
  scheda?: SchedaEsercizio; // scheda di esecuzione (9/10): quando c'è, il player la mostra al posto di descrizione
  note?: string;
  v2: boolean;
}

export function esercizioAny(id: string): EsercizioView | undefined {
  const v1 = esercizioById(id);
  if (v1) {
    return { id: v1.id, nome: v1.nome, unita: v1.unita, perLato: v1.perLato === true, videoUrl: v1.videoUrl, videoMp4: false, descrizione: v1.descrizione, note: v1.note, v2: false };
  }
  const v2 = esercizioV2ById(id);
  if (v2) {
    const mp4 = !!v2.videoUrl && /\.mp4(\?|$)/i.test(v2.videoUrl);
    return { id: v2.id, nome: v2.nome, unita: v2.unita, perLato: v2.perLato === true, videoUrl: v2.videoUrl, videoMp4: mp4, videoSchermoUrl: v2.videoSchermoUrl, descrizione: v2.descrizione ?? v2.note, scheda: v2.scheda, note: v2.descrizione ? v2.note : undefined, sensazioni: v2.sensazioni, v2: true };
  }
  // Ri-test in seduta (26/10): un item può essere un TEST (palleggi, muro, tiri, wall sit…): nome e protocollo dal test
  const t1 = testById(id);
  if (t1) {
    return { id: t1.id, nome: t1.nome, unita: t1.unita, perLato: false, videoMp4: false, descrizione: [t1.protocollo, ...(t1.passi ?? []).map((p, i) => `${i + 1}. ${p}`)].join(' '), v2: false };
  }
  const t2 = testV2ById(id);
  if (t2) {
    const mp4 = !!t2.videoUrl && /\.mp4(\?|$)/i.test(t2.videoUrl);
    return { id: t2.id, nome: t2.nome, unita: t2.unita, perLato: false, videoUrl: t2.videoUrl, videoMp4: mp4, descrizione: [t2.protocollo, ...(t2.passi ?? []).map((p, i) => `${i + 1}. ${p}`)].join(' '), v2: true };
  }
  return undefined;
}

/** Unità con cui fare un item: quella del blocco di Ste se diversa dal catalogo (EMOM a tempo), altrimenti quella dell'esercizio. */
export function unitaItem(it: { esercizio_id: string; unita?: string }, ex?: { unita: string } | null): string {
  return it.unita ?? ex?.unita ?? esercizioAny(it.esercizio_id)?.unita ?? 'reps';
}

export function unitaLabel(unita: string, quantita: number): string {
  if (unita === 'secondi') return `${quantita}"`;
  if (unita === 'minuti') return `${quantita}'`;
  if (unita === 'metri') return `${quantita} m`;
  return `${quantita} reps`;
}
