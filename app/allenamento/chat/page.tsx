'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { Send } from 'lucide-react';
import { BackButton, Button, Textarea } from '@/components/ui';

interface Msg { role: 'user' | 'assistant'; content: string }

const WELCOME: Msg = {
  role: 'assistant',
  content: 'Sono il tuo preparatore AI ⚽ Chiedimi degli esercizi, dell\'esecuzione o del tuo programma. Per cambiare il piano della settimana usa "Rifai la settimana" nella pagina Campo.',
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
        <div className="px-5 pb-2 flex items-center gap-2">
          <BackButton onClick={() => router.push('/allenamento')} label="Campo" />
          <div className="min-w-0">
            <h1 className="font-display text-title-3 font-bold text-app leading-tight">Preparatore AI</h1>
            <p className="text-caption text-muted">Allenamento tecnico e fisico</p>
          </div>
        </div>
        <p className="text-caption text-muted text-center pb-2 px-5 leading-snug">
          Stai parlando con un&apos;AI, non con una persona. Ricordati che l&apos;AI può fare errori.
        </p>

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
            <Button onClick={send} disabled={sending || !input.trim()} aria-label="Invia" className="w-12 px-0 shrink-0">
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
