'use client';

// TODO: Implementare Setup Calendario Settimanale (Step 7 handoff doc)
// Struttura:
//   - Utente seleziona giorni allenamento (checkbox lun-dom)
//   - Utente seleziona giorno partita (radio lun-dom)
//   - Salvataggio in user_weekly_calendar
//   - Logica nota campo: se Giorno 2 = giorno allenamento → integrata nel giorno
//   - Logica partita: pausa sequenza → pratica pre-partita → riprende il giorno dopo
//   - Riaprire ogni inizio settimana (o modificabile dal profilo)

export default function CalendarPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <p className="text-gray-500">🚧 Setup calendario — da implementare</p>
    </div>
  );
}
