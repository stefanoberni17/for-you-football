import { Lock } from 'lucide-react';
import { BackButton, Card } from '@/components/ui';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-app py-10 px-5">
      <div className="w-full max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2 text-forest-400" aria-hidden><Lock size={36} /></div>
          <h1 className="font-display text-title-1 font-bold text-app">Privacy Policy</h1>
          <p className="text-muted text-body-sm mt-1">For You Football — ultimo aggiornamento: marzo 2025</p>
        </div>

        <Card className="space-y-8 text-body text-app leading-relaxed">

          {/* Intro */}
          <section>
            <p>
              For You Football è un&apos;app di allenamento mentale per calciatori. Rispettiamo la tua privacy e vogliamo essere
              trasparenti su come raccogliamo e utilizziamo i tuoi dati.
            </p>
          </section>

          {/* 1. Dati raccolti */}
          <section>
            <h2 className="text-title-3 font-bold text-app mb-3">1. Dati che raccogliamo</h2>
            <div className="space-y-3">
              <Card variant="raised" padding="sm">
                <p className="font-semibold text-app mb-1">Profilo personale</p>
                <p className="text-muted">Nome, età, email, obiettivi, passioni, sogno e situazione attuale. Forniti volontariamente durante la registrazione o dal profilo.</p>
              </Card>
              <Card variant="raised" padding="sm">
                <p className="font-semibold text-app mb-1">Progressi nel percorso</p>
                <p className="text-muted">Giorni e settimane completati, progressi nel percorso e risposte alle domande riflessive.</p>
              </Card>
              <Card variant="raised" padding="sm">
                <p className="font-semibold text-app mb-1">Riflessioni</p>
                <p className="text-muted">Le risposte alle domande riflessive dei giorni del percorso (max 1000 caratteri ciascuna).</p>
              </Card>
              <Card variant="raised" padding="sm">
                <p className="font-semibold text-app mb-1">Dati sulla salute</p>
                <p className="text-muted">Come stai, ore di sonno, recupero, dolori o fastidi che segnali, dove senti un esercizio, i risultati dei test fisici. Li inserisci tu e li salviamo solo con il tuo consenso esplicito, che chiediamo a parte. Servono a regolare percorso e allenamento, non vengono mai venduti né usati per pubblicità. Puoi chiederne la cancellazione quando vuoi.</p>
              </Card>
              <Card variant="raised" padding="sm">
                <p className="font-semibold text-app mb-1">Intelligenza artificiale ed età</p>
                <p className="text-muted">Il Coach e il piano di allenamento usano un&apos;intelligenza artificiale: te lo diciamo sempre, non è una persona e può sbagliare. L&apos;app è per chi ha almeno 14 anni; dai 14 ai 17 anni puoi dare tu il consenso, e questa pagina è scritta per essere chiara anche per te. Per i genitori c&apos;è una <a href="/genitori" className="text-forest-400 underline">pagina dedicata</a>.</p>
              </Card>
              <Card variant="raised" padding="sm">
                <p className="font-semibold text-app mb-1">Conversazioni Telegram</p>
                <p className="text-muted">I messaggi scambiati con il Coach AI tramite il bot Telegram, necessari per mantenere il contesto della conversazione.</p>
              </Card>
            </div>
          </section>

          {/* 2. Come usiamo i dati */}
          <section>
            <h2 className="text-title-3 font-bold text-app mb-3">2. Come utilizziamo i tuoi dati</h2>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-forest-500 mt-0.5">•</span>
                <span>Personalizzare le risposte del Coach AI in base al tuo percorso e alla tua storia</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-forest-500 mt-0.5">•</span>
                <span>Tenere traccia dei tuoi progressi e sbloccare i contenuti in sequenza</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-forest-500 mt-0.5">•</span>
                <span>Migliorare l&apos;esperienza nel tempo tramite pattern anonimi (mai dati personali identificabili)</span>
              </li>
            </ul>
            <Card variant="accent" padding="sm" className="mt-4">
              <p className="font-semibold text-forest-300 mb-1">Non vendiamo i tuoi dati</p>
              <p className="text-forest-200">I tuoi dati non vengono mai venduti, ceduti o condivisi con terze parti a scopo commerciale.</p>
            </Card>
          </section>

          {/* 3. Retention */}
          <section>
            <h2 className="text-title-3 font-bold text-app mb-3">3. Conservazione dei dati</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 border-l-2 border-forest-500/40 pl-3">
                <div>
                  <p className="font-semibold text-app">Conversazioni Telegram</p>
                  <p className="text-muted">Eliminate automaticamente dopo <strong>90 giorni</strong>. Un riassunto anonimo dei temi emersi può essere conservato nel profilo per mantenere la continuità del percorso.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-l-2 border-forest-500/40 pl-3">
                <div>
                  <p className="font-semibold text-app">Profilo, progressi e riflessioni</p>
                  <p className="text-muted">Conservati finché il tuo account è attivo o fino a richiesta di cancellazione.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Tecnologie */}
          <section>
            <h2 className="text-title-3 font-bold text-app mb-3">4. Tecnologie utilizzate</h2>
            <div className="space-y-2">
              <div className="flex items-start gap-3 border-l-2 border-forest-500/40 pl-3">
                <div>
                  <p className="font-semibold text-app">Supabase</p>
                  <p className="text-muted">Database sicuro hosted in Europa per la conservazione dei dati.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-l-2 border-forest-500/40 pl-3">
                <div>
                  <p className="font-semibold text-app">Anthropic (Claude AI)</p>
                  <p className="text-muted">I tuoi messaggi vengono inviati ad Anthropic per generare le risposte del Coach AI. Anthropic non conserva i dati oltre l&apos;elaborazione della richiesta.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-l-2 border-forest-500/40 pl-3">
                <div>
                  <p className="font-semibold text-app">Telegram</p>
                  <p className="text-muted">Usato come canale opzionale per interagire con il Coach AI. L&apos;ID Telegram è l&apos;unico dato condiviso con Telegram.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Diritti */}
          <section>
            <h2 className="text-title-3 font-bold text-app mb-3">5. I tuoi diritti</h2>
            <p className="mb-3">Hai il diritto di:</p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-forest-500 mt-0.5">•</span>
                <span>Accedere ai dati che conserviamo su di te</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-forest-500 mt-0.5">•</span>
                <span>Richiedere la correzione di dati errati</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-forest-500 mt-0.5">•</span>
                <span>Cancellare il tuo account da solo, da Profilo → &quot;Cancella l&apos;account&quot;: l&apos;app si chiude subito, i dati restano 60 giorni per chi ci ripensa, poi vengono cancellati per sempre; oppure chiedercelo via email</span>
              </li>
            </ul>
            <Card padding="sm" className="bg-info/10 border-info/30">
              <p className="font-semibold text-info mb-1">Contatto</p>
              <p className="text-app">Per qualsiasi richiesta relativa ai tuoi dati, scrivi a:{' '}
                <a href="mailto:info@foryoufootball.it" className="underline font-semibold text-info">
                  info@foryoufootball.it
                </a>
              </p>
            </Card>
          </section>

          {/* Footer */}
          <section className="border-t border-divider pt-6 text-center text-caption text-faint">
            <p>For You Football è un progetto indipendente.</p>
          </section>

        </Card>

        {/* Back link */}
        <div className="flex justify-center mt-6">
          <BackButton href="/login" label="Torna al login" />
        </div>

      </div>
    </main>
  );
}
