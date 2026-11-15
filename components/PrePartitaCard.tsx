'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronRight, Play } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { trackOnboarding } from '@/lib/onboardingTrack';
import { todayItaly } from '@/lib/dateItaly';
import {
  BISOGNI, bisogniAperti, bisognoSuggerito, praticheDelBisogno, rigaSuggerimento,
  type Bisogno, type CheckinOggi, type PraticaPrePartita,
} from '@/lib/prePartita';
import PracticePopup from '@/components/PracticePopup';
import { Badge, Card, IconaFunzione, Sheet } from '@/components/ui';

/**
 * «Oggi giochi: arriva pronto» (14/11): in Home il giorno della partita. Il ragazzo dice come si sente
 * (meno ansia, più concentrazione, meno pensieri…) e trova due o tre pratiche corte della Palestra che ha
 * già incontrato nel percorso; il check-in del mattino suggerisce da dove partire. Le pratiche fatte oggi
 * restano segnate sul dispositivo (`prePartita:<data>`).
 */
export default function PrePartitaCard({ settimana, praticaSettimana }: { settimana: number; praticaSettimana?: string }) {
  const oggi = todayItaly();
  const chiave = `prePartita:${oggi}`;
  const [checkin, setCheckin] = useState<CheckinOggi | null>(null);
  const [aperto, setAperto] = useState<Bisogno | null>(null);
  const [attiva, setAttiva] = useState<PraticaPrePartita | null>(null);
  const [fatte, setFatte] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(chiave) || '[]'); } catch { return []; }
  });

  useEffect(() => {
    authFetch('/api/checkin').then(r => (r.ok ? r.json() : null)).then(d => setCheckin(d?.checkin ?? null)).catch(() => {});
  }, [chiave]);

  const bisogni = bisogniAperti(settimana);
  if (bisogni.length === 0) return null;
  const suggerito = bisognoSuggerito(checkin, settimana);
  const nomeFatta = (id: string) => BISOGNI.flatMap(b => praticheDelBisogno(b.id, settimana)).find(p => p.id === id)?.nome;
  const ultimaFatta = fatte.length ? nomeFatta(fatte[fatte.length - 1]) : undefined;

  const fatta = (p: PraticaPrePartita) => {
    const nuove = fatte.includes(p.id) ? fatte : [...fatte, p.id];
    setFatte(nuove);
    try { localStorage.setItem(chiave, JSON.stringify(nuove)); } catch { /* niente */ }
    trackOnboarding('pre_partita_pratica', { bisogno: aperto, pratica: p.id });
    setAttiva(null);
  };

  const b = aperto ? BISOGNI.find(x => x.id === aperto) : null;
  const pratiche = aperto ? praticheDelBisogno(aperto, settimana) : [];

  return (
    <>
      <Card padding="md" aria-label="Oggi giochi: arriva pronto">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-display text-[18px] font-bold text-forest-300">
            <IconaFunzione f="prePartita" size={22} className="shrink-0" />Prima della partita
          </span>
          <Badge tone="danger">Oggi giochi</Badge>
        </div>
        <h2 className="mt-2 font-display text-title-1 font-bold text-app leading-tight">Arriva pronto</h2>
        <p className="mt-0.5 text-body-sm text-muted">
          {ultimaFatta ? <>Fatta: {ultimaFatta}. Ne vuoi un&apos;altra?</> : 'Come ti senti? Scegli e fai una pratica corta.'}
        </p>
        {suggerito && !ultimaFatta && <p className="mt-2 text-body-sm text-forest-300">{rigaSuggerimento(suggerito)}</p>}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {bisogni.map(x => {
            const sug = x.id === suggerito;
            return (
              <button key={x.id} type="button" onClick={() => setAperto(x.id)}
                className={`flex min-h-[52px] items-center justify-between gap-2 rounded-btn border px-3 py-2.5 text-left text-body-sm font-semibold transition-colors ${
                  sug ? 'border-forest-400 bg-forest-500/15 text-app' : 'border-divider bg-surface-2 text-app hover:bg-surface-3'}`}>
                <span>{x.etichetta}</span>
                <ChevronRight size={16} className="shrink-0 text-faint" aria-hidden />
              </button>
            );
          })}
        </div>
      </Card>

      <Sheet open={!!b && !attiva} onClose={() => setAperto(null)} eyebrow="Oggi giochi" title={b?.etichetta} subtitle={b?.sotto}>
        <div className="space-y-2 pb-2">
          {pratiche.map(p => {
            const ok = fatte.includes(p.id);
            return (
              <button key={p.id} type="button" onClick={() => setAttiva(p)}
                className="flex w-full items-center gap-3 rounded-card border border-divider bg-surface-2 p-3.5 text-left hover:bg-surface-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-body font-semibold text-app">{p.nome}</span>
                  <span className="mt-0.5 text-body-sm text-muted line-clamp-2">{p.durataMinuti} min · {p.perche}</span>
                </span>
                <span aria-hidden className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${ok ? 'bg-forest-500/20 text-forest-300' : 'bg-forest-500 text-white'}`}>
                  {ok ? <Check size={20} strokeWidth={3} /> : <Play size={18} fill="currentColor" />}
                </span>
              </button>
            );
          })}
          {praticaSettimana && (
            <div className="mt-3 rounded-card border border-divider p-3.5">
              <p className="text-overline uppercase tracking-wider font-semibold text-forest-400">Dal percorso, per il giorno della partita</p>
              <p className="mt-1 whitespace-pre-line text-body-sm leading-relaxed text-app">{praticaSettimana}</p>
            </div>
          )}
        </div>
      </Sheet>

      {attiva && (
        <PracticePopup
          titolo={attiva.nome}
          pratica={attiva.pratica}
          durataMinuti={attiva.durataMinuti}
          tipoPratica={attiva.tipoPratica}
          weekTool={attiva.principio}
          respiro={attiva.respiro}
          onComplete={() => fatta(attiva)}
          onSkip={() => setAttiva(null)}
        />
      )}
    </>
  );
}
