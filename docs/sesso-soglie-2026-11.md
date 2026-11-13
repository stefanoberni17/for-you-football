# Ragazzo o ragazza: soglie e carichi (13/11/2026)

Ste, 13/11: «per le donne dovremmo mettere a posto almeno i carichi ecc. e chiedere sesso in registrazione».

## Cosa fa l'app

- **La domanda.** «Sei un ragazzo o una ragazza?» (`components/SessoScelta.tsx`) è obbligatoria nel primo passo della registrazione e in «Completa il profilo» (Google). Chi è già registrato la trova nell'Account e nel setup del Corpo (sezione «Il tuo corpo»). Sotto la domanda: «Serve a tarare carichi e livelli dei test, e a parlarti nel modo giusto».
- **Dove sta il dato.** Colonna `profiles.sesso` ('M' | 'F', migration 042). La legge `loadSesso` in `lib/sessoServer.ts`, con una query a parte: senza la colonna, o per chi non ha risposto, vale null e tutto resta come prima.
- **Soglie dei test** (`SOGLIE_F` e `soglieTest` in `lib/sesso.ts`).
  - Per una ragazza valgono al salvataggio di un test (`/api/training/test`), nel rombo e nella Carta (`buildRombo`), nei livelli per qualità (`livelliPerQualita`) e negli squilibri spinta/tirata.
  - I risultati di una ragazza salvati prima si ricalcolano con le sue soglie (`livelloRisultato`).
  - Restano uguali per tutti: tecnica con la palla, tenute isometriche (plank, superman, wall sit, affondo isometrico), test della fascia, scale a corpo libero e AMRAP. L'AMRAP è misurato sui massimi di chi lo fa.
- **Carichi** (`limaCarichi` in `lib/trainingCarico.ts`), senza un massimale suo:
  - il peso di partenza del catalogo e i kg dei blocchi di Ste scendono al 65 %;
  - si arrotondano a pesi che esistono: kettlebell a 4 kg (minimo 4), manubri e zavorra al kg, bilanciere e macchina a 2,5 kg; il bilanciere non scende mai sotto la barra da 15 kg;
  - il tetto senza massimale è 12 kg invece di 20;
  - con il massimale vale la percentuale del suo 1RM, come per tutti.
- **Planner, preparatore e Coach.**
  - Planner e preparatore ricevono la riga «È una RAGAZZA…» (`sessoTesto`).
  - Il Coach riceve «È una ragazza: parlale al femminile» (`sessoPerCoach`).

## Le soglie proposte (da confermare con Ste)

Numeri scelti a tavolino, non presi da tabelle normative. Li ho ricavati dalle differenze medie riportate negli studi sul calcio femminile:

| Qualità | Differenza media (ragazze rispetto ai ragazzi) |
| --- | --- |
| Sprint | circa 8-9 % più lente |
| Corse di resistenza | circa 12 % più lente |
| Salti in lungo | circa 18 % in meno |
| Forza relativa delle gambe | circa 80 % |
| Forza relativa della parte alta | circa 60-65 % |

Vanno tarate con i dati delle prime ragazze.

| Test | Ragazzi (intermedio / avanzato / PRO) | Ragazze |
| --- | --- | --- |
| Max piegamenti | 15 / 30 / 40 | 8 / 18 / 25 |
| Max pull-up | 2 / 8 / 12 | 1 / 3 / 6 |
| 1 km (s, meno è meglio) | 250 / 230 / 210 | 280 / 258 / 235 |
| 3 km (s) | 825 / 750 / 705 | 925 / 840 / 790 |
| Navetta 10 m × 30" | 7 / 10 / 12 | 6 / 9 / 11 |
| Ankle stiffness 20" | 7 / 9 / 10 | 6 / 8 / 9 |
| Ankle stiffness per lato | 6 / 8 / 9 | 5 / 7 / 8 |
| 50 m (s) | 9 / 8 / 7 | 9,8 / 8,7 / 7,6 |
| T sprint (s) | 14 / 12 / 10 | 15,1 / 13 / 10,8 |
| Broad jump (cm) | 170 / 200 / 250 | 140 / 165 / 205 |
| Broad jump per lato (cm) | 150 / 190 / 240 | 125 / 155 / 195 |
| Squat (1RM / peso corporeo) | 1,0 / 1,3 / 1,6 | 0,8 / 1,05 / 1,3 |
| Stacco rumeno | 0,9 / 1,2 / 1,5 | 0,75 / 1,0 / 1,25 |
| Hip thrust | 1,0 / 1,4 / 1,8 | 0,9 / 1,25 / 1,6 |
| Squat bulgaro | 0,4 / 0,6 / 0,8 | 0,3 / 0,45 / 0,6 |
| Panca piana | 0,6 / 0,8 / 1,0 | 0,4 / 0,55 / 0,7 |
| Shoulder press | 0,4 / 0,55 / 0,7 | 0,3 / 0,4 / 0,5 |
| Pull-up zavorrato (corpo + zavorra) | 1,1 / 1,3 / 1,5 | 1,0 / 1,1 / 1,25 |

## Da decidere con Ste

1. Le soglie qui sopra e il 65 % sui pesi.
2. Il tetto di 12 kg senza massimale.
3. Le soglie dei gradini delle scale (20 piegamenti, 10 trazioni) restano uguali. I gradini sono passi, e una ragazza parte semplicemente da un gradino più basso. Va bene così?
4. Le opzioni sono solo due, «Ragazzo» e «Ragazza». Per le soglie ne serve una. Se vuoi una terza opzione, va detto cosa vale per le soglie.
