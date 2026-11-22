# Per la chat dei contenuti: le correzioni su Notion dall'audit del 22/11

Audit completo: `docs/audit-percorso-2026-11-22.md`. Qui solo quello che si fa **su Notion**, con le frasi esatte e un
testo proposto per ogni punto. Le proposte sono di Claude: decide Ste.

## Già sistemato nel codice (PR #192): NON serve fare niente su Notion

- **W12-G7, Gate finale:** l'app mostra «Le tue risposte del primo giorno» sotto la pratica, anche senza «Mostra
  Carta». Si può togliere dal Contesto la frase «Mostra Carta Onboarding, da attivare quando Code lo rilascia»
  (resta comunque l'opzione «Onboarding» di Mostra Carta, se serve altrove).
- **W9-G6 e Gate 9:** la routine di W9-G4 ora si vede nel giorno («Le tue risposte»).
- **W11-G3:** «Le tue risposte» mostra le date e i giorni saltati.
- **W11-G4:** gli aiuti sotto i cinque campi della pagina chiedono solo il richiamo in poche parole.
- **Il nome dello strumento** in W5, W7, W8 (e W9, W11) non compare più prima del giorno in cui viene presentato.
- **Il popup del Reset:** durante il respiro mostra la parola del ragazzo; il «Mantra Dashboard» resta come «La frase
  della settimana» nel foglio di partenza. Si può tenere com'è, ma va letta come frase della settimana, non come mantra.
- **Fine percorso, Coach, Palestra, azioni, schede di riserva:** sistemati nel codice.
- **Principio W4:** il codice ora dice «Ascolto», come Notion.

## Da fare su Notion

1. **W12-G4:** «Mostra Carta» = «Risposte pronte» (al posto di «Protocollo For You»). Dopo il merge della PR #192
   «Risposte pronte» mostra il DURANTE del Protocollo For You (e se è vuoto le risposte di W11-G2).
2. **W8-G7:** «Mostra Carta» = «Cose» (la domanda 3 chiede di rileggere la Carta).
3. Tutti i punti dei tre rapporti qui sotto (W1-W4, W5-W8, W9-W12), tranne quelli dell'elenco «già sistemato».
4. **Schede SOS (DB Difficoltà):**
   - Errore «Adesso» (W1): «"Ho rovinato tutto"… l'hai aggiunto tu… Tieni quello che è successo.» e Panchina
     «Adesso» (W1): «Guarda cosa è successo e cosa ti stai raccontando.» usano fatto/storia in W1 (strumento di W6).
   - Ansia W8: «la pressione dei genitori», «Un respiro lungo, lunghissimo», «Spalle aperte, petto libero»,
     «Giochi perché vali già», «toglierle la radice»: promesse sul corpo e frasi da Instagram.
   - Ansia W3: «È energia, non pericolo… lo puoi guidare.»
   - I due layer «L'Anticipo» (W7) descrivono la mossa (senti, nomina, Reset, scegli), non la frase «quando sento…,
     allora…» del campo Strumento di W7: usare la frase.
   - Panchina chiude con «Il tuo valore non lo decide…»: da frase fatta.
   Quando si cambia un layer «Adesso», dirlo: il codice ne tiene una copia di riserva (`lib/sosCards.ts`).
5. **«Pratica Giorno Partita»** è vuota in tutte e 12 le settimane: finché è vuota il giorno della partita non ha il box.

## Gli audio: quali si rifanno dopo i cambi

Si rifà un audio solo se cambia una frase che la voce dice (Apertura, Pratica, Nota Campo letta a voce). Il riassunto
«Fai 3 Reset per arrivare qui» non conta: l'audio guida già i Reset per esteso.

- **W3-G4, Pratica (sicuro):** l'audio fa ancora la versione in tre fasi da 15', il testo ora ha cinque passi e il
  resto facoltativo. Prima va corretta su Notion l'Apertura («Oggi lo metti alla prova, in tre fasi.») e la Durata.
- **Se si applicano le proposte qui sotto**, toccano frasi registrate in: W1-G3 (apertura, pratica), W1-G6 (pratica),
  W2-G1 (pratica), W2-G4 (apertura), W4-G3 (apertura, pratica), W4-G5 (pratica), W6-G4 (apertura «dodici minuti»,
  pratica «Stacca un momento»), W7-G4 (pratica «stacca e rifallo»), W7-G6 (pratica), W8-G2 (pratica «stacchi»),
  W10-G1 (apertura).
- Dopo i cambi: scrivere a Claude l'elenco dei giorni toccati. Rigenera solo le frasi cambiate (pochi centesimi di
  crediti per giorno), carica i file e aggiorna «Durata Minuti».

---

# Audit contenuti W1-W4 (22/11)

Fonti: giorni.json (W1-G1…W4-G7), settimane.json (W1-W4), lib/risposteChiave.ts, lib/risposteGuidate.ts, app/giorno/[week]/[day]/page.tsx, components/PracticePopup.tsx, components/GlobalMeditationWrapper.tsx + MeditationPopup.tsx, lib/constants.ts. Niente modificato.

Parole vietate (Chin Mudra, interruttore, «c'è qualcuno a casa», riflessi, la strada, crescita spirituale): nessuna in W1-W4. Anticipazioni di strumenti W5+: nessuna (W4-G5 «cosa è successo / quale frase ci hai aggiunto» è un accenno generico a Fatto vs Storia, già previsto nel Coach Contesto W4). Canone Reset (gesto sull'inspirazione, parola sull'espirazione, 4/6, Reset breve senza conteggio) e Body Check (piedi → stomaco → petto → spalle) rispettati in tutti i giorni.

## BLOCCANTI

**[BLOCCANTE] W4-G6 · Pratica** — «Poi scrivi il tuo Protocollo Pressione in tre righe, nella risposta di oggi […] Adesso provalo una volta […] Rileggi le tre righe ad alta voce una volta. Suonano tue? Se qualcosa non ti convince, sistemalo adesso.»
Nell'app la pratica sta in un timer da 10' («Inizia la pratica · 10 min», anello «Rifletti», «Ho finito» solo dal 60 %); il campo guidato arriva solo nella slide dopo (Domanda). Il ragazzo legge «scrivi» e «rileggi le tre righe» quando non c'è dove scrivere, e le rilegge prima di averle scritte. La Domanda poi ripete «Scrivilo qui sotto… Poi leggilo ad alta voce».
Proposta (Pratica): «Siediti. Occhi aperti, lo sguardo su un punto, attenzione al punto sotto lo sterno. Fai 3 Reset per arrivare qui. Poi ripassa i tre pezzi del tuo Protocollo, senza scrivere: 1. IL MIO SEGNALE NEL CORPO… 2. IL MIO PENSIERO CHE TORNA… 3. IL MIO MANTRA… [testi attuali]. Adesso provalo una volta […]. Finita la pratica li scrivi nella risposta di oggi: c'è una guida con quello che avevi scritto nelle settimane scorse.» Togliere «Rileggi le tre righe ad alta voce» (resta nella Domanda). Valutare Durata Minuti 5 (la prova dura pochi minuti).

**[BLOCCANTE] W1 (settimana) · Pratica Pre Partita** — «fai 10 Reset di fila, respiro, gesto, parola».
Il box compare in qualsiasi giorno della W1 con la partita domani (page.tsx: `isPreMatchDay && settimanaData.praticaPrePartita`), anche G1 e G2, quando il gesto (G2) e la parola (G3) non esistono ancora.
Proposta: «Questa sera, prima di dormire: 10 respiri lenti, naso 4 secondi gonfiando la pancia, bocca 6 secondi. Se hai già il gesto e la tua parola, mettili dentro. Poi immagina come vuoi giocare domani: il primo pallone, la prima corsa, tu dentro la partita. Se domani arriva un momento pesante, alla prima pausa un respiro comodo: quello ce l'hai già.»

## INCOERENTI

**W1-G3 · Apertura** — «il mantra, cioè una parola che ti dici dentro. Da qui in avanti la chiamiamo semplicemente la tua parola.» La promessa non regge: W1-G6 «espira con il mantra», W2-G1 «(respiro, gesto, mantra)», tutte le Note Campo W2-W4 «gesto e mantra», W4-G6 «IL MIO MANTRA», Carta «Il tuo mantra», popup del Reset «Il mantra della tua settimana». Proposta: «…il mantra: una parola breve che ti dici dentro. La chiamiamo anche la tua parola.» (la frase è nell'audio dell'apertura: va riregistrata quella frase).

**W1-G3 · Domanda** — «Quale parola hai scelto? Ti veniva comoda da ripetere, o vuoi provarne un'altra?» La risposta intera finisce nel riquadro «Il tuo mantra» della Carta (`testoChiave` → risposta intera) e nell'aiuto di W4-G6 («Nella prima settimana avevi scritto»): es. «Sono qui, un po' strana, forse la cambio». Proposta testo: «Scrivi solo la parola che hai scelto. (Se non ti veniva comoda, la cambi quando vuoi dalla Carta.)» Oppure, nel codice, una risposta guidata '1-3' con parte `parola` come il momento di W1-G2.

**W1-G5 · Domanda Pre Pratica / W1-G7 · Domande Gate q1 e q2** — «Se vuoi cambiarlo, scrivilo adesso.»; «Se la cambi, scrivi quella nuova.»; «lo tieni anche per la prossima, o ne scegli un altro? Scrivilo in una riga.»
Quello che scrive lì non aggiorna niente: il momento si legge solo da W1-G2 (parte `momento`), il mantra solo da W1-G3. G6, G7, la Carta, l'aiuto di W4-G6 e il Coach («Le sue risposte chiave») continuano a mostrare quello vecchio. Il box con «Modifica» è già nella stessa schermata (Mostra Carta Momento / Mantra).
Proposta W1-G5: «Il tuo momento è ancora quello qui sopra? Se vuoi cambiarlo, tocca «Modifica». Non è una promessa di farlo oggi: è per riconoscerlo meglio quando capita.» Gate q1: «…Se la cambi, aggiornala con «Modifica» qui sopra e scrivi qui perché.» q2: «…Se ne scegli un altro, aggiornalo con «Modifica» qui sopra.»

**W1-G3 · Pratica** — «Domani, durante la giornata, prova il Reset una volta. Anche fuori dal campo». W1-G4 è tutto nell'app (tre situazioni da seduto/in piedi/immaginando) e non lo riprende; la giornata arriva in G5. L'Apertura dello stesso giorno dice correttamente «Domani lo provi in situazioni diverse». Proposta: togliere la frase o «Da domani lo provi in situazioni diverse, prima qui e poi nella giornata.» (è nell'audio).

**W2-G1 e W3-G1 · Tipo Pratica = respirazione** — Con questo tipo il PracticePopup mostra per tutto il timer il cerchio «Inspira 4 / Espira 6». W2-G1 chiede 2' di osservazione con il respiro naturale (W2-G4 Contesto: «respiro indipendente, non sincronizzato»); W3-G1 dice «Non devi cambiare niente: né la postura, né il respiro». Proposta: Tipo Pratica = visualizzazione (anello fermo «Osserva») per entrambi.

**W4-G3 · Pratica** — «• NOTA: c'è una frase che arriva insieme alla paura?» Il canone e W4-G4 dicono SENTI → NOMINA → TORNA. Proposta: «• NOMINA: c'è una frase che arriva insieme alla paura? …» (audio da ritoccare).

**W4-G4 · Domanda** — «Dopo il Reset, dentro la scena, cosa c'era nel corpo? Era diverso da prima o uguale?» Nella versione base non c'è nessun Body Check dopo il Reset: «4. TORNA. Un Reset completo […] 5. ESCI. Lascia la scena, piedi a terra, e scrivi». Proposta (Domanda, non è nell'audio): «Nella scena: cosa hai sentito nel corpo e che nome hai dato al pensiero? E dopo il Reset, ti è sembrato diverso o uguale? Tutte e due le risposte vanno bene.»

**W3 e W4 (settimane) · Pratica Pre Partita** — W3: «ricorda com'era il tuo corpo l'ultima volta che hai giocato bene: la tua firma» (la firma nasce in W3-G3, il box appare da G1). W4: «il tuo Protocollo Pressione nella versione lunga» (si impara in G4, si scrive in G6, il box appare da G1). Proposta W3: «…Poi ricorda com'era il tuo corpo l'ultima volta che hai giocato bene (se l'hai già scritta, è la tua firma)…». W4: «…Poi una volta, lento, su quello che c'è adesso: senti dov'è la tensione, dai un nome al pensiero, torna con un Reset…» (senza «il tuo Protocollo»).

**W1-W4 (settimane) · Mantra Dashboard** — «Reset. Torna qui!» / «Vedi. Torna in controllo!» / «Osserva. Ritrova chiarezza!» / «Resta. Sei tu che scegli!». Il popup del Reset (GlobalMeditationWrapper → MeditationPopup) li mostra come «Il mantra della tua settimana», anche durante il respiro, dal W1-G3 in poi: contraddice «la tua parola, scelta da te», «Osserva» in W3 è il verbo dell'Observer, i punti esclamativi sono da Instagram. Proposta: «Reset.» per tutte e quattro (il ripiego del codice), oppure nel codice mostrare la parola scelta (riquadro mantra della Carta).

**W2 · Coach Contesto** — «Audio: per W2 gli audio sono in preparazione; finché non ci sono, il Coach rimanda al testo della pratica». Gli audio W2-G1/G2/G3/G4/G6 sono collegati. Proposta: «⚠️ LE PRATICHE DI W2-G1, G2, G3, G4 e G6 SONO REGISTRATE IN AUDIO (G5 no): il Coach non le riformula.» (come W1).

**W3 · Coach Contesto** — «G2 cita anche Buffon, che ha raccontato di sentire ansia forte prima delle partite decisive e ha imparato a non combatterla.» Il Contesto di W3-G2 dice: «restare sul fatto pubblico (ha parlato apertamente dei suoi periodi di ansia e depressione), senza attribuirgli tecniche o frasi». Proposta: «G2 cita Buffon: ha parlato apertamente dei suoi periodi di ansia, quando era già tra i portieri più forti al mondo. Solo questo: niente tecniche o frasi attribuite.»

**W4 (settimana) · Principio** — Notion «Ascolto»; WEEK_PRINCIPLES[4] e Coach Contesto «Ascolto applicato». Allineare (proposta: «Ascolto applicato» su Notion).

## RIFINITURE (in breve)

- **Trasversale, W2-G5, W3-G1…G6, W4-G1…G6 · Pratica** — «Fai 3 Reset per arrivare qui: naso, pancia, bocca.»: il riassunto lascia fuori gesto e parola. Proposta: «…3 Reset per arrivare qui: respiro, gesto, parola.» W2-G5 e W3-G5 hanno anche «Adesso, in-app:» (gergo): «Adesso, qui:».
- **W2-G1** — la parola «Observer» compare per la prima volta nella Domanda («Durante i 2 minuti di Observer»). Aggiungere in fondo alla Pratica: «Questo è l'Observer: il tuo secondo strumento.» (come W3-G1).
- **W2-G4 · Apertura** — «sono dieci minuti seduto»; Durata Minuti 8. → «otto minuti».
- **W3-G4** — Durata 16 (oltre gli 8-15 del G4) e l'Apertura non lo dice: aggiungere «Oggi la pratica è lunga, circa un quarto d'ora». Domanda «Confronta il Body Check prima e dopo il Reset» ma i Body Check sono tre → «Confronta i tre Body Check: prima della scena, dentro la scena, dopo il Reset».
- **W4-G4 · Contesto** — «circa 10 minuti la parte base»; Durata Minuti 7. Allineare.
- **W1-G6 · Pratica** — «tra le risposte qui sotto scegli la frase più vera»: le frasi sono nella slide dopo → «nella domanda finale scegli la frase più vera». Stessa Pratica: «espira con il mantra» → «con la tua parola».
- **W1-G2** — Pratica «Più avanti lo userai nelle pause in campo» contro la Nota Campo dello stesso giorno «Al prossimo allenamento, alla prima palla ferma […] fai il gesto» → «Già al prossimo allenamento puoi usarlo nelle pause». Nota Campo «è il primo giorno» → «è la prima volta».
- **W3-G2 / W3-G7** — W3-G2 «è la tua mappa personale, e oggi la cerchi», ma la Carta («La tua mappa») prende Gate 3 q1. Aggiungere a q1: «(Diventa la tua mappa: la ritrovi nella Carta.)». Gate 3 q1 come «mappa» va bene: chiede dove porta la tensione.
- **W3-G3 · Nota Campo** — «aggiornala» → «aggiornala dalla Carta (Modifica)».
- **W4-G6 · Pratica** — «IL MIO SEGNALE NEL CORPO (l'hai cercato nella terza settimana)»: lo ha cercato anche in W4-G2 («Oggi cerchi il tuo»). → «(l'hai cercato nella terza settimana, e di nuovo quattro giorni fa)».
- **W4-G3 · Apertura** — «Spesso, quando dici di no, può essere che la stai nascondendo» contro il Contesto «Chi dice di non sentirla: non contraddirlo» → «Se ti sembra di non averne, va bene: guardala quando capita.» Grammatica: «Il «andrà male»» → «L'«andrà male»».
- **W4-G5 · Pratica** — «una discussione a casa con il partner o con i figli»: pubblico 18-20 → «con i tuoi, con la ragazza o il ragazzo».
- **W2-G7, W3-G7 · Domanda** — «per sbloccare la prossima settimana» contro W1-G7 Contesto («non come cancello da sbloccare») → «per chiudere la settimana».
- **W2-G4 · Tipo Giorno** — «Nota Campo» ma è l'Esercizio Principale (W1/W3/W4-G4 «Esercizio Principale»); lo legge il Coach.
- **W4-G7 · Missione Settimana** — errore → «il Protocollo nella versione breve»; dalla W5 l'errore va allo Stacco (canone W11: errore → Stacco) e il banner della missione resta in Home in W5. Proposta: «…Alla prima pausa: un respiro con gesto e mantra, e torna alla prossima azione. Uno strumento, un momento.»

## Campi vuoti (non riscritti)

- Pratica Giorno Partita: vuota in W1, W2, W3, W4 (il giorno della partita nessun box).
- Audio: assenti W1-G5, W1-G7, W2-G5, W2-G7, W3-G5, W3-G7, W4-G6, W4-G7 (coerente con i Coach Contesto per W1; W4-G6 ha una prova dentro la pratica senza audio).
- Durata Inspira / Durata Espira: vuote ovunque (vale il 4/6 di default: corretto).
- Perché Funziona: **pieno in tutti i 28 giorni** W1-W4. CLAUDE.md («W1-W4 NON hanno più il fallback… il box resta vuoto») e il to-do «Scrivere i 24 Perché funziona di W1-W4» sono superati.

## Verificati senza problemi propri

W1-G1, W1-G4 (richiamo «il tuo momento… il secondo giorno» coperto da Mostra Carta Momento), W2-G2, W2-G3 (la frase della Domanda Pre Pratica torna in pratica con «Hai scritto:»), W2-G6, W3-G6, W4-G1, W4-G2. Risposta guidata W1-G2 (gesto + momento) e W4-G6 (etichette IL MIO SEGNALE NEL CORPO / IL MIO PENSIERO CHE TORNA / IL MIO MANTRA, opzioni, «mascella, mani, gambe», aiuti da W3-G2, W2-G4, W1-G3) allineate ai testi di Notion. Gate W1-W4: tre domande numerate, sulla settimana; W4 q1 con elenco puntato letto come una domanda. Riferimenti temporali («ieri», «la settimana scorsa», «il primo giorno della settimana») tutti corretti.

---

# Audit W5-W8 — rapporto (22/11)

Fonti: giorni.json, settimane.json, difficolta.json; codice (lib/risposteChiave.ts, lib/constants.ts, app/giorno, app/gate, components/PracticePopup.tsx, MeditationPopup.tsx, GlobalMeditationWrapper.tsx); copioni in content/audio-scripts; durata reale degli MP3 con ffprobe (tutte le `Durata Minuti` corrispondono all'audio della pratica arrotondato per eccesso). Gate: W5 3 domande, W6-W8 4, tutte numerate «1. »; missioni coerenti con la settimana dopo; sveglia presente in W5, W6, W8 e assente in W7 (come `SETTIMANE_SVEGLIA`). Nessuna parola vietata.

## BLOCCANTE

**1. [BLOCCANTE] W7-G1 e W7-G6 · Pratica (valvola di sicurezza)** — «fermati e fai un Reset. E se ti va, scrivimi.» — Nell'app nessun canale porta a Ste: il ragazzo non sa a chi scrivere, proprio nella frase di sicurezza. In tutti gli altri giorni (e nell'audio di W7-G6) è «parlane con il Coach»: oggi testo e audio di W7-G6 si contraddicono. — Proposta: «Se ti smuove più del previsto, fermati e fai un Reset. E se ti va, parlane con il Coach.»

## INCOERENTE

**2. [INCOERENTE] W5-G1…G3, W7-G1…G3, W8-G1…G3 · nome dello strumento in testa alla pratica (codice)** — `WEEK_TOOLS` va nel sottotitolo del giorno e nel titolo del PracticePopup («Lo Stacco», «L'Anticipo», «Il Rilascio») dal G1, ma lo strumento si presenta solo in G4 («Oggi impari lo Stacco», «Oggi alleni l'Anticipo», «si chiama Il Rilascio»). Il ragazzo vede per tre giorni un nome mai spiegato (W7-G1 Contesto: «Non anticipare… gli strumenti»). — Proposta: per W5, W7, W8 mostrare il nome dal G4 (prima il principio o niente). W6 va bene: Fatto o storia parte dal G1.

**3. [INCOERENTE] W6-G4 · Apertura (anche audio `W6-G4-apertura`)** — «È il giorno più lungo della settimana: dodici minuti.» — Durata Minuti 9, audio 8'17". — Proposta: «È il giorno più lungo della settimana. Prenditi il tempo che serve.» (rigenerare la frase nell'audio).

**4. [INCOERENTE] W6-G4 e W7-G4 · Pratica (anche audio)** — W6-G4: «Stacca un momento. Piedi a terra, i suoni intorno.»; W7-G4: «Se hai tempo e ti va, stacca e rifallo con un altro fastidio piccolo». — Dopo W5 «stacca» si legge come lo Stacco (in W6-G4 cade tra un Reset e una scena: sembra un passo da fare). — Proposte: «Fermati un momento. Piedi a terra, i suoni intorno.» · «Se hai tempo e ti va, fai una pausa e rifallo con un altro fastidio piccolo».

**5. [INCOERENTE] W7-G1 · Pratica** — «Il tuo segnale non devi ricordartelo per forza. Quel momento non l'hai mai guardato, quindi è normale non averlo in mente» — La Missione di W6 chiedeva proprio: «Alla prima pausa chiediti DOVE è partita nel corpo… Solo trovarla.» Chi l'ha fatta si sente dire il contrario (stessa frase nella REGOLA PEDAGOGICA del Coach Contesto W7). — Proposta: «Se con la missione della settimana scorsa l'hai già trovato, scrivi quello. Se no, va bene: quel momento quasi nessuno lo guarda, ed è normale non averlo in mente.»

**6. [INCOERENTE] Missioni W5 e W7 mai riprese; Contesti che parlano di «Check precedente»** — W6-G1 Contesto «ha «Ha Check Precedente» sulla Missione W5»; W7-G3 «Check precedente attivo»; W8-G1 «Ha Check Precedente che aggancia la Missione di W7»; W8-G3 «Check precedente attivo: raccoglie la Nota Campo di G2». — Dal 29/9 l'app non legge più il check (la proprietà non esiste neanche nello snapshot): il Coach crede che il ragazzo abbia risposto, e la missione W5 (GIUDIZIO) e la W7 («una cosa di te che resta uguale») non vengono mai raccolte. — Proposte: togliere quelle frasi dai Contesti; in W6-G1 Apertura aggiungere «La missione della settimana scorsa era dare il nome GIUDIZIO ai pensieri su cosa pensano gli altri. Se ti è capitato, oggi ci torni sopra.»; in W8-G6 Pratica, prima della lista: «Se con la missione della settimana scorsa hai trovato una cosa di te che resta uguale, parti da quella.»

**7. [INCOERENTE] W7 · definizione dell'Anticipo (tre versioni)** — W7-G4 Pratica: «Oggi alleni l'Anticipo: senti la rabbia salire un secondo prima, e scegli tu invece di subirla»; Strumento W7: «Più l'Anticipo: la tua frase «quando sento..., allora...»»; schede SOS «L'Anticipo» (Panchina, Mister): SENTI / NOMINA / un respiro / SCEGLI, cioè la mossa intera di W7-G3, che nei giorni non si chiama Anticipo. — Proposta di una frase unica da usare in G4, Strumento e SOS: «L'Anticipo: ti accorgi del tuo segnale al primo gradino e, alla prima pausa, un Reset breve e la prossima azione. Lo prepari con la tua frase «quando sento…, allora…».» Nelle schede SOS chiamare la sequenza a quattro passi «la mossa intera» oppure ridurla a quella frase.

**8. [INCOERENTE] W6-G4 · Pratica, passo 3** — «se riguarda cosa pensano gli altri di te, GIUDIZIO; se è altro, «pensiero».» — L'Observer ha tre nomi: PASSATO, FUTURO, GIUDIZIO; «pensiero» non è un'etichetta del canone. — Proposta: «se riguarda cosa pensano gli altri di te, GIUDIZIO; se torna su una cosa già successa, PASSATO; se corre avanti, FUTURO.»

**9. [INCOERENTE] W8-G7 · Domande Gate q3** — «Rileggi la tua Carta, le cose che hai scritto, anche se sono meno di cinque.» — W8-G7 non ha `Mostra Carta`: il Gate non mostra il riquadro e il ragazzo deve uscire (Profilo → Carta) a metà Gate. Il codice lo supporta già (`Cose` → campo `cose`, RisposteChiaveBox sul Gate). — Proposta: su Notion `Mostra Carta = Cose` su W8-G7; testo invariato o «Rileggi qui sotto le cose che hai scritto…».

**10. [INCOERENTE] W5-W8 · Mantra Dashboard nel Reset (codice)** — Il popup del Reset mostra «Il mantra della tua settimana» con «Sbaglio. Reset. Prossima azione.», «Tieni il fatto.», «Sentila salire. Scegli.», «Sei più del risultato.», e lo ripete durante il respiro. Il canone e i giorni («espira con il mantra») parlano del mantra SUO scelto in W1-G3. — Proposta: nel popup chiamarla «La frase della settimana» (fuori dal cerchio del respiro) e durante il respiro mostrare il mantra di W1-G3 (`campiCarta().mantra`), con «Reset.» come ripiego.

**11. [INCOERENTE] W8-G4 · Contesto** — «È il SETTIMO e ultimo attrezzo della cassetta (Reset, Observer, Body Check, Protocollo Pressione, Lo Stacco, L'Anticipo, Il Rilascio)» — manca Fatto vs Storia (W6, in `WEEK_TOOLS`): il Coach può contare male. — Proposta: «È l'ultimo strumento del Blocco 2 (Reset, Observer, Body Check, Protocollo Pressione, Lo Stacco, Fatto o storia, L'Anticipo, Il Rilascio).»

## RIFINITURA (riassunte)

- **W7-G2 Pratica** — «Anche un'entrata decisa, se la scegli tu, è una scelta tua.» Il Coach Contesto avverte che essere consapevoli non rende accettabile far male, il testo che legge il ragazzo no. Aggiungere: «Dentro le regole: sceglierla non rende giusto far male a qualcuno.»
- **W7-G7 q3** — «la tua frase del giorno 4»: il Gate non la mostra (W7-G4 non è risposta chiave). Aggiungere «(se non la ricordi, è in Profilo → Le tue risposte, settimana 7)», oppure farla diventare chiave e mostrarla.
- **W8-G4 Pratica** — «Adesso il gesto, imparalo bene» / «oggi provi solo il gesto»: «gesto» è già pollice e indice del Reset. Usare «il movimento» o «il Rilascio».
- **W8-G2 Pratica (e audio)** — «poi un respiro e stacchi» / «stacca lo sguardo dal punto»: «poi un respiro e lasci andare la scena» / «sposta lo sguardo dal punto».
- **W5-G2 Domanda** — la pratica allena il Reset nell'istante dopo l'errore («Nota se cambia qualcosa»), la domanda chiede solo se si era accorto allora. Proposta: «Quando hai fermato la scena e fatto il Reset, è cambiato qualcosa? (Va bene anche «niente».)»
- **W7-G2 Tipo Pratica** — «visualizzazione», ma la pratica è leggere i tre gradini: «riflessione».
- **Contesti con numeri vecchi** — W6-G4 «(12 min, due passaggi)», W7-G4 «(12 min)», W7-G6 «(riflessione, 6 min)» (durate vere 9, 8, 5); W5-G6 «La domanda a quattro risposte», mentre la domanda ha due punti.
- **W5-G5, W6-G5, W7-G5, W8-G5 Pratica** — «Adesso, in-app: 3 Reset»: gergo, meglio «Adesso, qui: 3 Reset».
- **W6** — nei testi «Fatto o storia», nell'app (`WEEK_TOOLS`, sottotitolo del Reset e della pratica) «Fatto vs Storia»: sceglierne uno.
- **W8-G5, W8-G6** — esempi solo al maschile («la tua ragazza o tua moglie», «un fratello», «un papà»): dal 13/11 ci sono le ragazze. Aggiungere un esempio neutro o femminile («una sorella su cui si può contare»).

## Campi vuoti
- Settimane W5, W6, W7, W8: `Pratica Giorno Partita` vuota (il giorno della partita nessun box). Nessun campo vuoto nei giorni W5-G1…W8-G7. Senza audio per scelta (README): G5, G7, W6-G6, W7-G1, W7-G2, W8-G6.

## Giorni controllati senza problemi
W5-G3, W5-G5 (solo «in-app»), W5-G7, W6-G2, W6-G3, W6-G5 (solo «in-app»), W6-G6, W6-G7, W7-G5 (solo «in-app»). Con problemi solo nel Contesto: W5-G6, W6-G1, W7-G3, W8-G1, W8-G3. Continuità («ieri», «due giorni fa», «la settimana scorsa», «il primo giorno del percorso», «la tua frase del giorno 4») corretta ovunque; nessuna anticipazione di strumenti futuri nei testi (salvo il nome in testa alla pratica, punto 2); W8-G6 scrive davvero nel riquadro «Chi sono, oltre la maglia» della Carta, come promette.

---

# Audit W9–W12 (22/11) — rapporto

Fonti: giorni.json / settimane.json (snapshot), repo sul branch `claude/fyf-training-analysis-7id8v4` (contiene il commit 9ad38d9 = PR #192, **non ancora su main**). Niente modificato.

## BLOCCANTI

**[BLOCCANTE] W12-G7 · Pratica + Domanda Gate 3** — «Poi, qui sotto, trovi le risposte che hai dato il primo giorno, prima di iniziare.» / «3. Le risposte del tuo primo giorno: cosa diresti oggi a te stesso di allora?»
Nel codice non esiste niente che mostri le risposte della registrazione nel Gate 12: nessun valore «Onboarding» in `MOSTRA_CARTA_NOTION`/`MOSTRA_ALTRE_NOTION`, nessuna voce `'12-7'` in `DA_MOSTRARE`, `RisposteChiaveBox` non legge `profiles`/`profile_snapshots` (grep "Onboarding" in lib/ e app/: zero risultati utili). W12-G7 su Notion non ha nemmeno «Mostra Carta». Il ragazzo legge «qui sotto» e non trova niente, e la Q3 è obbligatoria. Il Contesto lo ammette («da attivare quando Code lo rilascia»).
Proposta: (a) codice: valore Notion «Onboarding» che mostra dalla `profile_snapshots` T0 (fallback `profiles`) situazione attuale, paure (etichette), obiettivi, sogno; (b) finché non c'è, testo: «Poi ripensa a com'eri il primo giorno, prima di iniziare: cosa ti preoccupava, cosa volevi. Guardalo come se fosse un compagno che stimi.» e Q3: «Pensa a com'eri il primo giorno: cosa diresti oggi a te stesso di allora?»

**[BLOCCANTE] W11-G4 · risposta guidata (`lib/risposteGuidate.ts`, '11-4')** — gli aiuti sotto i campi in cui scrive sono della versione vecchia e gli fanno fare il contrario della pratica (rev. 27/10: «solo il richiamo… poche parole… Non devi ricopiarle»):
- PRIMA: «la tua routine nelle tre versioni (spogliatoio, i due secondi col piede in campo, allenamento) e le tue condizioni» → la routine ha due versioni e col piede in campo c'è un Reset; Notion chiede «La tua routine in una riga». Proposta: «La tua routine in una riga, dal Rilascio al Reset. E quando metti il piede in campo, un Reset.» (placeholder: «Rilascio con la maglietta, musica, scarpe, 'libero', Reset»).
- DURANTE: «A gioco fermo i due secondi presente; … il Protocollo Pressione nelle due versioni.» → Proposta: «Mentre il gioco va, la prossima giocata. A gioco fermo, un Reset breve. Le tre risposte pronte (errore, pressione, rabbia), una riga ciascuna.»
- DOPO: «Il Rilascio sulla linea e la rilettura in due minuti: cosa tengo, cosa tolgo.» (placeholder «Sulla linea… poi…») → «Il Rilascio, e due minuti di rilettura.»
- QUANDO NON FUNZIONA: ok nella sostanza («cosa rivedi: il momento, la durata, le parole; oppure ne parli con il Coach» per allinearlo).

**[BLOCCANTE] W11-G3 · Pratica** — «Apri le tue risposte: le trovi qui sotto… Non leggerle tutte: scorrile e guarda le date… i giorni saltati, le settimane in cui ti sei fermato, e i giorni in fila.»
Il giorno 11-3 mostra solo il link «Tutte le tue risposte» (`DA_MOSTRARE['11-3'] = []`, ok). Ma `/risposte` non mostra la data dei giorni (solo «Aggiornata il…» se modificata) e non elenca i giorni senza risposta scritta (`loadRisposte` salta le righe vuote): le date e i buchi che il testo chiede di guardare non ci sono.
Proposta: codice, data di completamento su ogni giorno in `/risposte`; oppure testo: «Apri le tue risposte (qui sotto il link, o dal Profilo). Non leggerle tutte: scorrile e guarda dove ci sono e dove mancano. Le settimane in cui ti sei fermato te le ricordi tu.»

## INCOERENTI

**W9-G1 · Contesto** — «il centro = lo stato della firma del gioco libero (W3-G3, richiamo esplicito)». Il testo non richiama la firma, e Mostra Carta è vuoto. Proposta: aggiungere Mostra Carta «Firma» e in apertura «Ti ricordi la tua firma del gioco libero della terza settimana? La trovi qui sotto. È da lì che giochi quando sei al centro.»; oppure togliere «richiamo esplicito».

**W9-G1 · Apertura/Pratica** — «Adesso hai sette strumenti»: la rassegna salta Fatto vs Storia (W6), che per il canone e `WEEK_TOOLS[6]` è uno strumento. Il ragazzo che conta arriva a otto. Proposta, dopo il Rilascio: «E Fatto o storia: quello non si usa in campo, lo tieni per rileggere a freddo, dopo.»

**W9-G6 + W9-G7 Q2 · richiamo non mostrato** — G6 «guardala pezzo per pezzo»; Gate Q2 «Riprendi quella del quarto giorno e aggiornala». La routine di W9-G4 non è mostrata (nessuna voce `'9-6'`/`'9-7'`, la routine non è un campo della Carta quindi Mostra Carta non basta). Proposta: `DA_MOSTRARE['9-6'] = [[9,4]]`, `['9-7'] = [[9,4]]`; o nel testo «(la trovi nel Profilo, in «Le tue risposte»)».

**W9-G7 · Perché Funziona** — «Riprendere le tre versioni» → il Contesto dice «niente terza versione». Proposta: «Riprendere le due versioni e segnare cosa hai cambiato…».

**W9-G4 · Pratica** — «il passaggio da fuori a dentro» e «un respiro con gesto e mantra, e sei dentro»: Coach Contesto W9 vieta «dentro/fuori» come stati. Proposta: «il passaggio dalla giornata al campo»; «…e ci sei».

**W9 · Messaggio Chiusura** — «e l'hai già provata»: il Gate accetta «magari è ancora una bozza / se non l'hai ancora provata». Proposta: «Hai la tua routine per arrivare presente. Da qui in avanti la provi e la aggiusti dopo ogni partita.»

**W10-G1 · Apertura** — «un Reset breve, un respiro con gesto e mantra… QUANDO GIOCHI… Il gesto lo sai fare, va da solo... e se ti metti a guardarlo mentre lo fai, lo peggiori.» Subito dopo «gesto e mantra», «il gesto» si legge come pollice+indice. Proposta: «Il gesto tecnico, il passaggio, il controllo, lo sai fare: va da solo…».

**W10-G2 · Contesto** — «Tipo giornata a due tempi: al mattino la consegna, la sera la raccolta.» Il giorno è Tipo Pratica «riflessione», 8 minuti, non giornata. Il Coach riceve questa regia: togliere la frase.

**W10-G3 · Nota Campo** — «nelle pause: due secondi, torna presente.» Il resto della settimana dice «un Reset breve» (decisione 26/10, un gesto solo). Proposta: «nelle pause: un Reset breve, torna presente.» Stesso tema, meno grave: W10-G5 e W10-G7 Perché Funziona («Due secondi lì», «dove i due secondi ti vengono già»).

**W10-G5 · Perché Funziona** — «e quasi nessuno li usa»: il Contesto dice tolto «non li usa quasi nessuno» (rev. 26/10). Proposta: «Una partita è piena di momenti fermi, e spesso passano senza che li usi.»

**W11 · Messaggio Chiusura** — «L'ultima settimana guardiamo indietro, con calma, a chi eri il primo giorno.» W12 è ora settimana di pratica, il confronto è solo un pezzo breve del G7. Proposta: «L'ultima settimana si pratica: riprendi un pezzo al giorno e lo porti in campo.»

**W11 · Pratica Pre Partita** — «apri il tuo Protocollo, la pagina che hai scritto questa settimana.» Si vede anche in W11-G1…G3, quando la pagina non esiste; e non dice dove aprirla (il box della partita non la mostra). Proposta: «Se hai già scritto la tua pagina, aprila (nella Carta o in «Le tue risposte») e leggi la parte PRIMA e la parte DURANTE. Se non l'hai ancora scritta: la tua routine e la risposta che usi quando qualcosa va storto.»

**W12 · Coach Contesto vs W12-G7 Contesto** — W12: «Se chiede «e poi?»: «poi c'è la tua pratica, e ci sono io quando ti serve»»; G7: «Dopo il percorso c'è il Coach (decisione di Ste: non «ci sono io»)». Allineare a «c'è il Coach».

**W12 · Messaggio Chiusura** — «E più avanti ci sarà un nuovo percorso, per andare oltre.» contro «NESSUNA Season 2 nominata» (Contesto W12 e G7). Proposta: togliere la frase, o «Quando ci sarà altro, lo saprai.» Rifinitura nella stessa frase: «esattamente 84 giorni» (chi si è fermato ne ha usati di più) → «dodici settimane, 84 giorni di pratica».

**Codice — fine percorso (W12-G7 →)**:
- Celebrazione del Gate (`app/gate/[week]/page.tsx`): «La prossima si sblocca domattina» anche dopo il Gate 12.
- `app/week-complete/[week]`: per W12 «Strumento che porti con te: Giocare libero · Principio: La Via» e «Le prossime settimane arriveranno presto. Stai facendo un lavoro straordinario.» → Notion W12: Strumento «Nessuno nuovo», Principio «Ritornare al Centro», nessuna Season 2 promessa.
- `lib/constants.ts`: `WEEK_PRINCIPLES` 10 «Ritornare al Centro applicato», 11 «Libertà», 12 «La Via» (Notion: tutte «Ritornare al Centro»; «La Via» è parente di «la strada»). `WEEK_TOOLS[12] = 'Giocare libero'`: esce anche come strumento nel sottotitolo della pratica W12 e nel popup del Reset. `WEEK_TOOLS[10]` «Due secondi per tornare presente» (Notion: «Un Reset breve…»).
- `app/beta-complete`: «L'ultimo blocco — Giocare libero — sta arrivando»; il «prima e dopo» mette la Q3 del Gate 1 («qualcosa del Reset da chiarire») e la Q2 del Gate 12 («se salti, cosa fai») come «prima» e «dopo»; titolo «Ce l'hai fatta» contro «NON FARE: celebrare».

**Codice — SYSTEM_PROMPT del Coach (`lib/coach-ai.ts` 755-800)** è fermo a prima delle revisioni 26-27/10 e contraddice il Coach Contesto di Notion (che arriva solo dal tool):
- W9: routine «3 pezzi + Reset» senza Rilascio; «se la routine diventa pilota automatico è già rotta» (W9-G6: «ti partirà da sola… ed è un bene»); centro = «corpo presente, testa sulla prossima azione»; titolo esempio «La strada è tua… Due strade opposte».
- W10: «quando ALLENA la tecnica si concentra sul gesto» (tolto il 26/10); «fuori mentre giochi, dentro quando il gioco è fermo»; «un rientro» come pausa; «Chi «sente tutto»… è arrivato tranquillo» (W10-G6 dice il contrario); «non si contano i palleggi» (G4 li conta).
- W11: «routine di W9 nelle tre versioni + condizioni», «due secondi»; «chi si è fermato… ha fatto una cosa più difficile» (Contesto: senza classifiche); G6 «confronto con la pagina IMMAGINATA» (G6 ora = episodio + rilettura); «quale ti viene da solo?» (criterio: nessuna gerarchia); «La Carta… resta sigillata» (è modificabile).
- W12: l'arco è quello vecchio (G2 firma, G3 Stacco + Fatto vs Storia, G4 metodo intero, G6 onboarding); «Non vedo differenze → sai cosa stai facendo e perché…» (tolta); «ci sono io».
Proposta: riscrivere le righe W9-W12 dal Coach Contesto di Notion.

## Tabella dei richiami

| Giorno | Cosa richiama il testo | Cosa mostra l'app | Esito |
|---|---|---|---|
| W9-G6 | la routine di G4 (implicito) | niente | no (vedi sopra) |
| W9-G7 Q2 | «quella del quarto giorno» | niente | no |
| W11-G2 | segnale e parola W4 «qui sotto» | W4-G6 (Protocollo Pressione guidato) | ok |
| W11-G3 | le tue risposte «qui sotto», le date | link a /risposte; niente date | no (date) |
| W11-G4 | routine (9), PP (4), «cosa ti aiuta» (10), risposte pronte «due giorni fa» | W9-G4, W4-G6, W10-G6, W11-G2 | ok (etichetta «Le tue condizioni» ≠ «cosa ti aiuta a tornare presente»: rifinitura) |
| W11-G6 | Protocollo «qui sotto» | W11-G4 | ok |
| W11-G7 Q1 | la pagina «qui sotto» | W11-G4 + W11-G2 | ok |
| W12-G4 | risposte pronte «nella tua pagina, la settimana scorsa» | branch: DURANTE di W11-G4 (ripiego W11-G2); **main: W11-G2** | ok dopo il merge della PR #192; su main dice «Settimana 11, giorno 2», non la pagina |
| W12-G6 | Protocollo For You «qui sotto» | Mostra Carta → W11-G4 | ok |
| W12-G7 | risposte del primo giorno «qui sotto» | niente | **BLOCCANTE** |
| S11 pre partita | «apri il tuo Protocollo» | niente; in G1-G3 non esiste | no |
| S12 pre partita | Protocollo prima/durante | niente (sta nella Carta) | rifinitura: dire dove |

Risposte richiamate chieste davvero nel giorno citato: W9-G4 routine (due versioni) ✓; W10-G6 «facile/difficile + cosa preparare» ✓; W11-G2 tre risposte ✓; W11-G4 cinque parti ✓; W4-G6 segnale/pensiero/mantra ✓. Riferimenti temporali («due giorni fa», «la settimana scorsa», «ieri») tutti giusti.

## RIFINITURE (in breve)
- W9-G2 Apertura «A volte arrivi in ritardo sulle giocate» come segno dell'essere scollegato; il Contesto dice che il ritardo «non prova da solo» di essere sovrappensiero.
- W9-G4: l'esempio di versione corta salta la «testa» («stessi pezzi»).
- W9-G6 «e ieri sul campo» → «e ieri, sul campo o nel tuo momento importante».
- W9-G7 Apertura «Sei entrato lunedì»: i giorni del percorso non sono legati ai giorni della settimana → «Sei entrato in questa settimana».
- W10-G4 Domanda «tra un blocco di tocchi e l'altro»: nella pratica «blocco» sono i tre pezzi da 3'; → «tra una serie di tocchi e l'altra».
- W10-G6 «Mentre giochi non lo cerchi»: «lo» ambiguo → «Mentre giochi non cerchi di vedere tutto il campo».
- W10-G2/G3/G4 Tipo Pratica «riflessione» su esercizi con la palla: il popup scrive «Rifletti» durante il timer.
- W11-G3 «le trovi qui sotto»: sotto c'è solo il link → «qui sotto trovi il link».
- W12-G1: «unisci pollice e indice» → «di entrambe le mani» (canone).
- W12-G7 Q3 quasi uguale alla Domanda di W11-G3 («la frase che diresti oggi a te stesso delle prime settimane»).
- S12 Pratica Pre Partita «Domani entri come entri adesso. Da lì.» poco chiara.
- W9-G4 Contesto «(da allineare)»: nota di lavoro rimasta.
- W10-G7 e W11-G7 hanno 3 domande (decisioni nel Contesto): la regola «da W6 4» del brief e di CLAUDE.md non vale più per W10-W11.

## Campi vuoti
- Pratica Giorno Partita: vuota W9, W10, W11, W12 (e W8).
- Mostra Carta: vuoto ovunque tranne W12-G4 («Risposte pronte») e W12-G6 («Protocollo For You»); manca per W12-G7 (onboarding), W9-G1 (firma, se si tiene il richiamo).
- Audio: solo W9-G1/G2, W10-G1…G4, W12-G1…G4 (come da piano); W11 senza audio.
- Missione: assente W11-G7 (decisione) e W12-G7 (fine).
- `SETTIMANE_SVEGLIA` include 10 ✓, coerente con l'esercizio W10 («Torna la sveglia… 15 minuti»).

## Giorni senza problemi
W9-G3, W9-G5, W11-G1, W11-G2, W11-G5, W11-G6, W11-G7, W12-G2, W12-G3, W12-G5, W12-G6.

---

