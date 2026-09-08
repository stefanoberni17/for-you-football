# For You Football — Report finale sessione (6-8 settembre 2026)

**Stato:** tutto in produzione su Vercel, PR #63-#76 merged su `main`, branch di lavoro allineata.
**Modulo toccato:** FYF Training (area riservata dietro `profiles.training_access`) più lo strumento Everfit di Ste.

Il documento ha tre parti: cosa è stato fatto, come sta l'app oggi, cosa fare per portarla sul mercato.

---

## 1. Modifiche fatte in questa sessione

### 1.1 Motore di allenamento

| Cosa | Dove | Effetto per l'atleta |
|---|---|---|
| **Review livelli** dal foglio del 4/9: 28 esercizi "solo questo livello", 31 note di dose | `docs/training-catalogo-v2.json`, `lib/trainingRulesV2.ts`, `lib/trainingBlocks.ts` | Un B non vede mai un esercizio da A/PRO come esclusione dura; le note guidano la dose. Il blocco programmato da Ste al livello dell'atleta vince sull'esercizio. |
| **Carico totale** session-RPE + ACWR | `lib/trainingLoad.ts`, hub | Carico seduta = durata × RPE. Acuto, cronico, rapporto con stato poco / ok / alto / rischio. Target e tetto settimanale che il planner rispetta. Stima del carico squadra dal calendario. |
| **Blocchi incompleti** da 13 a 9 | `scripts/build-blocks.py`, catalogo | Deadlift dentro (solo A). Headball disattivata per scelta: i 9 blocchi Visione restano fuori finché non si decide. |
| **Richiesta guidata** al posto del testo libero | `lib/trainingRequest.ts`, `components/TrainingPlanForm.tsx` | "Rifai da capo" = giorni + tempo + focus + nota. "Modifica" = una sola modifica tra sette. I campi diventano vincoli duri nel validatore, non solo parole nel prompt. |
| **Salti, recuperi, posticipi, nuova settimana** | `lib/trainingPlannerV2.ts`, `/api/training/plan`, hub | Stati seduta: fatta, oggi, recuperabile (ieri), saltata, futura. Posticipo di un giorno, una volta sola. Nuova settimana automatica con le sedute saltate riproposte uguali, sempre sotto il tetto di fase. |
| **Round di revisione**: 10 difetti trovati e chiusi | vari | Loop di auto-generazione, recuperi letti su tutti i piani della settimana, piano fuso rivalidato, fallback che non sovrascrive su "modifica", memoria alimentata solo dalla nota utente. |

### 1.2 Player e feedback

| Cosa | Effetto |
|---|---|
| **Lati** dai blocchi Everfit (`per_lato`) | Isometria runner e simili: destro poi sinistro con la quantità per lato, non dimezzata. Pull Up Around The World: orario e antiorario. |
| **"Dove l'hai sentito?"** (migration 020, applicata) | Dopo l'ultima serie dei 24 esercizi legati ai test il player chiede la zona. Un fastidio scelto due volte arriva al planner e alla chat. |
| **Descrizioni** | 49 esercizi senza video hanno una descrizione leggibile. Da rivedere con Ste. |
| **Video rotti** | 15 video della libreria Everfit (S3 privato) tolti. Elenco degli 80 da registrare in `docs/training-video-da-registrare.md`. |
| **Navigazione** | Esercizio precedente, "Esercizio completato", "Non era l'ultima: torna alla serie", legenda RPE con 1-3 / 5 / 7-8 / 10. |

### 1.3 Linguaggio, durata, test

- Nomi dei blocchi e testi del planner **senza codici** ("Pliometria B1 - short" diventa "Pliometria (versione breve)"), regola esplicita nel prompt: si parla a un ragazzo di 14-20 anni.
- **Durata in evidenza**: badge per seduta, totale settimanale, badge nella pagina seduta.
- **Pagina test a blocchi numerati** richiudibili: forza a corpo libero, scala skill, tecnica con la palla, fascia, poi le categorie v2, ultimo l'AMRAP.

### 1.4 La Card (rombo)

Controllo contro le regole dei test, tre problemi corretti e una struttura nuova.

- **Punteggio ancorato ai livelli**, uguale per tutti i test: 40 alla soglia intermedio, 60 avanzato, 80 PRO, 100 un gradino oltre. Prima un atleta intermedio ovunque aveva Pull a 13 e Resistenza a 67.
- **Massimali senza peso corporeo** esclusi dalla media invece di contare zero.
- **Asse fisso 0-100** nel radar, con legenda.
- **Due viste**: base a 6 punte (Forza parte alta, Forza parte bassa, Resistenza, Velocità, Tecnica, Prevenzione) e dettaglio a 11. Tutti i 43 test mappati.
- **Progresso nel tempo**: rombo grigio della partenza sotto quello verde, "+N" per punta, "partenza → ora" nel dettaglio, "📈 +8 in Forza parte bassa" nella pagina test dopo un salvataggio.

### 1.5 Strumento Everfit (per i clienti di Ste, fuori dall'app)

- `scripts/everfit-assign.mjs`: lettura e assegnazione allenamenti (history, detail, copy, add, update, delete). Permesso pre-approvato in `.claude/settings.json`.
- Settimane assegnate per due clienti (anonimizzati: Utente E., Utente R.), con progressione per la settimana successiva di Utente R. (HIIT 40/20, EMOM con esercizi più complessi a 2 ripetizioni, Push +2).
- Vincoli fissi: scritture solo su richiesta esplicita, token mai nel repo (scade circa ogni 10 giorni), dati clienti fuori dal repo.

---

## 2. Stato attuale dell'app

### 2.1 Cosa c'è e funziona

| Area | Stato |
|---|---|
| Percorso mentale | Settimane 1-8 live (Blocco 1 e 2), contenuti su Notion, gate, missioni, riflessioni, rituale del mattino, schede SOS a layer, Palestra per principio, Carta del Giocatore. |
| Coach AI | Web e Telegram, memoria unificata, tool `leggi_percorso`, safety con alert email + Telegram e modalità contenimento, rate limiting, cache Notion. |
| Azioni giornaliere | 5 azioni "act as if", tick, streak, storico. |
| Check-in e statistiche | 4 slider giornalieri, grafici, streak, contesto per il Coach. |
| Pagamenti | Stripe live: 69 € una tantum o 29 € × 3 (founder), webhook idempotente, beta codes. |
| Compliance | Age gate 14, consensi tracciati, trasparenza AI, protocollo safety. |
| FYF Training | Setup, batteria test v1 + v2 con video, Card a due viste con progresso, catalogo 309 esercizi, 144 blocchi, planner a blocchi con validatore, carico totale, richiesta guidata, player con feedback per serie e sensazioni, chat preparatore. |

### 2.2 Cosa manca o è in sospeso

| Cosa | Priorità | Note |
|---|---|---|
| Termini di servizio e privacy definitivi | Alta | `/termini` è un placeholder, versioni vuote in `lib/constants.ts`. Il flusso di ri-accettazione è pronto. |
| Revisione psicologo dei testi safety | Alta | Il protocollo c'è, la firma no. Con minorenni è un blocco per i club. |
| Settimane 9-12 (Blocco 3) | Alta | Si vende una stagione a cui manca l'ultimo blocco. |
| Descrizioni esercizi da rivedere | Media | 49 testi scritti senza vedere l'esercizio. |
| 80 video da registrare | Media | Elenco in ordine di priorità. |
| Headball / video di visione | Bassa | Decisione di Ste. |
| Dati reali sul carico totale | Osservazione | Serve almeno due settimane di sedute vere. |
| Apertura del Training ad altri utenti test | Alta | Flag via SQL a 2-3 ragazzi veri prima di pensare a UI o paywall. |
| Bucket audio pratiche | Bassa | Da creare su Supabase Storage. |

---

## 3. Analisi e consigli per il lancio

### 3.1 Primi principi (la lente Musk)

**Il problema vero.** Un ragazzo di 16 anni si allena tre volte a settimana con la squadra. Per il resto è solo con la sua testa e il suo corpo, e nessuno gli misura niente. L'app risolve entrambe le cose: un metodo per la testa e un motore che misura e programma il corpo. È raro. La concorrenza è una playlist di meditazioni con la foto di un campo.

**Due prodotti in un'app.** Il percorso mentale e il Training sono nati separati e si vede. Serve un oggetto solo attorno a cui gira tutto, e quell'oggetto è **la Card**: una carta FIFA di se stesso che un ragazzo capisce in un secondo. Il percorso mentale deve diventare una punta della Card, non un'app a parte.

**Il muro prima del valore.** Oggi il flusso è registrazione, email, paywall, onboarding. Si chiedono soldi prima di far vedere qualcosa. Un ragazzo deve fare un test, vedere la sua Card e fare il primo Reset in tre minuti, gratis. Poi si paga per la settimana due e per il planner. È la modifica singola con il ritorno più alto.

**Chi paga.** L'utente ha 16 anni e non ha una carta. Paga il genitore, e oggi nessuna riga di prodotto o sito gli parla. Il secondo compratore è il club: un settore giovanile paga per trenta ragazzi e porta distribuzione gratis.

**Il modello.** Season 1 a 69 € finisce dopo dodici settimane. Il Training produce un piano nuovo ogni lunedì per sempre. Il fisico è l'abbonamento, il mentale è il prodotto d'ingresso. Va deciso prima dei primi cento paganti.

### 3.2 Identità e trasformazione (la lente Robbins)

- **Nessuno compra un metodo, compra chi diventa.** "Lucidità, fiducia e libertà" sono parole da adulto. Un ragazzo vuole "il mister non mi lascia più in panchina" e "non tremo più sul rigore". Il campo come specchio resta dentro il prodotto; fuori si parla di quello che vede lui.
- **La prova è la storia.** Non c'è ancora un prima e dopo raccontato da un ragazzo vero. I dati per costruirlo ci sono: situazione iniziale, gate della settimana uno, gate finale, Card grigia e Card verde. Servono dieci ragazzi che finiscono e tre che lo raccontano in trenta secondi con la faccia.
- **La coorte batte l'app.** Trenta ragazzi che partono lo stesso lunedì, un gruppo WhatsApp, una call di venti minuti la domenica sera, una classifica settimanale dei progressi della Card. La responsabilità reciproca fa finire il percorso; il percorso finito produce le testimonianze.
- **Il momento condivisibile.** La Card come immagine da mettere nelle storie Instagram. È l'unico canale gratuito verso altri sedicenni e oggi non esiste.

### 3.3 Piano in novanta giorni

**Giorni 0-30, chiudere le falle**
1. Termini e privacy veri, versioni compilate.
2. Revisione dello psicologo sui testi safety.
3. Settimane 9-12 scritte.
4. Prova gratuita: test, Card e settimana uno prima del paywall.
5. Eventi di analytics: attivazione, ritenzione a 7 e 28 giorni, conversione.

**Giorni 30-60, la prima squadra**
6. Coorte fondatori di trenta ragazzi: clienti di Ste, compagni di squadra, un settore giovanile in prova gratuita.
7. Call settimanale, Card condivisibile, un contenuto al giorno su TikTok e Instagram riciclando le pillole del Coach e gli esercizi registrati.

**Giorni 60-90, la prova e la scala**
8. Tre video testimonianza, landing rifatta attorno a loro e alla Card.
9. Pagina per i genitori.
10. Pilota a pagamento con il club, seconda coorte, decisione sull'abbonamento.

### 3.4 Cosa manca nel prodotto, in ordine

1. Prova gratuita prima del paywall.
2. Card condivisibile come immagine e invito a un compagno.
3. La dimensione mentale dentro la Card.
4. Settimane 9-12.
5. Pagina e messaggio per i genitori.
6. Analytics di attivazione e ritenzione.
7. Presenza negli store, anche solo come wrapper della PWA: per un sedicenne un'app fuori dallo store non esiste.
8. Una persona per i contenuti social.

### 3.5 Metriche da guardare dal primo giorno

| Metrica | Perché |
|---|---|
| Attivazione: primo test + prima Card + primo Reset nella prima sessione | Dice se il valore arriva prima del muro. |
| Sedute e pratiche completate per settimana per utente | La metrica guida del prodotto. |
| Ritenzione a 7 e 28 giorni | Dice se il rituale tiene. |
| Percentuale che completa la settimana 4 | Il primo gate difficile. |
| Conversione da prova a pagamento | Il prezzo è giusto solo se questo numero è sano. |
| Card condivise e inviti | L'unico motore di crescita gratuito. |

---

## 4. Riferimenti

- Documentazione tecnica del modulo: `CLAUDE.md`, sezione FYF Training.
- Formalizzazione: `docs/training-formalizzazione-v2.md`, `docs/training-recap-progressioni.md`.
- Blocchi: `docs/training-blocchi.md`. Video: `docs/training-video-da-registrare.md`. Test utenti: `docs/training-test-utenti.md`.
- PR di questa sessione: #63-#76.
