'use client';

// TODO: Implementare pagina giorno (Step 5 handoff doc)
// Struttura:
//   - Fetch dati giorno da /api/giorno?week=W&day=D&userId=X
//   - Render: Apertura + Pratica + Domanda
//   - Se ha_nota_campo → nota contestuale (allenamento vs "prossima volta")
//   - Se è_gate (giorno 7) → redirect /gate/[week]
//   - Se è_esercizio_principale → timer 8-15 min
//   - Salvataggio risposta domanda
//   - Bottone "Segna come completato" → POST /api/giorno

export default function GiornoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <p className="text-gray-500">🚧 Pagina giorno — da implementare</p>
    </div>
  );
}
