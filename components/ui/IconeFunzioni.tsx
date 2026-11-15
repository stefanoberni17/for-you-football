import type { ComponentType, SVGProps } from 'react';
import {
  BookOpen, CalendarDays, CalendarRange, ChartColumn, Dumbbell, Eye, History, IdCard, Key, LifeBuoy,
  ListChecks, MessageCircle, Route, Settings2, Timer, Wind, Zap, Bandage,
} from 'lucide-react';
import IconaCorpo, { IconaMente } from './IconaCorpo';

/**
 * Le icone fisse (14/11, Ste: «un'icona per le azioni, una per il percorso, una per gli allenamenti mentali… sopra
 * ogni bottone per renderle identificabili a colpo d'occhio»). Tre regole:
 * 1. ogni cosa ha la sua icona, sempre la stessa: lo stato («Oggi partita», «Fatto») va nella riga sotto, mai
 *    nell'icona (prima l'allenamento di oggi diventava una coppa, una spunta o una pausa a seconda del giorno);
 * 2. il colore dice la parte: verde la Mente, blu il Corpo (`parte`), bianco le cose di tutte e due (`null`);
 * 3. ogni riquadro con l'etichetta porta il segno piccolo della sua parte (la testa o il calciatore).
 * Una sola mappa: chi mette un bottone nuovo sceglie la funzione qui, non un'icona a mano.
 */
type Icona = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

/** Il pallone: squadra, partita e il resoconto «Com'è andata?». */
export function IconaPallone({ size = 24, ...props }: SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7.5l4.3 3.1-1.6 5h-5.4l-1.6-5z" fill="currentColor" />
      <path d="M12 7.5V2.3M16.3 10.6l4.8-1.7M14.7 15.6l3 4.2M9.3 15.6l-3 4.2M7.7 10.6L2.9 8.9" />
    </svg>
  );
}

export const FUNZIONI = {
  // Mente
  percorso: { parte: 'mente', nome: 'Percorso Mente', Icona: Route },
  allenamentoMente: { parte: 'mente', nome: 'Allenamento mentale', Icona: Wind },
  reset: { parte: 'mente', nome: 'Reset rapido', Icona: Zap },
  quandoDura: { parte: 'mente', nome: 'Quando si fa dura', Icona: LifeBuoy },
  azioni: { parte: 'mente', nome: 'Le tue azioni', Icona: ListChecks },
  esercizio: { parte: 'mente', nome: 'Esercizio della settimana', Icona: Eye },
  gate: { parte: 'mente', nome: 'Gate', Icona: Key },
  risposte: { parte: 'mente', nome: 'Le tue risposte', Icona: BookOpen },
  dati: { parte: 'mente', nome: 'I tuoi dati', Icona: ChartColumn },
  coach: { parte: 'mente', nome: 'Coach', Icona: MessageCircle },
  prePartita: { parte: 'mente', nome: 'Prima della partita', Icona: IconaPallone }, // 14/11: «Oggi giochi: arriva pronto»
  // Corpo
  allenamentoCorpo: { parte: 'corpo', nome: 'Allenamento', Icona: Dumbbell },
  test: { parte: 'corpo', nome: 'Test', Icona: Timer },
  squadraPartita: { parte: 'corpo', nome: 'Squadra e partita', Icona: IconaPallone },
  dolore: { parte: 'corpo', nome: 'Dolore', Icona: Bandage },
  setup: { parte: 'corpo', nome: 'Il tuo setup', Icona: Settings2 },
  storico: { parte: 'corpo', nome: 'Lo storico', Icona: History },
  settimanePassate: { parte: 'corpo', nome: 'Le settimane passate', Icona: CalendarRange },
  preparatore: { parte: 'corpo', nome: 'Preparatore', Icona: MessageCircle },
  // Di tutte e due
  settimana: { parte: null, nome: 'La tua settimana', Icona: CalendarDays },
  carta: { parte: null, nome: 'La tua Carta', Icona: IdCard },
} satisfies Record<string, { parte: 'mente' | 'corpo' | null; nome: string; Icona: Icona }>;

export type Funzione = keyof typeof FUNZIONI;

export function parteDi(f: Funzione): 'mente' | 'corpo' | null {
  return FUNZIONI[f].parte;
}

export function IconaFunzione({ f, size, className }: { f: Funzione; size?: number; className?: string }) {
  const I: Icona = FUNZIONI[f].Icona;
  return <I size={size} className={className} aria-hidden />;
}

/** Il segno piccolo della parte, accanto all'etichetta dei riquadri. */
export function SegnoParte({ parte, size = 16 }: { parte: 'mente' | 'corpo'; size?: number }) {
  return parte === 'corpo' ? <IconaCorpo size={size} aria-hidden /> : <IconaMente size={size} aria-hidden />;
}
