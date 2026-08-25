export default function TerminiPage() {
  return (
    <main className="min-h-screen bg-app py-10 px-5">
      <div className="w-full max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">📄</div>
          <h1 className="text-2xl font-bold text-app">Termini di servizio</h1>
          <p className="text-muted text-sm mt-1">For You Football</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-xl p-7 space-y-6 text-sm text-app leading-relaxed">

          {/*
            ⚠️ PLACEHOLDER — il testo definitivo dei Termini di servizio è in
            preparazione con il supporto legale. Questa pagina va sostituita
            integralmente PRIMA del lancio pubblico. Quando il documento
            definitivo viene pubblicato: aggiornare anche TERMS_VERSION in
            lib/constants.ts (fa scattare la ri-accettazione).
          */}
          <section>
            <p>
              Il testo completo dei Termini di servizio di For You Football è in fase di
              finalizzazione e sarà pubblicato su questa pagina.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-app mb-2">In sintesi, intanto</h2>
            <div className="space-y-3">
              <div className="bg-surface-2 border border-divider rounded-xl p-4">
                <p className="font-semibold text-app mb-1">⚽ Cos&apos;è For You Football</p>
                <p className="text-muted">
                  Un percorso di allenamento mentale per sportivi, con pratiche guidate e un
                  assistente automatico (il Coach AI). Non è un servizio medico, psicologico o
                  terapeutico e non lo sostituisce.
                </p>
              </div>
              <div className="bg-surface-2 border border-divider rounded-xl p-4">
                <p className="font-semibold text-app mb-1">🎂 Età minima</p>
                <p className="text-muted">
                  Per usare l&apos;app devi avere almeno 14 anni.
                </p>
              </div>
              <div className="bg-surface-2 border border-divider rounded-xl p-4">
                <p className="font-semibold text-app mb-1">🤖 Coach AI</p>
                <p className="text-muted">
                  Il Coach è un sistema automatico basato su intelligenza artificiale, non una
                  persona. Le sue risposte non sono consigli medici o psicologici.
                </p>
              </div>
            </div>
          </section>

          <section>
            <p className="text-muted">
              Per qualsiasi domanda: <span className="text-app">foryou.innerpath@gmail.com</span>
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
