export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 py-10 px-5">
      <div className="w-full max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🔒</div>
          <h1 className="text-2xl font-bold text-gray-800">Privacy Policy</h1>
          <p className="text-gray-500 text-sm mt-1">Naruto Inner Path — ultimo aggiornamento: febbraio 2025</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-7 space-y-8 text-sm text-gray-700 leading-relaxed">

          {/* Intro */}
          <section>
            <p>
              Naruto Inner Path è un'app di crescita personale. Rispettiamo la tua privacy e vogliamo essere
              trasparenti su come raccogliamo e utilizziamo i tuoi dati.
            </p>
          </section>

          {/* 1. Dati raccolti */}
          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3">1. Dati che raccogliamo</h2>
            <div className="space-y-3">
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                <p className="font-semibold text-gray-800 mb-1">👤 Profilo personale</p>
                <p className="text-gray-600">Nome, età, email, obiettivi, passioni, sogno e situazione attuale. Forniti volontariamente durante la registrazione o dal profilo.</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                <p className="font-semibold text-gray-800 mb-1">📺 Progressi nel percorso</p>
                <p className="text-gray-600">Episodi completati, settimana corrente e tracker delle pratiche settimanali.</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                <p className="font-semibold text-gray-800 mb-1">✍️ Riflessioni</p>
                <p className="text-gray-600">Le risposte alle domande riflessive degli episodi (max 500 caratteri ciascuna).</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                <p className="font-semibold text-gray-800 mb-1">💬 Conversazioni Telegram</p>
                <p className="text-gray-600">I messaggi scambiati con il Maestro AI tramite il bot Telegram, necessari per mantenere il contesto della conversazione.</p>
              </div>
            </div>
          </section>

          {/* 2. Come usiamo i dati */}
          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3">2. Come utilizziamo i tuoi dati</h2>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>Personalizzare le risposte del Maestro AI in base al tuo percorso e alla tua storia</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>Tenere traccia dei tuoi progressi e sbloccare i contenuti in sequenza</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>Migliorare l'esperienza nel tempo tramite pattern anonimi (mai dati personali identificabili)</span>
              </li>
            </ul>
            <div className="mt-4 bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="font-semibold text-green-800 mb-1">✅ Non vendiamo i tuoi dati</p>
              <p className="text-green-700">I tuoi dati non vengono mai venduti, ceduti o condivisi con terze parti a scopo commerciale.</p>
            </div>
          </section>

          {/* 3. Retention */}
          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3">3. Conservazione dei dati</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-lg">🗓️</span>
                <div>
                  <p className="font-semibold text-gray-800">Conversazioni Telegram</p>
                  <p className="text-gray-600">Eliminate automaticamente dopo <strong>90 giorni</strong>. Un riassunto anonimo dei temi emersi può essere conservato nel profilo per mantenere la continuità del percorso.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">📁</span>
                <div>
                  <p className="font-semibold text-gray-800">Profilo, progressi e riflessioni</p>
                  <p className="text-gray-600">Conservati finché il tuo account è attivo o fino a richiesta di cancellazione.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Tecnologie */}
          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3">4. Tecnologie utilizzate</h2>
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <span className="text-lg">🗄️</span>
                <div>
                  <p className="font-semibold text-gray-800">Supabase</p>
                  <p className="text-gray-600">Database sicuro hosted in Europa per la conservazione dei dati.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">🤖</span>
                <div>
                  <p className="font-semibold text-gray-800">Anthropic (Claude AI)</p>
                  <p className="text-gray-600">I tuoi messaggi vengono inviati ad Anthropic per generare le risposte del Maestro AI. Anthropic non conserva i dati oltre l'elaborazione della richiesta.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">✈️</span>
                <div>
                  <p className="font-semibold text-gray-800">Telegram</p>
                  <p className="text-gray-600">Usato come canale opzionale per interagire con il Maestro AI. L'ID Telegram è l'unico dato condiviso con Telegram.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Diritti */}
          <section>
            <h2 className="text-base font-bold text-gray-800 mb-3">5. I tuoi diritti</h2>
            <p className="mb-3">Hai il diritto di:</p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>Accedere ai dati che conserviamo su di te</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>Richiedere la correzione di dati errati</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">•</span>
                <span>Richiedere la cancellazione del tuo account e di tutti i dati associati</span>
              </li>
            </ul>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="font-semibold text-blue-800 mb-1">📧 Contatto</p>
              <p className="text-blue-700">Per qualsiasi richiesta relativa ai tuoi dati, scrivi a:{' '}
                <a href="mailto:foryou.innerpath@gmail.com" className="underline font-semibold">
                  foryou.innerpath@gmail.com
                </a>
              </p>
            </div>
          </section>

          {/* Footer */}
          <section className="border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
            <p>Naruto Inner Path è un progetto indipendente.</p>
            <p className="mt-1">Non è affiliato con Masashi Kishimoto, TV Tokyo o Viz Media.</p>
          </section>

        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <a href="/login" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
            ← Torna al login
          </a>
        </div>

      </div>
    </main>
  );
}
