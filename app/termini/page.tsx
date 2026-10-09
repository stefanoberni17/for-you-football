import { FileText } from 'lucide-react';
import { BackButton, Card } from '@/components/ui';
import { ACCOUNT_GRACE_DAYS, MIN_AGE, SEASON_INSTALLMENTS } from '@/lib/constants';

export const metadata = { title: 'Termini di servizio — For You Football' };

/**
 * Termini di servizio definitivi (9/10/2026, versione TERMS_VERSION in lib/constants.ts).
 * Linguaggio piano, Codice del consumo e GDPR come riferimento. Quando il testo cambia in modo
 * sostanziale: aggiornare TERMS_VERSION → ri-accettazione (ConsentReacceptSheet).
 * Il recesso di 14 giorni è quello di legge per i contenuti digitali: nel checkout non chiediamo
 * di rinunciarvi, quindi vale pieno (decisione del 9/10: più semplice e più onesto).
 */
function Sez({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section id={`s${n}`}>
      <h2 className="text-title-3 font-bold text-app mb-3">{n}. {title}</h2>
      <div className="space-y-3 text-body text-app leading-relaxed">{children}</div>
    </section>
  );
}

function Punto({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card variant="raised" padding="sm">
      <p className="font-semibold text-app mb-1">{title}</p>
      <div className="text-muted">{children}</div>
    </Card>
  );
}

export default function TerminiPage() {
  return (
    <main className="min-h-screen bg-app py-10 px-5">
      <div className="w-full max-w-2xl mx-auto">

        <div className="text-center mb-8">
          <div className="flex justify-center mb-2 text-forest-400" aria-hidden><FileText size={36} /></div>
          <h1 className="font-display text-title-1 font-bold text-app">Termini di servizio</h1>
          <p className="text-muted text-body-sm mt-1">For You Football · versione del 9 ottobre 2026</p>
        </div>

        <Card className="space-y-8 text-body text-app leading-relaxed">

          <section>
            <p>
              Questi sono gli accordi tra te e For You Football. Li abbiamo scritti corti e chiari perché vorremmo che li leggessi davvero.
              Usando l’app li accetti; se non sei d’accordo con qualcosa, non usarla e scrivici.
            </p>
          </section>

          <Sez n="1" title="Chi siamo">
            <p>
              For You Football è un progetto di <strong>Stefano Berni</strong>, preparatore atletico. Contatto per tutto quello che riguarda l’app:{' '}
              <a href="mailto:info@foryoufootball.it" className="text-forest-400 underline">info@foryoufootball.it</a>.
            </p>
          </Sez>

          <Sez n="2" title="Cos’è For You Football">
            <Punto title="Il percorso mentale">
              Dodici settimane di pratiche brevi (respiro, attenzione, gestione dell’errore e della pressione), un check-in del mattino, strumenti da usare in campo,
              schede per i momenti difficili, e un Coach con cui scrivere.
            </Punto>
            <Punto title="Il Campo (allenamento fisico)">
              Per chi lo attiva: test, un piano settimanale di sedute e una chat con un preparatore automatico. Le sedute sono costruite sugli esercizi che Stefano
              usa con i suoi atleti, dosate per livello ed età.
            </Punto>
            <Punto title="Il Coach e il preparatore sono intelligenze artificiali">
              Non sono persone. Te lo diciamo sempre in modo chiaro. Seguono regole scritte da noi, ma possono sbagliare: usa la testa, e se qualcosa non ti torna
              fermati e scrivici.
            </Punto>
          </Sez>

          <Sez n="3" title="Cosa non è">
            <p>
              For You Football <strong>non è un servizio sanitario, psicologico né terapeutico</strong>, e non li sostituisce. Il Coach non fa diagnosi e non dà
              consigli medici o psicologici. Il Campo non è una visita medica e il preparatore automatico non è un medico né un fisioterapista. Se stai male,
              nel corpo o nella testa, la persona giusta è un medico, uno psicologo o un adulto di cui ti fidi: l’app ti rimanderà a loro.
            </p>
            <p>
              Non promettiamo risultati sportivi: più lucidità in campo, più forza o più velocità dipendono da te, dal tuo allenamento con la squadra e da
              mille altre cose. L’app è uno strumento, non una garanzia.
            </p>
          </Sez>

          <Sez n="4" title="Chi può usarla">
            <ul className="space-y-2">
              {[
                `Devi avere almeno ${MIN_AGE} anni (in questa prima fase). Sotto quell’età la registrazione è bloccata.`,
                'L’account è personale: una persona, un account. Non condividere la password e non far usare l’app a qualcun altro con il tuo account.',
                'I dati che inserisci (età, come stai, dolori, risultati dei test) devono essere veri: il piano e le risposte del Coach si basano su quelli.',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2"><span className="text-forest-500 mt-0.5">•</span><span>{t}</span></li>
              ))}
            </ul>
          </Sez>

          <Sez n="5" title="Allenamento fisico: le regole di sicurezza">
            <p>Prima di entrare nel Campo ti chiediamo di dichiarare di stare bene e, se giochi in una società, di avere il certificato medico in regola. Poi:</p>
            <ul className="space-y-2">
              {[
                'Ti alleni sotto la tua responsabilità: scegli tu se, dove e come fare un esercizio. Se non te la senti, non lo fai.',
                'Se senti dolore (non la normale fatica) ti fermi. Segnalalo nell’app: le sedute fisiche si bloccano finché non dici che è passato o ne hai parlato con un medico o un fisioterapista.',
                'Segui le indicazioni di esecuzione e i carichi proposti; non aumentare i pesi per conto tuo oltre quello che il piano prevede.',
                'Allenati in un posto sicuro, con attrezzatura in buono stato. Con i pesi, se puoi, con qualcuno vicino.',
                'In caso di infortunio o malore chiama il 112.',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2"><span className="text-forest-500 mt-0.5">•</span><span>{t}</span></li>
              ))}
            </ul>
          </Sez>

          <Sez n="6" title="Prezzi e pagamenti">
            <Punto title="Cosa è gratis">
              Registrarsi, la prima settimana del percorso con le sue pratiche, il check-in e un numero limitato di messaggi al Coach in app.
            </Punto>
            <Punto title="Cosa si paga">
              Per continuare oltre la settimana gratuita serve un acquisto. I prezzi in vigore sono scritti in chiaro nella pagina Prezzi e nel checkout prima di
              pagare, IVA inclusa. Oggi: Season 1 in un pagamento unico oppure in {SEASON_INSTALLMENTS} rate mensili. Se in futuro offriremo un abbonamento mensile
              o un periodo di prova, prima del pagamento vedrai prezzo, durata della prova, data del primo addebito e come disdire.
            </Punto>
            <Punto title="Rate">
              Scegliendo le rate, l’accesso vale finché le rate vengono pagate; con la terza rata pagata Season 1 è tua per sempre. Se interrompi prima della terza
              (pagamento fallito o disdetta), l’accesso si chiude e Season 1 non resta acquistata. Un pagamento fallito viene ritentato per alcuni giorni; se non
              va a buon fine, l’accesso si sospende finché non aggiorni il metodo di pagamento.
            </Punto>
            <Punto title="Abbonamenti">
              Un abbonamento si rinnova da solo alla scadenza di ogni periodo finché non lo disdici. Si disdice in qualsiasi momento dal portale «Gestisci abbonamento»
              nel Profilo: resta attivo fino alla fine del periodo già pagato, poi si ferma senza altri addebiti.
            </Punto>
            <Punto title="Pagamento e ricevute">
              I pagamenti passano da Stripe. Noi non vediamo né conserviamo il numero della carta. La ricevuta arriva all’email inserita nel checkout.
              I codici promozionali, quando ci sono, si applicano nel checkout e valgono per il periodo indicato: finito lo sconto, il prezzo torna quello di listino.
            </Punto>
            <Punto title="Prezzi che cambiano">
              Se cambiamo un prezzo, vale per i nuovi acquisti. Per un abbonamento in corso te lo comunichiamo almeno 30 giorni prima: puoi disdire prima che
              il nuovo prezzo si applichi.
            </Punto>
          </Sez>

          <Sez n="7" title="Diritto di ripensarci (recesso)">
            <p>
              Hai <strong>14 giorni</strong> dall’acquisto per cambiare idea: scrivi a info@foryoufootball.it e ti rimborsiamo quanto pagato (per le rate, le rate
              pagate), sullo stesso metodo di pagamento. L’accesso ai contenuti a pagamento si chiude. Passati i 14 giorni il pagamento non è rimborsabile, ma
              puoi sempre disdire o cancellare l’account.
            </p>
          </Sez>

          <Sez n="8" title="Il tuo account">
            <p>
              Puoi cancellare l’account da solo da Profilo → «Cancella l’account»: l’app si chiude subito, i dati restano {ACCOUNT_GRACE_DAYS} giorni per chi ci ripensa
              (basta entrare e riattivare), poi spariscono per sempre. Eventuali rate in corso vengono messe in pausa e riprendono se riattivi. Cancellare l’account
              non dà diritto a rimborsi oltre il recesso della sezione 7.
            </p>
            <p>
              Possiamo sospendere o chiudere un account se viola questi termini (sezione 9) o se mette in pericolo altre persone o il servizio. Prima, dove possibile,
              ti avvisiamo.
            </p>
          </Sez>

          <Sez n="9" title="Uso corretto">
            <p>Non puoi:</p>
            <ul className="space-y-2">
              {[
                'copiare, registrare o ridistribuire i contenuti (testi, audio, video, esercizi, piani) fuori dal tuo uso personale;',
                'condividere l’account o rivendere l’accesso;',
                'usare il Coach o il preparatore per scopi diversi dal tuo percorso (es. generare contenuti da pubblicare, provare a farli uscire dalle loro regole);',
                'interferire con il funzionamento dell’app, aggirare i limiti o accedere a dati di altri.',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2"><span className="text-forest-500 mt-0.5">•</span><span>{t}</span></li>
              ))}
            </ul>
          </Sez>

          <Sez n="10" title="Contenuti e proprietà">
            <p>
              Testi, audio, video, esercizi, il metodo, il nome e il marchio For You Football sono di Stefano Berni o dei suoi licenzianti. Con l’acquisto hai il diritto
              di usarli nell’app per il tuo allenamento, non di farne altro. Quello che scrivi tu (riflessioni, risposte, messaggi) resta tuo: ci dai il permesso di
              usarlo solo per farti funzionare l’app, come descritto nella <a href="/privacy" className="text-forest-400 underline">Privacy Policy</a>.
            </p>
          </Sez>

          <Sez n="11" title="Disponibilità e cambiamenti">
            <p>
              Facciamo il possibile perché l’app funzioni sempre, ma può avere interruzioni (aggiornamenti, guasti dei fornitori, cause fuori dal nostro controllo).
              I contenuti e le funzioni possono cambiare nel tempo: aggiungiamo, correggiamo, a volte togliamo. Se dovessimo chiudere il servizio o una sua parte a
              pagamento, ti avvisiamo con almeno 30 giorni di anticipo e rimborsiamo la parte già pagata e non goduta.
            </p>
          </Sez>

          <Sez n="12" title="Responsabilità">
            <p>
              Rispondiamo dei danni causati da dolo o colpa grave nostra, e di tutto ciò che la legge non permette di escludere. Non rispondiamo dei danni che derivano
              da un uso dell’app contrario a questi termini o alle avvertenze di sicurezza (sezione 5), da dati falsi che hai inserito, da scelte che hai fatto
              ignorando il parere di un medico, o da cause fuori dal nostro controllo. Il Coach e il preparatore sono strumenti automatici: le loro risposte vanno
              lette con giudizio e non sostituiscono una persona competente.
            </p>
          </Sez>

          <Sez n="13" title="Modifiche a questi termini">
            <p>
              Se li cambiamo in modo sostanziale, te lo diciamo nell’app e ti chiediamo di accettarli di nuovo prima di continuare. Se non sei d’accordo puoi cancellare
              l’account; per gli abbonamenti valgono le regole della sezione 6. La data in cima è la versione in vigore.
            </p>
          </Sez>

          <Sez n="14" title="Legge e controversie">
            <p>
              Si applica la legge italiana. Per i consumatori valgono le tutele del Codice del consumo e il foro del luogo in cui risiedi. Prima di qualsiasi causa,
              scrivici: la maggior parte delle cose si risolve con un’email. Puoi anche rivolgerti a un organismo di risoluzione alternativa delle controversie (ADR).
            </p>
          </Sez>

          <section className="border-t border-divider pt-6 text-center text-caption text-faint">
            <p>For You Football è un progetto indipendente di Stefano Berni · info@foryoufootball.it</p>
          </section>

        </Card>

        <div className="flex justify-center gap-2 mt-6 flex-wrap">
          <BackButton href="/privacy" label="Privacy Policy" />
          <BackButton href="/login" label="Torna all’app" />
        </div>
      </div>
    </main>
  );
}
