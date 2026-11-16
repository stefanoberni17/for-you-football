# Soglie dei test per le ragazze: cosa dicono gli studi (16/11/2026)

Ricerca per tarare `SOGLIE_F` in `lib/sesso.ts`. Il documento di partenza è `docs/sesso-soglie-2026-11.md`. Le soglie nel codice non sono ancora cambiate: aspettano l’ok di Ste.

## Come ho lavorato

- Per ogni qualità ho cercato studi pubblicati con revisione (PubMed, PMC, Sports Medicine, J Strength Cond Res, IJSPP, J Sports Sci). Li ho letti nel testo completo quando era aperto.
- Per ogni test ho cercato il **rapporto ragazze/ragazzi**. Le fonti preferite sono gli studi che misurano maschi e femmine **nello stesso studio**, meglio se calciatori.
- Poi ho applicato il rapporto alle soglie maschili di Ste e ho arrotondato.
- **Le trappole.**
  - Nei test a tempo il divario va sul tempo: «più lente del 12 %» vuol dire tempo × 1,12, non × 0,88.
  - Nella forza rispetto al peso corporeo il divario è più piccolo che nella forza assoluta.
  - Nella parte alta il divario è più grande che nelle gambe.
  - Nei test a ripetizioni (piegamenti, trazioni) il divario non è lineare. Chi è più debole lavora più vicino al suo massimo, quindi fa molte meno ripetizioni.

**Un riferimento per tutto: la meta-analisi del calcio femminile.** Compton e colleghi (Sports Medicine, 2025-2026) hanno raccolto 288 studi e 18.722 giocatrici dai 16 anni in su. Le hanno divise per livello, da «Tier 2» (campionati regionali) a «Tier 4-5» (prime leghe, nazionali, NCAA Division I). Valori medi di tutti i livelli:

| Test | Media | Intervallo di previsione 90 % |
| --- | --- | --- |
| 20 m | 3,45 s | |
| 30 m | 4,88 s | 4,39-5,37 |
| 40 m | 6,11 s | |
| T-test | 11,47 s | 8,84-14,11 |
| 5-0-5 | 2,57 s | |
| Salto in lungo da fermo | 189 cm | 157-221 |
| 1RM back squat | 87 kg | |
| Yo-Yo IR1 | 1143 m | |
| VO2max | 49 ml/kg/min | |

Tra i livelli lo sprint sui 30 m cambia molto: −0,47 s dal Tier 2 al Tier 4-5. Il salto in lungo invece cambia pochissimo: differenze «trascurabili».

Questi numeri non danno il rapporto con i maschi. Servono come controllo: le soglie proposte devono mettere la calciatrice media in un punto sensato della scala.

---

## Qualità per qualità

### Velocità (50 m)
Lo studio migliore è Haugen 2019 (PLoS One). Sono atleti norvegesi d'élite testati con fotocellule, tra cui 93 calciatrici e 57 calciatori.

| Distanza | Calciatrici | Calciatori | Divario |
| --- | --- | --- | --- |
| 10 m | 2,17 s | 2,01 s | +8 % |
| 20 m | 3,55 s | 3,24 s | +9,6 % |
| 30 m | 4,84 s | 4,39 s | +10,3 % |
| 40 m | 6,12 s | 5,51 s | +11,1 % |

Su tutti gli sport insieme il divario va dal 6,4 % sui 10 m al 9,3 % sui 40 m. Sulla velocità massima teorica (v0) è dell'11,9 %. **Più lunga è la distanza, più cresce il divario.**

Altri due studi danno divari più grandi:
- Loturco 2025 (calciatori e calciatrici brasiliani di livello nazionale): +13,3 % sui 20 m nei senior.
- McFarland/Lockie 2016 (NCAA Division II, stessa università): +14,9 % sui 30 m.

Sui 50 m il divario atteso è quindi **circa l'11-12 %**. Oggi è 8,9 %, troppo poco.

**Proposta: tempo × 1,12.** Il cronometro a mano non cambia il rapporto, perché sbaglia allo stesso modo per tutti.

### Cambi di direzione (T sprint)
Il test dell'app è il classico T-test: 10 m avanti, spostamenti laterali da 5 m, poi indietro. Ci sono confronti diretti nel calcio.

| Studio | Campione | Calciatrici | Calciatori | Divario |
| --- | --- | --- | --- | --- |
| Chattanta 2024 | 69 e 69, 18-25 anni | 11,27 s | 10,06 s | +12 % |
| McFarland/Lockie 2016 | NCAA D-II | 11,92 s | 10,22 s | +16,6 % |

Nello stesso studio di Lockie il pro-agility dà +15,5 %. Loturco 2025 trova solo +4,7 % su uno zig-zag, ma è un percorso diverso.

**Proposta: tempo × 1,12**, il valore più prudente dei confronti diretti. Oggi è 1,08, troppo poco.

### Navetta 10 m × 30"
È un test di sprint ripetuti con cinque cambi di direzione. Non ho trovato studi su questo protocollo esatto.

Le qualità più vicine sono lo sprint breve (+8-13 %) e i cambi di direzione (+12-16 %). Il numero di navette va con la velocità media, quindi conviene un fattore di circa 0,88-0,90.
- 7 → 6,2
- 10 → 8,9
- 12 → 10,7

**Proposta: tenere 6 / 9 / 11. È una stima.**

### Resistenza (1 km e 3 km)
- **Record mondiali** (Sandbakk 2018, IJSPP): il divario nella corsa è stabile all'8-12 %.
- **Marines USA** (Looney 2024, 497 donne e 1224 uomini): sulle 3 miglia le donne sono più lente del 9-11 %.
- **Esercito USA** (Grier 2025, 433 donne e 2124 uomini): sulle 2 miglia le donne sono più lente del 9,4 %.

Lo Yo-Yo IR1 mostra divari enormi: i maschi coprono il 97 % di distanza in più (Mujika 2009, calciatori dello stesso club). Ma la distanza dello Yo-Yo non cresce in modo lineare con la velocità, quindi non va usata per un test a tempo.

**Proposta: tenere tempo × 1,12.** È un po' più largo della media degli allenati e va bene per le dilettanti. Con × 1,11 cambierebbe di 2-9 secondi, una differenza trascurabile.

### Salto in lungo da fermo (broad jump)
Non ho trovato uno studio che misuri il broad jump di maschi e femmine nello stesso campione di calciatori. Mettendo insieme:
- **calciatrici:** 189 cm di media nella meta-analisi Compton;
- **calciatori:** 241 cm in 19 giocatori NCAA Division I (Lockie 2016); sul singolo arto 210-216 cm.

Il rapporto è circa **0,78**.

I salti verticali nello stesso studio confermano l'ordine di grandezza:
- squat jump: 0,79 nei senior di Loturco 2025, 0,73 in McFarland/Lockie 2016;
- countermovement jump: 0,70-0,72 negli stessi due studi.

Nella popolazione generale a 17 anni il rapporto è più basso, 0,65 sulla mediana (percentili italiani, Eur J Transl Myol 2020). Ma lì le ragazze sono meno allenate.

**Proposta: × 0,80.** Oggi è 0,82, quindi va abbassato di poco.

### Ankle stiffness / pogo 20"
Non ci sono studi su questo test, cioè percorsi completi in 20 secondi. La qualità più vicina è la forza reattiva nei saltelli.

Lehnert 2020 (J Hum Kinet) ha misurato ragazzi e ragazze U16 di sport di squadra:
- indice di forza reattiva (RSI): le ragazze hanno il 70-77 % dei ragazzi;
- rigidità della gamba rispetto al peso: 84-92 %.

Il test dell'app conta i percorsi, che dipendono soprattutto da quanto è breve il contatto a terra. Un fattore di circa 0,85-0,9 è ragionevole.

**Proposta: tenere 6 / 8 / 9, e 5 / 7 / 8 per gamba. È una stima.**

### Forza relativa delle gambe (squat, stacco rumeno, hip thrust, bulgaro)
- **Powerlifter** (van den Hoek 2024, J Sci Med Sport; 238.336 donne e 571.650 uomini, 18-35 anni, 90° percentile): squat 2,26 contro 2,83 volte il peso corporeo (0,80); stacco 2,66 contro 3,25 (0,82).
- **Atleti di forza e rugby** (Bartolomei 2021): squat 1,31 contro 2,01 volte il peso (0,65); stacco 1,53 contro 2,29 (0,67).
- **Calciatrici NCAA Division II** (Andersen 2018): squat stimato 1,16 volte il peso corporeo.

Quindi, per il peso corporeo, le ragazze hanno **circa il 65-80 %** della forza delle gambe dei ragazzi. L'80 % vale solo per atlete molto allenate. Per una calciatrice è meglio stare a circa **0,78**. Oggi è 0,80-0,83 (0,89 sull'hip thrust).

Sull'hip thrust non ci sono confronti. Uso lo stesso rapporto, al massimo 0,80. Oggi 0,89 è il valore più generoso della tabella senza un dato che lo giustifichi.

### Forza relativa della parte alta (panca, shoulder press)
- **Powerlifter** (van den Hoek 2024): panca 1,35 contro 1,95 volte il peso corporeo (0,69).
- **Atleti** (Bartolomei 2021): panca 0,85 contro 1,36 (0,62).
- **Forza assoluta:** braccia 52 %, gambe 66 % (Miller 1993). Una rassegna (Nuzzo 2023) conferma che il divario è più grande nella parte alta.

**Proposta: × 0,65 per panca e shoulder press.**
- La panca di oggi (0,67-0,70) è al limite alto: la abbasso appena.
- Lo shoulder press di oggi (0,71-0,75) è più generoso della panca, e non c'è un motivo. Lo allineo.

### Piegamenti (a terra, non sulle ginocchia)
- **Esercito USA** (Grier 2025): sui piegamenti con stacco delle mani le donne fanno il 69 % delle ripetizioni (24,0 contro 34,8).
- **Giovani adulti svedesi** (Ryman Augustsson 2009, 38 donne e 25 uomini): 17 contro 39 ripetizioni, cioè 0,44. Questo dato viene dal riassunto, non ho potuto leggere il testo completo.
- **La parte alta** (sopra): 0,62-0,69. Nelle ripetizioni a carico fisso il divario è più grande.

Il rapporto va quindi da 0,45 (non allenate) a 0,70 (allenate al test). Oggi le soglie stanno a 0,53-0,63, nel mezzo.

**Proposta: tenere 8 / 18 / 25.**

### Trazioni e trazione zavorrata
Lo studio più chiaro sono i Marines USA (Looney 2024, Front Physiol). Lì le donne si allenano apposta per le trazioni, perché sono nel loro test.
- donne 9 ± 3, uomini 20 ± 5 (0,45);
- nel gruppo con il punteggio massimo: 13 contro 23 (0,57).

Nei soldati dell'esercito l'appeso alla sbarra con le ginocchia al petto dà 2,0 contro 7,7 (0,26). Le calciatrici di solito non allenano la sbarra, quindi è giusto stare in basso: circa 0,45-0,5.
- 2 → 1
- 8 → 3,6, arrotondato a 4
- 12 → 5,4-6, arrotondato a 6

**Proposta: 1 / 4 / 6** (oggi 1 / 3 / 6). Anche 3 è difendibile, se Ste preferisce restare stretto.

**Trazione zavorrata.** Il rapporto della parte alta non si applica, perché il carico comprende il peso del corpo. La tengo coerente con le trazioni libere usando la stessa formula di Brzycki del test:
- 1 trazione ≈ 1,0 volte il peso;
- 4 trazioni ≈ 1,09;
- 6 trazioni ≈ 1,16.

Nei ragazzi le soglie di Ste stanno circa 0,05 sopra l'equivalente delle trazioni libere. **Proposta: 1,0 / 1,1 / 1,2** (oggi 1,0 / 1,1 / 1,25).

---

## La tabella proposta

| Test | Ragazzi (Ste) | Rapporto dagli studi | Ragazze oggi | **Ragazze proposta** | Cosa fare |
| --- | --- | --- | --- | --- | --- |
| Max piegamenti | 15 / 30 / 40 | 0,45-0,70 | 8 / 18 / 25 | **8 / 18 / 25** | tenere |
| Max trazioni | 2 / 8 / 12 | 0,45-0,57 | 1 / 3 / 6 | **1 / 4 / 6** | piccolo cambio |
| 1 km (s) | 250 / 230 / 210 | tempo × 1,09-1,12 | 280 / 258 / 235 | **280 / 258 / 235** | tenere |
| 3 km (s) | 825 / 750 / 705 | tempo × 1,09-1,12 | 925 / 840 / 790 | **925 / 840 / 790** | tenere |
| Navetta 10 m × 30" | 7 / 10 / 12 | × 0,88-0,90 (stima) | 6 / 9 / 11 | **6 / 9 / 11** | tenere |
| Ankle stiffness 20" | 7 / 9 / 10 | × 0,85-0,90 (stima) | 6 / 8 / 9 | **6 / 8 / 9** | tenere |
| Ankle stiffness per gamba | 6 / 8 / 9 | × 0,85-0,90 (stima) | 5 / 7 / 8 | **5 / 7 / 8** | tenere |
| 50 m (s) | 9 / 8 / 7 | tempo × 1,10-1,13 | 9,8 / 8,7 / 7,6 | **10,1 / 9,0 / 7,8** | cambiare |
| T sprint (s) | 14 / 12 / 10 | tempo × 1,12-1,17 | 15,1 / 13 / 10,8 | **15,7 / 13,4 / 11,2** | cambiare |
| Broad jump (cm) | 170 / 200 / 250 | × 0,78-0,80 | 140 / 165 / 205 | **136 / 160 / 200** | piccolo cambio |
| Broad jump per gamba (cm) | 150 / 190 / 240 | × 0,78-0,80 | 125 / 155 / 195 | **120 / 150 / 190** | piccolo cambio |
| Squat (1RM / peso corporeo) | 1,0 / 1,3 / 1,6 | × 0,65-0,80 | 0,8 / 1,05 / 1,3 | **0,8 / 1,0 / 1,25** | piccolo cambio |
| Stacco rumeno | 0,9 / 1,2 / 1,5 | × 0,67-0,82 | 0,75 / 1,0 / 1,25 | **0,7 / 0,95 / 1,2** | piccolo cambio |
| Hip thrust | 1,0 / 1,4 / 1,8 | × 0,78-0,80 (stima: gambe) | 0,9 / 1,25 / 1,6 | **0,8 / 1,1 / 1,45** | cambiare |
| Squat bulgaro | 0,4 / 0,6 / 0,8 | × 0,78 | 0,3 / 0,45 / 0,6 | **0,3 / 0,45 / 0,6** | tenere |
| Panca piana | 0,6 / 0,8 / 1,0 | × 0,62-0,69 | 0,4 / 0,55 / 0,7 | **0,4 / 0,5 / 0,65** | piccolo cambio |
| Shoulder press | 0,4 / 0,55 / 0,7 | × 0,65 (stima: come la panca) | 0,3 / 0,4 / 0,5 | **0,25 / 0,35 / 0,45** | cambiare |
| Trazione zavorrata (corpo + zavorra) / corpo | 1,1 / 1,3 / 1,5 | coerente con 1 / 4 / 6 trazioni | 1,0 / 1,1 / 1,25 | **1,0 / 1,1 / 1,2** | piccolo cambio |

Le proposte segnate come stima non hanno un confronto diretto in letteratura: navetta, ankle stiffness, hip thrust, shoulder press.

### Controllo con la calciatrice media (meta-analisi Compton)
- **T-test.** La media delle calciatrici è 11,47 s, tra avanzato (13,4) e PRO (11,2). I calciatori universitari fanno 10,1-10,2 s, intorno al PRO dei ragazzi (10). Il quadro è coerente.
- **Broad jump.** La media delle calciatrici è 189 cm, tra avanzato (160) e PRO (200). I calciatori NCAA Division I fanno 241 cm, tra 200 e 250. Il quadro è coerente.
- **50 m.** Le calciatrici d'élite fanno i 40 m in 6,1 s, quindi i 50 m in circa 7,4 s, oltre il PRO proposto (7,8). I calciatori d'élite fanno i 40 m in 5,5 s, quindi i 50 m in circa 6,6 s, oltre il PRO dei ragazzi (7). Il quadro è coerente.
- **Una nota per Ste.** Alcune soglie maschili sono larghe rispetto alla letteratura: T sprint e 50 m, dove un buon universitario è già PRO. Le soglie femminili ottenute con il rapporto ereditano questa larghezza. Se un giorno Ste stringe quelle maschili, basta riapplicare i rapporti.

### Una nota sui carichi (non era nella domanda)
Oggi `FATTORE_PESO_F` è 0,65. Cosa dicono gli studi sulla forza assoluta delle donne rispetto agli uomini:
- **gambe:** circa 0,6-0,66 (Miller 1993: 66 %);
- **parte alta:** circa 0,5-0,55 (Miller 1993: 52 %).

Lo 0,65 va bene per le gambe ma è un po' alto per panca, spalle e trazioni. Se Ste vuole, si può usare 0,55 per gli esercizi della parte alta.

---

## Fonti

1. Compton HR, Lovell R, Scott D, Clubb J, Shushan T. Benchmarking the Physical Performance Qualities in Women's Football: A Systematic Review and Meta-analysis Across the Performance Scale. *Sports Med* 2025-2026. [PMC13314896](https://pmc.ncbi.nlm.nih.gov/articles/PMC13314896/) · [doi:10.1007/s40279-025-02251-0](https://doi.org/10.1007/s40279-025-02251-0) (correzione: [doi:10.1007/s40279-025-02337-9](https://doi.org/10.1007/s40279-025-02337-9))
2. Haugen TA, Breitschädel F, Seiler S. Sprint mechanical variables in elite athletes: Are force-velocity profiles sport specific or individual? *PLoS One* 2019. [PMC6655540](https://pmc.ncbi.nlm.nih.gov/articles/PMC6655540/) · [doi:10.1371/journal.pone.0215551](https://doi.org/10.1371/journal.pone.0215551)
3. Haugen TA, Breitschädel F, Seiler S. Sprint mechanical properties in soccer players according to playing standard, position, age and sex. *J Sports Sci* 2020. Su 674 calciatori e calciatrici, le differenze tra i sessi vanno da piccole a molto grandi. Testo chiuso, letto solo il riassunto. [doi:10.1080/02640414.2020.1741955](https://doi.org/10.1080/02640414.2020.1741955)
4. Haugen TA, Tønnessen E, Seiler S. Speed and countermovement-jump characteristics of elite female soccer players, 1995-2010. *IJSPP* 2012. Solo riassunto. [doi:10.1123/ijspp.7.4.340](https://doi.org/10.1123/ijspp.7.4.340)
5. Loturco I et al. Challenges in speed and power development across age categories: a comparative study of female and male football players. *Biol Sport* 2025;42(4):203-209. [doi:10.5114/biolsport.2025.150039](https://doi.org/10.5114/biolsport.2025.150039)
6. McFarland IT, Dawes JJ, Elder CL, Lockie RG. Relationship of Two Vertical Jumping Tests to Sprint and Change of Direction Speed among Male and Female Collegiate Soccer Players. *Sports* 2016. [PMC5968930](https://pmc.ncbi.nlm.nih.gov/articles/PMC5968930/) · [doi:10.3390/sports4010011](https://doi.org/10.3390/sports4010011)
7. Lockie RG et al. Relationships and Predictive Capabilities of Jump Assessments to Soccer-Specific Field Test Performance in Division I Collegiate Players. *Sports* 2016. [PMC5968899](https://pmc.ncbi.nlm.nih.gov/articles/PMC5968899/) · [doi:10.3390/sports4040056](https://doi.org/10.3390/sports4040056)
8. Chattanta V, Verma N, Mehra P. Quantifying the difference between male and female agility in football players. *Phys Ther Sport* 2024. [doi:10.1016/j.ptsp.2024.10.002](https://doi.org/10.1016/j.ptsp.2024.10.002)
9. Mujika I, Santisteban J, Impellizzeri FM, Castagna C. Fitness determinants of success in men's and women's football. *J Sports Sci* 2009. Solo riassunto. [doi:10.1080/02640410802428071](https://doi.org/10.1080/02640410802428071)
10. Cardoso de Araújo M et al. Sex Differences in Physical Capacities of German Bundesliga Soccer Players. *J Strength Cond Res* 2020. Solo riassunto: divari da grandi a enormi in sprint, salti e resistenza intermittente. [doi:10.1519/JSC.0000000000002662](https://doi.org/10.1519/JSC.0000000000002662)
11. Sandbakk Ø, Solli GS, Holmberg HC. Sex Differences in World-Record Performance. *IJSPP* 2018. [doi:10.1123/ijspp.2017-0196](https://doi.org/10.1123/ijspp.2017-0196)
12. Looney DP et al. The 300 Marines: characterizing the US Marines with perfect scores on their physical and combat fitness tests. *Front Physiol* 2024. [PMC11217602](https://pmc.ncbi.nlm.nih.gov/articles/PMC11217602/) · [doi:10.3389/fphys.2024.1406749](https://doi.org/10.3389/fphys.2024.1406749)
13. Grier T et al. Musculoskeletal Injury and Physical Fitness Across US Army Occupational Specialties. *J Mil Veterans Health* 2025;33(2). [jmvh.org](https://jmvh.org/article/musculoskeletal-injury-and-physical-fitness-across-us-army-occupational-specialties/)
14. Ryman Augustsson S et al. Gender differences and reliability of selected physical performance tests in young women and men. *Adv Physiother* 2009. Numeri presi dal riassunto, non verificati nel testo. [doi:10.1080/14038190801999679](https://doi.org/10.1080/14038190801999679)
15. van den Hoek DJ et al. Normative data for the squat, bench press and deadlift exercises in powerlifting: Data from 809,986 competition entries. *J Sci Med Sport* 2024. [doi:10.1016/j.jsams.2024.07.005](https://doi.org/10.1016/j.jsams.2024.07.005)
16. Bartolomei S et al. A Comparison between Male and Female Athletes in Relative Strength and Power Performances. *J Funct Morphol Kinesiol* 2021. [PMC7930971](https://pmc.ncbi.nlm.nih.gov/articles/PMC7930971/) · [doi:10.3390/jfmk6010017](https://doi.org/10.3390/jfmk6010017)
17. Andersen E, Lockie RG, Dawes JJ. Relationship of Absolute and Relative Lower-Body Strength to Predictors of Athletic Performance in Collegiate Women Soccer Players. *Sports* 2018. [PMC6316620](https://pmc.ncbi.nlm.nih.gov/articles/PMC6316620/) · [doi:10.3390/sports6040106](https://doi.org/10.3390/sports6040106)
18. Miller AE, MacDougall JD, Tarnopolsky MA, Sale DG. Gender differences in strength and muscle fiber characteristics. *Eur J Appl Physiol* 1993. [doi:10.1007/BF00235103](https://doi.org/10.1007/BF00235103)
19. Nuzzo JL. Narrative Review of Sex Differences in Muscle Strength… *J Strength Cond Res* 2023. [doi:10.1519/JSC.0000000000004329](https://doi.org/10.1519/JSC.0000000000004329)
20. Lehnert M et al. Gender and Age Related Differences in Leg Stiffness and Reactive Strength in Adolescent Team Sports Players. *J Hum Kinet* 2020. [PMC7706640](https://pmc.ncbi.nlm.nih.gov/articles/PMC7706640/) · [doi:10.2478/hukin-2020-0020](https://doi.org/10.2478/hukin-2020-0020)
21. Percentile values of the standing broad jump in children and adolescents aged 6-18 years old. *Eur J Transl Myol* 2020. [PMC7385687](https://pmc.ncbi.nlm.nih.gov/articles/PMC7385687/) · [doi:10.4081/ejtm.2019.9050](https://doi.org/10.4081/ejtm.2019.9050)

**Cosa non ho potuto leggere.** Testi chiusi, letti solo nel riassunto: Haugen 2020, Mujika 2009, Cardoso de Araújo 2020, Ryman Augustsson 2009. I numeri dei rapporti vengono dagli studi aperti (1, 2, 5, 6, 7, 12, 13, 15, 16, 17, 20, 21) e da Chattanta 2024, il cui riassunto riporta i valori.
