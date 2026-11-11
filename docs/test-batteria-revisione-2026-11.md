# La batteria di test, rivista (11/11/2026, proposta)

Ste, 11/11: «riguarderei bene tutta la batteria di test in modo che li diminuiamo, soprattutto quelli per partire, poi gli altri li calcola durante gli allenamenti da solo». Insieme: gli obiettivi prima dei test, «Dove ti alleni» separato da «Che attrezzi hai», infortuni obbligatori, «Parto senza test» con la conferma del piano base, una domanda al posto dell'AMRAP, con «Tutto, in equilibrio» i test principali e una settimana di sedute guidate per i test a chi non ha risultati da inserire.

Niente codice finché Ste non conferma le tabelle.

## Com'è oggi

47 test (21 della prima versione, 26 della v2) più la scala dei gradini, in una pagina a 11 blocchi. La card dell'hub dice «mezz'ora». Cosa legge davvero il programma (cercato nel codice l'11/11):

- **Gradini delle scale** (piegamenti, pull-up, plank, superman, squat, affondi, RDL, bridge): le sedute di parte alta e di gambe composte dal server (`pa-*`, `pb-*`). Le gambe servono almeno due catene testate.
- **AMRAP**: l'unica fonte del livello generale (`fasciaFromResults`). Senza, livello B su tutto; per la parte alta conta anche come voto e tira giù chi ai piegamenti è forte.
- **Livello per qualità** (`livelloQualita`): i test di quella qualità; senza, il livello generale.
- **Massimali in palestra**: il tetto dei kg (senza massimale 20 kg) e la seduta di forza massima delle gambe (`pb-fmax`).
- **Tecnica**: palleggi, muro, tiri e passaggi danno la parte più debole (`prioritaTecnica`).
- **Per lato** (wall sit, affondo fermo, salto, ankle, equilibrio, palleggi, tiri): gli squilibri. Gli squilibri li leggono anche i log per lato delle sedute.
- **Cinque questionari della fascia** (fatica nell'equilibrio, nei towel curls, dolori alle articolazioni, dopo gli allenamenti, dopo le partite): solo la punta Fascia della Carta. Nessuna regola del piano li legge. Fastidi e dolori il programma li prende già da limitazioni, resoconti, zone tese e «Dove l'hai sentito?».

Già oggi alcune cose si calcolano in seduta: un gradino passato in seduta diventa un risultato (`risultatiDallaSeduta`), e nelle settimane di ri-test le serie test entrano nelle sedute (`inserisciSerieTest`).

## La proposta in breve

1. **Livello generale da una domanda**, non dall'AMRAP.
2. **Per partire al massimo 4 test**, scelti dagli obiettivi, tutti a casa, circa 10 minuti. Oppure i risultati che ha già, scritti a mano.
3. **Il resto dentro le sedute**: la prima volta che una seduta tocca una qualità senza test, la sua prima serie è il test (come nel ri-test integrato).
4. **I massimali si stimano dalle serie**: chi in palestra fa le serie con i kg e le ripetizioni fatte e il voto, ha il massimale stimato senza fare il test.
5. **Settimana dei test**, a scelta, per chi preferisce farli tutti subito: sedute guidate solo per i test, con il riscaldamento, rispettando partita e squadra.
6. **Tutti i test restano possibili**: quelli che non servono per partire stanno in «Tutti i test».

## 1. La domanda al posto dell'AMRAP (Ste, 11/11)

«Come valuteresti il tuo livello negli esercizi in palestra o a corpo libero?» Una risposta sola; decide il livello generale di partenza e il tetto dei carichi (oggi «Esperienza palestra» sì/no, `caricoMaxPct`: 60 % senza esperienza, 70 % con, 90 % con esperienza, più di 18 anni e livello A o PRO).

| Risposta (testo di Ste) | Livello generale | Esperienza con i pesi |
|---|---|---|
| Mai fatti | B | no (carichi max 60 %) |
| Ho fatto qualcosa, ma poco | B | no |
| Un po' di esperienza, ma livello base | B | no |
| Riesco a eseguire esercizi con i pesi in autonomia | B | sì (70 %) |
| Ho esperienza in palestra e a corpo libero e mi ritengo a un livello avanzato | A | sì (90 % sopra i 18 anni) |
| Sono anni che mi alleno ed eseguo tranquillamente esercizi con pesi e a corpo libero | A | sì (90 % sopra i 18 anni) |

PRO solo dai test, mai dalla domanda: chi si sopravvaluta non parte troppo alto. Appena c'è il test di una qualità vale il test, e la dose la correggono comunque i log delle prime sedute. L'AMRAP resta tra i test per chi lo vuole fare, e se c'è vale lui.

## 2. Per partire: i test per obiettivo

Tutti a corpo libero, a casa, una serie al massimo ciascuno.

| Obiettivo | Per partire | Perché basta |
|---|---|---|
| Forza parte alta | piegamenti · pull-up (se ha la sbarra) | i gradini di spinta e tirata; senza sbarra la tirata la fanno i rematori |
| Forza gambe | squat · glute bridge | le due catene che servono alle sedute di gambe |
| Tecnica palla | palleggi piede forte · piede debole | la parte debole della tecnica e il livello dei palleggi |
| Esplosività / salti | equilibrio a occhi chiusi destro e sinistro · le tre domande sui dolori (articolazioni, dopo gli allenamenti, dopo le partite) | la fascia decide anche la pliometria (vedi sotto); salto e ankle stiffness nella prima seduta |
| Prevenzione | come per i salti, più i towel curls | il punto di partenza della fascia |
| Velocità, Resistenza | nessuno | partono dal livello generale; il test è la prima serie della prima seduta di quella qualità |
| Kettlebell, Recupero | nessuno | il kettlebell dai log |
| Tutto, in equilibrio | piegamenti · pull-up · squat · bridge | i «test principali» di Ste; tecnica e campo nelle sedute |

Con due obiettivi di forza e la tecnica il massimo è 6 test (circa 15 minuti); il caso tipico è 2-4.

Accanto a ogni test «Ho già il risultato» per scriverlo a mano (anche dei test in seduta: chi sa il suo 50 m lo scrive e non lo rifà).

**La fascia per la pliometria (Ste, 11/11: «quelli della fascia dovrebbero essere usati anche per la pliometria»).** Oggi i test della fascia entrano solo nella Carta. Proposta: (a) il punteggio della fascia diventa un voto nel livello della pliometria (mediana bassa: una fascia debole tiene la pliometria al livello sotto, anche con un buon salto in lungo); (b) dolori alle articolazioni o fastidi dopo gli allenamenti nei questionari → la pliometria resta in B anche con i test dei salti da A, e le 4 settimane di ingresso in B non si accorciano (oggi un A ai salti le porta a 2); (c) equilibrio a occhi chiusi con più del 15 % di differenza tra i lati → nella pliometria prima gli esercizi a due gambe. È una regola nuova del Campo: le soglie le decide Ste.

## 3. Il resto dentro le sedute

| Test | Quando entra | Come |
|---|---|---|
| Plank, superman | prima seduta di parte alta | prima serie dell'esercizio di core o dorsali: «tieni il più a lungo possibile» |
| Affondi, RDL | prima seduta di gambe | prima serie dell'esercizio, al massimo |
| 50 m | prima seduta di velocità | dopo il riscaldamento, al posto del primo sprint |
| Salto in lungo, ankle stiffness | prima seduta di pliometria | primi due salti della seduta |
| Navetta (in stagione) o 1 km (fuori stagione) | prima seduta di resistenza | prima serie |
| Muro, tiri, passaggi | prima seduta di tecnica di quel tema | primo esercizio |
| Per lato (affondo fermo o salto su una gamba) | solo se i log per lato mostrano una differenza | proposta nella seduta dopo |

Le regole del ri-test valgono anche qui: mai a ±1 giorno dalla partita, mai nello scarico, mai su una zona dolorante, al massimo una serie test per seduta (due nella prima settimana?). Finché il test non c'è la qualità resta al livello generale, e la seduta lo dice.

## 4. I massimali dalle serie

Le serie in palestra hanno già kg, ripetizioni fatte e voto. Una serie con almeno 3 e al massimo 10 ripetizioni e voto 7 o più dà una stima del massimale (Brzycki, con le ripetizioni rimaste dal voto). Vale la stima più alta delle ultime 4 settimane; il test di massimale resta per chi lo vuole fare. Fino alla prima stima vale il tetto di oggi (20 kg senza massimale), quindi le prime sedute partono basse e salgono con i log. Da decidere con Ste: le soglie di ripetizioni e voto.

## 5. La settimana dei test (a scelta)

Per chi parte senza risultati e preferisce farli tutti subito (proposta di Ste per «Tutto, in equilibrio», ma vale per tutti):

- **Seduta 1, a casa, ~30'**: riscaldamento, i test a corpo libero (otto catene), poi mobilità.
- **Seduta 2, in campo, ~45'**: riscaldamento velocità, 50 m, salto in lungo, ankle stiffness, palleggi e muro.
- **Seduta 3, in campo, ~30'** (solo fuori stagione o con la resistenza tra gli obiettivi): 1 km o navetta.
- In palestra: una seduta con le serie sub-massimali dei lift che userà.

Le sedute seguono le regole dell'asse partita (velocità e resistenza mai il giorno prima, i salti mai a −1, niente a +1 dopo una partita giocata). Con la squadra 3+ volte e la partita, la settimana dei test ha solo le sedute 1 e 2. La settimana dopo parte il piano vero, già calibrato.

Dubbio: in stagione una settimana senza lavoro di forza vero, solo test. Per questo la propongo a scelta, non obbligatoria.

## 6. Tutti i test restano (Ste, 11/11: «lascerei comunque la possibilità di fare i test»)

Nessun test si toglie. La pagina dei test ha tre parti: «Per partire» (quelli dei suoi obiettivi), «Dentro le sedute» (quelli che arrivano da soli, con «Lo faccio adesso» per chi li vuole fare prima), «Tutti i test» (l'elenco completo, chiuso). Cambia solo cosa si chiede e cosa si calcola da solo:

| Test | Come arriva |
|---|---|
| AMRAP | facoltativo; se c'è vale lui, altrimenti la domanda |
| Questionari della fascia | per partire con salti e prevenzione; facoltativi per gli altri |
| Equilibrio occhi chiusi dx/sx | per partire con salti e prevenzione |
| 3 km | facoltativo (il 1 km arriva nella seduta) |
| T-sprint | facoltativo |
| Wall sit (due gambe), per lato (wall sit, affondo fermo, salto, ankle) | facoltativi; gli squilibri li leggono anche i log per lato |
| Palleggi di testa, piramide | facoltativi |
| Tiri in traversa, passaggi al palo | primo esercizio della seduta di tiri |
| Lift in palestra | stimati dalle serie; il test resta |

## Domande per Ste

1. La tabella della domanda: «in autonomia con i pesi» = B con esperienza, le ultime due = A. Va bene?
2. La fascia per la pliometria: (a), (b), (c) come sopra? Le soglie?
3. Nella prima settimana una o due serie test per seduta?
4. La settimana dei test: a scelta per tutti, o solo con «Tutto, in equilibrio»?
5. Massimali dalle serie: da 3 a 10 ripetizioni con voto ≥ 7, va bene?
