import Link from 'next/link';

export const metadata = { title: 'Per i genitori — For You Football' };

/**
 * Pagina per i genitori: cos'è l'app, cosa fa l'AI, età, dati, sicurezza, chi paga.
 * Linguaggio piano (legge 132/2025: informazioni chiare per i minori e per chi ne risponde).
 * Statica, pubblica, senza tab bar. Linkata da registrazione, privacy, profilo e Campo.
 */
function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-2 border border-divider rounded-xl p-4">
      <p className="font-semibold text-app mb-1">{title}</p>
      <div className="text-muted leading-relaxed">{children}</div>
    </div>
  );
}

export default function GenitoriPage() {
  return (
    <main className="min-h-screen bg-app pt-safe pb-10 px-5">
      <div className="max-w-md mx-auto text-sm">
        <div className="mb-6">
          <p className="text-xs font-semibold text-forest-400 mb-1">For You Football</p>
          <h1 className="text-2xl font-bold text-app">Per i genitori</h1>
          <p className="text-muted mt-1">Due minuti per capire cosa usa tuo figlio o tua figlia.</p>
        </div>

        <div className="space-y-3">
          <Box title="Cos'è">
            Un&apos;app di allenamento mentale per chi gioca a calcio, dai 14 anni in su. Un percorso di 12 settimane con esercizi brevi ogni giorno (respiro, attenzione, gestione dell&apos;errore e della pressione) e, per chi lo attiva, un modulo di allenamento fisico con test e sedute. L&apos;ha creata Stefano Berni, preparatore atletico. Non è terapia, non è un servizio medico e non sostituisce mister, medico o psicologo.
          </Box>
          <Box title="Cosa fa l'intelligenza artificiale">
            Nell&apos;app c&apos;è un &quot;Coach&quot; con cui si può scrivere. È un&apos;intelligenza artificiale, lo diciamo sempre in modo chiaro, non è una persona e può sbagliare. Segue regole scritte da noi: parla di calcio e di come si sta in campo, non dà diagnosi, non dà consigli medici, non finge di essere umano. Il piano di allenamento fisico è proposto dall&apos;AI e controllato in automatico da regole fisse del preparatore (carichi, recuperi, giorni vicini alla partita).
          </Box>
          <Box title="Età e consenso">
            L&apos;app si può usare dai 14 anni: sotto quell&apos;età la registrazione è bloccata. Tra i 14 e i 17 anni la legge italiana permette al ragazzo di dare il consenso da solo, a patto che le informazioni siano chiare: per questo la nostra privacy è scritta in modo semplice. Se preferite leggerla insieme, è <Link href="/privacy" className="text-forest-400 underline">qui</Link>.
          </Box>
          <Box title="Quali dati raccogliamo">
            Nome, email, data di nascita, ruolo e livello nel calcio, le risposte scritte durante il percorso, i messaggi al Coach. Con un consenso a parte anche i dati sulla salute che inserisce lui o lei: come sta, ore di sonno, eventuali dolori, i risultati dei test fisici. Servono solo a regolare percorso e allenamento. Niente pubblicità, niente vendita di dati. Si possono chiedere copia e cancellazione in qualsiasi momento.
          </Box>
          <Box title="Sicurezza">
            Se in una conversazione con il Coach compaiono segnali di un momento difficile serio, il Coach smette di fare coaching, invita a parlare con un adulto di fiducia e indica contatti reali (Telefono Amico, 112 in emergenza). Una persona del nostro team viene avvisata e controlla. Le conversazioni normali si cancellano dopo 90 giorni.
          </Box>
          <Box title="Allenamento fisico">
            Prima di iniziare chiediamo di dichiarare di stare bene e, per chi gioca in una società, di avere il certificato medico in regola. Se segnala un dolore, le sedute fisiche si fermano finché non dice che è passato o ne ha parlato con medico o fisioterapista. Gli esercizi sono quelli che il preparatore usa con i suoi atleti, dosati per livello ed età.
          </Box>
          <Box title="Costi">
            La registrazione è gratuita. Per usare il percorso serve un acquisto, che di solito fa un genitore: il prezzo è indicato in chiaro prima di pagare, non ci sono rinnovi nascosti e il pagamento passa da Stripe, non salviamo i dati della carta.
          </Box>
          <Box title="Domande">
            Scriveteci a <a href="mailto:info@foryoufootball.it" className="text-forest-400 underline">info@foryoufootball.it</a>. Rispondiamo noi, non un&apos;AI.
          </Box>
        </div>

        <div className="flex gap-4 justify-center mt-8 text-xs text-faint">
          <Link href="/privacy" className="underline">Privacy</Link>
          <Link href="/termini" className="underline">Termini</Link>
          <Link href="/" className="underline">Torna all&apos;app</Link>
        </div>
      </div>
    </main>
  );
}
