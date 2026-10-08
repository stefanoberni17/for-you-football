# Lancio Mentale (9 novembre 2026) e Campo (dicembre): ricognizione e stima

Risposta al punto 0 della spec «FYF: prezzi, prova, pagamenti e Campo · v3» (8 ottobre 2026). Niente codice scritto: solo fatti letti dal repo (`main` = `cf8ee13`, PR #128) e stime. Dove non ho potuto verificare (Stripe Managed Payments, latenza del Coach) lo dico.

**Due cose da sapere subito**
1. In questa sessione non ho `.env.local`: niente chiavi Stripe, Anthropic, Supabase. Le prove del punto 0.2 e la misura della latenza (6) le posso fare solo quando mi dai un account Stripe di test con Managed Payments attivo (chiave `sk_test_…` incollata in chat, mai nel repo) e una chiave Anthropic. Fino ad allora quello che dico su Managed Payments viene dalla documentazione Stripe, non da una prova.
2. La spec contraddice il congelamento del Campo (25/9): la Fase 2 è la decisione di Ste e sostituisce il congelamento dal 23 novembre. Fino a quella data sul Campo non tocco niente.

---

## 0.1 Checkout o Elements?

**Stripe Checkout, sessioni create dal server.** `app/api/stripe/create-checkout/route.ts` chiama `stripe.checkout.sessions.create` in due modi: `mode: 'payment'` (Season 1 una tantum) e `mode: 'subscription'` (3 rate, con una Subscription Schedule agganciata dal webhook). Niente Elements, niente Payment Links. Compatibile con Managed Payments, che supporta Checkout e Payment Links.

Dettagli che contano per il passaggio:
- SDK `stripe` 17.5, `apiVersion: '2025-02-24.acacia'` (`lib/stripe.ts`). Managed Payments potrebbe richiedere una versione API più recente: da verificare sull'account di test, l'aggiornamento è una riga più il controllo dei tipi.
- `automatic_tax: { enabled: false }`, `billing_address_collection: 'required'`, `customer_update: { address, name }`, promo code disattivati, `consent_collection` acceso solo se `TERMS_VERSION` è compilata (oggi è vuota).
- Il webhook (`app/api/stripe/webhook/route.ts`) gestisce 5 eventi con idempotenza su `stripe_events` e mappa `trialing` → `active`: utile, perché vuol dire che una prova con carta oggi aprirebbe TUTTO (vedi 0.3).
- Portale clienti già in uso: `POST /api/stripe/portal` → `stripe.billingPortal.sessions.create` con ritorno a `/profilo`. La disdetta dall'app è già possibile per chi ha una sub.

## 0.2 Prove su Managed Payments

Non eseguite (vedi sopra). Quello che so dalla documentazione e che va confermato con l'account di test, nell'ordine in cui lo proverò:

| Prova | Atteso | Rischio |
|---|---|---|
| Prova 7 giorni con carta obbligatoria | `subscription_data.trial_period_days: 7` + `payment_method_collection: 'always'` in Checkout | Basso |
| Codice promozionale in checkout | `allow_promotion_codes: true` (oggi spento di proposito) | Basso |
| Coupon permanente | coupon `duration: 'forever'` sulla sub | Basso |
| Cambio coupon su sub esistente via API | `subscriptions.update({ discounts })` | **Medio**: con Managed Payments Stripe è il venditore; da verificare che le modifiche via API alle sub non siano limitate |
| Portale per la disdetta | già in uso | Basso |
| Cambio prodotto su sub esistente (Mentale → Completo) con conguaglio | `subscriptions.update({ items, proration_behavior })` | **Medio**: stesso dubbio; se non ammesso, l'upgrade si fa con cancel + nuovo checkout e un diritto registrato da noi |
| Promemoria pre-addebito | Managed Payments lo manda solo per prove > 7 giorni: la email del giorno 6 la mandiamo noi (punto 7) | — |
| Pagamento fallito | Smart Retries di Stripe + stato `past_due`; la tolleranza la decidiamo noi in codice (vedi 4) | Basso |

**Codice fiscale prodotto.** Propongo `txcd_10103000` (SaaS, uso personale). Motivo: il prodotto è un servizio software ad abbonamento (percorso strutturato + chat), il Coach AI è una funzione del servizio, non il servizio. `txcd_10105001` (AI, uso personale) andrebbe bene solo se la cosa venduta fosse «accesso a un'AI». Stesso trattamento IVA UE nei due casi (servizi elettronici, IVA del paese del cliente): la scelta non cambia l'importo, cambia la descrizione. Prezzi IVA inclusa: `tax_behavior: 'inclusive'` sui Price.

**Piano B Paddle.** Sostituisce Checkout, webhook, portale e i 4 file Stripe: stima +12-18 ore rispetto a Managed Payments, con la stessa logica di diritti sul nostro DB (punto 3), che resta identica.

## 0.3 Dove vive oggi il gating

Un'unica funzione di verità per il paywall mentale, due flag separati per il resto:

| Cosa | Dove | Come decide |
|---|---|---|
| Paywall mentale (pure) | `lib/checkAccess.ts` → `hasActiveAccess(profile)` | `is_beta_free` OR `season1_access` OR `subscription_status === 'active'` (e `trialing` è mappato ad `active`) |
| Settimana gratis | `canAccessWeek(profile, week)` = pagante OR `week <= FREE_WEEKS` (1) | |
| Server, contenuti | `lib/serverAccess.ts` → `requireWeekAccess` su `/api/giorno`, `/api/settimana`; `requirePaidAccess` su `/api/gate`, `/api/chat` (oltre `FREE_COACH_MESSAGES = 10`), `/api/telegram`, `/api/telegram/link`, `/api/carta` | legge `profiles` con service role |
| Client | `components/PaywallGuard.tsx` (rotte a pagamento → `/pricing`), `app/page.tsx`, `app/giorno/…`, `app/pricing` | solo UX, mai verità |
| Telegram | `app/api/telegram/route.ts:195` → `requirePaidAccess` | **non è gratis per tutti**: senza Season 1 il bot risponde «a pagamento». Con una prova mappata ad `active` lo diventerebbe |
| Campo (training) | `lib/trainingAccess.ts` → `profiles.training_access` (flag manuale via SQL, migration 015), controllato in tutte le 10 route `/api/training/*` e in `lib/cartaServer.ts` | **del tutto separato dal pagamento**: oggi un pagante NON entra nel Campo e un beta col flag entra anche senza pagare |
| Preparatore | `/api/training/chat` → stesso flag | |
| Audio delle pratiche | URL pubblici di Supabase Storage nel campo Notion `Audio Pratica`, passati dal `GET /api/giorno` (che è dietro `requireWeekAccess`) | **l'MP3 in sé non è protetto**: chi ha l'URL lo apre senza login. Per il lancio basta che l'URL arrivi solo da un'API gated (già così); bucket privato con URL firmati = +2-3 ore, lo metterei in Fase 2 |
| Cron proattivi | `filterActiveProfiles` + `deleted_at` | non guardano il pagamento |

Conseguenza per il punto 3: la base c'è (una funzione pura + due helper server), ma oggi il «diritto» è un booleano; per Mentale / Allenamenti / Completo serve una colonna `prodotto` e `hasActiveAccess` deve diventare `hasAccess(profile, area)` con area ∈ {mentale, campo}. I 25 file che la usano cambiano una riga ciascuno.

Altri fatti utili dalla ricognizione:
- `MIN_AGE = 14` in `lib/constants.ts`, validata solo in `/api/register` (nessun controllo altrove): il punto 2 è un numero da cambiare più il testo del messaggio.
- `PRIVACY_VERSION` e `TERMS_VERSION` sono `''`: `consent_events` registra già le accettazioni con versione vuota; compilarle accende da sola la ri-accettazione (`lib/consent.ts`) e il `consent_collection` di Checkout.
- Email agli utenti: oggi l'app non ne manda nessuna, a parte quelle di Supabase Auth. Resend è configurato ma usato solo per il safety alert a Ste (`lib/coach-ai.ts`). Nessuno scheduler oltre ai 3 cron Vercel (03:00, 06:00, 16:00 UTC): la email del giorno 6 può agganciarsi a uno di questi.
- Eventi: `lib/events.ts` ha già `signup_completed`, `checkin_saved`, `day_completed`, `gate_completed`, `coach_message_sent`, `checkout_started`, `payment_completed`, `app_open`, `pricing_view`; viste `v_funnel_primo_giorno*`, `v_coorti_d7_d28` (migration 022). Mancano: prova avviata, disdetta in prova, primo pagamento, rinnovo 2 e 3, ritorno entro il terzo giorno (derivabile da `app_open`), prima pratica con ore dalla registrazione (derivabile da `day_completed` + `created_at`).
- Safety: le due categorie «disturbi alimentari» e «abusi» esistono già, ma con 5 parole in tutto e solo a livello alert (`lib/coach-ai.ts:39-41`, «finché lo psicologo non decide»). L'avviso a Ste contiene i primi 200 caratteri del messaggio (email e Telegram): per il vincolo «dati minimi» va tolto il testo e lasciati nome, id, canale, livello, ora.
- Statistiche: confermato il bug 10.1. L'API filtra per data (`/api/checkin/history` usa `gte(date, N giorni fa)`), ma la pagina fa `checkins.slice(-period)`: con il periodo 7 prende gli ultimi 7 check-in anche se sparsi su un mese. Fix di 10 righe.
- «Perché funziona» (12.4): verificato nel codice, il Contesto NON arriva al client (`senzaRegia()` in `lib/notion.ts` lo toglie da tutte le risposte; la pagina giorno legge solo `percheFunziona`). In W1 il box resta vuoto finché i 24 testi non sono su Notion. Nessun lavoro, solo contenuto.
- Nuovi utenti (10.3): la card Campo in Palestra compare già solo con `training_access`; la sezione Genitori del profilo è visibile a tutti (link a `/genitori`): da nascondere o spostare in fondo.
- Coach, latenza: i log `coach usage [tag]` stampano i token ma non i millisecondi. Prima cosa del punto 6: aggiungere i ms al log e leggere 10 richieste vere dai log Vercel, invece di misurare da qui.

---

## 0.4 Stima ore

Ore di lavoro mio, con test e documentazione inclusi, senza i tempi di attesa di Ste (testi, decisioni, account Stripe). Intervallo = incertezza, non margine.

### Fase 1, Mentale (entro il 26 ottobre)

| # | Punto | Ore | Note |
|---|---|---|---|
| 0 | Ricognizione (fatta) + prove su account Stripe di test | 3-5 | le prove partono quando c'è l'account |
| 1 | Sicurezza: liste, test parafrasi/negazioni/falsi positivi, e2e, alert con dati minimi | 5-7 | le parole definitive restano allo psicologo |
| 2 | Età minima 18 configurabile | 1 | |
| 3 | Diritti separati: migration (`prodotto`, `access_source`, `trial_ends_at`, `locked_price`), `hasAccess(profile, area)`, 25 call site, Telegram/audio/preparatore, beta a 12 settimane, test | 9-13 | il Campo resta sul flag finché non si vende |
| 4 | Prova 168 h con carta, webhook (`trial_will_end`, `trialing`, `paid`, `payment_failed` con tolleranza, `canceled`, rimborso), W1 in prova, W2 dopo pagamento + Gate, doppio checkout, test duplicati/fuori ordine/mancanti | 10-14 | il pezzo più delicato |
| 5 | Tre prodotti su Stripe, prezzo bloccato come diritto (19/29 con data configurabile), coupon Instagram a scadenza, tetto iscritti + lista d'attesa con email, prezzo upgrade configurabile | 8-12 | |
| 6 | Telegram solo con diritto valido, tetto 20 messaggi condiviso app+Telegram, ms nel log + misura, indicatore «sta scrivendo» se serve | 4-6 | +2-3 se bisogna tagliare la latenza davvero |
| 7 | Email giorno 0 e 6 con Resend: template, invio dal cron, tabella `email_log` con retry e avviso a Ste | 6-9 | testi di Ste |
| 8 | «Chi ti ha consigliato?» in registrazione + vista | 1-2 | |
| 9 | Versioni legali, link, frase «non è un servizio sanitario» | 2-3 | testi dall'avvocato |
| 10 | Correzioni 10.1-10.7 | 6-9 | 10.1 e 10.3 sono brevi, 10.2 e 10.7 dipendono da decisioni di contenuto |
| 11 | Eventi mancanti + vista con i conteggi | 4-6 | |
| 12 | Home del primo giorno, onboarding ridotto, verifica audio, 12.4 (già verificato: ok) | 6-10 | l'audio lo provo con l'harness, la voce la giudica Ste |
| 13 | Collaudo finale | 6-10 | il telefono reale e l'acquisto vero sono di Ste |
| | **Totale Fase 1** | **71-107** | |

Rispetto alla stima esterna (50-90): il totale alto sfora perché il modello degli accessi (3) e la prova con i webhook (4) sono rifatti da zero rispetto al Season 1 di oggi. Con il **piano ridotto** della spec (email giorno 0 a mano, Telegram spento in prova, via 10.5-10.7 e il punto 12 tranne 12.4) si tolgono 12-18 ore: **59-89**, dentro il riferimento.

Tempo di calendario: 18 giorni lavorativi fino al 26 ottobre. A 4-5 ore al giorno la Fase 1 piena ci sta solo se Stripe risponde sull'idoneità entro questa settimana e i testi (email, legali) arrivano entro il 20. Se l'idoneità slitta, i punti 3, 5, 6, 8, 9, 10, 11 non dipendono da Stripe e si fanno comunque; il 4 e il 7 aspettano.

### Fase 2, Campo (23 novembre - 6 dicembre)

| # | Punto | Ore | Note |
|---|---|---|---|
| 14.2 | Prescrizione unica: una sola lettura di carico/serie/reps per piano, storico, scheda, hint del player e prompt del preparatore | 8-12 | il caso Windmill 12/16 kg nasce da `trainingAdapt` + `trainingProgressione` che parlano due lingue |
| 14.3 | Preparatore: regole nel prompt (niente cause inventate, nomi dei comandi, niente kg fuori motore, rimando al flusso dolore) + segnalazione a Ste | 4-6 | |
| 14.6 | Dolore e2e: pain-hold per zona a 4/10, esercizi tolti dalla seduta, rimozione, avviso con dati minimi | 6-8 | oggi il pain-hold blocca tutta la seduta fisica, non la zona |
| 14.4 | Schede esercizio: modello dati (Notion o JSON), pagina scheda, esclusione dal motore senza scheda+video, lista incompleti per Ste | 10-14 | i contenuti sono vostri; 80 video da registrare (`docs/training-video-da-registrare.md`) |
| 14.1 | Aree attive in configurazione (tecnica, fascia, forza funzionale) | 3-4 | |
| 14.5 | Durate: audit per lato su tutti i blocchi (l'apertura è già corretta, PR #128), recuperi e transizioni | 3-5 | |
| 14.7 | Data programmata vs effettiva | 3-4 | tagliabile |
| 14.8 | Card e piano coerenti | 3-5 | tagliabile |
| 14.9 | Campo in alto in Palestra, pagina prodotto per chi ha solo Mentale, upgrade con conguaglio, diritto `campo` dai webhook | 8-12 | dipende dalla prova 0.2 sul cambio prodotto |
| 14.11 | Collaudo 3 aree + utente solo Mentale + telefono | 6-8 | |
| | **Totale Fase 2** | **54-78** | senza 14.7 e 14.8: 48-69 |

Due settimane di calendario (10 giorni lavorativi) per 54-78 ore: ci stanno solo a tempo pieno. Se il 6 dicembre manca anche una delle cinque condizioni di 14.10, si va a gennaio come dice la spec: la condizione 3 (ogni esercizio assegnabile con scheda e video) dipende da quanti video Ste registra entro il 6, non dal codice.

---

## Cosa serve da Ste per partire

1. Risposta di Stripe sull'idoneità a Managed Payments; poi chiave `sk_test_` di un account con Managed Payments attivo, in chat.
2. Chiave Anthropic per la misura della latenza (o la leggo dai log Vercel dopo aver aggiunto i ms).
3. Decisioni: data di fine del periodo a 29€ (basta un valore in configurazione, la metto), tetto iscritti iniziale (25), testo delle email giorno 0 e 6, versioni dei documenti legali.
4. Conferma del ordine: parto da 1 (sicurezza) e 2 (età), che non dipendono da niente, mentre aspettiamo Stripe.
