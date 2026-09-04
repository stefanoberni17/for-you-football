/**
 * FYF Training — libreria BLOCCHI GENERATA (non modificare a mano).
 *
 * Sorgente: docs/everfit-workouts.json (203 workout Everfit, 144 titoli
 * distinti) → scripts/build-blocks.py. Alias ed euristiche nello script.
 * Blocchi completi: 131 · incompleti (esercizi non mappati): 13.
 */
import type { Blocco } from './trainingBlocks';

export const BLOCCHI: Blocco[] = [
 {
  "id": "circuito-addominali-b1",
  "nome": "Circuito addominali B1",
  "nomeEverfit": "Circuito addominali B1",
  "famiglia": "Circuito Addominali",
  "qualita": "core",
  "qualitaSet": {
   "core": 12
  },
  "livello": "B",
  "progressione": 1,
  "variante": "full",
  "durataMin": 19,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "core2-bicycle-crunch-straight-leg",
    "nomeEverfit": "Bicycle Crunch Straight Leg",
    "serie": 3,
    "quantita": 30.0,
    "unita": "reps",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "core2-reverse-crunch",
    "nomeEverfit": "Reverse Crunch",
    "serie": 3,
    "quantita": 12.0,
    "unita": "reps",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "core2-full-moon-abs",
    "nomeEverfit": "Full Moon Abs",
    "serie": 3,
    "quantita": 12.0,
    "unita": "reps",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "core2-plank-with-twist",
    "nomeEverfit": "Plank with Twist",
    "serie": 3,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 30,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "circuito-addominali-b2",
  "nome": "Circuito addominali B2",
  "nomeEverfit": "Circuito addominali B2",
  "famiglia": "Circuito Addominali",
  "qualita": "core",
  "qualitaSet": {
   "core": 12
  },
  "livello": "B",
  "progressione": 2,
  "variante": "full",
  "durataMin": 19,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "core2-bicycle-crunch-straight-leg",
    "nomeEverfit": "Bicycle Crunch Straight Leg",
    "serie": 4,
    "quantita": 30.0,
    "unita": "reps",
    "recupero_sec": 15
   },
   {
    "esercizio_id": "core2-reverse-crunch",
    "nomeEverfit": "Reverse Crunch",
    "serie": 4,
    "quantita": 12.0,
    "unita": "reps",
    "recupero_sec": 20
   },
   {
    "esercizio_id": "core2-full-moon-abs",
    "nomeEverfit": "Full Moon Abs",
    "serie": 2,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "core2-plank-with-twist",
    "nomeEverfit": "Plank with Twist",
    "serie": 2,
    "quantita": 15.0,
    "unita": "reps",
    "recupero_sec": 30,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "drbbling-a2",
  "nome": "Drbbling A2",
  "nomeEverfit": "Drbbling A2",
  "famiglia": "Drbbling",
  "qualita": "velocita",
  "qualitaSet": {
   "tecnica-passaggi": 3,
   "tecnica-conduzione": 3,
   "velocita": 6
  },
  "livello": "A",
  "progressione": 2,
  "variante": "full",
  "durataMin": 28,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 3,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "cond-6",
    "nomeEverfit": "Box Dribbling",
    "serie": 3,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 90
   },
   {
    "esercizio_id": "vel-rapidita-movimenti-attaccanti",
    "nomeEverfit": "Rapidità movimenti attaccanti",
    "serie": 3,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "vel-box-rapidita-e-tiro",
    "nomeEverfit": "BOX rapidità e Tiro",
    "serie": 3,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 120
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "dribbling-headball-a1",
  "nome": "Dribbling - Headball A1",
  "nomeEverfit": "Dribbling - Headball A1",
  "famiglia": "Dribbling - Headball",
  "qualita": "tecnica-conduzione",
  "qualitaSet": {
   "tecnica-conduzione": 6,
   "tecnica-passaggi": 2
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 35,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "cond-6",
    "nomeEverfit": "Box Dribbling",
    "serie": 2,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "nota": "A RITMO BASSO"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Box Dribbling - headball",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Box Dribbling - headball",
    "serie": 2,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 30
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Box Dribbling - headball",
    "serie": 1,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 30,
    "nota": "SOLO PIEDE DEBOLE"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Box Dribbling - headball",
    "serie": 1,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 120,
    "nota": "SOLO PIEDE DEBOLE"
   },
   {
    "esercizio_id": "cond-6",
    "nomeEverfit": "Box Dribbling",
    "serie": 3,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "nota": "A RITMO ALTO"
   },
   {
    "esercizio_id": "cond-6",
    "nomeEverfit": "Box Dribbling",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 120,
    "nota": "A RITMO ALTO"
   },
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "nota": "A RITMO MEDIO"
   },
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 120,
    "nota": "A RITMO MEDIO"
   }
  ],
  "completo": false,
  "mancanti": [
   "Box Dribbling - headball"
  ],
  "tags": []
 },
 {
  "id": "dribbling-a1",
  "nome": "Dribbling A1",
  "nomeEverfit": "Dribbling A1",
  "famiglia": "Dribbling",
  "qualita": "tecnica-conduzione",
  "qualitaSet": {
   "tecnica-passaggi": 3,
   "tecnica-conduzione": 3
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 19,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 3,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "cond-6",
    "nomeEverfit": "Box Dribbling",
    "serie": 3,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 90
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "dribbling-e-visione-a1",
  "nome": "Dribbling e visione A1",
  "nomeEverfit": "Dribbling e visione A1",
  "famiglia": "Dribbling E Visione",
  "qualita": "tecnica-visione",
  "qualitaSet": {
   "tecnica-passaggi": 3,
   "tecnica-conduzione": 3,
   "tecnica-visione": 4
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 25,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 3,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "cond-6",
    "nomeEverfit": "Box Dribbling",
    "serie": 3,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 90
   },
   {
    "esercizio_id": "tvis-dribbling-visione-e-reattivita-avanzato",
    "nomeEverfit": "Dribbling visione e reattività - Avanzato",
    "serie": 4,
    "quantita": 8.0,
    "unita": "reps",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "dribbling-e-visione-b1",
  "nome": "Dribbling e visione B1",
  "nomeEverfit": "Dribbling e visione B1",
  "famiglia": "Dribbling E Visione",
  "qualita": "tecnica-visione",
  "qualitaSet": {
   "tecnica-passaggi": 3,
   "tecnica-conduzione": 3,
   "tecnica-visione": 4
  },
  "livello": "B",
  "progressione": 1,
  "variante": "full",
  "durataMin": 25,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 3,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "cond-6",
    "nomeEverfit": "Box Dribbling",
    "serie": 3,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 90
   },
   {
    "esercizio_id": "tvis-dribbling-visione-e-reattivita-base",
    "nomeEverfit": "Dribbling visione e reattività - Base",
    "serie": 4,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "f1-forza-parte-alta-completa",
  "nome": "F1 - Forza parte Alta completa",
  "nomeEverfit": "F1 - Forza parte Alta completa",
  "famiglia": "F1 - Forza Parte Alta Completa",
  "qualita": "forza-parte-alta",
  "qualitaSet": {
   "forza-parte-alta": 12,
   "core": 12
  },
  "livello": null,
  "progressione": null,
  "variante": "full",
  "durataMin": 37,
  "attrezzatura": [
   "piccoli attrezzi"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "pull-4",
    "nomeEverfit": "Band Assisted Pull Up",
    "serie": 3,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 90
   },
   {
    "esercizio_id": "pull-2",
    "nomeEverfit": "Inverted Row",
    "serie": 3,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "push-2",
    "nomeEverfit": "Push-Up",
    "serie": 3,
    "quantita": 3.0,
    "unita": "reps",
    "recupero_sec": 90
   },
   {
    "esercizio_id": "push-1",
    "nomeEverfit": "Modified Push Up",
    "serie": 3,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "core2-isometric-bear-crawl",
    "nomeEverfit": "Isometric Bear Crawl",
    "serie": 3,
    "quantita": 45.0,
    "unita": "secondi",
    "recupero_sec": 20
   },
   {
    "esercizio_id": "core2-reverse-crunch",
    "nomeEverfit": "Reverse Crunch",
    "serie": 2,
    "quantita": 15.0,
    "unita": "reps",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "core2-plank-with-twist",
    "nomeEverfit": "Plank with Twist",
    "serie": 1,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "core2-lower-back-curl",
    "nomeEverfit": "Lower Back Curl",
    "serie": 3,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "core2-medicine-ball-russian-twist",
    "nomeEverfit": "Medicine Ball Russian Twist",
    "serie": 3,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 30,
    "carico_kg": 5.0
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "fartlek-a1",
  "nome": "Fartlek A1",
  "nomeEverfit": "Fartlek A1",
  "famiglia": "Fartlek",
  "qualita": "resistenza-aerobica",
  "qualitaSet": {
   "resistenza-aerobica": 22
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 43,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 3,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 3,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 40,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 40/40"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 40/40"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 4,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 7,
    "quantita": 15.0,
    "unita": "secondi",
    "recupero_sec": 15,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 15.0,
    "unita": "secondi",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 240,
    "schema": "interval",
    "sezione": "1/1"
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Fartlek:\n4' 1/1\n6' 40/40\n5' 30/30\n4' 15/15\n4' x 2",
  "tags": []
 },
 {
  "id": "fartlek-a2",
  "nome": "Fartlek A2",
  "nomeEverfit": "Fartlek A2",
  "famiglia": "Fartlek",
  "qualita": "resistenza-aerobica",
  "qualitaSet": {
   "resistenza-aerobica": 22
  },
  "livello": "A",
  "progressione": 2,
  "variante": "full",
  "durataMin": 43,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 3,
    "quantita": 70.0,
    "unita": "secondi",
    "recupero_sec": 50,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 70.0,
    "unita": "secondi",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 3,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 40/40"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 40/40"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 4,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 25,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 7,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 15,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 240,
    "schema": "interval",
    "sezione": "1/1"
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Fartlek:\n4' 1/1\n6' 40/40\n5' 30/30\n4' 15/15\n4' x 2",
  "tags": []
 },
 {
  "id": "fartlek-a3",
  "nome": "Fartlek A3",
  "nomeEverfit": "Fartlek A3",
  "famiglia": "Fartlek",
  "qualita": "resistenza-aerobica",
  "qualitaSet": {
   "resistenza-aerobica": 22
  },
  "livello": "A",
  "progressione": 3,
  "variante": "full",
  "durataMin": 45,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 50.0,
    "unita": "secondi",
    "recupero_sec": 50,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 40,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 2,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 40,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 50.0,
    "unita": "secondi",
    "recupero_sec": 50,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 3,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 40/40"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 40/40"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 3,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 4,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 40,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 240,
    "schema": "interval",
    "sezione": "1/1"
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Fartlek:\nPIRAMIDE 60/30\n40/20\n30/60\n20/40",
  "tags": []
 },
 {
  "id": "fartlek-a4",
  "nome": "Fartlek A4",
  "nomeEverfit": "Fartlek A4",
  "famiglia": "Fartlek",
  "qualita": "resistenza-aerobica",
  "qualitaSet": {
   "resistenza-aerobica": 33
  },
  "livello": "A",
  "progressione": 4,
  "variante": "full",
  "durataMin": 49,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 4,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 40,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 50.0,
    "unita": "secondi",
    "recupero_sec": 50,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 40,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 2,
    "quantita": 10.0,
    "unita": "secondi",
    "recupero_sec": 10,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 40,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 50.0,
    "unita": "secondi",
    "recupero_sec": 50,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 240,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 3,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 3,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 40/40"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1",
    "nota": "Fartlek 40/40"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 7,
    "quantita": 10.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 10.0,
    "unita": "secondi",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1"
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Fartlek:\nPIRAMIDE 60/30\n40/20\n30/60\n20/40",
  "tags": []
 },
 {
  "id": "fascia-e-tecnica-funzionale-a1",
  "nome": "Fascia e tecnica Funzionale A1",
  "nomeEverfit": "Fascia e tecnica Funzionale A1",
  "famiglia": "Fascia E Tecnica Funzionale",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "fascia-prevenzione": 14
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 25,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fasc-protezione-palla-figura-8-fascia",
    "nomeEverfit": "Protezione palla figura 8 - fascia",
    "serie": 2,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-protezione-palla-schiena-fascia",
    "nomeEverfit": "Protezione palla schiena - fascia",
    "serie": 2,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-protezione-palla-laterale-suola-fascia",
    "nomeEverfit": "Protezione palla laterale suola - fascia",
    "serie": 2,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-spinta-laterale-suola-protezione-palla-fascia",
    "nomeEverfit": "Spinta laterale suola - protezione palla - fascia",
    "serie": 2,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-spinta-laterale-e-finta-protezione-palla-fascia",
    "nomeEverfit": "Spinta laterale e finta - protezione palla - fascia",
    "serie": 3,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-protezione-palla-laterale-palleggi-fascia",
    "nomeEverfit": "Protezione palla laterale - palleggi - fascia",
    "serie": 3,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "fascia-e-tecnica-funzionale-a2",
  "nome": "Fascia e tecnica Funzionale A2",
  "nomeEverfit": "Fascia e tecnica Funzionale A2",
  "famiglia": "Fascia E Tecnica Funzionale",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "fascia-prevenzione": 15,
   "tecnica-palleggi": 2
  },
  "livello": "A",
  "progressione": 2,
  "variante": "full",
  "durataMin": 40,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fasc-protezione-palla-figura-8-fascia",
    "nomeEverfit": "Protezione palla figura 8 - fascia",
    "serie": 2,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-protezione-palla-schiena-fascia",
    "nomeEverfit": "Protezione palla schiena - fascia",
    "serie": 2,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-protezione-palla-laterale-suola-fascia",
    "nomeEverfit": "Protezione palla laterale suola - fascia",
    "serie": 2,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-spinta-laterale-suola-protezione-palla-fascia",
    "nomeEverfit": "Spinta laterale suola - protezione palla - fascia",
    "serie": 2,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-spinta-laterale-e-finta-protezione-palla-fascia",
    "nomeEverfit": "Spinta laterale e finta - protezione palla - fascia",
    "serie": 3,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-protezione-palla-laterale-palleggi-fascia",
    "nomeEverfit": "Protezione palla laterale - palleggi - fascia",
    "serie": 3,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-freestyle-3-conetti",
    "nomeEverfit": "Palleggi Freestyle 3 conetti",
    "serie": 1,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-liberi-freestyle",
    "nomeEverfit": "Palleggi al muro liberi freestyle",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-palleggi-freestyle-tecnica",
    "nomeEverfit": "Palleggi Freestyle - Tecnica",
    "serie": 1,
    "quantita": 300.0,
    "unita": "secondi",
    "recupero_sec": 120
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "fascia-foundation-2",
  "nome": "Fascia Foundation 2",
  "nomeEverfit": "Fascia Foundation 2",
  "famiglia": "Fascia Foundation",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "riscaldamento": 2,
   "fascia-prevenzione": 6,
   "pliometria-estensiva": 2
  },
  "livello": null,
  "progressione": 2,
  "variante": "full",
  "durataMin": 34,
  "attrezzatura": [
   "piccoli attrezzi"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-fascia-adhesion-tennis-ball",
    "nomeEverfit": "Fascia adhesion tennis ball",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-toes-up-down",
    "nomeEverfit": "Toes up down",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 45,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-toes-up-down",
    "nomeEverfit": "Toes up down",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-single-leg-rdl",
    "nomeEverfit": "Fascia Single leg RDL",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "risc-fascia-standing-meditation",
    "nomeEverfit": "Fascia Standing Meditation",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "plioe-pogo-jumps",
    "nomeEverfit": "Pogo Jumps",
    "serie": 2,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Esercizi per costruire una base solida bel sistema fasciale",
  "tags": []
 },
 {
  "id": "fascia-foundation-a3",
  "nome": "Fascia Foundation A3",
  "nomeEverfit": "Fascia Foundation A3",
  "famiglia": "Fascia Foundation",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "riscaldamento": 2,
   "fascia-prevenzione": 6,
   "pliometria-estensiva": 6
  },
  "livello": "A",
  "progressione": 3,
  "variante": "full",
  "durataMin": 37,
  "attrezzatura": [
   "piccoli attrezzi"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-fascia-adhesion-tennis-ball",
    "nomeEverfit": "Fascia adhesion tennis ball",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-single-leg-rdl",
    "nomeEverfit": "Fascia Single leg RDL",
    "serie": 1,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "risc-fascia-standing-meditation",
    "nomeEverfit": "Fascia Standing Meditation",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-fascia-iso-lounge-runner",
    "nomeEverfit": "Fascia Iso Lounge Runner",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "plioe-pogo-jumps",
    "nomeEverfit": "Pogo Jumps",
    "serie": 4,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "plioe-fascia-toe-bounces-single-leg-pogo-jumps",
    "nomeEverfit": "Fascia Toe Bounces Single Leg - Pogo Jumps",
    "serie": 2,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-arms-swing",
    "nomeEverfit": "Fascia Arms Swing",
    "serie": 2,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Esercizi per costruire una base solida bel sistema fasciale",
  "tags": []
 },
 {
  "id": "fascia-foundation-a3-forza",
  "nome": "Fascia Foundation A3 Forza",
  "nomeEverfit": "Fascia Foundation A3 Forza",
  "famiglia": "Fascia Foundation Forza",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "riscaldamento": 2,
   "fascia-prevenzione": 5,
   "pliometria-estensiva": 3,
   "forza-parte-alta": 6,
   "pliometria-intensiva": 3
  },
  "livello": "A",
  "progressione": 3,
  "variante": "full",
  "durataMin": 41,
  "attrezzatura": [
   "campo",
   "piccoli attrezzi"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-foam-roll-plantar-fascia",
    "nomeEverfit": "Foam Roll Plantar Fascia",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "risc-fascia-standing-meditation",
    "nomeEverfit": "Fascia Standing Meditation",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-fascia-iso-lounge-runner",
    "nomeEverfit": "Fascia Iso Lounge Runner",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "plioe-fascia-toe-bounces-single-leg-pogo-jumps",
    "nomeEverfit": "Fascia Toe Bounces Single Leg - Pogo Jumps",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-arms-swing",
    "nomeEverfit": "Fascia Arms Swing",
    "serie": 2,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-advanced-fascia-progression",
    "nomeEverfit": "Advanced Fascia Progression",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "plioe-fascia-bridge-bounces",
    "nomeEverfit": "Fascia Bridge Bounces",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fpa-spinta-isometrica-al-muro-frontale",
    "nomeEverfit": "Spinta isometrica al muro frontale",
    "serie": 2,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 40,
    "perLato": true
   },
   {
    "esercizio_id": "fpa-spinta-isometrica-al-muro-laterale-interno",
    "nomeEverfit": "Spinta isometrica al muro laterale interno",
    "serie": 2,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 40,
    "perLato": true
   },
   {
    "esercizio_id": "fpa-spinta-isometrica-al-muro-laterale-esterno",
    "nomeEverfit": "Spinta isometrica al muro laterale esterno",
    "serie": 2,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 40,
    "perLato": true
   },
   {
    "esercizio_id": "plioi-spinta-frontale-corsa-skip-fascia",
    "nomeEverfit": "Spinta frontale corsa - skip - fascia",
    "serie": 3,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "fascia-foundation-a4",
  "nome": "Fascia foundation A4",
  "nomeEverfit": "Fascia foundation A4",
  "famiglia": "Fascia Foundation",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "riscaldamento": 2,
   "fascia-prevenzione": 8,
   "pliometria-estensiva": 5
  },
  "livello": "A",
  "progressione": 4,
  "variante": "full",
  "durataMin": 38,
  "attrezzatura": [
   "piccoli attrezzi"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-fascia-adhesion-tennis-ball",
    "nomeEverfit": "Fascia adhesion tennis ball",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-single-leg-rdl",
    "nomeEverfit": "Fascia Single leg RDL",
    "serie": 1,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-single-leg-runner-towel",
    "nomeEverfit": "Fascia Single leg runner (towel)",
    "serie": 2,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "risc-fascia-standing-meditation",
    "nomeEverfit": "Fascia Standing Meditation",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-fascia-iso-lounge-runner",
    "nomeEverfit": "Fascia Iso Lounge Runner",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "plioe-pogo-jumps",
    "nomeEverfit": "Pogo Jumps",
    "serie": 3,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "plioe-fascia-toe-bounces-single-leg-pogo-jumps",
    "nomeEverfit": "Fascia Toe Bounces Single Leg - Pogo Jumps",
    "serie": 2,
    "quantita": 45.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-arms-swing",
    "nomeEverfit": "Fascia Arms Swing",
    "serie": 2,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Esercizi per costruire una base solida bel sistema fasciale",
  "tags": []
 },
 {
  "id": "fascia-foundation-a5",
  "nome": "Fascia Foundation A5",
  "nomeEverfit": "Fascia Foundation A5",
  "famiglia": "Fascia Foundation",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "riscaldamento": 2,
   "fascia-prevenzione": 8,
   "pliometria-estensiva": 7
  },
  "livello": "A",
  "progressione": 5,
  "variante": "full",
  "durataMin": 43,
  "attrezzatura": [
   "piccoli attrezzi"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-fascia-adhesion-tennis-ball",
    "nomeEverfit": "Fascia adhesion tennis ball",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-single-leg-runner-towel",
    "nomeEverfit": "Fascia Single leg runner (towel)",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "risc-fascia-standing-meditation",
    "nomeEverfit": "Fascia Standing Meditation",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-fascia-iso-lounge-runner",
    "nomeEverfit": "Fascia Iso Lounge Runner",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "plioe-pogo-jumps",
    "nomeEverfit": "Pogo Jumps",
    "serie": 3,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "plioe-fascia-toe-bounces-single-leg-pogo-jumps",
    "nomeEverfit": "Fascia Toe Bounces Single Leg - Pogo Jumps",
    "serie": 2,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-arms-swing",
    "nomeEverfit": "Fascia Arms Swing",
    "serie": 2,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-advanced-fascia-progression",
    "nomeEverfit": "Advanced Fascia Progression",
    "serie": 1,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "plioe-fascia-bridge-bounces",
    "nomeEverfit": "Fascia Bridge Bounces",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Esercizi per costruire una base solida del sistema fasciale",
  "tags": []
 },
 {
  "id": "fascia-foundation-a6",
  "nome": "Fascia Foundation A6",
  "nomeEverfit": "Fascia Foundation A6",
  "famiglia": "Fascia Foundation",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "riscaldamento": 2,
   "fascia-prevenzione": 8,
   "pliometria-estensiva": 8
  },
  "livello": "A",
  "progressione": 6,
  "variante": "full",
  "durataMin": 49,
  "attrezzatura": [
   "piccoli attrezzi"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-fascia-adhesion-tennis-ball",
    "nomeEverfit": "Fascia adhesion tennis ball",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-single-leg-rdl",
    "nomeEverfit": "Fascia Single leg RDL",
    "serie": 1,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "risc-fascia-standing-meditation",
    "nomeEverfit": "Fascia Standing Meditation",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "plioe-pogo-jumps",
    "nomeEverfit": "Pogo Jumps",
    "serie": 2,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "plioe-fascia-toe-bounces-single-leg-pogo-jumps",
    "nomeEverfit": "Fascia Toe Bounces Single Leg - Pogo Jumps",
    "serie": 3,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-arms-swing",
    "nomeEverfit": "Fascia Arms Swing",
    "serie": 3,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-advanced-fascia-progression",
    "nomeEverfit": "Advanced Fascia Progression",
    "serie": 2,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "plioe-fascia-bridge-bounces",
    "nomeEverfit": "Fascia Bridge Bounces",
    "serie": 3,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Esercizi per costruire una base solida bel sistema fasciale",
  "tags": []
 },
 {
  "id": "fascia-foundation-b3-forza",
  "nome": "Fascia Foundation B3 Forza",
  "nomeEverfit": "Fascia Foundation B3 Forza",
  "famiglia": "Fascia Foundation Forza",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "riscaldamento": 2,
   "fascia-prevenzione": 2,
   "pliometria-estensiva": 2,
   "forza-parte-alta": 3,
   "pliometria-intensiva": 2
  },
  "livello": "B",
  "progressione": 3,
  "variante": "full",
  "durataMin": 26,
  "attrezzatura": [
   "campo",
   "piccoli attrezzi"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-foam-roll-plantar-fascia",
    "nomeEverfit": "Foam Roll Plantar Fascia",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "risc-fascia-standing-meditation",
    "nomeEverfit": "Fascia Standing Meditation",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-fascia-iso-lounge-runner",
    "nomeEverfit": "Fascia Iso Lounge Runner",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "plioe-fascia-toe-bounces-single-leg-pogo-jumps",
    "nomeEverfit": "Fascia Toe Bounces Single Leg - Pogo Jumps",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-arms-swing",
    "nomeEverfit": "Fascia Arms Swing",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "plioe-fascia-bridge-bounces",
    "nomeEverfit": "Fascia Bridge Bounces",
    "serie": 1,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fpa-spinta-isometrica-al-muro-frontale",
    "nomeEverfit": "Spinta isometrica al muro frontale",
    "serie": 1,
    "quantita": 15.0,
    "unita": "secondi",
    "recupero_sec": 45,
    "perLato": true
   },
   {
    "esercizio_id": "fpa-spinta-isometrica-al-muro-laterale-interno",
    "nomeEverfit": "Spinta isometrica al muro laterale interno",
    "serie": 1,
    "quantita": 15.0,
    "unita": "secondi",
    "recupero_sec": 45,
    "perLato": true
   },
   {
    "esercizio_id": "fpa-spinta-isometrica-al-muro-laterale-esterno",
    "nomeEverfit": "Spinta isometrica al muro laterale esterno",
    "serie": 1,
    "quantita": 15.0,
    "unita": "secondi",
    "recupero_sec": 45,
    "perLato": true
   },
   {
    "esercizio_id": "plioi-spinta-frontale-corsa-skip-fascia",
    "nomeEverfit": "Spinta frontale corsa - skip - fascia",
    "serie": 2,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "fascia-foundation-tecnica-a1",
  "nome": "Fascia foundation tecnica A1",
  "nomeEverfit": "Fascia foundation tecnica A1",
  "famiglia": "Fascia Foundation Tecnica",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "riscaldamento": 1,
   "fascia-prevenzione": 6
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 24,
  "attrezzatura": [
   "piccoli attrezzi"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-fascia-adhesion-tennis-ball",
    "nomeEverfit": "Fascia adhesion tennis ball",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-toes-up-down",
    "nomeEverfit": "Toes up down",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 45,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-single-leg-rdl",
    "nomeEverfit": "Fascia Single leg RDL",
    "serie": 1,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-equilibrio-1-pallina-tennis-fascia-tecnica",
    "nomeEverfit": "Equilibrio 1 pallina tennis fascia tecnica",
    "serie": 2,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-palleggi-con-pallina-da-tennis",
    "nomeEverfit": "Palleggi con pallina da tennis",
    "serie": 1,
    "quantita": 240.0,
    "unita": "secondi",
    "recupero_sec": 0
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Esercizi per costruire una base solida bel sistema fasciale",
  "tags": []
 },
 {
  "id": "fascia-foundation-tecnica-a1-b",
  "nome": "Fascia foundation tecnica A1-B",
  "nomeEverfit": "Fascia foundation tecnica A1-B",
  "famiglia": "Fascia Foundation Tecnica",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "riscaldamento": 1,
   "fascia-prevenzione": 7
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 29,
  "attrezzatura": [
   "piccoli attrezzi"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-fascia-adhesion-tennis-ball",
    "nomeEverfit": "Fascia adhesion tennis ball",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-toes-up-down",
    "nomeEverfit": "Toes up down",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 45,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-single-leg-rdl",
    "nomeEverfit": "Fascia Single leg RDL",
    "serie": 1,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-equilibrio-1-pallina-tennis-fascia-tecnica",
    "nomeEverfit": "Equilibrio 1 pallina tennis fascia tecnica",
    "serie": 2,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-palleggi-con-pallina-da-tennis",
    "nomeEverfit": "Palleggi con pallina da tennis",
    "serie": 1,
    "quantita": 240.0,
    "unita": "secondi",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-palleggi-freestyle-tecnica",
    "nomeEverfit": "Palleggi Freestyle - Tecnica",
    "serie": 1,
    "quantita": 300.0,
    "unita": "secondi",
    "recupero_sec": 0
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Esercizi per costruire una base solida bel sistema fasciale",
  "tags": []
 },
 {
  "id": "fascia-foundation-tecnica-a1-c",
  "nome": "Fascia foundation tecnica A1-C",
  "nomeEverfit": "Fascia foundation tecnica A1-C",
  "famiglia": "Fascia Foundation Tecnica",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "riscaldamento": 1,
   "fascia-prevenzione": 6,
   "tecnica-palleggi": 1
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 33,
  "attrezzatura": [
   "campo",
   "piccoli attrezzi"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-fascia-adhesion-tennis-ball",
    "nomeEverfit": "Fascia adhesion tennis ball",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-single-leg-rdl",
    "nomeEverfit": "Fascia Single leg RDL",
    "serie": 1,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-equilibrio-1-pallina-tennis-fascia-tecnica",
    "nomeEverfit": "Equilibrio 1 pallina tennis fascia tecnica",
    "serie": 2,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-palleggi-con-pallina-da-tennis",
    "nomeEverfit": "Palleggi con pallina da tennis",
    "serie": 1,
    "quantita": 300.0,
    "unita": "secondi",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "tpal-palleggi-freestyle-3-conetti",
    "nomeEverfit": "Palleggi Freestyle 3 conetti",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-palleggi-freestyle-tecnica",
    "nomeEverfit": "Palleggi Freestyle - Tecnica",
    "serie": 1,
    "quantita": 300.0,
    "unita": "secondi",
    "recupero_sec": 0
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Esercizi per costruire una base solida bel sistema fasciale",
  "tags": []
 },
 {
  "id": "fascia-foundation-tecnica-a2",
  "nome": "Fascia foundation Tecnica A2",
  "nomeEverfit": "Fascia foundation Tecnica A2",
  "famiglia": "Fascia Foundation Tecnica",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "riscaldamento": 1,
   "fascia-prevenzione": 7
  },
  "livello": "A",
  "progressione": 2,
  "variante": "full",
  "durataMin": 27,
  "attrezzatura": [
   "piccoli attrezzi"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-fascia-adhesion-tennis-ball",
    "nomeEverfit": "Fascia adhesion tennis ball",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-single-leg-rdl",
    "nomeEverfit": "Fascia Single leg RDL",
    "serie": 1,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-equilibrio-1-pallina-tennis-fascia-tecnica",
    "nomeEverfit": "Equilibrio 1 pallina tennis fascia tecnica",
    "serie": 2,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-equilibrio-2-pallina-da-tennis-fascia-tecnica",
    "nomeEverfit": "Equilibrio 2 pallina da tennis fascia tecnica",
    "serie": 2,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-palleggi-con-pallina-da-tennis",
    "nomeEverfit": "Palleggi con pallina da tennis",
    "serie": 1,
    "quantita": 300.0,
    "unita": "secondi",
    "recupero_sec": 0
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Esercizi per costruire una base solida bel sistema fasciale",
  "tags": []
 },
 {
  "id": "fascia-foundation-tecnica-a2-short",
  "nome": "Fascia foundation Tecnica A2 - short",
  "nomeEverfit": "Fascia foundation Tecnica A2 - short",
  "famiglia": "Fascia Foundation Tecnica",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "riscaldamento": 1,
   "fascia-prevenzione": 5
  },
  "livello": "A",
  "progressione": 2,
  "variante": "short",
  "durataMin": 17,
  "attrezzatura": [
   "piccoli attrezzi"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-fascia-adhesion-tennis-ball",
    "nomeEverfit": "Fascia adhesion tennis ball",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-equilibrio-1-pallina-tennis-fascia-tecnica",
    "nomeEverfit": "Equilibrio 1 pallina tennis fascia tecnica",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-equilibrio-2-pallina-da-tennis-fascia-tecnica",
    "nomeEverfit": "Equilibrio 2 pallina da tennis fascia tecnica",
    "serie": 2,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-palleggi-con-pallina-da-tennis",
    "nomeEverfit": "Palleggi con pallina da tennis",
    "serie": 1,
    "quantita": 240.0,
    "unita": "secondi",
    "recupero_sec": 0
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Esercizi per costruire una base solida bel sistema fasciale",
  "tags": []
 },
 {
  "id": "fascia-foundation-tecnica-a2-b",
  "nome": "Fascia foundation Tecnica A2-B",
  "nomeEverfit": "Fascia foundation Tecnica A2-B",
  "famiglia": "Fascia Foundation Tecnica",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "riscaldamento": 1,
   "fascia-prevenzione": 8,
   "tecnica-palleggi": 2
  },
  "livello": "A",
  "progressione": 2,
  "variante": "full",
  "durataMin": 39,
  "attrezzatura": [
   "campo",
   "piccoli attrezzi"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-fascia-adhesion-tennis-ball",
    "nomeEverfit": "Fascia adhesion tennis ball",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-single-leg-rdl",
    "nomeEverfit": "Fascia Single leg RDL",
    "serie": 1,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-equilibrio-1-pallina-tennis-fascia-tecnica",
    "nomeEverfit": "Equilibrio 1 pallina tennis fascia tecnica",
    "serie": 2,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-equilibrio-2-pallina-da-tennis-fascia-tecnica",
    "nomeEverfit": "Equilibrio 2 pallina da tennis fascia tecnica",
    "serie": 3,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-palleggi-con-pallina-da-tennis",
    "nomeEverfit": "Palleggi con pallina da tennis",
    "serie": 1,
    "quantita": 300.0,
    "unita": "secondi",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "tpal-palleggi-freestyle-3-conetti",
    "nomeEverfit": "Palleggi Freestyle 3 conetti",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-liberi-freestyle",
    "nomeEverfit": "Palleggi al muro liberi freestyle",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 0
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Esercizi per costruire una base solida bel sistema fasciale",
  "tags": []
 },
 {
  "id": "fascia-foundation-tecnica-a3",
  "nome": "Fascia foundation Tecnica A3",
  "nomeEverfit": "Fascia foundation Tecnica A3",
  "famiglia": "Fascia Foundation Tecnica",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "riscaldamento": 1,
   "fascia-prevenzione": 7
  },
  "livello": "A",
  "progressione": 3,
  "variante": "full",
  "durataMin": 27,
  "attrezzatura": [
   "piccoli attrezzi"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-fascia-adhesion-tennis-ball",
    "nomeEverfit": "Fascia adhesion tennis ball",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-single-leg-rdl",
    "nomeEverfit": "Fascia Single leg RDL",
    "serie": 1,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-equilibrio-1-pallina-tennis-fascia-tecnica",
    "nomeEverfit": "Equilibrio 1 pallina tennis fascia tecnica",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-equilibrio-2-pallina-da-tennis-fascia-tecnica",
    "nomeEverfit": "Equilibrio 2 pallina da tennis fascia tecnica",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-equilibrio-3-pallina-da-tennis-fascia-tecnica",
    "nomeEverfit": "Equilibrio 3 pallina da tennis fascia tecnica",
    "serie": 2,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-palleggi-con-pallina-da-tennis",
    "nomeEverfit": "Palleggi con pallina da tennis",
    "serie": 1,
    "quantita": 300.0,
    "unita": "secondi",
    "recupero_sec": 0
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Esercizi per costruire una base solida bel sistema fasciale",
  "tags": []
 },
 {
  "id": "fascia-foundations-1",
  "nome": "Fascia Foundations 1",
  "nomeEverfit": "Fascia Foundations 1",
  "famiglia": "Fascia Foundation",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "riscaldamento": 1,
   "fascia-prevenzione": 6
  },
  "livello": null,
  "progressione": 1,
  "variante": "full",
  "durataMin": 23,
  "attrezzatura": [
   "piccoli attrezzi"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-fascia-adhesion-tennis-ball",
    "nomeEverfit": "Fascia adhesion tennis ball",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-toes-up-down",
    "nomeEverfit": "Toes up down",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 45,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-toes-up-down",
    "nomeEverfit": "Toes up down",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-single-leg-rdl",
    "nomeEverfit": "Single leg Fascia RDL",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Esercizi per costruire una base solida bel sistema fasciale",
  "tags": []
 },
 {
  "id": "fascia-foundations-1b",
  "nome": "Fascia Foundations 1B",
  "nomeEverfit": "Fascia Foundations 1B",
  "famiglia": "Fascia Foundation",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "riscaldamento": 1,
   "fascia-prevenzione": 10
  },
  "livello": null,
  "progressione": 1,
  "variante": "full",
  "sottovariante": "B",
  "durataMin": 30,
  "attrezzatura": [
   "piccoli attrezzi"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-fascia-adhesion-tennis-ball",
    "nomeEverfit": "Fascia adhesion tennis ball",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-toes-up-down",
    "nomeEverfit": "Toes up down",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 45,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-toes-up-down",
    "nomeEverfit": "Toes up down",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-single-leg-rdl",
    "nomeEverfit": "Single leg Fascia RDL",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-iso-lounge-runner",
    "nomeEverfit": "Fascia Iso Lounge Runner",
    "serie": 2,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-single-leg-runner-towel",
    "nomeEverfit": "Fascia Single leg runner (towel)",
    "serie": 2,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Esercizi per costruire una base solida bel sistema fasciale",
  "tags": []
 },
 {
  "id": "fascia-foundations-1d",
  "nome": "Fascia Foundations 1D",
  "nomeEverfit": "Fascia Foundations 1D",
  "famiglia": "Fascia Foundation",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "riscaldamento": 1,
   "fascia-prevenzione": 7,
   "pliometria-estensiva": 4
  },
  "livello": null,
  "progressione": 1,
  "variante": "full",
  "sottovariante": "D",
  "durataMin": 29,
  "attrezzatura": [
   "piccoli attrezzi"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-fascia-adhesion-tennis-ball",
    "nomeEverfit": "Fascia adhesion tennis ball",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-toes-up-down",
    "nomeEverfit": "Toes up down",
    "serie": 1,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-single-leg-rdl",
    "nomeEverfit": "Single leg Fascia RDL",
    "serie": 1,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-iso-lounge-runner",
    "nomeEverfit": "Fascia Iso Lounge Runner",
    "serie": 1,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-single-leg-runner-towel",
    "nomeEverfit": "Fascia Single leg runner (towel)",
    "serie": 1,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-towel-figure-8",
    "nomeEverfit": "Fascia Towel figure 8",
    "serie": 1,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "plioe-pogo-jumps",
    "nomeEverfit": "Pogo Jumps",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "plioe-fascia-toe-bounces-single-leg-pogo-jumps",
    "nomeEverfit": "Fascia Toe Bounces Single Leg - Pogo Jumps",
    "serie": 2,
    "quantita": 45.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Esercizi per costruire una base solida bel sistema fasciale",
  "tags": []
 },
 {
  "id": "fascia-foundations-2a",
  "nome": "Fascia Foundations 2A",
  "nomeEverfit": "Fascia Foundations 2A",
  "famiglia": "Fascia Foundation",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "riscaldamento": 1,
   "fascia-prevenzione": 6,
   "pliometria-estensiva": 4
  },
  "livello": null,
  "progressione": 2,
  "variante": "full",
  "sottovariante": "A",
  "durataMin": 29,
  "attrezzatura": [
   "piccoli attrezzi"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-fascia-adhesion-tennis-ball",
    "nomeEverfit": "Fascia adhesion tennis ball",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-toes-up-down",
    "nomeEverfit": "Toes up down",
    "serie": 1,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-single-leg-rdl",
    "nomeEverfit": "Single leg Fascia RDL",
    "serie": 1,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-iso-lounge-runner",
    "nomeEverfit": "Fascia Iso Lounge Runner",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-single-leg-runner-towel",
    "nomeEverfit": "Fascia Single leg runner (towel)",
    "serie": 1,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "plioe-pogo-jumps",
    "nomeEverfit": "Pogo Jumps",
    "serie": 2,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "plioe-fascia-toe-bounces-single-leg-pogo-jumps",
    "nomeEverfit": "Fascia Toe Bounces Single Leg - Pogo Jumps",
    "serie": 2,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Esercizi per costruire una base solida bel sistema fasciale",
  "tags": []
 },
 {
  "id": "fascia-foundations-2c",
  "nome": "Fascia Foundations 2C",
  "nomeEverfit": "Fascia Foundations 2C",
  "famiglia": "Fascia Foundation",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "riscaldamento": 1,
   "fascia-prevenzione": 4,
   "pliometria-estensiva": 4
  },
  "livello": null,
  "progressione": 2,
  "variante": "full",
  "sottovariante": "C",
  "durataMin": 29,
  "attrezzatura": [
   "piccoli attrezzi"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-fascia-adhesion-tennis-ball",
    "nomeEverfit": "Fascia adhesion tennis ball",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "fasc-towel-curls",
    "nomeEverfit": "Towel Curls",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-fascia-iso-lounge-runner",
    "nomeEverfit": "Fascia Iso Lounge Runner",
    "serie": 2,
    "quantita": 150.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "plioe-pogo-jumps",
    "nomeEverfit": "Pogo Jumps",
    "serie": 2,
    "quantita": 150.0,
    "unita": "secondi",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "plioe-fascia-toe-bounces-single-leg-pogo-jumps",
    "nomeEverfit": "Fascia Toe Bounces Single Leg - Pogo Jumps",
    "serie": 2,
    "quantita": 105.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-equilibrio-1-pallina-tennis-fascia-tecnica",
    "nomeEverfit": "Equilibrio 1 pallina tennis fascia tecnica",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Esercizi per costruire una base solida bel sistema fasciale",
  "tags": []
 },
 {
  "id": "fascia-training-rolling-and-fascia-adhesion",
  "nome": "Fascia Training - Rolling and fascia adhesion",
  "nomeEverfit": "Fascia Training - Rolling and fascia adhesion",
  "famiglia": "Fascia Training - Rolling And Fascia Adhesion",
  "qualita": "fascia-prevenzione",
  "qualitaSet": {
   "riscaldamento": 6
  },
  "livello": null,
  "progressione": null,
  "variante": "full",
  "durataMin": 11,
  "attrezzatura": [
   "piccoli attrezzi"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-calves-foam-roll",
    "nomeEverfit": "Calves Foam Roll",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "risc-peroneals-foam-roll",
    "nomeEverfit": "Peroneals Foam Roll",
    "serie": 1,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "risc-hamstring-foam-roll",
    "nomeEverfit": "Hamstring Foam Roll",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "risc-rhomboids-foam-roll",
    "nomeEverfit": "Rhomboids Foam Roll",
    "serie": 1,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "risc-quadriceps-foam-roll",
    "nomeEverfit": "Quadriceps Foam Roll",
    "serie": 1,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "risc-piriformis-foam-roll",
    "nomeEverfit": "Piriformis Foam Roll",
    "serie": 1,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "forza-esplosiva-a1",
  "nome": "Forza Esplosiva A1",
  "nomeEverfit": "Forza Esplosiva A1",
  "famiglia": "Forza Esplosiva",
  "qualita": "forza-esplosiva",
  "qualitaSet": {
   "forza-parte-bassa": 8,
   "core": 2,
   "forza-esplosiva": 6,
   "test": 3,
   "pliometria-intensiva": 5,
   "pliometria-estensiva": 6
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 42,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fpb-tibialis-raises",
    "nomeEverfit": "Tibialis raises",
    "serie": 2,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 10.0
   },
   {
    "esercizio_id": "fpb-calf-raises",
    "nomeEverfit": "Calf raises",
    "serie": 1,
    "quantita": 25.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 5.0,
    "perLato": true
   },
   {
    "esercizio_id": "fpb-calf-raises",
    "nomeEverfit": "Calf raises",
    "serie": 1,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 10.0,
    "perLato": true
   },
   {
    "esercizio_id": "fpb-calf-raises",
    "nomeEverfit": "Calf raises",
    "serie": 1,
    "quantita": 30.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "core2-copenaghen-plank",
    "nomeEverfit": "copenaghen plank",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fpb-sissy-squat",
    "nomeEverfit": "sissy squat",
    "serie": 3,
    "quantita": 8.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fesp-forza-esplosiva-tecnica-salto-1-piede-e-2-piedi",
    "nomeEverfit": "Forza Esplosiva - Tecnica Salto 1 piede e 2 piedi",
    "serie": 2,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 20,
    "perLato": true
   },
   {
    "esercizio_id": "fesp-forza-esplosiva-tecnica-salto-1-piede-e-2-piedi",
    "nomeEverfit": "Forza Esplosiva - Tecnica Salto 1 piede e 2 piedi",
    "serie": 1,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fesp-forza-esplosiva-tecnica-salto-1-piede-e-2-piedi",
    "nomeEverfit": "Forza Esplosiva - Tecnica Salto 1 piede e 2 piedi",
    "serie": 2,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 20,
    "perLato": true
   },
   {
    "esercizio_id": "fesp-forza-esplosiva-tecnica-salto-1-piede-e-2-piedi",
    "nomeEverfit": "Forza Esplosiva - Tecnica Salto 1 piede e 2 piedi",
    "serie": 1,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "test2-test-salto-in-lungo-broad-jump",
    "nomeEverfit": "Test Salto in lungo - broad jump",
    "serie": 2,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "test2-test-salto-in-lungo-broad-jump",
    "nomeEverfit": "Test Salto in lungo - broad jump",
    "serie": 1,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "plioi-drop-jump",
    "nomeEverfit": "Drop Jump",
    "serie": 3,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "plioe-fascia-lateral-jumps-pliometria",
    "nomeEverfit": "Fascia Lateral Jumps - Pliometria",
    "serie": 2,
    "quantita": 10.0,
    "unita": "secondi",
    "recupero_sec": 20
   },
   {
    "esercizio_id": "plioe-fascia-lateral-jumps-pliometria",
    "nomeEverfit": "Fascia Lateral Jumps - Pliometria",
    "serie": 1,
    "quantita": 10.0,
    "unita": "secondi",
    "recupero_sec": 90
   },
   {
    "esercizio_id": "plioe-fascia-front-jumps-pliometria",
    "nomeEverfit": "Fascia Front Jumps - Pliometria",
    "serie": 2,
    "quantita": 10.0,
    "unita": "secondi",
    "recupero_sec": 20
   },
   {
    "esercizio_id": "plioe-fascia-front-jumps-pliometria",
    "nomeEverfit": "Fascia Front Jumps - Pliometria",
    "serie": 1,
    "quantita": 10.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "plioi-single-leg-lateral-drop-jump",
    "nomeEverfit": "Single leg lateral drop jump",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "forza-full-body-hiit-corpo-libero-b1",
  "nome": "Forza full body HIIT corpo libero - B1",
  "nomeEverfit": "Forza full body HIIT corpo libero - B1",
  "famiglia": "Forza Full Body Hiit Corpo Libero",
  "qualita": "forza-parte-alta",
  "qualitaSet": {
   "forza-parte-alta": 8,
   "forza-esplosiva": 8,
   "core": 4
  },
  "livello": "B",
  "progressione": 1,
  "variante": "full",
  "durataMin": 23,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fpa-piegamenti-hindu",
    "nomeEverfit": "Piegamenti Hindu",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B1"
   },
   {
    "esercizio_id": "fesp-skater-jump",
    "nomeEverfit": "Skater Jump",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B1"
   },
   {
    "esercizio_id": "fpa-diamond-push-up",
    "nomeEverfit": "Diamond Push Up",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B1"
   },
   {
    "esercizio_id": "core-6",
    "nomeEverfit": "hollow hold",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B1"
   },
   {
    "esercizio_id": "fesp-reverse-burpee",
    "nomeEverfit": "Reverse Burpee",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B1"
   },
   {
    "esercizio_id": "fpa-piegamenti-hindu",
    "nomeEverfit": "Piegamenti Hindu",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B1"
   },
   {
    "esercizio_id": "fesp-skater-jump",
    "nomeEverfit": "Skater Jump",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B1"
   },
   {
    "esercizio_id": "fpa-diamond-push-up",
    "nomeEverfit": "Diamond Push Up",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B1"
   },
   {
    "esercizio_id": "core-6",
    "nomeEverfit": "hollow hold",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B1"
   },
   {
    "esercizio_id": "fesp-reverse-burpee",
    "nomeEverfit": "Reverse Burpee",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B1"
   },
   {
    "esercizio_id": "fpa-piegamenti-hindu",
    "nomeEverfit": "Piegamenti Hindu",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B1"
   },
   {
    "esercizio_id": "fesp-skater-jump",
    "nomeEverfit": "Skater Jump",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B1"
   },
   {
    "esercizio_id": "fpa-diamond-push-up",
    "nomeEverfit": "Diamond Push Up",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B1"
   },
   {
    "esercizio_id": "core-6",
    "nomeEverfit": "hollow hold",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B1"
   },
   {
    "esercizio_id": "fesp-reverse-burpee",
    "nomeEverfit": "Reverse Burpee",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B1"
   },
   {
    "esercizio_id": "fpa-piegamenti-hindu",
    "nomeEverfit": "Piegamenti Hindu",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B1"
   },
   {
    "esercizio_id": "fesp-skater-jump",
    "nomeEverfit": "Skater Jump",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B1"
   },
   {
    "esercizio_id": "fpa-diamond-push-up",
    "nomeEverfit": "Diamond Push Up",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B1"
   },
   {
    "esercizio_id": "core-6",
    "nomeEverfit": "hollow hold",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B1"
   },
   {
    "esercizio_id": "fesp-reverse-burpee",
    "nomeEverfit": "Reverse Burpee",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B1"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "forza-full-body-hiit-corpo-libero-b3",
  "nome": "Forza full body HIIT corpo libero - B3",
  "nomeEverfit": "Forza full body HIIT corpo libero - B3",
  "famiglia": "Forza Full Body Hiit Corpo Libero",
  "qualita": "core",
  "qualitaSet": {
   "forza-parte-alta": 4,
   "core": 16
  },
  "livello": "B",
  "progressione": 3,
  "variante": "full",
  "durataMin": 23,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fpa-piegamenti-hindu",
    "nomeEverfit": "Piegamenti Hindu",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B3"
   },
   {
    "esercizio_id": "core2-side-jackknife",
    "nomeEverfit": "Side Jackknife",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B3"
   },
   {
    "esercizio_id": "core2-arm-climb-high-to-forearm-plank",
    "nomeEverfit": "Arm Climb (High to Forearm Plank)",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B3"
   },
   {
    "esercizio_id": "core2-side-jackknife",
    "nomeEverfit": "Side Jackknife",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B3"
   },
   {
    "esercizio_id": "core2-cross-body-mountain-climbers",
    "nomeEverfit": "Cross Body Mountain Climbers",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B3"
   },
   {
    "esercizio_id": "fpa-piegamenti-hindu",
    "nomeEverfit": "Piegamenti Hindu",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B3"
   },
   {
    "esercizio_id": "core2-side-jackknife",
    "nomeEverfit": "Side Jackknife",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B3"
   },
   {
    "esercizio_id": "core2-arm-climb-high-to-forearm-plank",
    "nomeEverfit": "Arm Climb (High to Forearm Plank)",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B3"
   },
   {
    "esercizio_id": "core2-side-jackknife",
    "nomeEverfit": "Side Jackknife",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B3"
   },
   {
    "esercizio_id": "core2-cross-body-mountain-climbers",
    "nomeEverfit": "Cross Body Mountain Climbers",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B3"
   },
   {
    "esercizio_id": "fpa-piegamenti-hindu",
    "nomeEverfit": "Piegamenti Hindu",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B3 SHORT"
   },
   {
    "esercizio_id": "core2-side-jackknife",
    "nomeEverfit": "Side Jackknife",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B3 SHORT"
   },
   {
    "esercizio_id": "core2-arm-climb-high-to-forearm-plank",
    "nomeEverfit": "Arm Climb (High to Forearm Plank)",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B3 SHORT"
   },
   {
    "esercizio_id": "core2-side-jackknife",
    "nomeEverfit": "Side Jackknife",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B3 SHORT"
   },
   {
    "esercizio_id": "core2-cross-body-mountain-climbers",
    "nomeEverfit": "Cross Body Mountain Climbers",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B3 SHORT"
   },
   {
    "esercizio_id": "fpa-piegamenti-hindu",
    "nomeEverfit": "Piegamenti Hindu",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B3 SHORT"
   },
   {
    "esercizio_id": "core2-side-jackknife",
    "nomeEverfit": "Side Jackknife",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B3 SHORT"
   },
   {
    "esercizio_id": "core2-arm-climb-high-to-forearm-plank",
    "nomeEverfit": "Arm Climb (High to Forearm Plank)",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B3 SHORT"
   },
   {
    "esercizio_id": "core2-side-jackknife",
    "nomeEverfit": "Side Jackknife",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B3 SHORT"
   },
   {
    "esercizio_id": "core2-cross-body-mountain-climbers",
    "nomeEverfit": "Cross Body Mountain Climbers",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "Forza full body HIIT 5min - corpo libero - B3 SHORT"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "forza-funzionale-e-pliometria-pro1",
  "nome": "Forza Funzionale e Pliometria PRO1",
  "nomeEverfit": "Forza Funzionale e Pliometria PRO1",
  "famiglia": "Forza Funzionale E Pliometria",
  "qualita": "pliometria-intensiva",
  "qualitaSet": {
   "forza-parte-bassa": 2,
   "forza-esplosiva": 1,
   "pliometria-intensiva": 16,
   "test": 4,
   "velocita": 8
  },
  "livello": "PRO",
  "progressione": 1,
  "variante": "full",
  "durataMin": 39,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fpb-sissy-squat-slide",
    "nomeEverfit": "Sissy Squat Slide",
    "serie": 2,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fesp-forza-esplosiva-tecnica-salto-1-piede-e-2-piedi",
    "nomeEverfit": "Forza Esplosiva - Tecnica Salto 1 piede e 2 piedi",
    "serie": 1,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "plioi-drop-jump",
    "nomeEverfit": "Drop Jump",
    "serie": 3,
    "quantita": 3.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "test2-test-salto-in-lungo-broad-jump",
    "nomeEverfit": "Test Salto in lungo - broad jump",
    "serie": 4,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "plioi-single-leg-lateral-drop-jump",
    "nomeEverfit": "Single leg lateral drop jump",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "plioi-single-leg-drop-e-spinta-interna",
    "nomeEverfit": "Single leg drop e spinta interna",
    "serie": 2,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "plioi-reverse-drop-jumps",
    "nomeEverfit": "Reverse drop jumps",
    "serie": 3,
    "quantita": 12.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "plioi-single-leg-drop-e-spinta-laterale",
    "nomeEverfit": "Single Leg Drop e spinta laterale",
    "serie": 3,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 45,
    "perLato": true
   },
   {
    "esercizio_id": "plioi-single-leg-reverse-lateral-drop-progression",
    "nomeEverfit": "single leg Reverse lateral drop progression",
    "serie": 3,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "vel-salto-triplo-e-sprint",
    "nomeEverfit": "Salto triplo e sprint",
    "serie": 4,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "vel-salto-triplo-a-1-gamba-e-sprint",
    "nomeEverfit": "Salto triplo a 1 gamba e sprint",
    "serie": 4,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 45,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "forza-max-parte-bassa-pro1",
  "nome": "Forza max parte bassa PRO1",
  "nomeEverfit": "Forza max parte bassa PRO1",
  "famiglia": "Forza Max Parte Bassa",
  "qualita": "forza-parte-bassa",
  "qualitaSet": {
   "forza-parte-bassa": 4,
   "pliometria-intensiva": 2,
   "forza-esplosiva": 2
  },
  "livello": "PRO",
  "progressione": 1,
  "variante": "full",
  "durataMin": 32,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fpb-single-leg-rdl",
    "nomeEverfit": "single leg rdl",
    "serie": 2,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 90,
    "carico_kg": 20.0,
    "perLato": true
   },
   {
    "esercizio_id": "fpb-nordic-hamstring",
    "nomeEverfit": "nordic hamstring",
    "serie": 2,
    "quantita": 3.0,
    "unita": "reps",
    "recupero_sec": 150
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Barbell Deadlift",
    "serie": 1,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 100.0
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Barbell Deadlift",
    "serie": 1,
    "quantita": 3.0,
    "unita": "reps",
    "recupero_sec": 180,
    "carico_kg": 120.0
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Barbell Deadlift",
    "serie": 1,
    "quantita": 1.0,
    "unita": "reps",
    "recupero_sec": 180,
    "carico_kg": 140.0
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Barbell Deadlift",
    "serie": 1,
    "quantita": 3.0,
    "unita": "reps",
    "recupero_sec": 180,
    "carico_kg": 120.0
   },
   {
    "esercizio_id": "plioi-drop-jump",
    "nomeEverfit": "Drop Jump",
    "serie": 2,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "fesp-fy-split-squat",
    "nomeEverfit": "FY Split Squat",
    "serie": 1,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 100.0,
    "perLato": true
   },
   {
    "esercizio_id": "fesp-fy-split-squat",
    "nomeEverfit": "FY Split Squat",
    "serie": 1,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 120.0,
    "perLato": true
   }
  ],
  "completo": false,
  "mancanti": [
   "Barbell Deadlift"
  ],
  "tags": []
 },
 {
  "id": "forza-mix-p1",
  "nome": "Forza Mix P1",
  "nomeEverfit": "Forza Mix P1",
  "famiglia": "Forza Mix",
  "qualita": "forza-parte-alta",
  "qualitaSet": {
   "forza-parte-alta": 5,
   "forza-parte-bassa": 1,
   "test": 2,
   "core": 2
  },
  "livello": null,
  "progressione": 1,
  "variante": "full",
  "ruolo": "portiere",
  "durataMin": 19,
  "attrezzatura": [
   "palestra",
   "sbarra"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "push-2",
    "nomeEverfit": "Push-Up",
    "serie": 1,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fpa-cuban-press",
    "nomeEverfit": "cuban press",
    "serie": 1,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 4.0
   },
   {
    "esercizio_id": "fpa-panca-piana-con-bilanciere",
    "nomeEverfit": "Barbell Bench Press",
    "serie": 1,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 20.0,
    "nota": "ripetizioni veloci"
   },
   {
    "esercizio_id": "fpa-spinta-isometrica-al-muro-laterale-esterno",
    "nomeEverfit": "Spinta isometrica al muro laterale esterno",
    "serie": 1,
    "quantita": 10.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fpb-affondo-isometrico",
    "nomeEverfit": "Affondo isometrico",
    "serie": 1,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "test2-test-salto-in-lungo-broad-jump",
    "nomeEverfit": "Test Salto in lungo - broad jump",
    "serie": 2,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "core2-bear-crawl-lateral",
    "nomeEverfit": "Bear Crawl Lateral",
    "serie": 1,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "core2-bear-crawl-linear",
    "nomeEverfit": "Bear Crawl Linear",
    "serie": 1,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fpa-chin-up",
    "nomeEverfit": "Chin-Up",
    "serie": 1,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 120,
    "nota": "ripetizioni veloci"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "forza-parte-alta-b1",
  "nome": "Forza Parte alta B1",
  "nomeEverfit": "Forza Parte alta B1",
  "famiglia": "Forza Parte Alta",
  "qualita": "forza-parte-alta",
  "qualitaSet": {
   "core": 14,
   "forza-parte-alta": 8
  },
  "livello": "B",
  "progressione": 1,
  "variante": "full",
  "durataMin": 41,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "core2-sit-up",
    "nomeEverfit": "Sit-Up",
    "serie": 4,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "core2-plank-with-twist",
    "nomeEverfit": "Plank with Twist",
    "serie": 3,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "core2-isometric-bear-crawl",
    "nomeEverfit": "Isometric Bear Crawl",
    "serie": 3,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 45
   },
   {
    "esercizio_id": "core2-bear-crawl-linear",
    "nomeEverfit": "Bear Crawl Linear",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "core2-bear-crawl-lateral",
    "nomeEverfit": "Bear Crawl Lateral",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "push-2",
    "nomeEverfit": "Push-Up",
    "serie": 5,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "pull-5",
    "nomeEverfit": "Pull-Up",
    "serie": 3,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "forza-parte-alta-b1-short",
  "nome": "Forza Parte alta B1 - short",
  "nomeEverfit": "Forza Parte alta B1 - short",
  "famiglia": "Forza Parte Alta",
  "qualita": "forza-parte-alta",
  "qualitaSet": {
   "core": 8,
   "forza-parte-alta": 8
  },
  "livello": "B",
  "progressione": 1,
  "variante": "short",
  "durataMin": 31,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "core2-sit-up",
    "nomeEverfit": "Sit-Up",
    "serie": 3,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "core2-plank-with-twist",
    "nomeEverfit": "Plank with Twist",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "core2-isometric-bear-crawl",
    "nomeEverfit": "Isometric Bear Crawl",
    "serie": 1,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 45
   },
   {
    "esercizio_id": "core2-bear-crawl-linear",
    "nomeEverfit": "Bear Crawl Linear",
    "serie": 1,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "core2-bear-crawl-lateral",
    "nomeEverfit": "Bear Crawl Lateral",
    "serie": 1,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "push-2",
    "nomeEverfit": "Push-Up",
    "serie": 5,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "pull-5",
    "nomeEverfit": "Pull-Up",
    "serie": 3,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "forza-parte-alta-b2",
  "nome": "Forza Parte alta B2",
  "nomeEverfit": "Forza Parte alta B2",
  "famiglia": "Forza Parte Alta",
  "qualita": "forza-parte-alta",
  "qualitaSet": {
   "forza-parte-alta": 11,
   "core": 5
  },
  "livello": "B",
  "progressione": 2,
  "variante": "full",
  "durataMin": 36,
  "attrezzatura": [
   "sbarra"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fpa-archer-pushup",
    "nomeEverfit": "Archer Push Up",
    "serie": 3,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 120,
    "perLato": true
   },
   {
    "esercizio_id": "core2-bicycle-crunch-straight-leg",
    "nomeEverfit": "Bicycle Crunch Straight Leg",
    "serie": 3,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fpa-pull-up-around-the-world",
    "nomeEverfit": "Pull Up Around The World",
    "serie": 2,
    "quantita": 3.0,
    "unita": "reps",
    "recupero_sec": 120,
    "perLato": true
   },
   {
    "esercizio_id": "fpa-piegamenti-hindu",
    "nomeEverfit": "Piegamenti Hindu",
    "serie": 3,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "core-6",
    "nomeEverfit": "hollow hold",
    "serie": 2,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "fpa-chin-up",
    "nomeEverfit": "Chin-Up",
    "serie": 3,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 90
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "forza-parte-alta-b3",
  "nome": "Forza Parte alta B3",
  "nomeEverfit": "Forza Parte alta B3",
  "famiglia": "Forza Parte Alta",
  "qualita": "forza-parte-alta",
  "qualitaSet": {
   "forza-parte-alta": 11,
   "core": 5
  },
  "livello": "B",
  "progressione": 3,
  "variante": "full",
  "durataMin": 39,
  "attrezzatura": [
   "sbarra"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fpa-archer-pushup",
    "nomeEverfit": "Archer Push Up",
    "serie": 3,
    "quantita": 8.0,
    "unita": "reps",
    "recupero_sec": 120,
    "perLato": true
   },
   {
    "esercizio_id": "core2-bicycle-crunch-straight-leg",
    "nomeEverfit": "Bicycle Crunch Straight Leg",
    "serie": 3,
    "quantita": 25.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fpa-pull-up-around-the-world",
    "nomeEverfit": "Pull Up Around The World",
    "serie": 2,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 120,
    "perLato": true
   },
   {
    "esercizio_id": "fpa-piegamenti-hindu",
    "nomeEverfit": "Piegamenti Hindu",
    "serie": 3,
    "quantita": 8.0,
    "unita": "reps",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "core-6",
    "nomeEverfit": "hollow hold",
    "serie": 2,
    "quantita": 80.0,
    "unita": "secondi",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "fpa-chin-up",
    "nomeEverfit": "Chin-Up",
    "serie": 3,
    "quantita": 12.0,
    "unita": "reps",
    "recupero_sec": 90
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "forza-parte-alta-emom-b2",
  "nome": "Forza Parte Alta EMOM B2",
  "nomeEverfit": "Forza Parte Alta EMOM B2",
  "famiglia": "Forza Parte Alta Emom",
  "qualita": "forza-parte-alta",
  "qualitaSet": {
   "forza-parte-alta": 9,
   "forza-parte-bassa": 3
  },
  "livello": "B",
  "progressione": 2,
  "variante": "full",
  "durataMin": 21,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fpa-archer-pushup",
    "nomeEverfit": "Archer Push Up",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B2"
   },
   {
    "esercizio_id": "fpb-body-weight-pistol-squat",
    "nomeEverfit": "Body Weight Pistol Squat",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B2"
   },
   {
    "esercizio_id": "fpa-eccentric-handstand-push-up",
    "nomeEverfit": "Eccentric Handstand Push Up",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B2"
   },
   {
    "esercizio_id": "fpa-crow-pose-progression",
    "nomeEverfit": "Crow Pose Progression",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B2"
   },
   {
    "esercizio_id": "fpa-archer-pushup",
    "nomeEverfit": "Archer Push Up",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B2"
   },
   {
    "esercizio_id": "fpb-body-weight-pistol-squat",
    "nomeEverfit": "Body Weight Pistol Squat",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B2"
   },
   {
    "esercizio_id": "fpa-eccentric-handstand-push-up",
    "nomeEverfit": "Eccentric Handstand Push Up",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B2"
   },
   {
    "esercizio_id": "fpa-crow-pose-progression",
    "nomeEverfit": "Crow Pose Progression",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B2"
   },
   {
    "esercizio_id": "fpa-archer-pushup",
    "nomeEverfit": "Archer Push Up",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B2"
   },
   {
    "esercizio_id": "fpb-body-weight-pistol-squat",
    "nomeEverfit": "Body Weight Pistol Squat",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B2"
   },
   {
    "esercizio_id": "fpa-eccentric-handstand-push-up",
    "nomeEverfit": "Eccentric Handstand Push Up",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B2"
   },
   {
    "esercizio_id": "fpa-crow-pose-progression",
    "nomeEverfit": "Crow Pose Progression",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B2"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "forza-parte-alta-emom-b4",
  "nome": "Forza Parte Alta EMOM B4",
  "nomeEverfit": "Forza Parte Alta EMOM B4",
  "famiglia": "Forza Parte Alta Emom",
  "qualita": "forza-parte-alta",
  "qualitaSet": {
   "forza-parte-alta": 9,
   "core": 3
  },
  "livello": "B",
  "progressione": 4,
  "variante": "full",
  "durataMin": 21,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fpa-archer-pushup",
    "nomeEverfit": "Archer Push Up",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B4"
   },
   {
    "esercizio_id": "core2-flutter-kick-abs-low",
    "nomeEverfit": "Flutter Kick Abs Low",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B4"
   },
   {
    "esercizio_id": "fpa-type-writer-push-up",
    "nomeEverfit": "Type Writer Push Up",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B4"
   },
   {
    "esercizio_id": "fpa-crow-pose-progression",
    "nomeEverfit": "Crow Pose Progression",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B4"
   },
   {
    "esercizio_id": "fpa-archer-pushup",
    "nomeEverfit": "Archer Push Up",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B4"
   },
   {
    "esercizio_id": "core2-flutter-kick-abs-low",
    "nomeEverfit": "Flutter Kick Abs Low",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B4"
   },
   {
    "esercizio_id": "fpa-type-writer-push-up",
    "nomeEverfit": "Type Writer Push Up",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B4"
   },
   {
    "esercizio_id": "fpa-crow-pose-progression",
    "nomeEverfit": "Crow Pose Progression",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B4"
   },
   {
    "esercizio_id": "fpa-archer-pushup",
    "nomeEverfit": "Archer Push Up",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B4"
   },
   {
    "esercizio_id": "core2-flutter-kick-abs-low",
    "nomeEverfit": "Flutter Kick Abs Low",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B4"
   },
   {
    "esercizio_id": "fpa-type-writer-push-up",
    "nomeEverfit": "Type Writer Push Up",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B4"
   },
   {
    "esercizio_id": "fpa-crow-pose-progression",
    "nomeEverfit": "Crow Pose Progression",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Forza Full Body EMOM B4"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "forza-parte-alta-pro-a2",
  "nome": "Forza parte alta Pro A2",
  "nomeEverfit": "Forza parte alta Pro A2",
  "famiglia": "Forza Parte Alta Pro",
  "qualita": "forza-parte-alta",
  "qualitaSet": {
   "forza-parte-alta": 12,
   "core": 7,
   "forza-esplosiva": 4
  },
  "livello": "A",
  "progressione": 2,
  "variante": "full",
  "durataMin": 46,
  "attrezzatura": [
   "palestra",
   "piccoli attrezzi",
   "sbarra"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fpa-crow-pose-progression",
    "nomeEverfit": "Crow Pose Progression",
    "serie": 2,
    "quantita": 3.0,
    "unita": "reps",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "fpa-crow-pose-progression",
    "nomeEverfit": "Crow Pose Progression",
    "serie": 1,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "fpa-crow-pose-progression",
    "nomeEverfit": "Crow Pose Progression",
    "serie": 1,
    "quantita": 1.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fpa-one-arm-push-up-incline",
    "nomeEverfit": "One Arm Push Up Incline",
    "serie": 3,
    "quantita": 14.0,
    "unita": "reps",
    "recupero_sec": 90,
    "carico_kg": 5.0,
    "perLato": true
   },
   {
    "esercizio_id": "fpa-muscle-up",
    "nomeEverfit": "Muscle Up",
    "serie": 1,
    "quantita": 1.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 20.0,
    "nota": "piu diminuisce il peso, più cerca di essere veloce nel movimento"
   },
   {
    "esercizio_id": "fpa-muscle-up",
    "nomeEverfit": "Muscle Up",
    "serie": 1,
    "quantita": 3.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 15.0,
    "nota": "piu diminuisce il peso, più cerca di essere veloce nel movimento"
   },
   {
    "esercizio_id": "fpa-muscle-up",
    "nomeEverfit": "Muscle Up",
    "serie": 1,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 5.0,
    "nota": "piu diminuisce il peso, più cerca di essere veloce nel movimento"
   },
   {
    "esercizio_id": "fpa-weighted-dips-from-bars",
    "nomeEverfit": "Weighted Dips (From Bars)",
    "serie": 2,
    "quantita": 8.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 40.0,
    "nota": "piu diminuisce il peso, più cerca di essere veloce nel movimento"
   },
   {
    "esercizio_id": "core2-cable-reverse-crunch",
    "nomeEverfit": "Cable Reverse Crunch",
    "serie": 3,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 90,
    "carico_kg": 20.0
   },
   {
    "esercizio_id": "core2-hanging-oblique-knee-raise",
    "nomeEverfit": "Hanging Oblique Knee Raise",
    "serie": 4,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fesp-medicine-ball-lateral-throw",
    "nomeEverfit": "Medicine Ball Lateral Throw",
    "serie": 4,
    "quantita": 8.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 5.0,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Allenamento Forza massima parte Alta PRO",
  "tags": []
 },
 {
  "id": "forza-parte-alta-pro-a3",
  "nome": "Forza parte alta Pro A3",
  "nomeEverfit": "Forza parte alta Pro A3",
  "famiglia": "Forza Parte Alta Pro",
  "qualita": "forza-parte-alta",
  "qualitaSet": {
   "forza-parte-alta": 11,
   "core": 5,
   "forza-esplosiva": 4,
   "fascia-prevenzione": 4
  },
  "livello": "A",
  "progressione": 3,
  "variante": "full",
  "durataMin": 54,
  "attrezzatura": [
   "palestra",
   "piccoli attrezzi",
   "sbarra"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fpa-crow-pose-progression",
    "nomeEverfit": "Crow Pose Progression",
    "serie": 3,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 180
   },
   {
    "esercizio_id": "fpa-one-arm-push-up-incline",
    "nomeEverfit": "One Arm Push Up Incline",
    "serie": 3,
    "quantita": 8.0,
    "unita": "reps",
    "recupero_sec": 150,
    "carico_kg": 10.0,
    "perLato": true
   },
   {
    "esercizio_id": "fpa-muscle-up",
    "nomeEverfit": "Muscle Up",
    "serie": 1,
    "quantita": 1.0,
    "unita": "reps",
    "recupero_sec": 180,
    "carico_kg": 25.0,
    "nota": "piu diminuisce il peso, più cerca di essere veloce nel movimento"
   },
   {
    "esercizio_id": "fpa-muscle-up",
    "nomeEverfit": "Muscle Up",
    "serie": 1,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 180,
    "carico_kg": 20.0,
    "nota": "piu diminuisce il peso, più cerca di essere veloce nel movimento"
   },
   {
    "esercizio_id": "fpa-weighted-dips-from-bars",
    "nomeEverfit": "Weighted Dips (From Bars)",
    "serie": 1,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 40.0,
    "nota": "piu diminuisce il peso, più cerca di essere veloce nel movimento"
   },
   {
    "esercizio_id": "fpa-weighted-dips-from-bars",
    "nomeEverfit": "Weighted Dips (From Bars)",
    "serie": 2,
    "quantita": 8.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 20.0,
    "nota": "piu diminuisce il peso, più cerca di essere veloce nel movimento"
   },
   {
    "esercizio_id": "core2-cable-reverse-crunch",
    "nomeEverfit": "Cable Reverse Crunch",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 90,
    "carico_kg": 25.0
   },
   {
    "esercizio_id": "core2-cable-reverse-crunch",
    "nomeEverfit": "Cable Reverse Crunch",
    "serie": 1,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 90,
    "carico_kg": 15.0
   },
   {
    "esercizio_id": "core2-hanging-oblique-knee-raise",
    "nomeEverfit": "Hanging Oblique Knee Raise",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fesp-medicine-ball-lateral-throw",
    "nomeEverfit": "Medicine Ball Lateral Throw",
    "serie": 4,
    "quantita": 8.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 5.0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-plank-jumps-fascia",
    "nomeEverfit": "Plank Jumps Fascia",
    "serie": 2,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 40
   },
   {
    "esercizio_id": "fasc-plank-torsione-elastica-fascia",
    "nomeEverfit": "Plank torsione elastica fascia",
    "serie": 2,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 40
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Allenamento Forza massima parte Alta PRO",
  "tags": []
 },
 {
  "id": "forza-parte-alta-pro-a3-short",
  "nome": "Forza parte alta Pro A3 - short",
  "nomeEverfit": "Forza parte alta Pro A3 - short",
  "famiglia": "Forza Parte Alta Pro",
  "qualita": "forza-parte-alta",
  "qualitaSet": {
   "forza-parte-alta": 8,
   "core": 3,
   "forza-esplosiva": 2,
   "fascia-prevenzione": 4
  },
  "livello": "A",
  "progressione": 3,
  "variante": "short",
  "durataMin": 38,
  "attrezzatura": [
   "palestra",
   "piccoli attrezzi",
   "sbarra"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fpa-crow-pose-progression",
    "nomeEverfit": "Crow Pose Progression",
    "serie": 2,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 180
   },
   {
    "esercizio_id": "fpa-one-arm-push-up-incline",
    "nomeEverfit": "One Arm Push Up Incline",
    "serie": 2,
    "quantita": 8.0,
    "unita": "reps",
    "recupero_sec": 150,
    "carico_kg": 10.0,
    "perLato": true
   },
   {
    "esercizio_id": "fpa-muscle-up",
    "nomeEverfit": "Muscle Up",
    "serie": 1,
    "quantita": 1.0,
    "unita": "reps",
    "recupero_sec": 180,
    "carico_kg": 25.0,
    "nota": "piu diminuisce il peso, più cerca di essere veloce nel movimento"
   },
   {
    "esercizio_id": "fpa-muscle-up",
    "nomeEverfit": "Muscle Up",
    "serie": 1,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 180,
    "carico_kg": 20.0,
    "nota": "piu diminuisce il peso, più cerca di essere veloce nel movimento"
   },
   {
    "esercizio_id": "fpa-weighted-dips-from-bars",
    "nomeEverfit": "Weighted Dips (From Bars)",
    "serie": 1,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 40.0,
    "nota": "piu diminuisce il peso, più cerca di essere veloce nel movimento"
   },
   {
    "esercizio_id": "fpa-weighted-dips-from-bars",
    "nomeEverfit": "Weighted Dips (From Bars)",
    "serie": 1,
    "quantita": 8.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 20.0,
    "nota": "piu diminuisce il peso, più cerca di essere veloce nel movimento"
   },
   {
    "esercizio_id": "core2-cable-reverse-crunch",
    "nomeEverfit": "Cable Reverse Crunch",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 90,
    "carico_kg": 25.0
   },
   {
    "esercizio_id": "core2-hanging-oblique-knee-raise",
    "nomeEverfit": "Hanging Oblique Knee Raise",
    "serie": 1,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fesp-medicine-ball-lateral-throw",
    "nomeEverfit": "Medicine Ball Lateral Throw",
    "serie": 2,
    "quantita": 8.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 5.0,
    "perLato": true
   },
   {
    "esercizio_id": "fasc-plank-jumps-fascia",
    "nomeEverfit": "Plank Jumps Fascia",
    "serie": 2,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 40
   },
   {
    "esercizio_id": "fasc-plank-torsione-elastica-fascia",
    "nomeEverfit": "Plank torsione elastica fascia",
    "serie": 2,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 40
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Allenamento Forza massima parte Alta PRO",
  "tags": []
 },
 {
  "id": "forza-parte-alta-pro1",
  "nome": "Forza Parte Alta PRO1",
  "nomeEverfit": "Forza Parte Alta PRO1",
  "famiglia": "Forza Parte Alta",
  "qualita": "forza-parte-alta",
  "qualitaSet": {
   "forza-parte-alta": 13
  },
  "livello": "PRO",
  "progressione": 1,
  "variante": "full",
  "durataMin": 27,
  "attrezzatura": [
   "palestra",
   "sbarra"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fpa-crow-pose-progression",
    "nomeEverfit": "Crow Pose Progression",
    "serie": 2,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 90
   },
   {
    "esercizio_id": "fpa-crow-pose-progression",
    "nomeEverfit": "Crow Pose Progression",
    "serie": 2,
    "quantita": 1.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fpa-one-arm-push-up-incline",
    "nomeEverfit": "One Arm Push Up Incline",
    "serie": 3,
    "quantita": 12.0,
    "unita": "reps",
    "recupero_sec": 90,
    "perLato": true
   },
   {
    "esercizio_id": "fpa-muscle-up",
    "nomeEverfit": "Muscle Up",
    "serie": 1,
    "quantita": 3.0,
    "unita": "reps",
    "recupero_sec": 90,
    "carico_kg": 15.0,
    "nota": "piu diminuisce il peso, più cerca di essere veloce nel movimento"
   },
   {
    "esercizio_id": "fpa-muscle-up",
    "nomeEverfit": "Muscle Up",
    "serie": 1,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 90,
    "carico_kg": 10.0,
    "nota": "piu diminuisce il peso, più cerca di essere veloce nel movimento"
   },
   {
    "esercizio_id": "fpa-muscle-up",
    "nomeEverfit": "Muscle Up",
    "serie": 1,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 90,
    "nota": "piu diminuisce il peso, più cerca di essere veloce nel movimento"
   },
   {
    "esercizio_id": "fpa-weighted-dips-from-bars",
    "nomeEverfit": "Weighted Dips (From Bars)",
    "serie": 1,
    "quantita": 8.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 40.0,
    "nota": "piu diminuisce il peso, più cerca di essere veloce nel movimento"
   },
   {
    "esercizio_id": "fpa-weighted-dips-from-bars",
    "nomeEverfit": "Weighted Dips (From Bars)",
    "serie": 1,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 30.0,
    "nota": "piu diminuisce il peso, più cerca di essere veloce nel movimento"
   },
   {
    "esercizio_id": "fpa-weighted-dips-from-bars",
    "nomeEverfit": "Weighted Dips (From Bars)",
    "serie": 1,
    "quantita": 12.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 20.0,
    "nota": "piu diminuisce il peso, più cerca di essere veloce nel movimento"
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Allenamento Forza massima parte Alta PRO",
  "tags": []
 },
 {
  "id": "forza-parte-alta-pullp1",
  "nome": "Forza Parte alta PullP1",
  "nomeEverfit": "Forza Parte alta PullP1",
  "famiglia": "Forza Parte Alta PullP1",
  "qualita": "forza-parte-alta",
  "qualitaSet": {
   "core": 2,
   "forza-parte-alta": 15
  },
  "livello": null,
  "progressione": null,
  "variante": "full",
  "ruolo": "portiere",
  "durataMin": 35,
  "attrezzatura": [
   "palestra",
   "sbarra"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "core2-hanging-knee-raises",
    "nomeEverfit": "Hanging Knee Raise",
    "serie": 2,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "pull-5",
    "nomeEverfit": "Pull-Up",
    "serie": 4,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 120,
    "nota": "se non riesci ad arrivare alle ripetizioni, fai quelle che riesci"
   },
   {
    "esercizio_id": "pull-4",
    "nomeEverfit": "Band Assisted Pull Up",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "pull-4",
    "nomeEverfit": "Band Assisted Pull Up",
    "serie": 1,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "fpa-chin-up",
    "nomeEverfit": "Chin-Up",
    "serie": 3,
    "quantita": 8.0,
    "unita": "reps",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "fpa-90-chin-up-iso-hold",
    "nomeEverfit": "90 Chin Up Iso Hold",
    "serie": 2,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fpa-dumbbell-lateral-raise",
    "nomeEverfit": "Dumbbell Lateral Raise",
    "serie": 3,
    "quantita": 12.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 5.0
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "forza-parte-alta-push-corpo-libero-b3",
  "nome": "Forza Parte alta Push corpo libero B3",
  "nomeEverfit": "Forza Parte alta Push corpo libero B3",
  "famiglia": "Forza Parte Alta Push Corpo Libero",
  "qualita": "forza-parte-alta",
  "qualitaSet": {
   "core": 12,
   "forza-parte-alta": 4
  },
  "livello": "B",
  "progressione": 3,
  "variante": "full",
  "durataMin": 21,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "core2-cross-body-mountain-climbers",
    "nomeEverfit": "Cross Body Mountain Climbers",
    "serie": 3,
    "quantita": 1,
    "unita": "reps",
    "recupero_sec": 20
   },
   {
    "esercizio_id": "core-4",
    "nomeEverfit": "Alternating 2 Point Plank",
    "serie": 2,
    "quantita": 1,
    "unita": "secondi",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "core-4",
    "nomeEverfit": "Alternating 2 Point Plank",
    "serie": 1,
    "quantita": 1,
    "unita": "secondi",
    "recupero_sec": 45
   },
   {
    "esercizio_id": "core2-bear-crawl-linear",
    "nomeEverfit": "Bear Crawl Linear",
    "serie": 2,
    "quantita": 12.0,
    "unita": "reps",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "core2-bear-crawl-lateral",
    "nomeEverfit": "Bear Crawl Lateral",
    "serie": 1,
    "quantita": 12.0,
    "unita": "reps",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "core2-bear-crawl-lateral",
    "nomeEverfit": "Bear Crawl Lateral",
    "serie": 1,
    "quantita": 12.0,
    "unita": "reps",
    "recupero_sec": 45
   },
   {
    "esercizio_id": "push-2",
    "nomeEverfit": "Push-Up",
    "serie": 2,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "core2-full-moon-abs",
    "nomeEverfit": "Full Moon Abs",
    "serie": 2,
    "quantita": 16.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fpa-piegamenti-hindu",
    "nomeEverfit": "Piegamenti Hindu",
    "serie": 2,
    "quantita": 12.0,
    "unita": "reps",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "forza-parte-alta-push-p1",
  "nome": "Forza Parte alta Push P1",
  "nomeEverfit": "Forza Parte alta Push P1",
  "famiglia": "Forza Parte Alta Push",
  "qualita": "forza-parte-alta",
  "qualitaSet": {
   "forza-parte-alta": 14,
   "core": 6
  },
  "livello": null,
  "progressione": 1,
  "variante": "full",
  "ruolo": "portiere",
  "durataMin": 37,
  "attrezzatura": [
   "palestra"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "push-2",
    "nomeEverfit": "Push-Up",
    "serie": 1,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fpa-panca-piana-con-bilanciere",
    "nomeEverfit": "Barbell Bench Press",
    "serie": 2,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 30.0,
    "nota": "se non riesci ad arrivare alle ripetizioni, fai quelle che riesci"
   },
   {
    "esercizio_id": "fpa-panca-piana-con-bilanciere",
    "nomeEverfit": "Barbell Bench Press",
    "serie": 1,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 20,
    "carico_kg": 30.0,
    "nota": "se non riesci ad arrivare alle ripetizioni, fai quelle che riesci"
   },
   {
    "esercizio_id": "fpa-panca-piana-con-bilanciere",
    "nomeEverfit": "Barbell Bench Press",
    "serie": 1,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 20,
    "carico_kg": 25.0,
    "nota": "se non riesci ad arrivare alle ripetizioni, fai quelle che riesci"
   },
   {
    "esercizio_id": "fpa-panca-piana-con-bilanciere",
    "nomeEverfit": "Barbell Bench Press",
    "serie": 1,
    "quantita": 8.0,
    "unita": "reps",
    "recupero_sec": 20,
    "carico_kg": 20.0,
    "nota": "se non riesci ad arrivare alle ripetizioni, fai quelle che riesci"
   },
   {
    "esercizio_id": "fpa-panca-piana-con-bilanciere",
    "nomeEverfit": "Barbell Bench Press",
    "serie": 1,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 20,
    "carico_kg": 15.0,
    "nota": "se non riesci ad arrivare alle ripetizioni, fai quelle che riesci"
   },
   {
    "esercizio_id": "fpa-panca-piana-con-bilanciere",
    "nomeEverfit": "Barbell Bench Press",
    "serie": 1,
    "quantita": 12.0,
    "unita": "reps",
    "recupero_sec": 180,
    "carico_kg": 10.0,
    "nota": "se non riesci ad arrivare alle ripetizioni, fai quelle che riesci"
   },
   {
    "esercizio_id": "fpa-cuban-press",
    "nomeEverfit": "cuban press",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 4.0
   },
   {
    "esercizio_id": "fpa-cuban-press",
    "nomeEverfit": "cuban press",
    "serie": 1,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 4.0
   },
   {
    "esercizio_id": "fpa-dips",
    "nomeEverfit": "Dips - Chest Version",
    "serie": 3,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "core2-isometric-bear-crawl",
    "nomeEverfit": "Isometric Bear Crawl",
    "serie": 2,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 45
   },
   {
    "esercizio_id": "core2-bear-crawl-linear",
    "nomeEverfit": "Bear Crawl Linear",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "core2-bear-crawl-lateral",
    "nomeEverfit": "Bear Crawl Lateral",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "forza-parte-alta-push-p1-corpo-libero",
  "nome": "Forza Parte alta Push P1 - corpo libero",
  "nomeEverfit": "Forza Parte alta Push P1 - corpo libero",
  "famiglia": "Forza Parte Alta Push - Corpo Libero",
  "qualita": "forza-parte-alta",
  "qualitaSet": {
   "forza-parte-alta": 12,
   "core": 6,
   "forza-esplosiva": 3
  },
  "livello": null,
  "progressione": 1,
  "variante": "full",
  "ruolo": "portiere",
  "durataMin": 39,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "push-2",
    "nomeEverfit": "Push-Up",
    "serie": 3,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fpa-piegamenti-hindu",
    "nomeEverfit": "Piegamenti Hindu",
    "serie": 3,
    "quantita": 8.0,
    "unita": "reps",
    "recupero_sec": 60,
    "nota": "se non riesci ad arrivare alle ripetizioni, fai quelle che riesci"
   },
   {
    "esercizio_id": "fpa-cuban-press",
    "nomeEverfit": "cuban press",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 4.0
   },
   {
    "esercizio_id": "fpa-cuban-press",
    "nomeEverfit": "cuban press",
    "serie": 1,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 4.0
   },
   {
    "esercizio_id": "fpa-dips",
    "nomeEverfit": "Dips - Chest Version",
    "serie": 3,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "core2-isometric-bear-crawl",
    "nomeEverfit": "Isometric Bear Crawl",
    "serie": 2,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 45
   },
   {
    "esercizio_id": "fesp-piegamenti-plyo",
    "nomeEverfit": "piegamenti plyo",
    "serie": 3,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "core2-bear-crawl-linear",
    "nomeEverfit": "Bear Crawl Linear",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "core2-bear-crawl-lateral",
    "nomeEverfit": "Bear Crawl Lateral",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "forza-parte-bassa-forza-max",
  "nome": "Forza Parte Bassa - forza max",
  "nomeEverfit": "Forza Parte Bassa - forza max",
  "famiglia": "Forza Parte Bassa - Forza Max",
  "qualita": "forza-parte-bassa",
  "qualitaSet": {
   "forza-parte-bassa": 7,
   "forza-esplosiva": 7
  },
  "livello": null,
  "progressione": null,
  "variante": "full",
  "durataMin": 33,
  "attrezzatura": [
   "kettlebell",
   "palestra"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fpb-calf-raises",
    "nomeEverfit": "Calves raises",
    "serie": 1,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 30,
    "carico_kg": 20.0,
    "perLato": true
   },
   {
    "esercizio_id": "fpb-squat",
    "nomeEverfit": "Barbell Squat",
    "serie": 1,
    "quantita": 3.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 80.0,
    "nota": "Esegui lo squat con i talloni leggermente sollevati"
   },
   {
    "esercizio_id": "fpb-squat",
    "nomeEverfit": "Barbell Squat",
    "serie": 1,
    "quantita": 3.0,
    "unita": "reps",
    "recupero_sec": 150,
    "carico_kg": 90.0,
    "nota": "Esegui lo squat con i talloni leggermente sollevati"
   },
   {
    "esercizio_id": "fpb-squat",
    "nomeEverfit": "Barbell Squat",
    "serie": 1,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 150,
    "carico_kg": 95.0,
    "nota": "Esegui lo squat con i talloni leggermente sollevati"
   },
   {
    "esercizio_id": "fesp-kettlebell-swing",
    "nomeEverfit": "Kettlebell swing",
    "serie": 1,
    "quantita": 15.0,
    "unita": "reps",
    "recupero_sec": 90,
    "carico_kg": 20.0
   },
   {
    "esercizio_id": "fesp-kettlebell-swing",
    "nomeEverfit": "Kettlebell swing",
    "serie": 1,
    "quantita": 13.0,
    "unita": "reps",
    "recupero_sec": 90,
    "carico_kg": 24.0
   },
   {
    "esercizio_id": "fesp-kettlebell-swing",
    "nomeEverfit": "Kettlebell swing",
    "serie": 1,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 90,
    "carico_kg": 28.0
   },
   {
    "esercizio_id": "fpb-nordic-hamstring",
    "nomeEverfit": "nordic hamstring",
    "serie": 1,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "fpb-nordic-hamstring",
    "nomeEverfit": "nordic hamstring",
    "serie": 2,
    "quantita": 3.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 5.0
   },
   {
    "esercizio_id": "fesp-kneeling-jump-to-broad-jump",
    "nomeEverfit": "Kneeling Jump to Broad Jump",
    "serie": 2,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "fesp-fy-split-squat",
    "nomeEverfit": "FY Split Squat",
    "serie": 2,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 60.0
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Forza per tutte le parti del corpo della parte bassa, focus forza, prevenzione ed esercizi funzionale",
  "tags": []
 },
 {
  "id": "forza-parte-bassa-b1",
  "nome": "Forza Parte Bassa B1",
  "nomeEverfit": "Forza Parte Bassa B1",
  "famiglia": "Forza Parte Bassa",
  "qualita": "forza-parte-bassa",
  "qualitaSet": {
   "forza-parte-bassa": 15,
   "fascia-prevenzione": 3,
   "core": 3,
   "pliometria-intensiva": 3
  },
  "livello": "B",
  "progressione": 1,
  "variante": "full",
  "durataMin": 43,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fpb-wall-sit",
    "nomeEverfit": "Wall sit",
    "serie": 3,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-fascia-iso-lounge-runner",
    "nomeEverfit": "Fascia Iso Lounge Runner",
    "serie": 3,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fpb-tibialis-raises",
    "nomeEverfit": "Tibialis raises",
    "serie": 3,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fpb-calf-raises",
    "nomeEverfit": "Calf raises",
    "serie": 3,
    "quantita": 12.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "core2-copenaghen-plank",
    "nomeEverfit": "copenaghen plank",
    "serie": 3,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fpb-sissy-squat",
    "nomeEverfit": "sissy squat",
    "serie": 3,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fpb-glute-bridge-ad-una-gamba",
    "nomeEverfit": "Glute bridge ad una gamba",
    "serie": 3,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "plioi-squat-jump",
    "nomeEverfit": "Jump Squat",
    "serie": 3,
    "quantita": 12.0,
    "unita": "reps",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "forza-parte-bassa-b2",
  "nome": "Forza Parte Bassa B2",
  "nomeEverfit": "Forza Parte Bassa B2",
  "famiglia": "Forza Parte Bassa",
  "qualita": "forza-parte-bassa",
  "qualitaSet": {
   "forza-parte-bassa": 9,
   "fascia-prevenzione": 2,
   "core": 2
  },
  "livello": "B",
  "progressione": 2,
  "variante": "full",
  "durataMin": 27,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fpb-wall-sit",
    "nomeEverfit": "Wall sit",
    "serie": 2,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-fascia-iso-lounge-runner",
    "nomeEverfit": "Fascia Iso Lounge Runner",
    "serie": 2,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fpb-tibialis-raises",
    "nomeEverfit": "Tibialis raises",
    "serie": 2,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fpb-calf-raises",
    "nomeEverfit": "Calf raises",
    "serie": 2,
    "quantita": 25.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "core2-copenaghen-plank",
    "nomeEverfit": "copenaghen plank",
    "serie": 2,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fpb-glute-bridge-ad-una-gamba",
    "nomeEverfit": "Glute bridge ad una gamba",
    "serie": 3,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "forza-parte-bassa-completa-palestra",
  "nome": "Forza Parte Bassa Completa - Palestra",
  "nomeEverfit": "Forza Parte Bassa Completa - Palestra",
  "famiglia": "Forza Parte Bassa Completa - Palestra",
  "qualita": "forza-parte-bassa",
  "qualitaSet": {
   "forza-parte-bassa": 10,
   "forza-esplosiva": 3,
   "core": 2
  },
  "livello": null,
  "progressione": null,
  "variante": "full",
  "durataMin": 31,
  "attrezzatura": [
   "kettlebell",
   "palestra",
   "sbarra"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fpb-tibialis-raises",
    "nomeEverfit": "Tibialis raises",
    "serie": 2,
    "quantita": 15.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fpb-calf-raises",
    "nomeEverfit": "Calves raises",
    "serie": 1,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fpb-atg-split-squat",
    "nomeEverfit": "atg split squat",
    "serie": 1,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "fpb-squat",
    "nomeEverfit": "Barbell Squat",
    "serie": 1,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 85.0,
    "nota": "Esegui lo squat con i talloni leggermente sollevati"
   },
   {
    "esercizio_id": "fpb-squat",
    "nomeEverfit": "Barbell Squat",
    "serie": 1,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 80.0,
    "nota": "Esegui lo squat con i talloni leggermente sollevati"
   },
   {
    "esercizio_id": "fpb-squat",
    "nomeEverfit": "Barbell Squat",
    "serie": 1,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 75.0,
    "nota": "Esegui lo squat con i talloni leggermente sollevati"
   },
   {
    "esercizio_id": "fesp-kettlebell-swing",
    "nomeEverfit": "Kettlebell swing",
    "serie": 1,
    "quantita": 15.0,
    "unita": "reps",
    "recupero_sec": 90,
    "carico_kg": 20.0
   },
   {
    "esercizio_id": "fesp-kettlebell-swing",
    "nomeEverfit": "Kettlebell swing",
    "serie": 1,
    "quantita": 13.0,
    "unita": "reps",
    "recupero_sec": 90,
    "carico_kg": 24.0
   },
   {
    "esercizio_id": "fesp-kettlebell-swing",
    "nomeEverfit": "Kettlebell swing",
    "serie": 1,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 90,
    "carico_kg": 28.0
   },
   {
    "esercizio_id": "fpb-nordic-hamstring",
    "nomeEverfit": "nordic hamstring",
    "serie": 1,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "fpb-nordic-hamstring",
    "nomeEverfit": "nordic hamstring",
    "serie": 1,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 5.0
   },
   {
    "esercizio_id": "fpb-nordic-hamstring",
    "nomeEverfit": "nordic hamstring",
    "serie": 1,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "core2-copenaghen-plank",
    "nomeEverfit": "copenaghen plank",
    "serie": 1,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "core2-toes-to-bar",
    "nomeEverfit": "Toes to Bar",
    "serie": 1,
    "quantita": 12.0,
    "unita": "reps",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Forza per tutte le parti del corpo della parte bassa, focus forza, prevenzione ed esercizi funzionali",
  "tags": []
 },
 {
  "id": "forza-prevenzione-a1",
  "nome": "Forza Prevenzione A1",
  "nomeEverfit": "Forza Prevenzione A1",
  "famiglia": "Forza Prevenzione",
  "qualita": "forza-parte-bassa",
  "qualitaSet": {
   "forza-parte-bassa": 18,
   "core": 9
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 54,
  "attrezzatura": [
   "palestra",
   "sbarra"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fpb-tibialis-raises",
    "nomeEverfit": "Tibialis raises",
    "serie": 2,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 10.0
   },
   {
    "esercizio_id": "fpb-calf-raises",
    "nomeEverfit": "Calf raises",
    "serie": 2,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 5.0,
    "perLato": true
   },
   {
    "esercizio_id": "fpb-calf-raises",
    "nomeEverfit": "Calf raises",
    "serie": 1,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "fpb-atg-split-squat",
    "nomeEverfit": "atg split squat",
    "serie": 3,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 120,
    "perLato": true
   },
   {
    "esercizio_id": "fpb-sissy-squat",
    "nomeEverfit": "sissy squat",
    "serie": 3,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fpb-fy-squat",
    "nomeEverfit": "FY Squat",
    "serie": 1,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 20.0
   },
   {
    "esercizio_id": "fpb-fy-squat",
    "nomeEverfit": "FY Squat",
    "serie": 2,
    "quantita": 7.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 20.0
   },
   {
    "esercizio_id": "fpb-glute-bridge-ad-una-gamba",
    "nomeEverfit": "Glute bridge ad una gamba",
    "serie": 3,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "fpb-glute-bridge-ad-una-gamba",
    "nomeEverfit": "Glute bridge ad una gamba",
    "serie": 1,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "core2-copenaghen-plank",
    "nomeEverfit": "copenaghen plank",
    "serie": 2,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "core2-toes-to-bar",
    "nomeEverfit": "Toes to Bar",
    "serie": 3,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "core-4",
    "nomeEverfit": "Alternating 2 Point Plank",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 90
   },
   {
    "esercizio_id": "core2-plank-with-twist",
    "nomeEverfit": "Plank with Twist",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 90,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "forza-prevenzione-a2",
  "nome": "Forza Prevenzione A2",
  "nomeEverfit": "Forza Prevenzione A2",
  "famiglia": "Forza Prevenzione",
  "qualita": "forza-parte-bassa",
  "qualitaSet": {
   "forza-parte-bassa": 12,
   "pliometria-estensiva": 3,
   "pliometria-intensiva": 2,
   "core": 1
  },
  "livello": "A",
  "progressione": 2,
  "variante": "full",
  "durataMin": 43,
  "attrezzatura": [
   "palestra"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fpb-tibialis-raises",
    "nomeEverfit": "Tibialis raises",
    "serie": 1,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 15.0
   },
   {
    "esercizio_id": "fpb-calf-raises",
    "nomeEverfit": "Calf raises",
    "serie": 1,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 15.0,
    "perLato": true
   },
   {
    "esercizio_id": "plioe-pogo-jumps",
    "nomeEverfit": "Pogo Jumps",
    "serie": 3,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fpb-atg-split-squat",
    "nomeEverfit": "atg split squat",
    "serie": 1,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 5.0,
    "perLato": true
   },
   {
    "esercizio_id": "fpb-atg-split-squat",
    "nomeEverfit": "atg split squat",
    "serie": 1,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 120,
    "perLato": true
   },
   {
    "esercizio_id": "fpb-fy-squat",
    "nomeEverfit": "FY Squat",
    "serie": 2,
    "quantita": 7.0,
    "unita": "reps",
    "recupero_sec": 120,
    "carico_kg": 20.0
   },
   {
    "esercizio_id": "fpb-stacco-rumeno",
    "nomeEverfit": "Barbell Stiff Leg Romanian Deadlift",
    "serie": 2,
    "quantita": 7.0,
    "unita": "reps",
    "recupero_sec": 90,
    "carico_kg": 30.0
   },
   {
    "esercizio_id": "fpb-nordic-hamstring",
    "nomeEverfit": "nordic hamstring",
    "serie": 2,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 180
   },
   {
    "esercizio_id": "fpb-single-leg-rdl",
    "nomeEverfit": "single leg rdl",
    "serie": 2,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 10.0,
    "perLato": true
   },
   {
    "esercizio_id": "plioi-drop-jump",
    "nomeEverfit": "Drop Jump",
    "serie": 2,
    "quantita": 3.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "core2-copenaghen-plank",
    "nomeEverfit": "copenaghen plank",
    "serie": 1,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "hiit-base-1-corpo-libero",
  "nome": "HIIT BASE 1 corpo libero",
  "nomeEverfit": "HIIT BASE 1 corpo libero",
  "famiglia": "Hiit Base Corpo Libero",
  "qualita": "forza-parte-bassa",
  "qualitaSet": {
   "forza-parte-bassa": 9,
   "core": 6,
   "forza-parte-alta": 3
  },
  "livello": null,
  "progressione": null,
  "variante": "full",
  "durataMin": 21,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fpb-bodyweight-squat",
    "nomeEverfit": "Bodyweight Squat",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "HIIT base 1"
   },
   {
    "esercizio_id": "core-2",
    "nomeEverfit": "Plank",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "HIIT base 1"
   },
   {
    "esercizio_id": "push-1",
    "nomeEverfit": "Modified Push Up",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "HIIT base 1"
   },
   {
    "esercizio_id": "fpb-body-weight-bulgarian-split-squat",
    "nomeEverfit": "Body Weight Bulgarian Split Squat",
    "serie": 2,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "HIIT base 1",
    "nota": "uno per lato"
   },
   {
    "esercizio_id": "core2-incline-mountain-climbers",
    "nomeEverfit": "Incline Mountain Climbers",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "HIIT base 1"
   },
   {
    "esercizio_id": "fpb-bodyweight-squat",
    "nomeEverfit": "Bodyweight Squat",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "HIIT base 1"
   },
   {
    "esercizio_id": "core-2",
    "nomeEverfit": "Plank",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "HIIT base 1"
   },
   {
    "esercizio_id": "push-1",
    "nomeEverfit": "Modified Push Up",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "HIIT base 1"
   },
   {
    "esercizio_id": "fpb-body-weight-bulgarian-split-squat",
    "nomeEverfit": "Body Weight Bulgarian Split Squat",
    "serie": 2,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "HIIT base 1",
    "nota": "uno per lato"
   },
   {
    "esercizio_id": "core2-incline-mountain-climbers",
    "nomeEverfit": "Incline Mountain Climbers",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "HIIT base 1"
   },
   {
    "esercizio_id": "fpb-bodyweight-squat",
    "nomeEverfit": "Bodyweight Squat",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "HIIT base 1"
   },
   {
    "esercizio_id": "core-2",
    "nomeEverfit": "Plank",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "HIIT base 1"
   },
   {
    "esercizio_id": "push-1",
    "nomeEverfit": "Modified Push Up",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "HIIT base 1"
   },
   {
    "esercizio_id": "fpb-body-weight-bulgarian-split-squat",
    "nomeEverfit": "Body Weight Bulgarian Split Squat",
    "serie": 2,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "HIIT base 1",
    "nota": "uno per lato"
   },
   {
    "esercizio_id": "core2-incline-mountain-climbers",
    "nomeEverfit": "Incline Mountain Climbers",
    "serie": 1,
    "quantita": 40.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "HIIT base 1"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "kettlebell-dynamic-power-a1",
  "nome": "kettlebell dynamic power A1",
  "nomeEverfit": "kettlebell dynamic power A1",
  "famiglia": "Kettlebell Dynamic Power",
  "qualita": "forza-esplosiva",
  "qualitaSet": {
   "forza-esplosiva": 9,
   "forza-parte-alta": 2
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 20,
  "attrezzatura": [
   "kettlebell",
   "palestra"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fesp-kettlebell-dead-clean",
    "nomeEverfit": "kettlebell dead clean",
    "serie": 2,
    "quantita": 8.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 24.0,
    "perLato": true
   },
   {
    "esercizio_id": "fesp-kettlebell-snatch",
    "nomeEverfit": "Kettlebell snatch",
    "serie": 2,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 20.0,
    "perLato": true
   },
   {
    "esercizio_id": "fpa-kettlebell-clean-to-push",
    "nomeEverfit": "kettlebell clean to push",
    "serie": 2,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 90,
    "carico_kg": 20.0,
    "perLato": true
   },
   {
    "esercizio_id": "fesp-kettlebell-swing",
    "nomeEverfit": "Kettlebell swing",
    "serie": 3,
    "quantita": 14.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 24.0
   },
   {
    "esercizio_id": "fesp-kettlebell-kneeling-snatch",
    "nomeEverfit": "kettlebell kneeling snatch",
    "serie": 2,
    "quantita": 12.0,
    "unita": "reps",
    "recupero_sec": 45,
    "carico_kg": 12.0,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "kettlebell-movimento-fluido-a1",
  "nome": "Kettlebell movimento fluido A1",
  "nomeEverfit": "Kettlebell movimento fluido A1",
  "famiglia": "Kettlebell Movimento Fluido",
  "qualita": "forza-esplosiva",
  "qualitaSet": {
   "forza-parte-alta": 4,
   "core": 2,
   "forza-esplosiva": 6
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 17,
  "attrezzatura": [
   "kettlebell"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fpa-kettlebell-advanced-windmill",
    "nomeEverfit": "Kettlebell Advanced Windmill",
    "serie": 2,
    "quantita": 12.0,
    "unita": "reps",
    "recupero_sec": 30,
    "carico_kg": 12.0,
    "perLato": true
   },
   {
    "esercizio_id": "fpa-kettlebell-bent-over-row-with-rotation",
    "nomeEverfit": "Kettlebell Bent Over Row with Rotation",
    "serie": 2,
    "quantita": 8.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 16.0,
    "perLato": true
   },
   {
    "esercizio_id": "core2-kettlebell-figure-8",
    "nomeEverfit": "Kettlebell Figure 8",
    "serie": 2,
    "quantita": 12.0,
    "unita": "reps",
    "recupero_sec": 30,
    "carico_kg": 16.0,
    "perLato": true
   },
   {
    "esercizio_id": "fesp-kettlebell-cross-chop",
    "nomeEverfit": "Kettlebell Cross Chop",
    "serie": 2,
    "quantita": 8.0,
    "unita": "reps",
    "recupero_sec": 30,
    "carico_kg": 16.0,
    "perLato": true
   },
   {
    "esercizio_id": "fesp-kettlebell-rotational-swing",
    "nomeEverfit": "kettlebell rotational swing",
    "serie": 2,
    "quantita": 12.0,
    "unita": "reps",
    "recupero_sec": 30,
    "carico_kg": 16.0,
    "perLato": true
   },
   {
    "esercizio_id": "fesp-kettlebell-rotational-clean",
    "nomeEverfit": "kettlebell rotational clean",
    "serie": 2,
    "quantita": 8.0,
    "unita": "reps",
    "recupero_sec": 45,
    "carico_kg": 16.0,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "metabolico-a1",
  "nome": "Metabolico A1",
  "nomeEverfit": "Metabolico A1",
  "famiglia": "Metabolico",
  "qualita": "resistenza-metabolico",
  "qualitaSet": {
   "riscaldamento": 39
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 42,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 3,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 40,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 1,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 8,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 1,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 240,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 11,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 10,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 1,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 240,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 5,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 40,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 1,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 7,
    "quantita": 60.0,
    "unita": "metri",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 1,
    "quantita": 60.0,
    "unita": "metri",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "metabolico-a1-soft",
  "nome": "Metabolico A1 - SOFT",
  "nomeEverfit": "Metabolico A1 - SOFT",
  "famiglia": "Metabolico",
  "qualita": "resistenza-metabolico",
  "qualitaSet": {
   "riscaldamento": 15
  },
  "livello": "A",
  "progressione": 1,
  "variante": "short",
  "durataMin": 21,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 3,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 5,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 40,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 1,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 5,
    "quantita": 60.0,
    "unita": "metri",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 1,
    "quantita": 60.0,
    "unita": "metri",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "metabolico-a2",
  "nome": "Metabolico A2",
  "nomeEverfit": "Metabolico A2",
  "famiglia": "Metabolico",
  "qualita": "resistenza-metabolico",
  "qualitaSet": {
   "riscaldamento": 40
  },
  "livello": "A",
  "progressione": 2,
  "variante": "full",
  "durataMin": 39,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 3,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 40,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 1,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 11,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 10,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 1,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 240,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 5,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 40,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 1,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 7,
    "quantita": 60.0,
    "unita": "metri",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 1,
    "quantita": 60.0,
    "unita": "metri",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 9,
    "quantita": 30.0,
    "unita": "metri",
    "recupero_sec": 10,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 1,
    "quantita": 30.0,
    "unita": "metri",
    "recupero_sec": 240,
    "schema": "interval",
    "sezione": "1/1"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "metabolico-b1",
  "nome": "Metabolico B1",
  "nomeEverfit": "Metabolico B1",
  "famiglia": "Metabolico",
  "qualita": "resistenza-metabolico",
  "qualitaSet": {
   "riscaldamento": 30
  },
  "livello": "B",
  "progressione": 1,
  "variante": "full",
  "durataMin": 25,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 3,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 40,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 7,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 8,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 10,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 5,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 40,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 1,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "1/1"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 6,
    "quantita": 60.0,
    "unita": "metri",
    "recupero_sec": 20,
    "schema": "interval",
    "sezione": "1/1"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "passaggi-al-muro-tecnica-di-base",
  "nome": "Passaggi al Muro - Tecnica di base",
  "nomeEverfit": "Passaggi al Muro - Tecnica di base",
  "famiglia": "Passaggi Al Muro - Tecnica Di Base",
  "qualita": "tecnica-passaggi",
  "qualitaSet": {
   "tecnica-passaggi": 2
  },
  "livello": null,
  "progressione": null,
  "variante": "full",
  "durataMin": 23,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi al muro 2 tocchi, stop di esterno, passaggio interno - Tecnica",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "tpas-passaggi-liberi-al-muro-tecnica",
    "nomeEverfit": "Passaggi liberi al muro - Tecnica",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi al muro 1 tocco interno 1 piede - Tecnica",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi al muro solo collo di prima - Tecnica",
    "serie": 1,
    "quantita": 240.0,
    "unita": "secondi",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "tpas-passaggi-a-10mt-alternati-primo-tocco-suola-tecn",
    "nomeEverfit": "Passaggi a 10mt alternati, primo tocco suola - Tecnica",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 0
   }
  ],
  "completo": false,
  "mancanti": [
   "Passaggi al muro 1 tocco interno 1 piede - Tecnica",
   "Passaggi al muro 2 tocchi, stop di esterno, passaggio interno - Tecnica",
   "Passaggi al muro solo collo di prima - Tecnica"
  ],
  "tags": []
 },
 {
  "id": "passaggi-al-muro-tecnica-visione-a1",
  "nome": "passaggi al muro - Tecnica Visione A1",
  "nomeEverfit": "passaggi al muro - Tecnica Visione A1",
  "famiglia": "Passaggi Al Muro - Tecnica Visione",
  "qualita": "tecnica-visione",
  "qualitaSet": {
   "tecnica-visione": 5,
   "tecnica-passaggi": 3
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 43,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tvis-videocorso-visione-esercizi-base",
    "nomeEverfit": "Videocorso Visione - Esercizi Base",
    "serie": 1,
    "quantita": 10.0,
    "unita": "minuti",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "tvis-passaggi-al-muro-visione",
    "nomeEverfit": "Passaggi al muro - VISIONE",
    "serie": 2,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "nota": "INTENSITÀ BASSA"
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-5-10mt-alto-basso",
    "nomeEverfit": "Passaggi al muro 5-10mt alto-basso",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tvis-passaggi-al-muro-visione",
    "nomeEverfit": "Passaggi al muro - VISIONE",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "nota": "INTENSITÀ BASSA"
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-in-difficolta",
    "nomeEverfit": "Passaggi al muro in difficoltà",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 90
   },
   {
    "esercizio_id": "tvis-passaggi-al-muro-visione",
    "nomeEverfit": "Passaggi al muro - VISIONE",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "nota": "INTENSITÀ BASSA"
   },
   {
    "esercizio_id": "tpas-passaggi-liberi-al-muro-tecnica",
    "nomeEverfit": "Passaggi liberi al muro - Tecnica",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Passaggi e Visione\nCircuito Esterni",
  "tags": []
 },
 {
  "id": "pliometria-a1",
  "nome": "pliometria A1",
  "nomeEverfit": "pliometria A1",
  "famiglia": "Pliometria",
  "qualita": "pliometria-intensiva",
  "qualitaSet": {
   "pliometria-intensiva": 25
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 49,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "plioi-drop-jump",
    "nomeEverfit": "Drop Jump",
    "serie": 5,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 90
   },
   {
    "esercizio_id": "plioi-reverse-drop-jumps",
    "nomeEverfit": "Reverse drop jumps",
    "serie": 5,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "plioi-single-leg-drop-e-spinta-laterale",
    "nomeEverfit": "Single Leg Drop e spinta laterale",
    "serie": 4,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 90,
    "perLato": true
   },
   {
    "esercizio_id": "plioi-single-leg-drop-e-spinta-interna",
    "nomeEverfit": "Single leg drop e spinta interna",
    "serie": 4,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 90,
    "perLato": true
   },
   {
    "esercizio_id": "plioi-single-leg-lateral-drop-jump",
    "nomeEverfit": "Single leg lateral drop jump",
    "serie": 3,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 90,
    "perLato": true
   },
   {
    "esercizio_id": "plioi-single-leg-reverse-lateral-drop-progression",
    "nomeEverfit": "single leg Reverse lateral drop progression",
    "serie": 4,
    "quantita": 1.0,
    "unita": "reps",
    "recupero_sec": 45,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "pliometria-b1",
  "nome": "Pliometria B1",
  "nomeEverfit": "Pliometria B1",
  "famiglia": "Pliometria",
  "qualita": "pliometria-intensiva",
  "qualitaSet": {
   "pliometria-estensiva": 2,
   "pliometria-intensiva": 10
  },
  "livello": "B",
  "progressione": 1,
  "variante": "full",
  "durataMin": 24,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "plioe-pogo-jumps",
    "nomeEverfit": "Pogo Jumps",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "plioe-fascia-toe-bounces-single-leg-pogo-jumps",
    "nomeEverfit": "Fascia Toe Bounces Single Leg - Pogo Jumps",
    "serie": 1,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "plioi-drop-jump",
    "nomeEverfit": "Drop Jump",
    "serie": 3,
    "quantita": 3.0,
    "unita": "reps",
    "recupero_sec": 90
   },
   {
    "esercizio_id": "plioi-reverse-drop-jumps",
    "nomeEverfit": "Reverse drop jumps",
    "serie": 3,
    "quantita": 12.0,
    "unita": "reps",
    "recupero_sec": 90
   },
   {
    "esercizio_id": "plioi-single-leg-drop-e-spinta-laterale",
    "nomeEverfit": "Single Leg Drop e spinta laterale",
    "serie": 2,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "plioi-single-leg-lateral-drop-jump",
    "nomeEverfit": "Single leg lateral drop jump",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "pliometria-b1-short",
  "nome": "Pliometria B1 - short",
  "nomeEverfit": "Pliometria B1 - short",
  "famiglia": "Pliometria",
  "qualita": "pliometria-intensiva",
  "qualitaSet": {
   "pliometria-estensiva": 2,
   "pliometria-intensiva": 8
  },
  "livello": "B",
  "progressione": 1,
  "variante": "short",
  "durataMin": 19,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "plioe-pogo-jumps",
    "nomeEverfit": "Pogo Jumps",
    "serie": 1,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "plioe-fascia-toe-bounces-single-leg-pogo-jumps",
    "nomeEverfit": "Fascia Toe Bounces Single Leg - Pogo Jumps",
    "serie": 1,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "plioi-drop-jump",
    "nomeEverfit": "Drop Jump",
    "serie": 2,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 90,
    "nota": "rialzo di circa 30cm"
   },
   {
    "esercizio_id": "plioi-reverse-drop-jumps",
    "nomeEverfit": "Reverse drop jumps",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 90,
    "nota": "rialzo di circa 30/40cm"
   },
   {
    "esercizio_id": "plioi-single-leg-drop-e-spinta-laterale",
    "nomeEverfit": "Single Leg Drop e spinta laterale",
    "serie": 2,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true,
    "nota": "rialzo di circa 20/30cm"
   },
   {
    "esercizio_id": "plioi-single-leg-lateral-drop-jump",
    "nomeEverfit": "Single leg lateral drop jump",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true,
    "nota": "rialzo di circa 20/30cm"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "pliometria-b2",
  "nome": "pliometria B2",
  "nomeEverfit": "pliometria B2",
  "famiglia": "Pliometria",
  "qualita": "pliometria-intensiva",
  "qualitaSet": {
   "pliometria-intensiva": 15
  },
  "livello": "B",
  "progressione": 2,
  "variante": "full",
  "durataMin": 33,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "plioi-drop-jump",
    "nomeEverfit": "Drop Jump",
    "serie": 3,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 90
   },
   {
    "esercizio_id": "plioi-reverse-drop-jumps",
    "nomeEverfit": "Reverse drop jumps",
    "serie": 3,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "plioi-single-leg-drop-e-spinta-laterale",
    "nomeEverfit": "Single Leg Drop e spinta laterale",
    "serie": 3,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 90,
    "perLato": true
   },
   {
    "esercizio_id": "plioi-single-leg-drop-e-spinta-interna",
    "nomeEverfit": "Single leg drop e spinta interna",
    "serie": 3,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 90,
    "perLato": true
   },
   {
    "esercizio_id": "plioi-single-leg-lateral-drop-jump",
    "nomeEverfit": "Single leg lateral drop jump",
    "serie": 3,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 90,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "pliometria-rapidita-velocita-a1",
  "nome": "Pliometria Rapidità Velocità A1",
  "nomeEverfit": "Pliometria Rapidità Velocità A1",
  "famiglia": "Pliometria Rapidità Velocità",
  "qualita": "pliometria-intensiva",
  "qualitaSet": {
   "forza-esplosiva": 3,
   "test": 4,
   "pliometria-estensiva": 2,
   "pliometria-intensiva": 2,
   "velocita": 11
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 35,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fesp-forza-esplosiva-tecnica-salto-1-piede-e-2-piedi",
    "nomeEverfit": "Forza Esplosiva - Tecnica Salto 1 piede e 2 piedi",
    "serie": 3,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "test2-rapidita-ankle-stiffness-test",
    "nomeEverfit": "Rapidità Ankle Stiffness - Test",
    "serie": 4,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "plioe-pogo-jumps-progression-ankle-stiffness",
    "nomeEverfit": "Pogo Jumps progression (Ankle Stiffness )",
    "serie": 2,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 20.0
   },
   {
    "esercizio_id": "plioi-singl-leg-rdl-sl-knee-jump-progression-advanced",
    "nomeEverfit": "Singl Leg RDL - SL Knee Jump Progression Advanced",
    "serie": 2,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 90,
    "carico_kg": 8.0
   },
   {
    "esercizio_id": "vel-postura-velocita-difensori",
    "nomeEverfit": "Postura + Velocità Difensori",
    "serie": 2,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 4,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 50
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 3,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 2,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 90
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "pliometria-rapidita-velocita-a2",
  "nome": "Pliometria rapidità velocità A2",
  "nomeEverfit": "Pliometria rapidità velocità A2",
  "famiglia": "Pliometria Rapidità Velocità",
  "qualita": "pliometria-intensiva",
  "qualitaSet": {
   "pliometria-estensiva": 3,
   "forza-esplosiva": 3,
   "test": 3,
   "pliometria-intensiva": 2,
   "velocita": 13
  },
  "livello": "A",
  "progressione": 2,
  "variante": "full",
  "durataMin": 40,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "plioe-pogo-jumps",
    "nomeEverfit": "Pogo Jumps",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 120,
    "nota": "a 2 piedi"
   },
   {
    "esercizio_id": "fesp-forza-esplosiva-tecnica-salto-1-piede-e-2-piedi",
    "nomeEverfit": "Forza Esplosiva - Tecnica Salto 1 piede e 2 piedi",
    "serie": 3,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "test2-rapidita-ankle-stiffness-test",
    "nomeEverfit": "Rapidità Ankle Stiffness - Test",
    "serie": 3,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "plioe-pogo-jumps-progression-ankle-stiffness",
    "nomeEverfit": "Pogo Jumps progression (Ankle Stiffness )",
    "serie": 2,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 20.0
   },
   {
    "esercizio_id": "plioi-singl-leg-rdl-sl-knee-jump-progression-advanced",
    "nomeEverfit": "Singl Leg RDL - SL Knee Jump Progression Advanced",
    "serie": 2,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 90,
    "carico_kg": 8.0
   },
   {
    "esercizio_id": "vel-salto-triplo-e-sprint",
    "nomeEverfit": "Salto triplo e sprint",
    "serie": 2,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "vel-salto-triplo-e-sprint",
    "nomeEverfit": "Salto triplo e sprint",
    "serie": 2,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 40
   },
   {
    "esercizio_id": "vel-salto-triplo-e-sprint",
    "nomeEverfit": "Salto triplo e sprint",
    "serie": 2,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "vel-salto-triplo-a-1-gamba-e-sprint",
    "nomeEverfit": "Salto triplo a 1 gamba e sprint",
    "serie": 2,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "vel-salto-triplo-a-1-gamba-e-sprint",
    "nomeEverfit": "Salto triplo a 1 gamba e sprint",
    "serie": 2,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 90,
    "perLato": true
   },
   {
    "esercizio_id": "vel-salto-triplo-a-1-gamba-e-sprint",
    "nomeEverfit": "Salto triplo a 1 gamba e sprint",
    "serie": 1,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 120,
    "perLato": true
   },
   {
    "esercizio_id": "vel-postura-velocita-difensori",
    "nomeEverfit": "Postura + Velocità Difensori",
    "serie": 2,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 120
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "pliometria-rapidita-velocita-b1",
  "nome": "Pliometria Rapidità Velocità B1",
  "nomeEverfit": "Pliometria Rapidità Velocità B1",
  "famiglia": "Pliometria Rapidità Velocità",
  "qualita": "pliometria-intensiva",
  "qualitaSet": {
   "forza-esplosiva": 3,
   "test": 5,
   "pliometria-intensiva": 2,
   "pliometria-estensiva": 2,
   "velocita": 11
  },
  "livello": "B",
  "progressione": 1,
  "variante": "full",
  "durataMin": 31,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fesp-forza-esplosiva-tecnica-salto-1-piede-e-2-piedi",
    "nomeEverfit": "Forza Esplosiva - Tecnica Salto 1 piede e 2 piedi",
    "serie": 3,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "test2-test-salto-in-lungo-broad-jump",
    "nomeEverfit": "Test Salto in lungo - broad jump",
    "serie": 2,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "plioi-single-leg-lateral-drop-jump",
    "nomeEverfit": "Single leg lateral drop jump",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "test2-rapidita-ankle-stiffness-test",
    "nomeEverfit": "Rapidità Ankle Stiffness - Test",
    "serie": 3,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "plioe-pogo-jumps-progression-ankle-stiffness",
    "nomeEverfit": "Pogo Jumps progression (Ankle Stiffness )",
    "serie": 2,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 20.0
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 4,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 50
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 3,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 4,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 90
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "pliometria-rapidita-velocita-b1-short",
  "nome": "Pliometria Rapidità Velocità B1 - short",
  "nomeEverfit": "Pliometria Rapidità Velocità B1 - short",
  "famiglia": "Pliometria Rapidità Velocità",
  "qualita": "pliometria-intensiva",
  "qualitaSet": {
   "forza-esplosiva": 2,
   "test": 6,
   "pliometria-intensiva": 1,
   "velocita": 8
  },
  "livello": "B",
  "progressione": 1,
  "variante": "short",
  "durataMin": 23,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fesp-forza-esplosiva-tecnica-salto-1-piede-e-2-piedi",
    "nomeEverfit": "Forza Esplosiva - Tecnica Salto 1 piede e 2 piedi",
    "serie": 2,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "test2-test-salto-in-lungo-broad-jump",
    "nomeEverfit": "Test Salto in lungo - broad jump",
    "serie": 3,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "plioi-single-leg-lateral-drop-jump",
    "nomeEverfit": "Single leg lateral drop jump",
    "serie": 1,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "test2-rapidita-ankle-stiffness-test",
    "nomeEverfit": "Rapidità Ankle Stiffness - Test",
    "serie": 3,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 3,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 50
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 3,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 2,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 90
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "pliometria-rapidita-velocita-b2",
  "nome": "Pliometria Rapidità Velocità B2",
  "nomeEverfit": "Pliometria Rapidità Velocità B2",
  "famiglia": "Pliometria Rapidità Velocità",
  "qualita": "pliometria-intensiva",
  "qualitaSet": {
   "forza-esplosiva": 2,
   "test": 6,
   "pliometria-intensiva": 2,
   "pliometria-estensiva": 1,
   "velocita": 12
  },
  "livello": "B",
  "progressione": 2,
  "variante": "full",
  "durataMin": 39,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "fesp-forza-esplosiva-tecnica-salto-1-piede-e-2-piedi",
    "nomeEverfit": "Forza Esplosiva - Tecnica Salto 1 piede e 2 piedi",
    "serie": 2,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "test2-test-salto-in-lungo-broad-jump",
    "nomeEverfit": "Test Salto in lungo - broad jump",
    "serie": 3,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "plioi-single-leg-lateral-drop-jump",
    "nomeEverfit": "Single leg lateral drop jump",
    "serie": 2,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "test2-rapidita-ankle-stiffness-test",
    "nomeEverfit": "Rapidità Ankle Stiffness - Test",
    "serie": 3,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "plioe-pogo-jumps-progression-ankle-stiffness",
    "nomeEverfit": "Pogo Jumps progression (Ankle Stiffness )",
    "serie": 1,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 60,
    "carico_kg": 20.0
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 4,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 3,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 2,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 180
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 1,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 1,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 1,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 180
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "rapidita-e-tiro",
  "nome": "rapidità e Tiro",
  "nomeEverfit": "rapidità e Tiro",
  "famiglia": "Rapidità E Tiro",
  "qualita": "velocita",
  "qualitaSet": {
   "velocita": 7,
   "tecnica-tiro": 4
  },
  "livello": null,
  "progressione": null,
  "variante": "full",
  "durataMin": 22,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "vel-box-rapidita-e-tiro",
    "nomeEverfit": "BOX rapidità e Tiro",
    "serie": 4,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "vel-allenamento-rapidita-tecnica-tiro-in-porta-e-vel",
    "nomeEverfit": "Allenamento rapidità, tecnica, tiro in porta e velocità di pensiero per il calcio",
    "serie": 3,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "ttir-calcio-in-alto-e-tiro-in-porta",
    "nomeEverfit": "Calcio in alto e tiro in porta",
    "serie": 4,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 30
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "rapidita-velocita-b1-short",
  "nome": "Rapidità Velocità B1 - short",
  "nomeEverfit": "Rapidità Velocità B1 - short",
  "famiglia": "Rapidità Velocità",
  "qualita": "velocita",
  "qualitaSet": {
   "pliometria-intensiva": 1,
   "riscaldamento": 2,
   "pliometria-estensiva": 3,
   "velocita": 5
  },
  "livello": "B",
  "progressione": 1,
  "variante": "short",
  "durataMin": 14,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "plioi-spinta-frontale-corsa-skip-fascia",
    "nomeEverfit": "Spinta frontale corsa - skip - fascia",
    "serie": 1,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "risc-hip-external-rotation-skip",
    "nomeEverfit": "Hip External Rotation Skip",
    "serie": 2,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "plioe-fascia-a-skip",
    "nomeEverfit": "Fascia A-Skip",
    "serie": 3,
    "quantita": 10.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "attivazione"
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 2,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 50
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 3,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "resistenza-alla-velocita-a1",
  "nome": "Resistenza alla Velocità A1",
  "nomeEverfit": "Resistenza alla Velocità A1",
  "famiglia": "Resistenza Alla Velocità",
  "qualita": "resistenza-rsa",
  "qualitaSet": {
   "velocita": 4,
   "test": 4,
   "resistenza-aerobica": 6
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 28,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "vel-t-sprint",
    "nomeEverfit": "T sprint",
    "serie": 3,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 60,
    "nota": "ALTERNA 1 CON PALLA E 1 SENZA PALLA"
   },
   {
    "esercizio_id": "vel-t-sprint",
    "nomeEverfit": "T sprint",
    "serie": 1,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 240,
    "nota": "ALTERNA 1 CON PALLA E 1 SENZA PALLA"
   },
   {
    "esercizio_id": "test2-test-navetta-10mt-30",
    "nomeEverfit": "TEST NAVETTA 10mt - 30''",
    "serie": 3,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "test2-test-navetta-10mt-30",
    "nomeEverfit": "TEST NAVETTA 10mt - 30''",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 180
   },
   {
    "esercizio_id": "aer-allenamento-tecnica-resistenza-velocita-forza-es",
    "nomeEverfit": "Allenamento Tecnica - Resistenza - Velocità - Forza Esplosiva",
    "serie": 2,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 80,
    "nota": "esegui ogni esercizio del video a rotazione per il tempo indicato"
   },
   {
    "esercizio_id": "aer-allenamento-tecnica-resistenza-velocita-forza-es",
    "nomeEverfit": "Allenamento Tecnica - Resistenza - Velocità - Forza Esplosiva",
    "serie": 1,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 180,
    "nota": "esegui ogni esercizio del video a rotazione per il tempo indicato"
   },
   {
    "esercizio_id": "aer-allenamento-tecnica-resistenza-velocita-forza-es",
    "nomeEverfit": "Allenamento Tecnica - Resistenza - Velocità - Forza Esplosiva",
    "serie": 3,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 80,
    "nota": "esegui ogni esercizio del video a rotazione per il tempo indicato"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "resistenza-alla-velocita-b1",
  "nome": "Resistenza alla Velocità B1",
  "nomeEverfit": "Resistenza alla Velocità B1",
  "famiglia": "Resistenza Alla Velocità",
  "qualita": "resistenza-rsa",
  "qualitaSet": {
   "velocita": 3,
   "test": 3,
   "resistenza-aerobica": 6
  },
  "livello": "B",
  "progressione": 1,
  "variante": "full",
  "durataMin": 27,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "vel-t-sprint",
    "nomeEverfit": "T sprint",
    "serie": 2,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 60,
    "nota": "ALTERNA 1 CON PALLA E 1 SENZA PALLA"
   },
   {
    "esercizio_id": "vel-t-sprint",
    "nomeEverfit": "T sprint",
    "serie": 1,
    "quantita": 2.0,
    "unita": "reps",
    "recupero_sec": 240,
    "nota": "ALTERNA 1 CON PALLA E 1 SENZA PALLA"
   },
   {
    "esercizio_id": "test2-test-navetta-10mt-30",
    "nomeEverfit": "TEST NAVETTA 10mt - 30''",
    "serie": 2,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "test2-test-navetta-10mt-30",
    "nomeEverfit": "TEST NAVETTA 10mt - 30''",
    "serie": 1,
    "quantita": 30.0,
    "unita": "secondi",
    "recupero_sec": 180
   },
   {
    "esercizio_id": "aer-allenamento-tecnica-resistenza-velocita-forza-es",
    "nomeEverfit": "Allenamento Tecnica - Resistenza - Velocità - Forza Esplosiva",
    "serie": 2,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 90,
    "nota": "esegui ogni esercizio del video a rotazione per il tempo indicato"
   },
   {
    "esercizio_id": "aer-allenamento-tecnica-resistenza-velocita-forza-es",
    "nomeEverfit": "Allenamento Tecnica - Resistenza - Velocità - Forza Esplosiva",
    "serie": 1,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 180,
    "nota": "esegui ogni esercizio del video a rotazione per il tempo indicato"
   },
   {
    "esercizio_id": "aer-allenamento-tecnica-resistenza-velocita-forza-es",
    "nomeEverfit": "Allenamento Tecnica - Resistenza - Velocità - Forza Esplosiva",
    "serie": 2,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 90,
    "nota": "esegui ogni esercizio del video a rotazione per il tempo indicato"
   },
   {
    "esercizio_id": "aer-allenamento-tecnica-resistenza-velocita-forza-es",
    "nomeEverfit": "Allenamento Tecnica - Resistenza - Velocità - Forza Esplosiva",
    "serie": 1,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 120,
    "nota": "esegui ogni esercizio del video a rotazione per il tempo indicato"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "resistenza-e-tecnica-funzionale-a1",
  "nome": "Resistenza e Tecnica funzionale A1",
  "nomeEverfit": "Resistenza e Tecnica funzionale A1",
  "famiglia": "Resistenza E Tecnica Funzionale",
  "qualita": "tecnica-palleggi",
  "qualitaSet": {
   "resistenza-aerobica": 4
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 31,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "aer-esercizio-resistenza-e-tecnica-funzionale",
    "nomeEverfit": "Esercizio resistenza e tecnica funzionale",
    "serie": 4,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 180
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "resistenza-e-tecnica-funzionale-b1",
  "nome": "Resistenza e Tecnica funzionale B1",
  "nomeEverfit": "Resistenza e Tecnica funzionale B1",
  "famiglia": "Resistenza E Tecnica Funzionale",
  "qualita": "tecnica-palleggi",
  "qualitaSet": {
   "resistenza-aerobica": 4
  },
  "livello": "B",
  "progressione": 1,
  "variante": "full",
  "durataMin": 27,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "aer-esercizio-resistenza-e-tecnica-funzionale",
    "nomeEverfit": "Esercizio resistenza e tecnica funzionale",
    "serie": 4,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 180
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "ripetute-a1",
  "nome": "Ripetute A1",
  "nomeEverfit": "Ripetute A1",
  "famiglia": "Ripetute",
  "qualita": "resistenza-aerobica",
  "qualitaSet": {
   "resistenza-aerobica": 6,
   "tecnica-passaggi": 4
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 33,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "aer-ripetute",
    "nomeEverfit": "Ripetute",
    "serie": 1,
    "quantita": 1000.0,
    "unita": "metri",
    "recupero_sec": 180
   },
   {
    "esercizio_id": "aer-ripetute",
    "nomeEverfit": "Ripetute",
    "serie": 1,
    "quantita": 600.0,
    "unita": "metri",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "aer-ripetute",
    "nomeEverfit": "Ripetute",
    "serie": 1,
    "quantita": 300.0,
    "unita": "metri",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "aer-ripetute",
    "nomeEverfit": "Ripetute",
    "serie": 1,
    "quantita": 200.0,
    "unita": "metri",
    "recupero_sec": 50
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 40
   },
   {
    "esercizio_id": "aer-fartlek",
    "nomeEverfit": "Fartlek",
    "serie": 1,
    "quantita": 10.0,
    "unita": "secondi",
    "recupero_sec": 50
   },
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 120,
    "nota": "A bassa intensità"
   },
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 1,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 120,
    "nota": "A bassa intensità"
   },
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 1,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 120,
    "nota": "A bassa intensità"
   },
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 120,
    "nota": "A bassa intensità"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "riscaldamento-sprint",
  "nome": "Riscaldamento Sprint",
  "nomeEverfit": "Riscaldamento Sprint",
  "famiglia": "Riscaldamento Sprint",
  "qualita": "riscaldamento",
  "qualitaSet": {
   "riscaldamento": 7
  },
  "livello": null,
  "progressione": null,
  "variante": "full",
  "durataMin": 9,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo riscaldamento",
    "serie": 3,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo riscaldamento",
    "serie": 2,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 50
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo riscaldamento",
    "serie": 2,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 30
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Esegui degli allunghi graduali fino ad arrivare agli ultimi quasi massimali",
  "tags": []
 },
 {
  "id": "riscaldamento-sprint-velocita",
  "nome": "Riscaldamento Sprint Velocità",
  "nomeEverfit": "Riscaldamento Sprint Velocità",
  "famiglia": "Riscaldamento Sprint Velocità",
  "qualita": "riscaldamento",
  "qualitaSet": {
   "pliometria-estensiva": 9,
   "velocita": 3,
   "riscaldamento": 4
  },
  "livello": null,
  "progressione": null,
  "variante": "full",
  "durataMin": 11,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "plioe-fascia-a-skip",
    "nomeEverfit": "Fascia A-Skip",
    "serie": 6,
    "quantita": 10.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "attivazione"
   },
   {
    "esercizio_id": "plioe-saltelli-in-mezzo-affondo-con-switch",
    "nomeEverfit": "Saltelli in mezzo affondo con switch",
    "serie": 3,
    "quantita": 10.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "attivazione"
   },
   {
    "esercizio_id": "vel-navette-laterali-con-pallina-da-tennis",
    "nomeEverfit": "navette laterali con pallina da tennis",
    "serie": 3,
    "quantita": 10.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "attivazione"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 4,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 20,
    "schema": "attivazione"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "riscaldamento-sprint-velocita-2",
  "nome": "Riscaldamento Sprint Velocità 2",
  "nomeEverfit": "Riscaldamento Sprint Velocità 2",
  "famiglia": "Riscaldamento Sprint Velocità",
  "qualita": "riscaldamento",
  "qualitaSet": {
   "pliometria-estensiva": 8,
   "velocita": 3,
   "test": 3,
   "riscaldamento": 4
  },
  "livello": null,
  "progressione": null,
  "variante": "full",
  "durataMin": 12,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "plioe-fascia-a-skip",
    "nomeEverfit": "Fascia A-Skip",
    "serie": 5,
    "quantita": 10.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "attivazione"
   },
   {
    "esercizio_id": "plioe-saltelli-in-mezzo-affondo-con-switch",
    "nomeEverfit": "Saltelli in mezzo affondo con switch",
    "serie": 3,
    "quantita": 10.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "attivazione"
   },
   {
    "esercizio_id": "vel-navette-laterali-con-pallina-da-tennis",
    "nomeEverfit": "navette laterali con pallina da tennis",
    "serie": 3,
    "quantita": 10.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "schema": "attivazione"
   },
   {
    "esercizio_id": "test2-rapidita-ankle-stiffness-test",
    "nomeEverfit": "Rapidità Ankle Stiffness - Test",
    "serie": 3,
    "quantita": 10.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "perLato": true,
    "schema": "attivazione"
   },
   {
    "esercizio_id": "risc-allungo-riscaldamento",
    "nomeEverfit": "Allungo",
    "serie": 4,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 20,
    "schema": "attivazione"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "salite-metabolico-a1",
  "nome": "Salite Metabolico A1",
  "nomeEverfit": "Salite Metabolico A1",
  "famiglia": "Salite Metabolico",
  "qualita": "resistenza-metabolico",
  "qualitaSet": {
   "resistenza-metabolico": 5,
   "velocita": 19
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 28,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "met-salite-allungo",
    "nomeEverfit": "Salite allungo",
    "serie": 2,
    "quantita": 200.0,
    "unita": "metri",
    "recupero_sec": 90,
    "schema": "interval",
    "sezione": "Salite Metabolico A1"
   },
   {
    "esercizio_id": "met-salite-allungo",
    "nomeEverfit": "Salite allungo",
    "serie": 2,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 60,
    "schema": "interval",
    "sezione": "Salite Metabolico A1"
   },
   {
    "esercizio_id": "met-salite-allungo",
    "nomeEverfit": "Salite allungo",
    "serie": 1,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 180,
    "schema": "interval",
    "sezione": "Salite Metabolico A1"
   },
   {
    "esercizio_id": "vel-salite-sprint",
    "nomeEverfit": "Salite Sprint",
    "serie": 2,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 50,
    "schema": "interval",
    "sezione": "Salite Metabolico A1"
   },
   {
    "esercizio_id": "vel-salite-sprint",
    "nomeEverfit": "Salite Sprint",
    "serie": 2,
    "quantita": 30.0,
    "unita": "metri",
    "recupero_sec": 50,
    "schema": "interval",
    "sezione": "Salite Metabolico A1"
   },
   {
    "esercizio_id": "vel-salite-sprint",
    "nomeEverfit": "Salite Sprint",
    "serie": 1,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 50,
    "schema": "interval",
    "sezione": "Salite Metabolico A1"
   },
   {
    "esercizio_id": "vel-salite-sprint",
    "nomeEverfit": "Salite Sprint",
    "serie": 3,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 30,
    "schema": "interval",
    "sezione": "Salite Metabolico A1"
   },
   {
    "esercizio_id": "vel-salite-sprint",
    "nomeEverfit": "Salite Sprint",
    "serie": 1,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 90,
    "schema": "interval",
    "sezione": "Salite Metabolico A1"
   },
   {
    "esercizio_id": "vel-salite-sprint",
    "nomeEverfit": "Salite Sprint",
    "serie": 4,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 50,
    "schema": "interval",
    "sezione": "Salite Metabolico A1"
   },
   {
    "esercizio_id": "vel-salite-sprint",
    "nomeEverfit": "Salite Sprint",
    "serie": 6,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 30,
    "schema": "interval",
    "sezione": "Salite Metabolico A1"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "salite-resistenza-a1",
  "nome": "Salite Resistenza A1",
  "nomeEverfit": "Salite Resistenza A1",
  "famiglia": "Salite Resistenza",
  "qualita": "resistenza-aerobica",
  "qualitaSet": {
   "velocita": 5
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 11,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "vel-sprint-e-salite-forza-esplosiva",
    "nomeEverfit": "Sprint e Salite - Forza esplosiva",
    "serie": 1,
    "quantita": 200.0,
    "unita": "metri",
    "recupero_sec": 120,
    "nota": "esegui le salita in progressione, arrivando circa all 80% della velocità"
   },
   {
    "esercizio_id": "vel-sprint-e-salite-forza-esplosiva",
    "nomeEverfit": "Sprint e Salite - Forza esplosiva",
    "serie": 1,
    "quantita": 150.0,
    "unita": "metri",
    "recupero_sec": 90,
    "nota": "esegui le salita in progressione, arrivando circa all 80% della velocità"
   },
   {
    "esercizio_id": "vel-sprint-e-salite-forza-esplosiva",
    "nomeEverfit": "Sprint e Salite - Forza esplosiva",
    "serie": 1,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 60,
    "nota": "esegui le salita in progressione, arrivando circa all 80% della velocità"
   },
   {
    "esercizio_id": "vel-sprint-e-salite-forza-esplosiva",
    "nomeEverfit": "Sprint e Salite - Forza esplosiva",
    "serie": 1,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 40,
    "nota": "esegui le salita in progressione, arrivando circa all 80% della velocità"
   },
   {
    "esercizio_id": "vel-box-rapidita-e-tiro",
    "nomeEverfit": "BOX rapidità e Tiro",
    "serie": 1,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 60,
    "nota": "ESEGUI NON A MASSIMA VELOCITA', circa a 70/80%"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "salite-sprint-a1",
  "nome": "Salite Sprint A1",
  "nomeEverfit": "Salite Sprint A1",
  "famiglia": "Salite Sprint",
  "qualita": "resistenza-metabolico",
  "qualitaSet": {
   "velocita": 14
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 15,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "vel-salite-sprint",
    "nomeEverfit": "Salite Sprint",
    "serie": 2,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 50,
    "schema": "interval",
    "sezione": "Salite Sprint A1"
   },
   {
    "esercizio_id": "vel-salite-sprint",
    "nomeEverfit": "Salite Sprint",
    "serie": 2,
    "quantita": 29.999999999999996,
    "unita": "metri",
    "recupero_sec": 50,
    "schema": "interval",
    "sezione": "Salite Sprint A1"
   },
   {
    "esercizio_id": "vel-salite-sprint",
    "nomeEverfit": "Salite Sprint",
    "serie": 1,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 50,
    "schema": "interval",
    "sezione": "Salite Sprint A1"
   },
   {
    "esercizio_id": "vel-salite-sprint",
    "nomeEverfit": "Salite Sprint",
    "serie": 2,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 30,
    "schema": "interval",
    "sezione": "Salite Sprint A1"
   },
   {
    "esercizio_id": "vel-salite-sprint",
    "nomeEverfit": "Salite Sprint",
    "serie": 1,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 120,
    "schema": "interval",
    "sezione": "Salite Sprint A1"
   },
   {
    "esercizio_id": "vel-salite-sprint",
    "nomeEverfit": "Salite Sprint",
    "serie": 3,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 50,
    "schema": "interval",
    "sezione": "Salite Sprint A1"
   },
   {
    "esercizio_id": "vel-salite-sprint",
    "nomeEverfit": "Salite Sprint",
    "serie": 3,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 30,
    "schema": "interval",
    "sezione": "Salite Sprint A1"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-a1-muro",
  "nome": "Tecnica A1 Muro",
  "nomeEverfit": "Tecnica A1 Muro",
  "famiglia": "Tecnica Muro",
  "qualita": "tecnica-passaggi",
  "qualitaSet": {
   "tecnica-passaggi": 9
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 47,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpas-passaggi-al-muro-1-tocco-interno-tecnica",
    "nomeEverfit": "Passaggi al muro 1 tocco interno - Tecnica",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-1-tocco-collo-tecnica",
    "nomeEverfit": "Passaggi al muro 1 tocco collo - Tecnica",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-controllo-suola-sposto-palla",
    "nomeEverfit": "Passaggi al muro - Controllo suola, sposto palla",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-2-tocchi-controllo-esterno-pass",
    "nomeEverfit": "Passaggi al muro 2 tocchi - controllo esterno, passaggio interno",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-2-tocchi-stop-di-esterno-passag",
    "nomeEverfit": "Passaggi al muro 2 tocchi - stop di esterno, passaggio collo - Tecnica",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-liberi-al-muro-tecnica",
    "nomeEverfit": "Passaggi liberi al muro - Tecnica",
    "serie": 1,
    "quantita": 6.0,
    "unita": "minuti",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "nota": "Bassa intensità"
   },
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 1,
    "quantita": 150.0,
    "unita": "secondi",
    "recupero_sec": 120,
    "nota": "Bassa intensità"
   },
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 120,
    "nota": "Bassa intensità"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-a2-muro",
  "nome": "Tecnica A2 Muro",
  "nomeEverfit": "Tecnica A2 Muro",
  "famiglia": "Tecnica Muro",
  "qualita": "tecnica-passaggi",
  "qualitaSet": {
   "tecnica-passaggi": 10
  },
  "livello": "A",
  "progressione": 2,
  "variante": "full",
  "durataMin": 55,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpas-passaggi-al-muro-1-tocco-interno-tecnica",
    "nomeEverfit": "Passaggi al muro 1 tocco interno - Tecnica",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-1-tocco-collo-tecnica",
    "nomeEverfit": "Passaggi al muro 1 tocco collo - Tecnica",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-controllo-interno-turn-180-tecn",
    "nomeEverfit": "Passaggi al muro - Controllo interno, turn 180 - TECNICA",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-controllo-suola-sposto-palla",
    "nomeEverfit": "Passaggi al muro - Controllo suola, sposto palla",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-in-difficolta",
    "nomeEverfit": "Passaggi al muro in difficoltà",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-5-10mt-alto-basso",
    "nomeEverfit": "Passaggi al muro 5-10mt alto-basso",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-liberi-al-muro-tecnica",
    "nomeEverfit": "Passaggi liberi al muro - Tecnica",
    "serie": 1,
    "quantita": 6.0,
    "unita": "minuti",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "nota": "Bassa intensità"
   },
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 1,
    "quantita": 150.0,
    "unita": "secondi",
    "recupero_sec": 120,
    "nota": "Bassa intensità"
   },
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 120,
    "nota": "Bassa intensità"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-a3-muro-2-tocchi",
  "nome": "Tecnica A3 Muro 2 tocchi",
  "nomeEverfit": "Tecnica A3 Muro 2 tocchi",
  "famiglia": "Tecnica Muro Tocchi",
  "qualita": "tecnica-passaggi",
  "qualitaSet": {
   "tecnica-palleggi": 3,
   "tecnica-passaggi": 7,
   "tecnica-visione": 3
  },
  "livello": "A",
  "progressione": 3,
  "variante": "full",
  "durataMin": 52,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpal-palleggi-al-muro-2-tocchi",
    "nomeEverfit": "Palleggi al muro 2 tocchi",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-2-tocchi-controllo-interno-pass",
    "nomeEverfit": "palleggi al muro 2 tocchi - controllo interno, passaggio collo",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-2-tocchi-controllo-esterno-pass",
    "nomeEverfit": "Palleggi al muro 2 tocchi - controllo esterno, passaggio collo",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-2-tocchi-stop-di-esterno-passag",
    "nomeEverfit": "Passaggi al muro 2 tocchi - stop di esterno, passaggio collo - Tecnica",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-2-tocchi-controllo-di-interno-a-2",
    "nomeEverfit": "Passaggi al muro 2 tocchi - controllo di interno ad aprire",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-2-tocchi-controllo-di-interno-a",
    "nomeEverfit": "Passaggi al muro 2 tocchi - Controllo di interno a chiudere",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-5-10mt-alto-basso",
    "nomeEverfit": "Passaggi al muro 5-10mt alto-basso",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-in-difficolta",
    "nomeEverfit": "Passaggi al muro in difficoltà",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "nota": "Bassa intensità"
   },
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 1,
    "quantita": 150.0,
    "unita": "secondi",
    "recupero_sec": 120,
    "nota": "Bassa intensità"
   },
   {
    "esercizio_id": "tvis-dribbling-visione-e-reattivita-base",
    "nomeEverfit": "Dribbling visione e reattività - Base",
    "serie": 3,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-a3-muro-2-tocchi-tecnica-di-base-1",
  "nome": "Tecnica A3 Muro 2 tocchi - Tecnica di base 1",
  "nomeEverfit": "Tecnica A3 Muro 2 tocchi - Tecnica di base 1",
  "famiglia": "Tecnica Muro Tocchi - Tecnica Di Base",
  "qualita": "tecnica-passaggi",
  "qualitaSet": {
   "tecnica-palleggi": 3,
   "tecnica-passaggi": 8
  },
  "livello": "A",
  "progressione": 3,
  "variante": "full",
  "durataMin": 55,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpal-palleggi-al-muro-2-tocchi",
    "nomeEverfit": "Palleggi al muro 2 tocchi",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-2-tocchi-controllo-interno-pass",
    "nomeEverfit": "palleggi al muro 2 tocchi - controllo interno, passaggio collo",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-2-tocchi-controllo-esterno-pass",
    "nomeEverfit": "Palleggi al muro 2 tocchi - controllo esterno, passaggio collo",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-2-tocchi-stop-di-esterno-passag",
    "nomeEverfit": "Passaggi al muro 2 tocchi - stop di esterno, passaggio collo - Tecnica",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-2-tocchi-controllo-di-interno-a-2",
    "nomeEverfit": "Passaggi al muro 2 tocchi - controllo di interno ad aprire",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-2-tocchi-controllo-di-interno-a",
    "nomeEverfit": "Passaggi al muro 2 tocchi - Controllo di interno a chiudere",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-5-10mt-alto-basso",
    "nomeEverfit": "Passaggi al muro 5-10mt alto-basso",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-in-difficolta",
    "nomeEverfit": "Passaggi al muro in difficoltà",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "nota": "Bassa intensità"
   },
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 1,
    "quantita": 150.0,
    "unita": "secondi",
    "recupero_sec": 120,
    "nota": "Bassa intensità"
   },
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 120,
    "nota": "Bassa intensità"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-al-muro-passaggi-e-palleggi-a1",
  "nome": "Tecnica al muro passaggi e palleggi A1",
  "nomeEverfit": "Tecnica al muro passaggi e palleggi A1",
  "famiglia": "Tecnica Al Muro Passaggi E Palleggi",
  "qualita": "tecnica-palleggi",
  "qualitaSet": {
   "tecnica-passaggi": 7,
   "test": 2
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 37,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpas-passaggi-liberi-al-muro-tecnica",
    "nomeEverfit": "Passaggi liberi al muro - Tecnica",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-ravvicinati-interno-esterno-tec",
    "nomeEverfit": "Passaggi al muro ravvicinati interno esterno - tecnica di base",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-ravvicinati-solo-collo-tecnica",
    "nomeEverfit": "Passaggi al muro ravvicinati solo collo - tecnica di base",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-controllo-orientato-con-finta-e",
    "nomeEverfit": "Passaggi al muro - controllo orientato con finta esterno",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-controllo-orientato-interno",
    "nomeEverfit": "Passaggi al muro - controllo orientato interno",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-controllo-alzando-palla",
    "nomeEverfit": "Passaggi al muro - controllo alzando palla",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-controllo-sombrero",
    "nomeEverfit": "Passaggi al muro - controllo sombrero",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "test2-palleggi-liberi-piedi-coscia-spalla-testa",
    "nomeEverfit": "Palleggi liberi piedi coscia spalla testa",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "test2-palleggi-liberi-coscia-e-testa",
    "nomeEverfit": "Palleggi liberi coscia e testa",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-al-muro-passaggi-e-controllo-a1",
  "nome": "Tecnica al Muro, passaggi e controllo A1",
  "nomeEverfit": "Tecnica al Muro, passaggi e controllo A1",
  "famiglia": "Tecnica Al Muro, Passaggi E Controllo",
  "qualita": "tecnica-passaggi",
  "qualitaSet": {
   "tecnica-palleggi": 1,
   "test": 1,
   "tecnica-passaggi": 12
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 60,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpal-palleggi-coscia-e-collo",
    "nomeEverfit": "Palleggi coscia e collo",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "test2-palleggi-piedi-coscia-testa",
    "nomeEverfit": "palleggi piedi coscia testa",
    "serie": 1,
    "quantita": 300.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-controllo-180gradi-tecnica",
    "nomeEverfit": "Passaggi al muro controllo 180gradi - TECNICA",
    "serie": 2,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-5-10mt-alto-basso",
    "nomeEverfit": "Passaggi al muro 5-10mt alto-basso",
    "serie": 2,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-2-tocchi-stop-di-esterno-passag",
    "nomeEverfit": "Passaggi al muro 2 tocchi - stop di esterno, passaggio collo - Tecnica",
    "serie": 2,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-controllo-interno-turn-180-tecn",
    "nomeEverfit": "Passaggi al muro - Controllo interno, turn 180 - TECNICA",
    "serie": 3,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-2-tocchi-stop-di-esterno-passag",
    "nomeEverfit": "Passaggi al muro 2 tocchi - stop di esterno, passaggio collo - Tecnica",
    "serie": 3,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-al-muro-passaggi-e-controllo-a1-short",
  "nome": "Tecnica al Muro, passaggi e controllo A1 - short",
  "nomeEverfit": "Tecnica al Muro, passaggi e controllo A1 - short",
  "famiglia": "Tecnica Al Muro, Passaggi E Controllo",
  "qualita": "tecnica-passaggi",
  "qualitaSet": {
   "test": 1,
   "tecnica-passaggi": 5
  },
  "livello": "A",
  "progressione": 1,
  "variante": "short",
  "durataMin": 20,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "test2-palleggi-piedi-coscia-testa",
    "nomeEverfit": "palleggi piedi coscia testa",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-controllo-180gradi-tecnica",
    "nomeEverfit": "Passaggi al muro controllo 180gradi - TECNICA",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-5-10mt-alto-basso",
    "nomeEverfit": "Passaggi al muro 5-10mt alto-basso",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-2-tocchi-stop-di-esterno-passag",
    "nomeEverfit": "Passaggi al muro 2 tocchi - stop di esterno, passaggio collo - Tecnica",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-controllo-interno-turn-180-tecn",
    "nomeEverfit": "Passaggi al muro - Controllo interno, turn 180 - TECNICA",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-passaggi-al-muro-2-tocchi-stop-di-esterno-passag",
    "nomeEverfit": "Passaggi al muro 2 tocchi - stop di esterno, passaggio collo - Tecnica",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 0
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-applicata-a1",
  "nome": "Tecnica Applicata A1",
  "nomeEverfit": "Tecnica Applicata A1",
  "famiglia": "Tecnica Applicata",
  "qualita": "tecnica-palleggi",
  "qualitaSet": {
   "tecnica-visione": 2,
   "resistenza-metabolico": 2,
   "tecnica-tiro": 1
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 33,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tvis-passaggi-al-muro-visione",
    "nomeEverfit": "Passaggi al muro - VISIONE",
    "serie": 2,
    "quantita": 300.0,
    "unita": "secondi",
    "recupero_sec": 180
   },
   {
    "esercizio_id": "met-circuito-resistenza-velocita-tecnica-x-esterno",
    "nomeEverfit": "Circuito Resistenza, Velocità, Tecnica x Esterno",
    "serie": 2,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "ttir-calcio-in-alto-e-tiro-in-porta",
    "nomeEverfit": "Calcio in alto e tiro in porta",
    "serie": 1,
    "quantita": 20.0,
    "unita": "reps",
    "recupero_sec": 180
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Passaggi e Visione\nCircuito Esterni",
  "tags": []
 },
 {
  "id": "tecnica-freestyle-dribbling",
  "nome": "Tecnica Freestyle - dribbling",
  "nomeEverfit": "Tecnica Freestyle - dribbling",
  "famiglia": "Tecnica Freestyle - Dribbling",
  "qualita": "tecnica-conduzione",
  "qualitaSet": {
   "tecnica-palleggi": 4,
   "fascia-prevenzione": 2,
   "tecnica-conduzione": 2
  },
  "livello": null,
  "progressione": null,
  "variante": "full",
  "durataMin": 63,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpal-palleggi-al-muro-liberi-freestyle",
    "nomeEverfit": "Palleggi al muro liberi freestyle",
    "serie": 2,
    "quantita": 9.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-freestyle-3-conetti",
    "nomeEverfit": "Palleggi Freestyle 3 conetti",
    "serie": 2,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-palleggi-freestyle-tecnica",
    "nomeEverfit": "Palleggi Freestyle - Tecnica",
    "serie": 2,
    "quantita": 660.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "cond-6",
    "nomeEverfit": "Box Dribbling",
    "serie": 2,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 120,
    "nota": "intensità libera - bassa"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-freestyle-dribbling-passaggio",
  "nome": "Tecnica Freestyle - dribbling passaggio",
  "nomeEverfit": "Tecnica Freestyle - dribbling passaggio",
  "famiglia": "Tecnica Freestyle - Dribbling Passaggio",
  "qualita": "tecnica-passaggi",
  "qualitaSet": {
   "tecnica-palleggi": 4,
   "fascia-prevenzione": 1,
   "tecnica-conduzione": 2,
   "tecnica-passaggi": 1
  },
  "livello": null,
  "progressione": null,
  "variante": "full",
  "durataMin": 48,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpal-palleggi-al-muro-liberi-freestyle",
    "nomeEverfit": "Palleggi al muro liberi freestyle",
    "serie": 1,
    "quantita": 7.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-liberi-freestyle",
    "nomeEverfit": "Palleggi al muro liberi freestyle",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-freestyle-3-conetti",
    "nomeEverfit": "Palleggi Freestyle 3 conetti",
    "serie": 2,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-palleggi-freestyle-tecnica",
    "nomeEverfit": "Palleggi Freestyle - Tecnica",
    "serie": 1,
    "quantita": 600.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "cond-6",
    "nomeEverfit": "Box Dribbling",
    "serie": 2,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 120,
    "nota": "intensità libera - bassa"
   },
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "perLato": true,
    "nota": "intensità libera - bassa"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-freestyle-dribbling-passaggio-short",
  "nome": "Tecnica Freestyle - dribbling passaggio - short",
  "nomeEverfit": "Tecnica Freestyle - dribbling passaggio - short",
  "famiglia": "Tecnica Freestyle - Dribbling Passaggio",
  "qualita": "tecnica-passaggi",
  "qualitaSet": {
   "tecnica-palleggi": 3,
   "fascia-prevenzione": 1,
   "tecnica-conduzione": 1,
   "tecnica-passaggi": 1
  },
  "livello": null,
  "progressione": null,
  "variante": "short",
  "durataMin": 38,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpal-palleggi-al-muro-liberi-freestyle",
    "nomeEverfit": "Palleggi al muro liberi freestyle",
    "serie": 1,
    "quantita": 7.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-freestyle-3-conetti",
    "nomeEverfit": "Palleggi Freestyle 3 conetti",
    "serie": 2,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-palleggi-freestyle-tecnica",
    "nomeEverfit": "Palleggi Freestyle - Tecnica",
    "serie": 1,
    "quantita": 600.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "cond-6",
    "nomeEverfit": "Box Dribbling",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 120,
    "nota": "intensità libera - bassa"
   },
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "perLato": true,
    "nota": "intensità libera - bassa"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-freestyle-a1",
  "nome": "Tecnica Freestyle A1",
  "nomeEverfit": "Tecnica Freestyle A1",
  "famiglia": "Tecnica Freestyle",
  "qualita": "tecnica-palleggi",
  "qualitaSet": {
   "tecnica-palleggi": 4,
   "fascia-prevenzione": 2
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 59,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpal-palleggi-al-muro-liberi-freestyle",
    "nomeEverfit": "Palleggi al muro liberi freestyle",
    "serie": 2,
    "quantita": 10.0,
    "unita": "minuti",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "tpal-palleggi-freestyle-3-conetti",
    "nomeEverfit": "Palleggi Freestyle 3 conetti",
    "serie": 2,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-palleggi-freestyle-tecnica",
    "nomeEverfit": "Palleggi Freestyle - Tecnica",
    "serie": 2,
    "quantita": 600.0,
    "unita": "secondi",
    "recupero_sec": 120
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-freestyle-a2",
  "nome": "Tecnica Freestyle A2",
  "nomeEverfit": "Tecnica Freestyle A2",
  "famiglia": "Tecnica Freestyle",
  "qualita": "tecnica-palleggi",
  "qualitaSet": {
   "tecnica-palleggi": 3,
   "fascia-prevenzione": 2
  },
  "livello": "A",
  "progressione": 2,
  "variante": "full",
  "durataMin": 54,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpal-palleggi-al-muro-liberi-freestyle",
    "nomeEverfit": "Palleggi al muro liberi freestyle",
    "serie": 2,
    "quantita": 10.0,
    "unita": "minuti",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "tpal-palleggi-freestyle-3-conetti",
    "nomeEverfit": "Palleggi Freestyle 3 conetti",
    "serie": 1,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 180
   },
   {
    "esercizio_id": "fasc-palleggi-freestyle-tecnica",
    "nomeEverfit": "Palleggi Freestyle - Tecnica",
    "serie": 2,
    "quantita": 600.0,
    "unita": "secondi",
    "recupero_sec": 120
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-freestyle-pro1",
  "nome": "Tecnica Freestyle PRO1",
  "nomeEverfit": "Tecnica Freestyle PRO1",
  "famiglia": "Tecnica Freestyle",
  "qualita": "tecnica-palleggi",
  "qualitaSet": {
   "tecnica-palleggi": 3,
   "fascia-prevenzione": 2,
   "tecnica-conduzione": 4,
   "tecnica-passaggi": 2
  },
  "livello": "PRO",
  "progressione": 1,
  "variante": "full",
  "durataMin": 65,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpal-palleggi-al-muro-liberi-freestyle",
    "nomeEverfit": "Palleggi al muro liberi freestyle",
    "serie": 2,
    "quantita": 10.0,
    "unita": "minuti",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "tpal-palleggi-freestyle-3-conetti",
    "nomeEverfit": "Palleggi Freestyle 3 conetti",
    "serie": 1,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 180
   },
   {
    "esercizio_id": "fasc-palleggi-freestyle-tecnica",
    "nomeEverfit": "Palleggi Freestyle - Tecnica",
    "serie": 2,
    "quantita": 600.0,
    "unita": "secondi",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "cond-6",
    "nomeEverfit": "Box Dribbling",
    "serie": 1,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "cond-6",
    "nomeEverfit": "Box Dribbling",
    "serie": 1,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "cond-6",
    "nomeEverfit": "Box Dribbling",
    "serie": 1,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "cond-6",
    "nomeEverfit": "Box Dribbling",
    "serie": 1,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpas-box-dribbling-passaggio",
    "nomeEverfit": "Box dribbling + passaggio",
    "serie": 2,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-in-2-a1",
  "nome": "Tecnica in 2 A1",
  "nomeEverfit": "Tecnica in 2 A1",
  "famiglia": "Tecnica In",
  "qualita": "tecnica-palleggi",
  "qualitaSet": {
   "tecnica-passaggi": 3
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 25,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpas-tecnica-a-2-passaggi-rasoterra-stop-interno-pass-2",
    "nomeEverfit": "Tecnica a 2 - Passaggi rasoterra - stop interno passaggio interno",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "tpas-tecnica-a-2-passaggi-rasoterra-stop-interno-pass",
    "nomeEverfit": "Tecnica a 2  - passaggi rasoterra - stop interno passaggio esterno",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": "tpas-tecnica-a-2-passaggi-rasoterra-stop-esterno-pass",
    "nomeEverfit": "Tecnica a 2 - passaggi rasoterra - Stop esterno passaggio interno",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 30
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Tecnica a 2 - Palla bassa e palla alta",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 30
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Tecnica a 2 - Palleggio con 2 palle",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 60
   }
  ],
  "completo": false,
  "mancanti": [
   "Tecnica a 2 - Palla bassa e palla alta",
   "Tecnica a 2 - Palleggio con 2 palle"
  ],
  "tags": []
 },
 {
  "id": "tecnica-palleggi-a1",
  "nome": "Tecnica Palleggi A1",
  "nomeEverfit": "Tecnica Palleggi A1",
  "famiglia": "Tecnica Palleggi",
  "qualita": "tecnica-palleggi",
  "qualitaSet": {
   "tecnica-palleggi": 5,
   "fascia-prevenzione": 1
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 35,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpal-palleggi-al-muro-2-tocchi-controllo-interno-pass",
    "nomeEverfit": "palleggi al muro 2 tocchi - controllo interno, passaggio collo",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-solo-collo",
    "nomeEverfit": "Palleggi solo Collo",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-solo-collo-3-tocchi-alternati-tecnica",
    "nomeEverfit": "Palleggi solo collo 3 tocchi alternati - TECNICA",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-1-piede-interno-collo-esterno-tecnica",
    "nomeEverfit": "Palleggi 1 piede interno/collo/esterno - Tecnica",
    "serie": 1,
    "quantita": 1,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-liberi-freestyle",
    "nomeEverfit": "Palleggi al muro liberi freestyle",
    "serie": 1,
    "quantita": 6.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-palleggi-freestyle-tecnica",
    "nomeEverfit": "Palleggi Freestyle - Tecnica",
    "serie": 1,
    "quantita": 360.0,
    "unita": "secondi",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-palleggi-a2",
  "nome": "Tecnica palleggi A2",
  "nomeEverfit": "Tecnica palleggi A2",
  "famiglia": "Tecnica Palleggi",
  "qualita": "tecnica-palleggi",
  "qualitaSet": {
   "tecnica-palleggi": 6,
   "fascia-prevenzione": 1
  },
  "livello": "A",
  "progressione": 2,
  "variante": "full",
  "durataMin": 40,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpal-palleggi-al-muro-1-tocco-solo-interno",
    "nomeEverfit": "Palleggi al muro 1 tocco solo interno",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-1-tocco-libero",
    "nomeEverfit": "Palleggi al muro 1 tocco libero",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-2-tocchi",
    "nomeEverfit": "Palleggi al muro 2 tocchi",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-2-tocchi-controllo-interno-pass",
    "nomeEverfit": "palleggi al muro 2 tocchi - controllo interno, passaggio collo",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-2-tocchi-controllo-esterno-pass",
    "nomeEverfit": "Palleggi al muro 2 tocchi - controllo esterno, passaggio collo",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-liberi-freestyle",
    "nomeEverfit": "Palleggi al muro liberi freestyle",
    "serie": 1,
    "quantita": 6.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-palleggi-freestyle-tecnica",
    "nomeEverfit": "Palleggi Freestyle - Tecnica",
    "serie": 1,
    "quantita": 360.0,
    "unita": "secondi",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-palleggi-a2-tecnica-di-base",
  "nome": "Tecnica palleggi A2 - Tecnica di base",
  "nomeEverfit": "Tecnica palleggi A2 - Tecnica di base",
  "famiglia": "Tecnica Palleggi - Tecnica Di Base",
  "qualita": "tecnica-palleggi",
  "qualitaSet": {
   "tecnica-palleggi": 8,
   "fascia-prevenzione": 1
  },
  "livello": "A",
  "progressione": 2,
  "variante": "full",
  "durataMin": 50,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpal-palleggi-al-muro-1-tocco-solo-interno",
    "nomeEverfit": "Palleggi al muro 1 tocco solo interno",
    "serie": 2,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-1-tocco-libero",
    "nomeEverfit": "Palleggi al muro 1 tocco libero",
    "serie": 2,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-2-tocchi",
    "nomeEverfit": "Palleggi al muro 2 tocchi",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-2-tocchi-controllo-interno-pass",
    "nomeEverfit": "palleggi al muro 2 tocchi - controllo interno, passaggio collo",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-2-tocchi-controllo-esterno-pass",
    "nomeEverfit": "Palleggi al muro 2 tocchi - controllo esterno, passaggio collo",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-liberi-freestyle",
    "nomeEverfit": "Palleggi al muro liberi freestyle",
    "serie": 1,
    "quantita": 6.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-palleggi-freestyle-tecnica",
    "nomeEverfit": "Palleggi Freestyle - Tecnica",
    "serie": 1,
    "quantita": 360.0,
    "unita": "secondi",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-palleggi-a3",
  "nome": "Tecnica Palleggi A3",
  "nomeEverfit": "Tecnica Palleggi A3",
  "famiglia": "Tecnica Palleggi",
  "qualita": "tecnica-palleggi",
  "qualitaSet": {
   "tecnica-palleggi": 7,
   "fascia-prevenzione": 1
  },
  "livello": "A",
  "progressione": 3,
  "variante": "full",
  "durataMin": 44,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpal-palleggi-al-muro-2-tocchi",
    "nomeEverfit": "Palleggi al muro 2 tocchi",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-2-tocchi-controllo-interno-pass",
    "nomeEverfit": "palleggi al muro 2 tocchi - controllo interno, passaggio collo",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-2-tocchi-controllo-esterno-pass",
    "nomeEverfit": "Palleggi al muro 2 tocchi - controllo esterno, passaggio collo",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-liberi-freestyle",
    "nomeEverfit": "Palleggi al muro liberi freestyle",
    "serie": 1,
    "quantita": 6.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-palleggi-freestyle-tecnica",
    "nomeEverfit": "Palleggi Freestyle - Tecnica",
    "serie": 1,
    "quantita": 360.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-solo-collo-3-tocchi-alternati-tecnica",
    "nomeEverfit": "Palleggi solo collo 3 tocchi alternati - TECNICA",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "tpal-palleggi-1-piede-interno-collo-esterno-tecnica",
    "nomeEverfit": "Palleggi 1 piede interno/collo/esterno - Tecnica",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 0,
    "perLato": true
   },
   {
    "esercizio_id": "tpal-palleggi-freestyle-3-conetti",
    "nomeEverfit": "Palleggi Freestyle 3 conetti",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 0
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-palleggi-a3-tecnica-di-base",
  "nome": "Tecnica Palleggi A3 - Tecnica di base",
  "nomeEverfit": "Tecnica Palleggi A3 - Tecnica di base",
  "famiglia": "Tecnica Palleggi - Tecnica Di Base",
  "qualita": "tecnica-palleggi",
  "qualitaSet": {
   "tecnica-palleggi": 9,
   "fascia-prevenzione": 2
  },
  "livello": "A",
  "progressione": 3,
  "variante": "full",
  "durataMin": 67,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpal-palleggi-al-muro-2-tocchi",
    "nomeEverfit": "Palleggi al muro 2 tocchi",
    "serie": 2,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-2-tocchi-controllo-interno-pass",
    "nomeEverfit": "palleggi al muro 2 tocchi - controllo interno, passaggio collo",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-2-tocchi-controllo-esterno-pass",
    "nomeEverfit": "Palleggi al muro 2 tocchi - controllo esterno, passaggio collo",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-liberi-freestyle",
    "nomeEverfit": "Palleggi al muro liberi freestyle",
    "serie": 2,
    "quantita": 6.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-palleggi-freestyle-tecnica",
    "nomeEverfit": "Palleggi Freestyle - Tecnica",
    "serie": 1,
    "quantita": 360.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-palleggi-freestyle-tecnica",
    "nomeEverfit": "Palleggi Freestyle - Tecnica",
    "serie": 1,
    "quantita": 360.0,
    "unita": "secondi",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "tpal-palleggi-solo-collo-3-tocchi-alternati-tecnica",
    "nomeEverfit": "Palleggi solo collo 3 tocchi alternati - TECNICA",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-1-piede-interno-collo-esterno-tecnica",
    "nomeEverfit": "Palleggi 1 piede interno/collo/esterno - Tecnica",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 120,
    "perLato": true
   },
   {
    "esercizio_id": "tpal-palleggi-freestyle-3-conetti",
    "nomeEverfit": "Palleggi Freestyle 3 conetti",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 0
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-palleggi-b1",
  "nome": "Tecnica Palleggi B1",
  "nomeEverfit": "Tecnica Palleggi B1",
  "famiglia": "Tecnica Palleggi",
  "qualita": "tecnica-palleggi",
  "qualitaSet": {
   "tecnica-palleggi": 6,
   "test": 1,
   "fascia-prevenzione": 1
  },
  "livello": "B",
  "progressione": 1,
  "variante": "full",
  "durataMin": 39,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpal-palleggi-solo-collo",
    "nomeEverfit": "Palleggi solo Collo",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-sotto-al-ginocchio-tecnica",
    "nomeEverfit": "Palleggi sotto al ginocchio - Tecnica",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "test2-palleggi-altezza-testa-tecnica",
    "nomeEverfit": "Palleggi altezza testa - Tecnica",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-solo-collo-3-tocchi-alternati-tecnica",
    "nomeEverfit": "Palleggi solo collo 3 tocchi alternati - TECNICA",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-solo-un-piede-tecnica",
    "nomeEverfit": "Palleggi solo un piede - Tecnica",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "tpal-palleggi-1-piede-interno-collo-esterno-tecnica",
    "nomeEverfit": "Palleggi 1 piede interno/collo/esterno - Tecnica",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "pall-7",
    "nomeEverfit": "Palleggi solo testa - Tecnica",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-palleggi-freestyle-tecnica",
    "nomeEverfit": "Palleggi Freestyle - Tecnica",
    "serie": 1,
    "quantita": 360.0,
    "unita": "secondi",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-palleggi-b1-tecnica-di-base",
  "nome": "Tecnica Palleggi B1 - tecnica di base",
  "nomeEverfit": "Tecnica Palleggi B1 - tecnica di base",
  "famiglia": "Tecnica Palleggi - Tecnica Di Base",
  "qualita": "tecnica-palleggi",
  "qualitaSet": {
   "tecnica-palleggi": 12,
   "test": 2,
   "fascia-prevenzione": 1
  },
  "livello": "B",
  "progressione": 1,
  "variante": "full",
  "durataMin": 61,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpal-palleggi-solo-collo",
    "nomeEverfit": "Palleggi solo Collo",
    "serie": 1,
    "quantita": 4.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-sotto-al-ginocchio-tecnica",
    "nomeEverfit": "Palleggi sotto al ginocchio - Tecnica",
    "serie": 2,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "test2-palleggi-altezza-testa-tecnica",
    "nomeEverfit": "Palleggi altezza testa - Tecnica",
    "serie": 2,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-solo-collo-3-tocchi-alternati-tecnica",
    "nomeEverfit": "Palleggi solo collo 3 tocchi alternati - TECNICA",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-solo-un-piede-tecnica",
    "nomeEverfit": "Palleggi solo un piede - Tecnica",
    "serie": 3,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "tpal-palleggi-1-piede-interno-collo-esterno-tecnica",
    "nomeEverfit": "Palleggi 1 piede interno/collo/esterno - Tecnica",
    "serie": 2,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "pall-7",
    "nomeEverfit": "Palleggi solo testa - Tecnica",
    "serie": 2,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-palleggi-freestyle-tecnica",
    "nomeEverfit": "Palleggi Freestyle - Tecnica",
    "serie": 1,
    "quantita": 360.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-liberi-freestyle",
    "nomeEverfit": "Palleggi al muro liberi freestyle",
    "serie": 1,
    "quantita": 6.0,
    "unita": "minuti",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-palleggi-b2-tecnica-di-base",
  "nome": "Tecnica Palleggi B2 - tecnica di base",
  "nomeEverfit": "Tecnica Palleggi B2 - tecnica di base",
  "famiglia": "Tecnica Palleggi - Tecnica Di Base",
  "qualita": "tecnica-palleggi",
  "qualitaSet": {
   "tecnica-palleggi": 12,
   "test": 1,
   "fascia-prevenzione": 1
  },
  "livello": "B",
  "progressione": 2,
  "variante": "full",
  "durataMin": 63,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpal-palleggi-solo-collo",
    "nomeEverfit": "Palleggi solo Collo",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-sotto-al-ginocchio-tecnica",
    "nomeEverfit": "Palleggi sotto al ginocchio - Tecnica",
    "serie": 2,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "test2-palleggi-altezza-testa-tecnica",
    "nomeEverfit": "Palleggi altezza testa - Tecnica",
    "serie": 1,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-liberi-calcio-alto-tecnica",
    "nomeEverfit": "Palleggi liberi + calcio alto - Tecnica",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-solo-collo-3-tocchi-alternati-tecnica",
    "nomeEverfit": "Palleggi solo collo 3 tocchi alternati - TECNICA",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-solo-un-piede-tecnica",
    "nomeEverfit": "Palleggi solo un piede - Tecnica",
    "serie": 2,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "tpal-palleggi-1-piede-interno-collo-esterno-tecnica",
    "nomeEverfit": "Palleggi 1 piede interno/collo/esterno - Tecnica",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "tpal-palleggi-1-piede-interno-collo-esterno-tecnica",
    "nomeEverfit": "Palleggi 1 piede interno/collo/esterno - Tecnica",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "pall-7",
    "nomeEverfit": "Palleggi solo testa - Tecnica",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "pall-7",
    "nomeEverfit": "Palleggi solo testa - Tecnica",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-palleggi-freestyle-tecnica",
    "nomeEverfit": "Palleggi Freestyle - Tecnica",
    "serie": 1,
    "quantita": 360.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-liberi-freestyle",
    "nomeEverfit": "Palleggi al muro liberi freestyle",
    "serie": 1,
    "quantita": 6.0,
    "unita": "minuti",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-palleggi-b3-tecnica-di-base",
  "nome": "Tecnica Palleggi B3 - Tecnica di Base",
  "nomeEverfit": "Tecnica Palleggi B3 - Tecnica di Base",
  "famiglia": "Tecnica Palleggi - Tecnica Di Base",
  "qualita": "tecnica-palleggi",
  "qualitaSet": {
   "tecnica-palleggi": 12,
   "test": 2,
   "fascia-prevenzione": 1
  },
  "livello": "B",
  "progressione": 3,
  "variante": "full",
  "durataMin": 64,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpal-palleggi-solo-interno-tecnica",
    "nomeEverfit": "Palleggi solo interno - Tecnica",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-solo-collo",
    "nomeEverfit": "Palleggi solo Collo",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-sotto-al-ginocchio-tecnica",
    "nomeEverfit": "Palleggi sotto al ginocchio - Tecnica",
    "serie": 2,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "test2-palleggi-altezza-testa-tecnica",
    "nomeEverfit": "Palleggi altezza testa - Tecnica",
    "serie": 2,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "tpal-palleggi-liberi-calcio-alto-tecnica",
    "nomeEverfit": "Palleggi liberi + calcio alto - Tecnica",
    "serie": 1,
    "quantita": 5.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-solo-un-piede-tecnica",
    "nomeEverfit": "Palleggi solo un piede - Tecnica",
    "serie": 2,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "tpal-palleggi-1-piede-interno-collo-esterno-tecnica",
    "nomeEverfit": "Palleggi 1 piede interno/collo/esterno - Tecnica",
    "serie": 2,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "pall-7",
    "nomeEverfit": "Palleggi solo testa - Tecnica",
    "serie": 2,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-palleggi-freestyle-tecnica",
    "nomeEverfit": "Palleggi Freestyle - Tecnica",
    "serie": 1,
    "quantita": 420.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-al-muro-liberi-freestyle",
    "nomeEverfit": "Palleggi al muro liberi freestyle",
    "serie": 1,
    "quantita": 7.0,
    "unita": "minuti",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tecnica-visione-a1",
  "nome": "Tecnica Visione A1",
  "nomeEverfit": "Tecnica Visione A1",
  "famiglia": "Tecnica Visione",
  "qualita": "tecnica-visione",
  "qualitaSet": {
   "tecnica-visione": 6
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 30,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tvis-passaggi-al-muro-visione",
    "nomeEverfit": "Passaggi al muro - VISIONE",
    "serie": 5,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tvis-videocorso-visione-esercizi-base",
    "nomeEverfit": "Videocorso Visione - Esercizi Base",
    "serie": 1,
    "quantita": 10.0,
    "unita": "minuti",
    "recupero_sec": 120
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Passaggi e Visione\nCircuito Esterni",
  "tags": []
 },
 {
  "id": "tecnica-visione-a2",
  "nome": "Tecnica visione A2",
  "nomeEverfit": "Tecnica visione A2",
  "famiglia": "Tecnica Visione",
  "qualita": "tecnica-visione",
  "qualitaSet": {
   "tecnica-visione": 2,
   "tecnica-tiro": 3
  },
  "livello": "A",
  "progressione": 2,
  "variante": "full",
  "durataMin": 35,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tvis-passaggi-al-muro-visione",
    "nomeEverfit": "Passaggi al muro - VISIONE",
    "serie": 1,
    "quantita": 300.0,
    "unita": "secondi",
    "recupero_sec": 180
   },
   {
    "esercizio_id": "tvis-videocorso-visione-esercizi-base",
    "nomeEverfit": "Videocorso Visione - Esercizi Base",
    "serie": 1,
    "quantita": 10.0,
    "unita": "minuti",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "ttir-tiri-in-porta-e-visione",
    "nomeEverfit": "Tiri in porta e VISIONE",
    "serie": 2,
    "quantita": 180.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "ttir-calcio-in-alto-e-tiro-in-porta",
    "nomeEverfit": "Calcio in alto e tiro in porta",
    "serie": 1,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 180
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Passaggi e Visione\nCircuito Esterni",
  "tags": []
 },
 {
  "id": "test-forza-parte-bassa",
  "nome": "TEST FORZA PARTE BASSA",
  "nomeEverfit": "TEST FORZA PARTE BASSA",
  "famiglia": "Test Forza Parte Bassa",
  "qualita": "test",
  "qualitaSet": {
   "test": 7,
   "forza-parte-bassa": 2,
   "fascia-prevenzione": 1
  },
  "livello": null,
  "progressione": null,
  "variante": "full",
  "durataMin": 36,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "test2-test-salto-in-lungo-broad-jump",
    "nomeEverfit": "Test Salto in lungo - broad jump",
    "serie": 4,
    "quantita": 1.0,
    "unita": "reps",
    "recupero_sec": 180,
    "nota": "segna la distanza del salto più lontano"
   },
   {
    "esercizio_id": "test2-rapidita-ankle-stiffness-test",
    "nomeEverfit": "Rapidità Ankle Stiffness - Test",
    "serie": 2,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 120,
    "perLato": true,
    "nota": "segna quante ripetizioni riesci a fare nel tempo con ogni gamba"
   },
   {
    "esercizio_id": "fpb-nordic-hamstring",
    "nomeEverfit": "nordic hamstring",
    "serie": 2,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 180,
    "nota": "ESEGUI UN VIDEO DELL'ESECUZIONE COMPLETA"
   },
   {
    "esercizio_id": "fasc-fascia-iso-lounge-runner",
    "nomeEverfit": "Fascia Iso Lounge Runner",
    "serie": 1,
    "quantita": 240.0,
    "unita": "secondi",
    "recupero_sec": 180,
    "perLato": true,
    "nota": "ESEGUI PER IL MASSIMO DEL TEMPO CON OGNI GAMBA, SEGNA IL TEMPO PER ENTRAMBE"
   },
   {
    "esercizio_id": "test2-test-equilibrio-1-gamba",
    "nomeEverfit": "TEST EQUILIBRIO 1 GAMBA",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true,
    "nota": "FAI IL VIDEO DELL'ESERCIZIO E SEGNA IL TEMPO CHE RIESCI A STARE IN EQUILIBRIO PER ENTRAMBE LE GAMBE"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "test-parte-alta",
  "nome": "TEST PARTE ALTA",
  "nomeEverfit": "TEST PARTE ALTA",
  "famiglia": "Test Parte Alta",
  "qualita": "test",
  "qualitaSet": {
   "test": 2,
   "forza-parte-alta": 2,
   "core": 1
  },
  "livello": null,
  "progressione": null,
  "variante": "full",
  "durataMin": 23,
  "attrezzatura": [
   "sbarra"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "test2-test-max-push-up",
    "nomeEverfit": "Test Max push up",
    "serie": 1,
    "quantita": 1,
    "unita": "reps",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "test2-test-max-pull-up",
    "nomeEverfit": "Test Max Pull up",
    "serie": 1,
    "quantita": 1,
    "unita": "reps",
    "recupero_sec": 0
   },
   {
    "esercizio_id": "push-2",
    "nomeEverfit": "Push-Up",
    "serie": 1,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 0,
    "schema": "amrap",
    "sezione": "Test Parte Alta AMRAP"
   },
   {
    "esercizio_id": "pull-5",
    "nomeEverfit": "Pull-Up",
    "serie": 1,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 0,
    "schema": "amrap",
    "sezione": "Test Parte Alta AMRAP"
   },
   {
    "esercizio_id": "core2-bicycle-crunch-straight-leg",
    "nomeEverfit": "Bicycle Crunch Straight Leg",
    "serie": 1,
    "quantita": 40.0,
    "unita": "reps",
    "recupero_sec": 0,
    "schema": "amrap",
    "sezione": "Test Parte Alta AMRAP"
   }
  ],
  "completo": true,
  "mancanti": [],
  "amrapSec": 1200,
  "tags": []
 },
 {
  "id": "test-resistenza",
  "nome": "TEST RESISTENZA",
  "nomeEverfit": "TEST RESISTENZA",
  "famiglia": "Test Resistenza",
  "qualita": "test",
  "qualitaSet": {
   "test": 2
  },
  "livello": null,
  "progressione": null,
  "variante": "full",
  "durataMin": 24,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "test2-test-resistenza-3km",
    "nomeEverfit": "TEST RESISTENZA 3KM",
    "serie": 1,
    "quantita": 3000.0,
    "unita": "metri",
    "recupero_sec": 240
   },
   {
    "esercizio_id": "test2-test-resistenza-1km",
    "nomeEverfit": "TEST RESISTENZA 1km",
    "serie": 1,
    "quantita": 1000.0,
    "unita": "metri",
    "recupero_sec": 240
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "test-velocita",
  "nome": "TEST VELOCITÀ",
  "nomeEverfit": "TEST VELOCITÀ",
  "famiglia": "Test Velocità",
  "qualita": "test",
  "qualitaSet": {
   "test": 6,
   "velocita": 3
  },
  "livello": null,
  "progressione": null,
  "variante": "full",
  "durataMin": 24,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "test2-test-velocita-100m",
    "nomeEverfit": "TEST VELOCITA' 100M",
    "serie": 3,
    "quantita": 100.0,
    "unita": "metri",
    "recupero_sec": 180,
    "nota": "PRENDI IL TEMPO MIGLIORE IN 3 TENTATIVI"
   },
   {
    "esercizio_id": "test2-test-velocita-50m",
    "nomeEverfit": "TEST VELOCITA' 50M",
    "serie": 3,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 120,
    "nota": "PRENDI IL TEMPO MIGLIORE IN 3 TENTATIVI"
   },
   {
    "esercizio_id": "vel-t-sprint",
    "nomeEverfit": "T sprint",
    "serie": 3,
    "quantita": 1.0,
    "unita": "reps",
    "recupero_sec": 90,
    "nota": "ESEGUI SENZA PALLA E PRENDI IL TEMPO MIGLIORE IN 3 TENTATIVI"
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tiri-e-visione-libero-a1",
  "nome": "Tiri e Visione Libero A1",
  "nomeEverfit": "Tiri e Visione Libero A1",
  "famiglia": "Tiri E Visione Libero",
  "qualita": "tecnica-visione",
  "qualitaSet": {
   "tecnica-tiro": 5
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 17,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "ttir-tiri-in-porta-e-visione",
    "nomeEverfit": "Tiri in porta e VISIONE",
    "serie": 4,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "ttir-calcio-in-alto-e-tiro-in-porta",
    "nomeEverfit": "Calcio in alto e tiro in porta",
    "serie": 1,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 120,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tiri-e-visione-libero-a1-tecnica-di-base",
  "nome": "Tiri e Visione Libero A1 - Tecnica di base",
  "nomeEverfit": "Tiri e Visione Libero A1 - Tecnica di base",
  "famiglia": "Tiri E Visione Libero - Tecnica Di Base",
  "qualita": "tecnica-visione",
  "qualitaSet": {
   "tecnica-tiro": 4
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 14,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "ttir-progressione-tiri-in-porta-tecnica-di-tiro",
    "nomeEverfit": "Progressione tiri in porta - Tecnica di tiro",
    "serie": 1,
    "quantita": 3.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "ttir-tiri-in-porta-e-visione",
    "nomeEverfit": "Tiri in porta e VISIONE",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true,
    "nota": "ESEGUI L'ESERCIZIO A RITMO BASSO"
   },
   {
    "esercizio_id": "ttir-tiri-in-porta-e-visione",
    "nomeEverfit": "Tiri in porta e VISIONE",
    "serie": 1,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 120,
    "perLato": true,
    "nota": "ESEGUI L'ESERCIZIO A RITMO BASSO"
   },
   {
    "esercizio_id": "ttir-calcio-in-alto-e-tiro-in-porta",
    "nomeEverfit": "Calcio in alto e tiro in porta",
    "serie": 1,
    "quantita": 10.0,
    "unita": "reps",
    "recupero_sec": 120,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tiri-in-porta-tecnica-di-tiro-a1",
  "nome": "tiri in porta - Tecnica di tiro A1",
  "nomeEverfit": "tiri in porta - Tecnica di tiro A1",
  "famiglia": "Tiri In Porta - Tecnica Di Tiro",
  "qualita": "tecnica-tiro",
  "qualitaSet": {
   "tecnica-tiro": 8
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 19,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "ttir-progressione-tiri-in-porta-tecnica-di-tiro",
    "nomeEverfit": "Progressione tiri in porta - Tecnica di tiro",
    "serie": 1,
    "quantita": 3.0,
    "unita": "reps",
    "recupero_sec": 120,
    "perLato": true
   },
   {
    "esercizio_id": "ttir-tiri-rigore-al-palo",
    "nomeEverfit": "tiri - rigore al palo",
    "serie": 2,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "ttir-tiri-rigore-alla-traversa",
    "nomeEverfit": "Tiri - rigore alla traversa",
    "serie": 1,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 120,
    "perLato": true
   },
   {
    "esercizio_id": "ttir-tiri-rigore-alla-traversa",
    "nomeEverfit": "Tiri - rigore alla traversa",
    "serie": 1,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 120,
    "perLato": true
   },
   {
    "esercizio_id": "ttir-calcio-in-alto-e-tiro-in-porta",
    "nomeEverfit": "Calcio in alto e tiro in porta",
    "serie": 3,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 120,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "tiri-in-porta-tecnica-di-tiro-b1",
  "nome": "tiri in porta - Tecnica di tiro B1",
  "nomeEverfit": "tiri in porta - Tecnica di tiro B1",
  "famiglia": "Tiri In Porta - Tecnica Di Tiro",
  "qualita": "tecnica-tiro",
  "qualitaSet": {
   "tecnica-tiro": 8
  },
  "livello": "B",
  "progressione": 1,
  "variante": "full",
  "durataMin": 19,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "ttir-progressione-tiri-in-porta-tecnica-di-tiro",
    "nomeEverfit": "Progressione tiri in porta - Tecnica di tiro",
    "serie": 2,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 120,
    "perLato": true
   },
   {
    "esercizio_id": "ttir-tiri-rigore-al-palo",
    "nomeEverfit": "tiri - rigore al palo",
    "serie": 2,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "ttir-tiri-rigore-alla-traversa",
    "nomeEverfit": "Tiri - rigore alla traversa",
    "serie": 1,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 120,
    "perLato": true
   },
   {
    "esercizio_id": "ttir-tiri-rigore-alla-traversa",
    "nomeEverfit": "Tiri - rigore alla traversa",
    "serie": 1,
    "quantita": 5.0,
    "unita": "reps",
    "recupero_sec": 120,
    "perLato": true
   },
   {
    "esercizio_id": "ttir-calcio-in-alto-e-tiro-in-porta",
    "nomeEverfit": "Calcio in alto e tiro in porta",
    "serie": 2,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 120,
    "perLato": true
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "trecnica-freestyle-dribbling-e-visione-1",
  "nome": "Trecnica freestyle - dribbling e visione 1",
  "nomeEverfit": "Trecnica freestyle - dribbling e visione 1",
  "famiglia": "Trecnica Freestyle - Dribbling E Visione",
  "qualita": "tecnica-visione",
  "qualitaSet": {
   "tecnica-palleggi": 2,
   "fascia-prevenzione": 1,
   "tecnica-conduzione": 2,
   "tecnica-visione": 5
  },
  "livello": null,
  "progressione": null,
  "variante": "full",
  "durataMin": 39,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpal-palleggi-al-muro-liberi-freestyle",
    "nomeEverfit": "Palleggi al muro liberi freestyle",
    "serie": 1,
    "quantita": 9.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "tpal-palleggi-freestyle-3-conetti",
    "nomeEverfit": "Palleggi Freestyle 3 conetti",
    "serie": 1,
    "quantita": 3.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-palleggi-freestyle-tecnica",
    "nomeEverfit": "Palleggi Freestyle - Tecnica",
    "serie": 1,
    "quantita": 360.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "cond-6",
    "nomeEverfit": "Box Dribbling",
    "serie": 2,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 120,
    "nota": "intensità libera - bassa"
   },
   {
    "esercizio_id": "tvis-dribbling-visione-e-reattivita-base",
    "nomeEverfit": "Dribbling visione e reattività - Base",
    "serie": 5,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "trecnica-freestyle-dribbling-e-visione-1-short",
  "nome": "Trecnica freestyle - dribbling e visione 1 short",
  "nomeEverfit": "Trecnica freestyle - dribbling e visione 1 short",
  "famiglia": "Trecnica Freestyle - Dribbling E Visione Short",
  "qualita": "tecnica-visione",
  "qualitaSet": {
   "tecnica-palleggi": 1,
   "fascia-prevenzione": 1,
   "tecnica-conduzione": 1,
   "tecnica-visione": 3
  },
  "livello": null,
  "progressione": null,
  "variante": "short",
  "durataMin": 28,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tpal-palleggi-al-muro-liberi-freestyle",
    "nomeEverfit": "Palleggi al muro liberi freestyle",
    "serie": 1,
    "quantita": 9.0,
    "unita": "minuti",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "fasc-palleggi-freestyle-tecnica",
    "nomeEverfit": "Palleggi Freestyle - Tecnica",
    "serie": 1,
    "quantita": 360.0,
    "unita": "secondi",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "cond-6",
    "nomeEverfit": "Box Dribbling",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 120,
    "nota": "intensità libera - bassa"
   },
   {
    "esercizio_id": "tvis-dribbling-visione-e-reattivita-base",
    "nomeEverfit": "Dribbling visione e reattività - Base",
    "serie": 3,
    "quantita": 6.0,
    "unita": "reps",
    "recupero_sec": 60
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "velocita-a1",
  "nome": "Velocità A1",
  "nomeEverfit": "Velocità A1",
  "famiglia": "Velocità",
  "qualita": "velocita",
  "qualitaSet": {
   "velocita": 25
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 35,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "vel-salto-triplo-e-sprint",
    "nomeEverfit": "Salto triplo e sprint",
    "serie": 2,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "vel-salto-triplo-e-sprint",
    "nomeEverfit": "Salto triplo e sprint",
    "serie": 2,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 40
   },
   {
    "esercizio_id": "vel-salto-triplo-e-sprint",
    "nomeEverfit": "Salto triplo e sprint",
    "serie": 2,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "vel-salto-triplo-a-1-gamba-e-sprint",
    "nomeEverfit": "Salto triplo a 1 gamba e sprint",
    "serie": 2,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "vel-salto-triplo-a-1-gamba-e-sprint",
    "nomeEverfit": "Salto triplo a 1 gamba e sprint",
    "serie": 2,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 90,
    "perLato": true
   },
   {
    "esercizio_id": "vel-salto-triplo-a-1-gamba-e-sprint",
    "nomeEverfit": "Salto triplo a 1 gamba e sprint",
    "serie": 1,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 120,
    "perLato": true
   },
   {
    "esercizio_id": "vel-sprint-con-palla-da-fermo",
    "nomeEverfit": "Sprint con palla da fermo",
    "serie": 2,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 40
   },
   {
    "esercizio_id": "vel-sprint-con-palla-da-fermo",
    "nomeEverfit": "Sprint con palla da fermo",
    "serie": 2,
    "quantita": 30.0,
    "unita": "metri",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "vel-sprint-con-palla-da-fermo",
    "nomeEverfit": "Sprint con palla da fermo",
    "serie": 2,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 2,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 90
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 2,
    "quantita": 30.0,
    "unita": "metri",
    "recupero_sec": 90
   },
   {
    "esercizio_id": "vel-t-sprint",
    "nomeEverfit": "T sprint",
    "serie": 4,
    "quantita": 1.0,
    "unita": "reps",
    "recupero_sec": 90
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "velocita-b1-short",
  "nome": "Velocità B1 - short",
  "nomeEverfit": "Velocità B1 - short",
  "famiglia": "Velocità",
  "qualita": "velocita",
  "qualitaSet": {
   "velocita": 17
  },
  "livello": "B",
  "progressione": 1,
  "variante": "short",
  "durataMin": 26,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 2,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 90
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 3,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 90
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 3,
    "quantita": 30.0,
    "unita": "metri",
    "recupero_sec": 90
   },
   {
    "esercizio_id": "vel-salto-triplo-a-1-gamba-e-sprint",
    "nomeEverfit": "Salto triplo a 1 gamba e sprint",
    "serie": 1,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "vel-salto-triplo-a-1-gamba-e-sprint",
    "nomeEverfit": "Salto triplo a 1 gamba e sprint",
    "serie": 1,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 90,
    "perLato": true
   },
   {
    "esercizio_id": "vel-salto-triplo-a-1-gamba-e-sprint",
    "nomeEverfit": "Salto triplo a 1 gamba e sprint",
    "serie": 1,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 120,
    "perLato": true
   },
   {
    "esercizio_id": "vel-sprint-con-palla-da-fermo",
    "nomeEverfit": "Sprint con palla da fermo",
    "serie": 2,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 40
   },
   {
    "esercizio_id": "vel-sprint-con-palla-da-fermo",
    "nomeEverfit": "Sprint con palla da fermo",
    "serie": 2,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "vel-t-sprint",
    "nomeEverfit": "T sprint",
    "serie": 2,
    "quantita": 1.0,
    "unita": "reps",
    "recupero_sec": 90
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "velocita-b1-short-2",
  "nome": "Velocità B1 - short 2",
  "nomeEverfit": "Velocità B1 - short 2",
  "famiglia": "Velocità",
  "qualita": "velocita",
  "qualitaSet": {
   "velocita": 13
  },
  "livello": "B",
  "progressione": 1,
  "variante": "short",
  "durataMin": 19,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 2,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 90
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 2,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 90
   },
   {
    "esercizio_id": "vel-sprint",
    "nomeEverfit": "Sprint",
    "serie": 1,
    "quantita": 30.0,
    "unita": "metri",
    "recupero_sec": 90
   },
   {
    "esercizio_id": "vel-salto-triplo-a-1-gamba-e-sprint",
    "nomeEverfit": "Salto triplo a 1 gamba e sprint",
    "serie": 1,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "vel-salto-triplo-a-1-gamba-e-sprint",
    "nomeEverfit": "Salto triplo a 1 gamba e sprint",
    "serie": 1,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 90,
    "perLato": true
   },
   {
    "esercizio_id": "vel-sprint-con-palla-da-fermo",
    "nomeEverfit": "Sprint con palla da fermo",
    "serie": 2,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 40
   },
   {
    "esercizio_id": "vel-sprint-con-palla-da-fermo",
    "nomeEverfit": "Sprint con palla da fermo",
    "serie": 2,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "vel-t-sprint",
    "nomeEverfit": "T sprint",
    "serie": 2,
    "quantita": 1.0,
    "unita": "reps",
    "recupero_sec": 90
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "velocita-e-forza-esplosiva-a1",
  "nome": "Velocità e forza esplosiva A1",
  "nomeEverfit": "Velocità e forza esplosiva A1",
  "famiglia": "Velocità E Forza Esplosiva",
  "qualita": "velocita",
  "qualitaSet": {
   "pliometria-estensiva": 2,
   "test": 2,
   "velocita": 23
  },
  "livello": "A",
  "progressione": 1,
  "variante": "full",
  "durataMin": 47,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "plioe-pogo-jumps",
    "nomeEverfit": "Pogo Jumps",
    "serie": 2,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 120,
    "nota": "a 2 piedi"
   },
   {
    "esercizio_id": "test2-rapidita-ankle-stiffness-test",
    "nomeEverfit": "Rapidità Ankle Stiffness - Test",
    "serie": 2,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "vel-salto-triplo-e-sprint",
    "nomeEverfit": "Salto triplo e sprint",
    "serie": 2,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "vel-salto-triplo-e-sprint",
    "nomeEverfit": "Salto triplo e sprint",
    "serie": 2,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 40
   },
   {
    "esercizio_id": "vel-salto-triplo-e-sprint",
    "nomeEverfit": "Salto triplo e sprint",
    "serie": 3,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "vel-salto-triplo-a-1-gamba-e-sprint",
    "nomeEverfit": "Salto triplo a 1 gamba e sprint",
    "serie": 2,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "vel-salto-triplo-a-1-gamba-e-sprint",
    "nomeEverfit": "Salto triplo a 1 gamba e sprint",
    "serie": 2,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 90,
    "perLato": true
   },
   {
    "esercizio_id": "vel-salto-triplo-a-1-gamba-e-sprint",
    "nomeEverfit": "Salto triplo a 1 gamba e sprint",
    "serie": 2,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 120,
    "perLato": true
   },
   {
    "esercizio_id": "vel-sprint-con-palla-da-fermo",
    "nomeEverfit": "Sprint con palla da fermo",
    "serie": 2,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 40
   },
   {
    "esercizio_id": "vel-sprint-con-palla-da-fermo",
    "nomeEverfit": "Sprint con palla da fermo",
    "serie": 2,
    "quantita": 30.0,
    "unita": "metri",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "vel-sprint-con-palla-da-fermo",
    "nomeEverfit": "Sprint con palla da fermo",
    "serie": 3,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "vel-postura-velocita-difensori",
    "nomeEverfit": "Postura + Velocità Difensori",
    "serie": 3,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 120
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "velocita-e-forza-esplosiva-b1",
  "nome": "velocità e forza esplosiva B1",
  "nomeEverfit": "velocità e forza esplosiva B1",
  "famiglia": "Velocità E Forza Esplosiva",
  "qualita": "velocita",
  "qualitaSet": {
   "pliometria-estensiva": 2,
   "forza-esplosiva": 3,
   "test": 3,
   "velocita": 14
  },
  "livello": "B",
  "progressione": 1,
  "variante": "full",
  "durataMin": 42,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "plioe-pogo-jumps",
    "nomeEverfit": "Pogo Jumps",
    "serie": 2,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 120,
    "nota": "a 2 piedi"
   },
   {
    "esercizio_id": "fesp-forza-esplosiva-tecnica-salto-1-piede-e-2-piedi",
    "nomeEverfit": "Forza Esplosiva - Tecnica Salto 1 piede e 2 piedi",
    "serie": 3,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "test2-rapidita-ankle-stiffness-test",
    "nomeEverfit": "Rapidità Ankle Stiffness - Test",
    "serie": 3,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "vel-salto-triplo-e-sprint",
    "nomeEverfit": "Salto triplo e sprint",
    "serie": 2,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "vel-salto-triplo-e-sprint",
    "nomeEverfit": "Salto triplo e sprint",
    "serie": 2,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 40
   },
   {
    "esercizio_id": "vel-salto-triplo-e-sprint",
    "nomeEverfit": "Salto triplo e sprint",
    "serie": 2,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "vel-salto-triplo-a-1-gamba-e-sprint",
    "nomeEverfit": "Salto triplo a 1 gamba e sprint",
    "serie": 2,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "vel-salto-triplo-a-1-gamba-e-sprint",
    "nomeEverfit": "Salto triplo a 1 gamba e sprint",
    "serie": 2,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 90,
    "perLato": true
   },
   {
    "esercizio_id": "vel-salto-triplo-a-1-gamba-e-sprint",
    "nomeEverfit": "Salto triplo a 1 gamba e sprint",
    "serie": 1,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 120,
    "perLato": true
   },
   {
    "esercizio_id": "vel-postura-velocita-difensori",
    "nomeEverfit": "Postura + Velocità Difensori",
    "serie": 3,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 120
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "velocita-e-forza-esplosiva-b2",
  "nome": "Velocità e forza esplosiva B2",
  "nomeEverfit": "Velocità e forza esplosiva B2",
  "famiglia": "Velocità E Forza Esplosiva",
  "qualita": "velocita",
  "qualitaSet": {
   "pliometria-estensiva": 2,
   "forza-esplosiva": 2,
   "test": 3,
   "velocita": 20
  },
  "livello": "B",
  "progressione": 2,
  "variante": "full",
  "durataMin": 45,
  "attrezzatura": [
   "campo"
  ],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "plioe-pogo-jumps",
    "nomeEverfit": "Pogo Jumps",
    "serie": 2,
    "quantita": 120.0,
    "unita": "secondi",
    "recupero_sec": 120,
    "nota": "a 2 piedi"
   },
   {
    "esercizio_id": "fesp-forza-esplosiva-tecnica-salto-1-piede-e-2-piedi",
    "nomeEverfit": "Forza Esplosiva - Tecnica Salto 1 piede e 2 piedi",
    "serie": 2,
    "quantita": 4.0,
    "unita": "reps",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "test2-rapidita-ankle-stiffness-test",
    "nomeEverfit": "Rapidità Ankle Stiffness - Test",
    "serie": 3,
    "quantita": 20.0,
    "unita": "secondi",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "vel-salto-triplo-e-sprint",
    "nomeEverfit": "Salto triplo e sprint",
    "serie": 2,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "vel-salto-triplo-e-sprint",
    "nomeEverfit": "Salto triplo e sprint",
    "serie": 2,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 40
   },
   {
    "esercizio_id": "vel-salto-triplo-e-sprint",
    "nomeEverfit": "Salto triplo e sprint",
    "serie": 2,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "vel-salto-triplo-a-1-gamba-e-sprint",
    "nomeEverfit": "Salto triplo a 1 gamba e sprint",
    "serie": 2,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 60,
    "perLato": true
   },
   {
    "esercizio_id": "vel-salto-triplo-a-1-gamba-e-sprint",
    "nomeEverfit": "Salto triplo a 1 gamba e sprint",
    "serie": 2,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 90,
    "perLato": true
   },
   {
    "esercizio_id": "vel-salto-triplo-a-1-gamba-e-sprint",
    "nomeEverfit": "Salto triplo a 1 gamba e sprint",
    "serie": 1,
    "quantita": 50.0,
    "unita": "metri",
    "recupero_sec": 120,
    "perLato": true
   },
   {
    "esercizio_id": "vel-sprint-con-palla-da-fermo",
    "nomeEverfit": "Sprint con palla da fermo",
    "serie": 2,
    "quantita": 20.0,
    "unita": "metri",
    "recupero_sec": 40
   },
   {
    "esercizio_id": "vel-sprint-con-palla-da-fermo",
    "nomeEverfit": "Sprint con palla da fermo",
    "serie": 2,
    "quantita": 30.0,
    "unita": "metri",
    "recupero_sec": 60
   },
   {
    "esercizio_id": "vel-sprint-con-palla-da-fermo",
    "nomeEverfit": "Sprint con palla da fermo",
    "serie": 2,
    "quantita": 10.0,
    "unita": "metri",
    "recupero_sec": 30
   },
   {
    "esercizio_id": "vel-postura-velocita-difensori",
    "nomeEverfit": "Postura + Velocità Difensori",
    "serie": 3,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 120
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 },
 {
  "id": "visione-b1-headball",
  "nome": "Visione B1 - headball",
  "nomeEverfit": "Visione B1 - headball",
  "famiglia": "Visione - Headball",
  "qualita": "tecnica-visione",
  "qualitaSet": {},
  "livello": "B",
  "progressione": 1,
  "variante": "full",
  "durataMin": 26,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi interno - visione headball",
    "serie": 3,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "perLato": true
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi collo - visione headball",
    "serie": 3,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "perLato": true
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi esterno - visione headball",
    "serie": 3,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "perLato": true
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi in equilibrio su 1 piede - visione headball",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 20
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi SX/Centro/DX - visione headball",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 30,
    "perLato": true
   }
  ],
  "completo": false,
  "mancanti": [
   "Passaggi SX/Centro/DX - visione headball",
   "Passaggi collo - visione headball",
   "Passaggi esterno - visione headball",
   "Passaggi in equilibrio su 1 piede - visione headball",
   "Passaggi interno - visione headball"
  ],
  "tags": []
 },
 {
  "id": "visione-b2-headball",
  "nome": "Visione B2 - headball",
  "nomeEverfit": "Visione B2 - headball",
  "famiglia": "Visione - Headball",
  "qualita": "tecnica-visione",
  "qualitaSet": {},
  "livello": "B",
  "progressione": 2,
  "variante": "full",
  "durataMin": 27,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi interno - visione headball",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "perLato": true
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi collo - visione headball",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "perLato": true
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi esterno - visione headball",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "perLato": true
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi in equilibrio su 1 piede - visione headball",
    "serie": 3,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 20
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi SX/Centro/DX - visione headball",
    "serie": 1,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 2,
    "perLato": true
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi SX/Centro/DX - visione headball",
    "serie": 1,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "perLato": true
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi SX/CC/DX interno/collo/esterno - visione headball",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "perLato": true
   }
  ],
  "completo": false,
  "mancanti": [
   "Passaggi SX/CC/DX interno/collo/esterno - visione headball",
   "Passaggi SX/Centro/DX - visione headball",
   "Passaggi collo - visione headball",
   "Passaggi esterno - visione headball",
   "Passaggi in equilibrio su 1 piede - visione headball",
   "Passaggi interno - visione headball"
  ],
  "tags": []
 },
 {
  "id": "visione-b3-headball",
  "nome": "Visione B3 - headball",
  "nomeEverfit": "Visione B3 - headball",
  "famiglia": "Visione - Headball",
  "qualita": "tecnica-visione",
  "qualitaSet": {},
  "livello": "B",
  "progressione": 3,
  "variante": "full",
  "durataMin": 23,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi interno - visione headball",
    "serie": 2,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 20,
    "perLato": true,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi collo - visione headball",
    "serie": 2,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 20,
    "perLato": true,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi esterno - visione headball",
    "serie": 2,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 20,
    "perLato": true,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi in equilibrio su 1 piede - visione headball",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi SX/Centro/DX - visione headball",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 2,
    "perLato": true
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi SX/CC/DX interno/collo/esterno - visione headball",
    "serie": 3,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "perLato": true
   }
  ],
  "completo": false,
  "mancanti": [
   "Passaggi SX/CC/DX interno/collo/esterno - visione headball",
   "Passaggi SX/Centro/DX - visione headball",
   "Passaggi collo - visione headball",
   "Passaggi esterno - visione headball",
   "Passaggi in equilibrio su 1 piede - visione headball",
   "Passaggi interno - visione headball"
  ],
  "tags": []
 },
 {
  "id": "visione-b4-headball",
  "nome": "Visione B4 - headball",
  "nomeEverfit": "Visione B4 - headball",
  "famiglia": "Visione - Headball",
  "qualita": "tecnica-visione",
  "qualitaSet": {},
  "livello": "B",
  "progressione": 4,
  "variante": "full",
  "durataMin": 24,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi interno - visione headball",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "perLato": true,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi collo - visione headball",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "perLato": true,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi esterno - visione headball",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "perLato": true,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi in equilibrio su 1 piede - visione headball",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi SX/Centro/DX - visione headball",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 2,
    "perLato": true,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi SX/CC/DX interno/collo/esterno - visione headball",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "perLato": true
   }
  ],
  "completo": false,
  "mancanti": [
   "Passaggi SX/CC/DX interno/collo/esterno - visione headball",
   "Passaggi SX/Centro/DX - visione headball",
   "Passaggi collo - visione headball",
   "Passaggi esterno - visione headball",
   "Passaggi in equilibrio su 1 piede - visione headball",
   "Passaggi interno - visione headball"
  ],
  "tags": []
 },
 {
  "id": "visione-b5-headball",
  "nome": "Visione B5 - headball",
  "nomeEverfit": "Visione B5 - headball",
  "famiglia": "Visione - Headball",
  "qualita": "tecnica-visione",
  "qualitaSet": {},
  "livello": "B",
  "progressione": 5,
  "variante": "full",
  "durataMin": 22,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi interno - visione headball",
    "serie": 2,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 20,
    "perLato": true,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi collo - visione headball",
    "serie": 2,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 20,
    "perLato": true,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi esterno - visione headball",
    "serie": 2,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 20,
    "perLato": true,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi in equilibrio su 1 piede - visione headball",
    "serie": 2,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi SX/CC/DX interno/collo/esterno - visione headball",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "perLato": true,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi sinistra/avanti/destra con video - visione headball",
    "serie": 2,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 30
   }
  ],
  "completo": false,
  "mancanti": [
   "Passaggi SX/CC/DX interno/collo/esterno - visione headball",
   "Passaggi collo - visione headball",
   "Passaggi esterno - visione headball",
   "Passaggi in equilibrio su 1 piede - visione headball",
   "Passaggi interno - visione headball",
   "Passaggi sinistra/avanti/destra con video - visione headball"
  ],
  "tags": []
 },
 {
  "id": "visione-b6-headball",
  "nome": "Visione B6 - headball",
  "nomeEverfit": "Visione B6 - headball",
  "famiglia": "Visione - Headball",
  "qualita": "tecnica-visione",
  "qualitaSet": {},
  "livello": "B",
  "progressione": 6,
  "variante": "full",
  "durataMin": 22,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi interno - visione headball",
    "serie": 2,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 20,
    "perLato": true,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi collo - visione headball",
    "serie": 2,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 20,
    "perLato": true,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi esterno - visione headball",
    "serie": 2,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 20,
    "perLato": true,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi in equilibrio su 1 piede - visione headball",
    "serie": 2,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi SX/CC/DX interno/collo/esterno - visione headball",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "perLato": true,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi sinistra/avanti/destra con video - visione headball",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi interno/collo/esterno con video - visione headball",
    "serie": 1,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 30,
    "perLato": true
   }
  ],
  "completo": false,
  "mancanti": [
   "Passaggi SX/CC/DX interno/collo/esterno - visione headball",
   "Passaggi collo - visione headball",
   "Passaggi esterno - visione headball",
   "Passaggi in equilibrio su 1 piede - visione headball",
   "Passaggi interno - visione headball",
   "Passaggi interno/collo/esterno con video - visione headball",
   "Passaggi sinistra/avanti/destra con video - visione headball"
  ],
  "tags": []
 },
 {
  "id": "visione-b7-headball",
  "nome": "Visione B7 - headball",
  "nomeEverfit": "Visione B7 - headball",
  "famiglia": "Visione - Headball",
  "qualita": "tecnica-visione",
  "qualitaSet": {},
  "livello": "B",
  "progressione": 7,
  "variante": "full",
  "durataMin": 22,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi collo - visione headball",
    "serie": 2,
    "quantita": 1.0,
    "unita": "minuti",
    "recupero_sec": 20,
    "perLato": true,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi in equilibrio su 1 piede - visione headball",
    "serie": 2,
    "quantita": 60.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi SX/CC/DX interno/collo/esterno - visione headball",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "perLato": true,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi sinistra/avanti/destra con video - visione headball",
    "serie": 2,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi interno/collo/esterno con video - visione headball",
    "serie": 2,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 30,
    "perLato": true
   }
  ],
  "completo": false,
  "mancanti": [
   "Passaggi SX/CC/DX interno/collo/esterno - visione headball",
   "Passaggi collo - visione headball",
   "Passaggi in equilibrio su 1 piede - visione headball",
   "Passaggi interno/collo/esterno con video - visione headball",
   "Passaggi sinistra/avanti/destra con video - visione headball"
  ],
  "tags": []
 },
 {
  "id": "visione-b8-headball",
  "nome": "Visione B8 - headball",
  "nomeEverfit": "Visione B8 - headball",
  "famiglia": "Visione - Headball",
  "qualita": "tecnica-visione",
  "qualitaSet": {},
  "livello": "B",
  "progressione": 8,
  "variante": "full",
  "durataMin": 21,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi SX/CC/DX interno/collo/esterno - visione headball",
    "serie": 2,
    "quantita": 90.0,
    "unita": "secondi",
    "recupero_sec": 20,
    "perLato": true,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi sinistra/avanti/destra con video - visione headball",
    "serie": 2,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 30,
    "perLato": true,
    "nota": "ESEGUI L'ESERCIZIO CON UN OCCHIO CHIUSO IN OGNI SET"
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "Passaggi interno/collo/esterno con video - visione headball",
    "serie": 2,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 30,
    "perLato": true
   },
   {
    "esercizio_id": null,
    "nomeEverfit": "passaggi dx/sx sinistra/avanti/destra con video - visione headball",
    "serie": 2,
    "quantita": 2.0,
    "unita": "minuti",
    "recupero_sec": 20
   }
  ],
  "completo": false,
  "mancanti": [
   "Passaggi SX/CC/DX interno/collo/esterno - visione headball",
   "Passaggi interno/collo/esterno con video - visione headball",
   "Passaggi sinistra/avanti/destra con video - visione headball",
   "passaggi dx/sx sinistra/avanti/destra con video - visione headball"
  ],
  "tags": []
 },
 {
  "id": "visione-pro-1",
  "nome": "Visione PRO 1",
  "nomeEverfit": "Visione PRO 1",
  "famiglia": "Visione",
  "qualita": "tecnica-visione",
  "qualitaSet": {
   "tecnica-visione": 2
  },
  "livello": "PRO",
  "progressione": 1,
  "variante": "full",
  "durataMin": 27,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "tvis-videocorso-visione-esercizi-base",
    "nomeEverfit": "Videocorso Visione - Esercizi Base",
    "serie": 1,
    "quantita": 10.0,
    "unita": "minuti",
    "recupero_sec": 120
   },
   {
    "esercizio_id": "tvis-videocorso-visione-esercizi-intermedi",
    "nomeEverfit": "Videocorso Visione - Esercizi Intermedi",
    "serie": 1,
    "quantita": 10.0,
    "unita": "minuti",
    "recupero_sec": 120
   }
  ],
  "completo": true,
  "mancanti": [],
  "descrizione": "Passaggi e Visione\nCircuito Esterni",
  "tags": []
 },
 {
  "id": "yoga-forza-e-prevenzione",
  "nome": "Yoga forza e prevenzione",
  "nomeEverfit": "Yoga forza e prevenzione",
  "famiglia": "Yoga Forza E Prevenzione",
  "qualita": "mobilita-recupero",
  "qualitaSet": {},
  "livello": null,
  "progressione": null,
  "variante": "full",
  "durataMin": 48,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": null,
    "nomeEverfit": "Yoga prevenzione e forza adduttori",
    "serie": 1,
    "quantita": 40.0,
    "unita": "minuti",
    "recupero_sec": 300
   }
  ],
  "completo": false,
  "mancanti": [
   "Yoga prevenzione e forza adduttori"
  ],
  "tags": []
 },
 {
  "id": "yoga-recupero",
  "nome": "Yoga Recupero",
  "nomeEverfit": "Yoga Recupero",
  "famiglia": "Yoga Recupero",
  "qualita": "mobilita-recupero",
  "qualitaSet": {
   "mobilita-recupero": 1
  },
  "livello": null,
  "progressione": null,
  "variante": "full",
  "durataMin": 43,
  "attrezzatura": [],
  "inCoppia": false,
  "items": [
   {
    "esercizio_id": "mob-sequenza-yoga-recupero-e-mobilita",
    "nomeEverfit": "Sequenza Yoga - Recupero e Mobilità",
    "serie": 1,
    "quantita": 40.0,
    "unita": "minuti",
    "recupero_sec": 0
   }
  ],
  "completo": true,
  "mancanti": [],
  "tags": []
 }
];
