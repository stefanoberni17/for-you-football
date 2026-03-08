'use client';

// TODO: Implementare Gate Giorno 7 (Step 6 handoff doc)
// Struttura:
//   - 3 domande obbligatorie dal DB Notion (Domande Gate field)
//   - Risposte salvate in user_day_progress.gate_answers (JSONB)
//   - Solo dopo risposta a tutte e 3 → sblocca settimana successiva
//   - Giorno 7 NON comprimibile — reminder gentile se saltato
//   - Al completamento → /week-complete/[week]

export default function GatePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <p className="text-gray-500">🚧 Gate giorno 7 — da implementare</p>
    </div>
  );
}
