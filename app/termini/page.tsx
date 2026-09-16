import { FileText } from 'lucide-react';
import { Card } from '@/components/ui';

export default function TerminiPage() {
  return (
    <main className="min-h-screen bg-app py-10 px-5">
      <div className="w-full max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2 text-forest-400" aria-hidden><FileText size={36} /></div>
          <h1 className="font-display text-title-1 font-bold text-app">Termini di servizio</h1>
          <p className="text-muted text-body-sm mt-1">For You Football</p>
        </div>

        <Card className="space-y-6 text-body text-app leading-relaxed">

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
            <h2 className="text-title-3 font-bold text-app mb-2">In sintesi, intanto</h2>
            <div className="space-y-3">
              <Card variant="raised" padding="sm">
                <p className="font-semibold text-app mb-1">Cos&apos;è For You Football</p>
                <p className="text-muted">
                  Un percorso di allenamento mentale per sportivi, con pratiche guidate e un
                  assistente automatico (il Coach AI). Non è un servizio medico, psicologico o
                  terapeutico e non lo sostituisce.
                </p>
              </Card>
              <Card variant="raised" padding="sm">
                <p className="font-semibold text-app mb-1">Età minima</p>
                <p className="text-muted">
                  Per usare l&apos;app devi avere almeno 14 anni.
                </p>
              </Card>
              <Card variant="raised" padding="sm">
                <p className="font-semibold text-app mb-1">Coach AI</p>
                <p className="text-muted">
                  Il Coach è un sistema automatico basato su intelligenza artificiale, non una
                  persona. Le sue risposte non sono consigli medici o psicologici.
                </p>
              </Card>
            </div>
          </section>

          <section>
            <p className="text-muted">
              Per qualsiasi domanda: <span className="text-app">info@foryoufootball.it</span>
            </p>
          </section>

        </Card>
      </div>
    </main>
  );
}
