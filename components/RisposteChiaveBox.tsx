'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight, PenLine } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { Button } from '@/components/ui';
import ModificaRispostaSheet from '@/components/ModificaRispostaSheet';
import { chiaviPerGiorno, testoRisposta, type RispostaChiave, type RispostaRow } from '@/lib/risposteChiave';

/**
 * "Le tue risposte" dentro un giorno del percorso (22/10, review W11): nei giorni elencati in
 * `DA_MOSTRARE` mostra le risposte chiave che il testo di Notion richiama ("le trovi qui sotto"),
 * una per riga, chiuse di default, con il link alla pagina /risposte. Se una risposta manca
 * (giorno saltato o risposta non scritta) lo dice, senza bloccare niente.
 * Fuori dai giorni elencati non rende nulla.
 */
export default function RisposteChiaveBox({ week, day, className = '' }: { week: number; day: number; className?: string }) {
  const chiavi = chiaviPerGiorno(week, day);
  const [rows, setRows] = useState<RispostaRow[] | null>(null);
  const [errore, setErrore] = useState(false);
  const [modifica, setModifica] = useState<RispostaChiave | null>(null);

  useEffect(() => {
    if (!chiavi || chiavi.length === 0) return;
    let vivo = true;
    (async () => {
      try {
        const res = await authFetch('/api/risposte?chiavi=1');
        const data = await res.json();
        if (!vivo) return;
        if (!res.ok || !Array.isArray(data?.risposte)) { setErrore(true); return; }
        setRows(data.risposte);
      } catch {
        if (vivo) setErrore(true);
      }
    })();
    return () => { vivo = false; };
    // chiavi dipende solo da week e day
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week, day]);

  if (!chiavi) return null;

  const link = (
    <Link href="/risposte" className="min-h-[44px] flex items-center gap-2 text-body-sm font-semibold text-forest-300">
      <BookOpen size={16} aria-hidden />
      <span className="flex-1">Tutte le tue risposte</span>
      <ChevronRight size={16} className="text-muted" aria-hidden />
    </Link>
  );

  if (chiavi.length === 0) {
    return <div className={`border-t border-divider ${className}`}>{link}</div>;
  }

  return (
    <div className={`border-t border-divider pt-3 ${className}`}>
      <p className="text-overline uppercase tracking-wider font-bold text-muted mb-1">Le tue risposte</p>
      {errore && <p className="text-body-sm text-muted">Non sono riuscito a caricarle. Le trovi nel Profilo, in «Le tue risposte».</p>}
      {!errore && rows === null && <p className="text-body-sm text-faint">Carico le tue risposte…</p>}
      {!errore && rows !== null && chiavi.map((c: RispostaChiave) => {
        const row = rows.find((r) => r.week === c.week && r.day === c.day);
        const testo = row ? testoRisposta(row) : null;
        return (
          <details key={`${c.week}-${c.day}`} className="group border-b border-divider last:border-b-0">
            <summary className="min-h-[48px] flex items-center gap-2 cursor-pointer list-none select-none">
              <span className="flex-1 min-w-0">
                <span className="block text-body font-semibold text-app">{c.label}</span>
                <span className="block text-caption text-muted">{testo ? c.quando : 'Non l’hai ancora scritta'}</span>
              </span>
              <ChevronRight size={18} className="text-muted shrink-0 transition-transform group-open:rotate-90" aria-hidden />
            </summary>
            <div className="pb-3 space-y-2">
              {testo ? (
                <p className="text-body text-app leading-relaxed whitespace-pre-line">{testo}</p>
              ) : (
                <p className="text-body-sm text-muted leading-relaxed">
                  Quel giorno non hai scritto la risposta. Puoi scriverla adesso: vale lo stesso.
                </p>
              )}
              {row?.aggiornataIl && <p className="text-caption text-faint">Aggiornata il {new Date(row.aggiornataIl).toLocaleDateString('it-IT')}{row.versioni ? ` · ${row.versioni} versioni` : ''}</p>}
              <Button variant="secondary" size="sm" icon={<PenLine size={16} aria-hidden />} onClick={() => setModifica(c)}>
                {testo ? 'Modifica' : 'Scrivilo adesso'}
              </Button>
            </div>
          </details>
        );
      })}
      {link}
      {modifica && (
        <ModificaRispostaSheet
          week={modifica.week}
          day={modifica.day}
          testoIniziale={(rows || []).find((r) => r.week === modifica.week && r.day === modifica.day)?.risposta || ''}
          open
          onClose={() => setModifica(null)}
          onSalvata={(t) => setRows((prev) => {
            const lista = prev ? [...prev] : [];
            const i = lista.findIndex((r) => r.week === modifica.week && r.day === modifica.day);
            const base: RispostaRow = i >= 0 ? lista[i] : { week: modifica.week, day: modifica.day, domanda: null, risposta: null, prePratica: null, gate: null, completedAt: null };
            const nuova = { ...base, risposta: t, versioni: (base.versioni || 0) + 1, aggiornataIl: new Date().toISOString() };
            if (i >= 0) lista[i] = nuova; else lista.push(nuova);
            return lista;
          })}
        />
      )}
    </div>
  );
}
