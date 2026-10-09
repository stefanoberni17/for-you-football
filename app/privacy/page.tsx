import { Lock } from 'lucide-react';
import { BackButton, Card } from '@/components/ui';
import { ACCOUNT_GRACE_DAYS, MIN_AGE } from '@/lib/constants';

export const metadata = { title: 'Privacy Policy — For You Football' };

/**
 * Privacy Policy definitiva (9/10/2026, versione PRIVACY_VERSION in lib/constants.ts).
 * Scritta in linguaggio piano (GDPR art. 12: informazioni chiare, anche per i più giovani).
 * Quando il testo cambia in modo sostanziale: aggiornare PRIVACY_VERSION → chi ha accettato
 * la versione precedente vede il foglio di ri-accettazione (ConsentReacceptSheet).
 * Pagina pubblica, senza tab bar, linkata da registrazione, profilo, termini e genitori.
 */
function Sez({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section id={`s${n}`}>
      <h2 className="text-title-3 font-bold text-app mb-3">{n}. {title}</h2>
      <div className="space-y-3 text-body text-app leading-relaxed">{children}</div>
    </section>
  );
}

function Voce({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card variant="raised" padding="sm">
      <p className="font-semibold text-app mb-1">{title}</p>
      <div className="text-muted">{children}</div>
    </Card>
  );
}

function Riga({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-forest-500/40 pl-3">
      <p className="font-semibold text-app">{title}</p>
      <p className="text-muted">{children}</p>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-app py-10 px-5">
      <div className="w-full max-w-2xl mx-auto">

        <div className="text-center mb-8">
          <div className="flex justify-center mb-2 text-forest-400" aria-hidden><Lock size={36} /></div>
          <h1 className="font-display text-title-1 font-bold text-app">Privacy Policy</h1>
          <p className="text-muted text-body-sm mt-1">For You Football · versione del 9 ottobre 2026</p>
        </div>

        <Card className="space-y-8 text-body text-app leading-relaxed">

          <section>
            <p>
              For You Football è un’app di allenamento mentale e fisico per chi gioca a calcio. Per funzionare ha bisogno di alcuni tuoi dati:
              qui ti diciamo quali, perché, per quanto tempo li teniamo, chi li vede e cosa puoi chiederci. È scritta per essere letta davvero,
              non solo accettata. Se qualcosa non è chiaro, scrivici.
            </p>
          </section>

          <Sez n="1" title="Chi tratta i tuoi dati">
            <p>
              Il titolare del trattamento è <strong>Stefano Berni</strong>, preparatore atletico, che ha creato For You Football.
              Per qualsiasi domanda o richiesta sui tuoi dati: <a href="mailto:info@foryoufootball.it" className="text-forest-400 underline">info@foryoufootball.it</a>.
              Rispondiamo noi, non un’intelligenza artificiale.
            </p>
          </Sez>

          <Sez n="2" title="Quali dati raccogliamo">
            <Voce title="Account">
              Email, password (salvata in forma cifrata, non la vediamo mai), nome, data di nascita. La data di nascita serve a verificare
              che tu abbia l’età minima ({MIN_AGE} anni in questa prima fase): da lì ricaviamo l’età che il Coach usa per parlarti nel modo giusto.
            </Voce>
            <Voce title="Profilo da calciatore">
              Ruolo, livello, le paure in campo che scegli, obiettivi, sogno, come stai vivendo il periodo, chi ti ha consigliato l’app (facoltativo).
              Li scrivi tu in registrazione e li puoi cambiare dal Profilo.
            </Voce>
            <Voce title="Il tuo percorso">
              Giorni e settimane completati, le risposte alle domande di riflessione e del Gate, le azioni che scegli e quelle che spunti,
              il calendario di allenamenti e partite, il mantra che scegli, le pratiche fatte.
            </Voce>
            <Voce title="Dati sulla salute (con il tuo consenso esplicito)">
              Il check-in del mattino (come stai, ore di sonno, recupero, lucidità, presenza), i dolori o fastidi che segnali, dove senti un esercizio,
              i risultati dei test fisici, le serie fatte e quanto sono state dure, il peso corporeo se lo inserisci. Sono «dati relativi alla salute»
              per il GDPR (art. 9): li salviamo solo con un consenso a parte che chiediamo in registrazione o al primo check-in, e servono soltanto
              a regolare percorso e allenamento. Mai pubblicità, mai vendita, mai condivisione con società sportive o terzi.
            </Voce>
            <Voce title="Conversazioni con il Coach e con il preparatore">
              In app, la chat con il Coach resta sul tuo telefono: il server non la salva. Dopo ogni dieci messaggi il Coach scrive per sé un breve
              riassunto dei temi (es. «lavora sull’errore in partita»), che resta nel tuo profilo per darti continuità e che puoi chiederci di cancellare.
              Su Telegram, se colleghi il bot, i messaggi vengono salvati per mantenere il filo e cancellati dopo 90 giorni. La chat con il preparatore
              del Campo non viene salvata; anche lì resta un riassunto di obiettivi e note.
            </Voce>
            <Voce title="Come usi l’app">
              Eventi tecnici senza contenuto (es. «ha aperto l’app», «ha completato il giorno 3», «ha scritto al Coach»), per capire dove le persone
              si fermano e migliorare il percorso. Niente strumenti di analisi di terze parti, niente profilazione pubblicitaria.
            </Voce>
            <Voce title="Pagamenti">
              Il pagamento passa da Stripe: noi riceviamo solo l’esito, l’identificativo del cliente e lo stato dell’acquisto. Il numero della carta non
              arriva mai ai nostri server. L’email e l’indirizzo di fatturazione inseriti nel checkout sono conservati da Stripe per le ricevute e gli obblighi fiscali.
            </Voce>
            <Voce title="Dati tecnici">
              Indirizzo IP e informazioni sul dispositivo nei log del servizio di hosting, per sicurezza e per far funzionare l’app; limiti di utilizzo
              (quanti messaggi al Coach in un’ora) tenuti per 24 ore contro gli abusi.
            </Voce>
          </Sez>

          <Sez n="3" title="Perché li usiamo e su quale base">
            <Riga title="Per darti il servizio (contratto)">
              Account, profilo, percorso, pagamenti, risposte del Coach e piano di allenamento personalizzati sulla tua storia.
            </Riga>
            <Riga title="Dati sulla salute (consenso esplicito)">
              Solo per regolare percorso e allenamento. Puoi revocare il consenso quando vuoi scrivendoci: da quel momento non li raccogliamo più e
              le parti dell’app che li usano (check-in, Campo) smettono di funzionare.
            </Riga>
            <Riga title="Sicurezza tua e dell’app (interesse legittimo)">
              Il controllo delle conversazioni per segnali di pericolo (sezione 5), i limiti anti-abuso, i log tecnici.
            </Riga>
            <Riga title="Obblighi di legge">
              Ricevute e fatture dei pagamenti, conservate da Stripe per il tempo previsto dalla normativa fiscale (10 anni).
            </Riga>
            <Riga title="Migliorare l’app (interesse legittimo)">
              Gli eventi d’uso, letti in forma aggregata. Nessuna decisione su di te viene presa da questi dati.
            </Riga>
          </Sez>

          <Sez n="4" title="L’intelligenza artificiale">
            <p>
              Il Coach, il preparatore del Campo e il piano della settimana usano modelli di intelligenza artificiale di <strong>Anthropic</strong>.
              Per rispondere, inviamo ad Anthropic il tuo messaggio e un contesto preparato da noi (nome, età, ruolo, dove sei nel percorso, le riflessioni
              recenti, il check-in, un riassunto delle conversazioni passate e, se hai il Campo, le sedute della settimana). Anthropic usa questi dati solo per
              generare la risposta: non li usa per addestrare i suoi modelli e li cancella entro 30 giorni.
            </p>
            <p>
              Te lo diciamo sempre: il Coach non è una persona e può sbagliare. Il piano di allenamento è proposto dall’AI e controllato da regole fisse
              scritte dal preparatore (carichi, recuperi, giorni vicini alla partita); puoi rigenerarlo o modificarlo tu. Nessuna decisione con effetti legali
              o altrettanto importanti su di te viene presa in automatico.
            </p>
          </Sez>

          <Sez n="5" title="Se stai attraversando un momento difficile">
            <p>
              Le conversazioni con il Coach passano da un controllo automatico su alcune parole e frasi legate a situazioni di rischio (farsi del male,
              violenza, disturbi alimentari, abusi, sostanze). Se scatta, il Coach smette di fare coaching, ti chiede come stai e ti indica persone e numeri
              reali a cui rivolgerti. Una persona del nostro team (Stefano) riceve un avviso con il tuo nome, il canale, il livello e l’ora: <strong>mai il testo
              del messaggio</strong>. Può leggere la conversazione su Telegram per capire come stai e, se serve, contattarti. Gli scambi che hanno fatto scattare
              l’avviso non vengono cancellati dopo 90 giorni come gli altri, ma restano finché il tuo account esiste: servono a proteggerti e a dimostrare
              come abbiamo agito.
            </p>
          </Sez>

          <Sez n="6" title="Chi vede i tuoi dati">
            <p>Nessuno li compra e nessuno li riceve per farci pubblicità. Li trattano per noi, con contratti che li vincolano, questi fornitori:</p>
            <Riga title="Supabase (database e accesso)">Dove vivono i tuoi dati, su server nell’Unione Europea.</Riga>
            <Riga title="Vercel (hosting dell’app)">Fa girare l’app e tiene i log tecnici. Società statunitense, con le garanzie europee per il trasferimento dei dati (clausole contrattuali standard e Data Privacy Framework).</Riga>
            <Riga title="Anthropic (intelligenza artificiale)">Genera le risposte del Coach e del preparatore (sezione 4). Società statunitense, stesse garanzie.</Riga>
            <Riga title="Stripe (pagamenti)">Gestisce carte, ricevute e fatture. Stripe Payments Europe, Irlanda.</Riga>
            <Riga title="Telegram (facoltativo)">Solo se colleghi il bot: Telegram vede che scrivi a @foryoufootballcoach_bot e il tuo identificativo Telegram; noi salviamo quell’identificativo per riconoscerti.</Riga>
            <Riga title="Resend (email di servizio)">Le email che ti mandiamo noi (conferme, avvisi sull’account). Società statunitense, stesse garanzie.</Riga>
            <Riga title="Notion (contenuti)">Ospita i testi del percorso, non i tuoi dati.</Riga>
            <p className="text-muted">
              Se la legge ce lo impone (un ordine dell’autorità) o se serve a proteggere te o altri in una situazione di pericolo, possiamo comunicare i dati
              strettamente necessari alle autorità competenti.
            </p>
          </Sez>

          <Sez n="7" title="Per quanto tempo">
            <Riga title="Account, profilo, percorso, dati sulla salute">Finché il tuo account è attivo.</Riga>
            <Riga title="Cancellazione dell’account">Da Profilo → «Cancella l’account» l’app si chiude subito; i dati restano {ACCOUNT_GRACE_DAYS} giorni per chi ci ripensa (puoi riattivare), poi vengono cancellati per sempre da tutte le tabelle, compresi i consensi e le conversazioni segnalate.</Riga>
            <Riga title="Conversazioni Telegram">90 giorni, poi cancellate in automatico (tranne quelle della sezione 5).</Riga>
            <Riga title="Riassunti del Coach e del preparatore">Finché l’account è attivo; li puoi far cancellare prima scrivendoci.</Riga>
            <Riga title="Eventi d’uso e log tecnici">Eventi finché l’account è attivo; log dell’hosting per il tempo tecnico del fornitore.</Riga>
            <Riga title="Ricevute e fatture">10 anni, presso Stripe, per obbligo fiscale: restano anche dopo la cancellazione dell’account.</Riga>
          </Sez>

          <Sez n="8" title="Cookie e dati sul telefono">
            <p>
              L’app usa solo cookie e memoria locale <strong>tecnici</strong>: la sessione di accesso, le preferenze (es. «salta per oggi»), una copia dei
              contenuti del percorso per aprire le pagine più in fretta, la chat con il Coach salvata sul dispositivo. Niente cookie pubblicitari, niente
              tracciamento tra siti, niente strumenti di terze parti. Quando esci dal Profilo la memoria locale viene svuotata: se usi un telefono condiviso,
              esci.
            </p>
          </Sez>

          <Sez n="9" title="I tuoi diritti">
            <p>Puoi chiederci in qualsiasi momento, scrivendo a info@foryoufootball.it:</p>
            <ul className="space-y-2">
              {[
                'di sapere quali dati abbiamo su di te e riceverne una copia (anche in un formato leggibile da un’altra app);',
                'di correggere dati sbagliati (molti li cambi da solo dal Profilo);',
                'di cancellare i dati o l’account (anche da solo, dal Profilo);',
                'di limitare o opporti a un trattamento basato sul nostro interesse legittimo;',
                'di revocare il consenso ai dati sulla salute: vale da quel momento in avanti.',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2"><span className="text-forest-500 mt-0.5">•</span><span>{t}</span></li>
              ))}
            </ul>
            <p>
              Rispondiamo entro 30 giorni. Se pensi che non stiamo rispettando le regole, puoi fare reclamo al Garante per la protezione dei dati personali
              (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-forest-400 underline">garanteprivacy.it</a>).
            </p>
          </Sez>

          <Sez n="10" title="Età">
            <p>
              In questa prima fase For You Football è per chi ha almeno {MIN_AGE} anni: sotto quell’età la registrazione è bloccata. Quando apriremo ai più giovani
              lo scriveremo qui, e questa pagina è già pensata per essere chiara anche per loro. Per chi vuole leggere con un genitore c’è una{' '}
              <a href="/genitori" className="text-forest-400 underline">pagina dedicata</a>.
            </p>
          </Sez>

          <Sez n="11" title="Modifiche">
            <p>
              Se cambiamo questa pagina in modo sostanziale, te lo diciamo nell’app e ti chiediamo di rileggerla e accettarla di nuovo prima di continuare.
              La data in cima è la versione in vigore.
            </p>
          </Sez>

          <section className="border-t border-divider pt-6 text-center text-caption text-faint">
            <p>For You Football è un progetto indipendente di Stefano Berni · info@foryoufootball.it</p>
          </section>

        </Card>

        <div className="flex justify-center gap-2 mt-6 flex-wrap">
          <BackButton href="/termini" label="Termini di servizio" />
          <BackButton href="/login" label="Torna all’app" />
        </div>

      </div>
    </main>
  );
}
