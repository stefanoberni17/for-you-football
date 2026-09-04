/**
 * Vista unificata di un esercizio per la UI (player, anteprima seduta):
 * risolve gli id del catalogo v1 (trainingCatalog) e v2 (trainingCatalogV2).
 * Client-safe (nessun import server).
 */
import { esercizioById } from './trainingCatalog';
import { esercizioV2ById } from './trainingCatalogV2';

export interface EsercizioView {
  id: string;
  nome: string;
  unita: string;          // reps | secondi | minuti | metri
  perLato: boolean;
  videoUrl?: string;
  videoMp4: boolean;      // true = file .mp4 diretto (libreria Everfit), non YouTube
  descrizione?: string;
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
    return { id: v2.id, nome: v2.nome, unita: v2.unita, perLato: v2.perLato === true, videoUrl: v2.videoUrl, videoMp4: mp4, descrizione: v2.note, v2: true };
  }
  return undefined;
}

export function unitaLabel(unita: string, quantita: number): string {
  if (unita === 'secondi') return `${quantita}"`;
  if (unita === 'minuti') return `${quantita}'`;
  if (unita === 'metri') return `${quantita} m`;
  return `${quantita} reps`;
}
