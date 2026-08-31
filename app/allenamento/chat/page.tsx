'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { ArrowLeft, Send } from 'lucide-react';

interface Msg { role: 'user' | 'assistant'; content: string }

const WELCOME: Msg = {
  role: 'assistant',
  content: 'Sono il tuo preparatore AI ⚽ Chiedimi degli esercizi, dell\'esecuzione o del tuo programma. Per cambiare il piano della settimana usa "Rigenera" nella pagina Campo.',
};

export default function TrainingChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const res = await authFetch('/api/training/state');
      if (res.status === 403) { router.push('/strumenti'); return; }
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
      if (res.status === 429) {
        setMessages([...next, { role: 'assistant', content: 'Abbiamo parlato tanto in quest\'ultima ora — riprendiamo tra poco ⚽' }]);
      } else if (res.ok) {
        const data = await res.json();
        setMessages([...next, { role: 'assistant', content: data.response }]);
      } else {
        setMessages([...next, { role: 'assistant', content: 'Ops, qualcosa è andato storto. Riprova.' }]);
      }
    } catch {
      setMessages([...next, { role: 'assistant', content: 'Connessione assente — riprova.' }]);
    } finally { setSending(false); }
  }, [input, messages, sending]);

  return (
    <main className="bg-app flex flex-col overflow-hidden" style={{ height: '100vh', paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
      <div className="max-w-md mx-auto w-full flex flex-col flex-1 min-h-0 pb-tabbar">
        {/* Header */}
        <div className="px-5 pb-3 flex items-center gap-3">
          <button onClick={() => router.push('/allenamento')} aria-label="Torna al Campo"
            className="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center text-muted shrink-0">
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-base font-bold text-app leading-tight">Preparatore AI</h1>
            <p className="text-[11px] text-faint">Allenamento tecnico e fisico</p>
          </div>
        </div>
        <p className="text-[10px] text-faint text-center pb-2 px-5">
          Stai parlando con un&apos;AI, non con una persona. Ricordati che l&apos;AI può fare errori.
        </p>

        {/* Messaggi */}
        <div ref={scrollerRef} className="flex-1 overflow-y-auto px-5 space-y-3 min-h-0">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-forest-500 text-white rounded-br-md' : 'bg-surface border border-divider text-app rounded-bl-md'
              }`}>{m.content}</div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start"><div className="bg-surface border border-divider rounded-2xl px-4 py-2.5 text-sm text-muted">…</div></div>
          )}
        </div>

        {/* Input */}
        <div className="px-5 pt-3">
          <div className="flex items-end gap-2">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={1} maxLength={800}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Chiedi al preparatore…"
              className="flex-1 px-4 py-3 bg-surface border border-divider rounded-2xl text-sm text-app outline-none focus:ring-2 focus:ring-forest-400 resize-none" />
            <button onClick={send} disabled={sending || !input.trim()} aria-label="Invia"
              className="w-12 h-12 rounded-2xl bg-forest-500 text-white flex items-center justify-center disabled:opacity-50 shrink-0">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
