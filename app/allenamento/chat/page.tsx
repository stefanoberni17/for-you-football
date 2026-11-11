'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { Send } from 'lucide-react';
import { Button, Card, Textarea } from '@/components/ui';
import ParteSwitch, { salvaParte, salvaCorpoAperto } from '@/components/ParteSwitch';

interface Msg { role: 'user' | 'assistant'; content: string }

const WELCOME: Msg = {
  role: 'assistant',
  content: 'Sono il tuo preparatore AI. Chiedimi degli esercizi, dell\'esecuzione o del tuo programma. Per cambiare il piano della settimana usa "Rifai la settimana" in Palestra › Corpo.',
};

export default function TrainingChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [rimasti, setRimasti] = useState<number | null>(null);
  const [chiuso, setChiuso] = useState<string | null>(null); // Base o in pausa: il preparatore non risponde // Medio: messaggi al preparatore rimasti nel mese
  const scrollerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const res = await authFetch('/api/training/state');
      if (res.status === 403) { salvaCorpoAperto(false); router.push('/allenamento'); return; }
      salvaParte('corpo'); salvaCorpoAperto(true);
      // Il preparatore per livello (3/11): al Base non c'è, si torna al Campo (che spiega dov'è)
      const st = await res.json().catch(() => null);
      const prep = st?.abbonamento?.preparatore as { rimasti: number | null; max: number | null } | undefined;
      // Dall'8/11 la chat del preparatore è una tab: chi non ce l'ha legge perché, invece di tornare al Campo
      if (prep?.max === 0) { setChiuso('Il preparatore AI c\'è dal Fisico Medio. Per un dolore usa il triangolo nella Palestra › Corpo: vale per tutti.'); return; }
      if (st?.abbonamento?.inPausa) { setChiuso('Sei in pausa: il preparatore riprende quando riprendi.'); return; }
      if (prep && prep.rimasti != null) setRimasti(prep.rimasti);
      try {
        const saved = sessionStorage.getItem('trainingChatMessages');
        if (saved) setMessages(JSON.parse(saved));
      } catch { /* no-op */ }
    })();
  }, [router]);

  useEffect(() => {
    try { sessionStorage.setItem('trainingChatMessages', JSON.stringify(messages)); } catch { /* no-op */ }
    if (!mountedRef.current) { mountedRef.current = true; return; }
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setSending(true);
    try {
      const res = await authFetch('/api/training/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(1) }), // senza welcome
      });
      if (res.status === 429 || res.status === 403 || res.status === 409) {
        const d = await res.json().catch(() => ({}));
        if (d.reason === 'limite_mese') setRimasti(0);
        const testo = d.reason === 'limite_mese' || d.reason === 'non_incluso' ? d.error
          : res.status === 409 ? 'Sei in pausa: il preparatore riprende quando riprendi.'
          : 'Abbiamo parlato tanto in quest\'ultima ora — riprendiamo tra poco ⚽';
        setMessages([...next, { role: 'assistant', content: testo }]);
      } else if (res.ok) {
        const data = await res.json();
        if (typeof data.rimasti === 'number') setRimasti(data.rimasti);
        setMessages([...next, { role: 'assistant', content: data.response }]);
      } else {
        setMessages([...next, { role: 'assistant', content: 'Ops, qualcosa è andato storto. Riprova.' }]);
      }
    } catch {
      setMessages([...next, { role: 'assistant', content: 'Connessione assente — riprova.' }]);
    } finally { setSending(false); }
  }, [input, messages, sending]);

  return (
    <main className="bg-app flex flex-col overflow-hidden h-dvh-screen pt-safe">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1 min-h-0 pb-tabbar">
        {/* Chat › Corpo (8/11): il selettore al posto del "torna al Campo" */}
        <div className="px-4 pb-2">
          <ParteSwitch parte="corpo" hrefs={{ mente: '/chat', corpo: '/allenamento/chat' }} corpoBloccato={false} />
          <p className="mt-2 text-body-sm text-muted text-center leading-snug">
            Il preparatore: un&apos;AI, non una persona. Può sbagliare.
            {rimasti != null && <> {rimasti > 0 ? `Ti restano ${rimasti} messaggi questo mese.` : 'Messaggi finiti: ripartono il primo del mese.'}</>}
          </p>
        </div>

        {chiuso ? (
          <div className="px-5 pt-4"><Card padding="md"><p className="text-body text-app leading-relaxed">{chiuso}</p></Card></div>
        ) : (<>
        {/* Messaggi */}
          <div ref={scrollerRef} className="flex-1 overflow-y-auto px-5 space-y-3 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-body leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user' ? 'bg-forest-500 text-white rounded-br-md' : 'bg-surface border border-divider text-app rounded-bl-md'
                }`}>{m.content}</div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start"><div className="bg-surface border border-divider rounded-2xl px-4 py-2.5 text-body text-muted">…</div></div>
            )}
          </div>

          {/* Input */}
          <div className="px-5 pt-3">
            <div className="flex items-end gap-2">
              <Textarea value={input} onChange={(e) => setInput(e.target.value)} rows={1} maxLength={800}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Chiedi al preparatore…" aria-label="Messaggio al preparatore"
                className="flex-1" />
              <Button onClick={send} disabled={sending || !input.trim() || rimasti === 0} aria-label="Invia" className="w-12 px-0 shrink-0">
                <Send size={18} />
              </Button>
            </div>
          </div>
        </>)}
      </div>
    </main>
  );
}
