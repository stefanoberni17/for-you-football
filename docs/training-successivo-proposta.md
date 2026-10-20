# Colonna `successivo` nel catalogo v2 — proposta da correggere (20/10/2026)

Ste, 16/9: "ok, non urgente". L'idea: per ogni esercizio del catalogo v2 l'id dell'esercizio "passo dopo", così quando la
dose è al tetto del +30 % e i log dicono ancora SALI il server propone l'esercizio successivo con dose ×0.7, come fa oggi
`gradinoSuccessivo` (`lib/trainingProgressione.ts`) sulle catene v1 (spinta, tirata, core, gambe). Oggi per il v2 il
"successivo" non è modellato: solo difficoltà e livello.

**Come si usa questo file:** ogni riga è un collegamento proposto. Sotto ognuno c'è `Correzione:` vuota: scrivi lì se il
passo dopo è un altro, se la catena va spezzata o se un esercizio non deve avere un successivo (scrivi "nessuno"). Anche
a pezzi, su GitHub o in chat. Io riporto nel JSON (`successivo` per esercizio), `build-catalog-v2.py` lo porta in
`ExerciseV2.successivo` e `gradinoSuccessivo` lo userà. Non ho toccato il JSON: finché non correggi, niente cambia.

Regola che ho seguito: stesso gesto, un gradino più duro (difficoltà o livello), stessa attrezzatura o quella che il
ragazzo ha già (corpo libero → corpo libero; palestra → palestra). Dove una catena v1 esiste già (push, pull, core,
squat, affondi, RDL, bridge) non la ridico: qui ci sono solo gli esercizi del v2 fuori da quelle scale.

## Parte alta (spinta)

1. `fpa-piegamenti-hindu` Hindu Push-Up → `fpa-diamond-push-up` Diamond Push-Up
   Correzione:
2. `fpa-diamond-push-up` Diamond Push-Up → `fpa-archer-pushup` Archer Push-Up
   Correzione:
3. `fpa-archer-pushup` Archer Push-Up → `fpa-type-writer-push-up` Typewriter Push-Up
   Correzione:
4. `fpa-type-writer-push-up` Typewriter Push-Up → `fpa-one-arm-push-up-incline` One-Arm Incline Push-Up (piedi sul rialzo)
   Correzione:
5. `fpa-one-arm-push-up-incline` One-Arm Incline Push-Up → `fpa-one-arm-pushup` One-Arm Push-Up (Basic)
   Correzione:
6. `fpa-one-arm-pushup` One-Arm Push-Up (Basic) → `fpa-one-arm-push-up-decline` One-Arm Decline Push-Up (mani sul rialzo)
   Correzione:
7. `fpa-one-arm-push-up-decline` One-Arm Decline Push-Up → `fpa-one-arm-push-up-deep-pro` One-Arm Deep Push-Up (PRO)
   Correzione:
8. `fpa-plank-to-pushup` Plank to Push-Up → `fpa-piegamenti-hindu` Hindu Push-Up
   Correzione:
9. `fpa-pike-push-up` Pike Push-Up → `fpa-pike-push-up-piedi-rialzati` Feet-Elevated Pike Push-Up
   Correzione:
10. `fpa-pike-push-up-piedi-rialzati` Feet-Elevated Pike Push-Up → `fpa-eccentric-handstand-push-up` Eccentric Handstand Push-Up
    Correzione:
11. `fpa-eccentric-handstand-push-up` Eccentric Handstand Push-Up → `fpa-handstand-push-up` Handstand Push-Up
    Correzione:
12. `fpa-dips` Dips → `fpa-weighted-dips-from-bars` Weighted Dips (solo con la palestra)
    Correzione:
13. `fpa-overhead-press-con-manubri` Seated Dumbbell Overhead Press → `fpa-overhead-press-con-manubri-in-piedi` Standing Dumbbell Overhead Press
    Correzione:
14. `fpa-overhead-press-con-manubri-in-piedi` Standing Dumbbell Overhead Press → `fpa-overhead-press-con-bilanciere` Barbell Overhead Press
    Correzione:
15. `fpa-panca-piana-con-bilanciere` Barbell Bench Press → `fpa-panca-piana-con-bulanciere-gambe-in-aria` Barbell Bench Press (Legs Raised)
    Correzione:
16. `fpa-incline-dumbbell-flyes` Incline Dumbbell Press → `fpa-bench-flyes-fy` Incline Dumbbell Fly to Press (FY)
    Correzione:

## Parte alta (tirata)

17. `fpa-rematore-sotto-al-tavolo` Inverted Row → `fpa-trazioni-australiane` Australian Pull-Up
    Correzione:
18. `fpa-trazioni-australiane` Australian Pull-Up → `fpa-chin-up` Chin-Up
    Correzione:
19. `fpa-chin-up` Chin-Up → `fpa-trazioni` Pull-Up
    Correzione:
20. `fpa-trazioni` Pull-Up → `fpa-archer-pullup` Archer Pull-Up
    Correzione:
21. `fpa-archer-pullup` Archer Pull-Up → `fpa-pull-up-around-the-world` Around the World Pull-Up
    Correzione:
22. `fpa-pull-up-around-the-world` Around the World Pull-Up → `fpa-muscle-up` Muscle-Up
    Correzione:
23. `fpa-kettlebell-bent-over-row-with-rotation` Kettlebell Bent-Over Row with Rotation → `fpa-gorilla-row` Gorilla Row
    Correzione:

## Gambe

24. `fpb-bodyweight-squat` Bodyweight Squat → `fpb-goblet-squat` Goblet Squat (con il kettlebell) — altrimenti resta la scala squat v1
    Correzione:
25. `fpb-goblet-squat` Goblet Squat → `fpb-squat` Barbell Back Squat (palestra)
    Correzione:
26. `fpb-squat` Barbell Back Squat → `fpb-fy-squat` Paused Tempo Squat (FY)
    Correzione:
27. `fpb-fy-squat` Paused Tempo Squat (FY) → `fpb-front-squat` Barbell Front Squat
    Correzione:
28. `fpb-body-weight-bulgarian-split-squat` Bodyweight Bulgarian Split Squat → `fpb-squat-bulgaro` Bulgarian Split Squat (con carico)
    Correzione:
29. `fpb-squat-bulgaro` Bulgarian Split Squat → `fpb-atg-split-squat` ATG Split Squat
    Correzione:
30. `fpb-atg-split-squat` ATG Split Squat → `fpb-atg-lunge` ATG Lunge
    Correzione:
31. `fpb-patrick-step-up` Patrick Step-Down → `fpb-poliquin-step-up` Poliquin Step-Up
    Correzione:
32. `fpb-poliquin-step-up` Poliquin Step-Up → `fpb-fy-lateral-step-up` Lateral Step-Up on Bench (FY)
    Correzione:
33. `fpb-sissy-squat-slide` Supported Sissy Squat → `fpb-sissy-squat` Sissy Squat
    Correzione:
34. `fpb-nordic` Nordic Hamstring (Eccentric) → `fpb-nordic-hamstring` Nordic Hamstring Curl (anche risalita)
    Correzione:
35. `fpb-stacco-rumeno` Romanian Deadlift → `fpb-stacco-da-terra-con-bilanciere` Barbell Deadlift
    Correzione:
36. `fpb-elevated-hamstring-bridge-single-leg` Single-Leg Elevated Hamstring Bridge → `fpb-eccentric-elevated-hamstring-single-leg` Single-Leg Eccentric Elevated Hamstring Bridge
    Correzione:
37. `fpb-affondo-isometrico` Isometric Lunge Hold → `fpb-affondo-isometrico-con-tallone-sollevato` Isometric Lunge Hold (Heel Raised)
    Correzione:
38. `fpb-single-leg-rdl` Explosive Single-Leg RDL → `fpb-rdl-progression` Single-Leg RDL with Jumps and Header
    Correzione:

## Core

39. `core2-side-plank` Side Plank → `core2-plank-with-twist` Side Plank with Twist
    Correzione:
40. `core2-plank-with-twist` Side Plank with Twist → `core2-copenaghen-plank` Copenhagen Plank
    Correzione:
41. `core2-copenaghen-plank` Copenhagen Plank → `fpb-copenhagen-plank-fy` Copenhagen Plank with Crunch (FY)
    Correzione:
42. `core2-hanging-knee-raises` Hanging Knee Raise → `core2-hanging-oblique-knee-raise` Hanging Oblique Knee Raise
    Correzione:
43. `core2-hanging-oblique-knee-raise` Hanging Oblique Knee Raise → `core2-toes-to-bar` Toes to Bar
    Correzione:
44. `core2-holllow-hold` Hollow Hold → `core2-dragon-flag-tuck-ecc` Tuck Dragon Flag (Slow Eccentric)
    Correzione:
45. `core2-dragon-flag-tuck-ecc` Tuck Dragon Flag (Slow Eccentric) → `core2-dragon-flag-tuck` Tuck Dragon Flag
    Correzione:
46. `core2-bear-crawl-linear` Bear Crawl (Forward) → `core2-bear-crawl-lateral` Bear Crawl (Lateral)
    Correzione:

## Esplosività e pliometria

47. `fesp-kettlebell-swing` Kettlebell Swing → `fesp-kettlebell-swing-una-mano` One-Arm Kettlebell Swing
    Correzione:
48. `fesp-kettlebell-swing-una-mano` One-Arm Kettlebell Swing → `fesp-kettlebell-rotational-swing` Kettlebell Rotational Swing
    Correzione:
49. `fesp-kettlebell-kneeling-snatch` Kettlebell Kneeling Snatch → `fesp-kettlebell-snatch` Kettlebell Snatch
    Correzione:
50. `fesp-kettlebell-dead-clean` Kettlebell Dead Clean → `fesp-kettlebell-rotational-clean` Kettlebell Rotational Clean
    Correzione:
51. `fesp-salto-in-lungo-da-fermo` Standing Broad Jump → `fesp-kneeling-jump-to-broad-jump` Kneeling Jump to Broad Jump
    Correzione:
52. `plioe-pogo-jumps` Pogo Jumps → `plioe-ankle-stiffness-pogo-jumps-progression` Pogo Jumps Progression (Ankle Stiffness)
    Correzione:
53. `plioe-ankle-stiffness-pogo-jumps-progression` Pogo Jumps Progression → `plioe-fascia-toe-bounces-single-leg-pogo-jumps` Single-Leg Toe Bounces (On the Spot)
    Correzione:
54. `plioe-fascia-toe-bounces-single-leg-pogo-jumps` Single-Leg Toe Bounces → `plioe-single-leg-pogo-jumps` Single-Leg Pogo Jumps (Forward-Back and Lateral)
    Correzione:
55. `plioe-saltelli-in-squat` Squat Hops → `plioe-saltelli-in-squat-diagonale` Diagonal Squat Hops
    Correzione:
56. `plioi-squat-jump` Squat Jump → `plioi-drop-jump` Drop Jump
    Correzione:
57. `plioi-drop-jump` Drop Jump → `plioi-reverse-drop-jumps` Reverse Drop Jump
    Correzione:
58. `plioi-single-leg-drop-e-spinta-interna` Single-Leg Drop with Inside Push-Off → `plioi-single-leg-drop-e-spinta-laterale` Single-Leg Drop with Lateral Push-Off
    Correzione:
59. `plioi-single-leg-drop-e-spinta-laterale` Single-Leg Drop with Lateral Push-Off → `plioi-single-leg-lateral-drop-jump` Single-Leg Lateral Drop Jump
    Correzione:
60. `plioi-single-leg-lateral-drop-jump` Single-Leg Lateral Drop Jump → `plioi-single-leg-reverse-lateral-drop-progression` Single-Leg Reverse Lateral Drop (Progression)
    Correzione:

## Velocità

61. `vel-sprint-10-m` 10 m Sprint → `vel-sprint` Sprint
    Correzione:
62. `vel-sprint-con-partenza-in-ginocchio` Kneeling Start Sprint → `vel-sprint-con-partenza-in-ginocchio-laterale` Side-Kneeling Start Sprint
    Correzione:
63. `vel-salto-triplo-e-sprint` Triple Jump to Sprint → `vel-salto-triplo-a-1-gamba-e-sprint` Single-Leg Triple Jump to Sprint
    Correzione:

## Tecnica (solo dove il passo è evidente)

64. `tpal-palleggi-solo-un-piede-tecnica` One-Foot Juggling → `tpal-palleggi-1-piede-interno-collo-esterno-tecnica` One-Foot Juggling: Inside, Laces, Outside
    Correzione:
65. `tpal-palleggi-1-piede-interno-collo-esterno-tecnica` → `tpal-palleggi-1-piede-alternati-interno-esterno-tecni` One-Foot Juggling: Inside/Outside Alternating
    Correzione:
66. `tpal-palleggi-al-muro-2-tocchi` Wall Volleys: Two Touches → `tpal-palleggi-al-muro-2-tocchi-controllo-interno-pass` Wall Volleys: Inside Control, Laces Pass
    Correzione:
67. `tpal-palleggi-al-muro-2-tocchi-controllo-interno-pass` → `tpal-palleggi-al-muro-2-tocchi-controllo-esterno-pass` Wall Volleys: Outside Control, Laces Pass
    Correzione:
68. `tpas-passaggi-al-muro-1-tocco-interno-tecnica` Wall Passes: One Touch, Inside → `tpas-passaggi-al-muro-1-tocco-collo-tecnica` Wall Passes: One Touch, Laces
    Correzione:
69. `tpas-passaggi-liberi-al-muro-tecnica` Free Wall Passes → `tpas-passaggi-al-muro-in-difficolta` Wall Passes Under Pressure
    Correzione:
70. `tvis-dribbling-visione-e-reattivita-base` Dribbling with Vision: Basic → `tvis-dribbling-visione-e-reattivita-avanzato` Dribbling with Vision: Advanced
    Correzione:

## Senza successivo (proposta)

Riscaldamento, rolling, yoga e sequenze guidate, test, Farmer's Walk, Calf Raise, Tibialis Raise, Wall Sit, Knee
Extension, Hip Thrust, Leg Press, Lateral Raise, Arnold Press, Cuban Press, Crow Pose, i tre esercizi di spinta
isometrica al muro, gli esercizi di protezione palla, gli esercizi con la pallina da tennis, Fartlek, Ripetute,
Allungo, Salite. Per questi la progressione è la dose (serie, kg, secondi), non un altro esercizio.
Correzione:
