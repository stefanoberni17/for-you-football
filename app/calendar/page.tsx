import { redirect } from 'next/navigation';

// Il setup del calendario settimanale vive nel WeeklyCalendarPopup
// (dashboard e /settimana/[id]): questa route esiste solo per non
// lasciare un URL morto a chi ci arriva da link vecchi.
export default function CalendarPage() {
  redirect('/');
}
