'use client';

import { useState, useRef, useEffect, useImperativeHandle } from 'react';
import { authFetch } from '@/lib/authFetch';
import { supabase } from '@/lib/supabase';
import { Send } from 'lucide-react';
import { Badge, Button, Chip, Input } from '@/components/ui';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatBotRef {
  sendSuggestion: (text: string) => void;
}

// Conversazione salvata sul DISPOSITIVO per utente (localStorage: sopravvive alla
// chiusura dell'app, resta locale). Tetto agli ultimi CHAT_KEEP messaggi.
const CHAT_STORAGE_PREFIX = 'coachChat:';
const CHAT_KEEP = 40;
export const chatStorageKey = (userId: string) => `${CHAT_STORAGE_PREFIX}${userId}`;
/** Da chiamare al logout: toglie le chat salvate di tutti gli utenti su questo dispositivo. */
export function clearSavedChats() {
  try {
    Object.keys(localStorage).filter(k => k.startsWith(CHAT_STORAGE_PREFIX)).forEach(k => localStorage.removeItem(k));
    sessionStorage.removeItem('coachChatMessages');
  } catch { /* no-op */ }
}

function makeWelcome(userName?: string): Message {
  return {
    role: 'assistant',
    content: userName
      ? `Ciao ${userName}. Sono il tuo Coach — sono qui per aiutarti a giocare con più lucidità. Di cosa vuoi parlare oggi?`
      : 'Ciao! Sono il tuo Coach — sono qui per aiutarti a giocare con più lucidità. Di cosa vuoi parlare oggi?',
    timestamp: new Date(),
  };
}

export default function ChatBot({ ref, suggestions, userName }: { ref?: React.Ref<ChatBotRef>; suggestions?: string[]; userName?: string }) {
  const [messages, setMessages] = useState<Message[]>([makeWelcome(userName)]);
  // Settimana gratis: FREE_COACH_MESSAGES messaggi, poi 403 payment_required dalla API
  const [paywalled, setPaywalled] = useState(false);
  const [freeRemaining, setFreeRemaining] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  // Ripristina la conversazione salvata sul dispositivo per QUESTO utente (chiave per
  // user id: su un telefono condiviso non si vede la chat di un altro). Il client
  // rimanda la cronologia al server a ogni messaggio, quindi il Coach riprende il filo.
  useEffect(() => {
    if (!userId) return;
    try {
      const saved = localStorage.getItem(chatStorageKey(userId));
      if (saved) {
        const parsed = JSON.parse(saved) as Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
        if (Array.isArray(parsed) && parsed.length > 1) {
          setMessages(parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
        }
      }
    } catch { /* storage non disponibile — ignora */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Aggiorna il welcome col nome quando arriva (solo se conversazione non iniziata)
  useEffect(() => {
    if (userName) {
      setMessages(prev => (prev.length <= 1 ? [makeWelcome(userName)] : prev));
    }
  }, [userName]);

  // Salva la conversazione sul dispositivo a ogni messaggio (oltre il solo welcome),
  // tenendo il welcome + gli ultimi CHAT_KEEP messaggi
  useEffect(() => {
    if (messages.length <= 1 || !userId) return;
    try {
      const tail = messages.length > CHAT_KEEP + 1 ? [messages[0], ...messages.slice(-CHAT_KEEP)] : messages;
      localStorage.setItem(
        chatStorageKey(userId),
        JSON.stringify(tail.map(m => ({ ...m, timestamp: m.timestamp.toISOString() })))
      );
    } catch { /* storage pieno/non disponibile — ignora */ }
  }, [messages, userId]);

  // Scroll automatico solo del container messaggi interno (non della pagina intera).
  // scrollIntoView() in passato scrollava anche la <main> -> al mount la pagina chat
  // sembrava gia scrollata verso il basso. Ora scrolliamo solo il parent diretto
  // dell'anchor, e solo dal secondo render in poi (skip mount iniziale).
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    const scroller = messagesEndRef.current?.parentElement;
    if (scroller) {
      scroller.scrollTop = scroller.scrollHeight;
    }
  }, [messages]);

  const sendMessageText = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Escludi il messaggio di benvenuto hardcoded (primo messaggio assistant)
      // per non confondere Claude con un messaggio che non ha generato lui
      const chatHistory = [...messages, userMessage]
        .filter((m, i) => !(i === 0 && m.role === 'assistant'))
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      const response = await authFetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatHistory,
          userId,
        }),
      });

      if (response.status === 429) {
        setMessages(prev => [...prev, {
          role: 'assistant' as const,
          content: 'Abbiamo parlato tanto in quest\'ultima ora ⚽ Prenditi una pausa — ne riparliamo tra poco.',
          timestamp: new Date(),
        }]);
        return;
      }
      if (response.status === 403) {
        const err = await response.json().catch(() => ({}));
        if (err?.error === 'payment_required') {
          setPaywalled(true);
          setFreeRemaining(0);
          setMessages(prev => [...prev, {
            role: 'assistant' as const,
            content: typeof err.message === 'string' && err.message
              ? err.message
              : 'Il Coach si attiva con Season 1. Nella settimana gratis hai il percorso, il check-in e la tua Carta: al Gate della settimana 1 ci ritroviamo qui, e da lì ti scrivo io.',
            timestamp: new Date(),
          }]);
          return;
        }
      }
      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      if (typeof data.freeRemaining === 'number') setFreeRemaining(data.freeRemaining);

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || data.message || 'Errore nella risposta',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Mi dispiace, si è verificato un errore. Riprova tra poco.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessageText(input);
  };

  useImperativeHandle(ref, () => ({
    sendSuggestion: (text: string) => sendMessageText(text),
  }));

  // Bordi arrotondati solo in alto: in basso la card si attacca alla tab bar.
  const freeBadge = !paywalled && freeRemaining !== null
    ? `${freeRemaining} ${freeRemaining === 1 ? 'messaggio' : 'messaggi'} gratis`
    : null;

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-surface rounded-t-sheet sm:rounded-sheet shadow-e2 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-forest-500 to-forest-600 text-white px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center font-bold text-title-3" aria-hidden="true">
            C
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-semibold text-title-3">Coach AI</h3>
            <p className="text-body-sm text-forest-50 opacity-90">Il tuo allenatore mentale</p>
          </div>
          {freeBadge && <Badge tone="neutral" className="shrink-0">{freeBadge}</Badge>}
        </div>
        {/* Trasparenza AI (art. 50 AI Act): sempre visibile, non dismissibile */}
        <p className="text-caption text-forest-50/80 mt-2.5 leading-snug">
          Stai parlando con un Coach AI, non con una persona. L&apos;AI può fare errori.
        </p>
      </div>

      {/* Messaggi */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 bg-app">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-[18px] ${
                message.role === 'user'
                  ? 'bg-forest-500 text-white rounded-br-md'
                  : 'bg-surface-2 text-app rounded-bl-md'
              }`}
            >
              <p className="text-body whitespace-pre-wrap leading-relaxed">{message.content}</p>
            </div>
          </div>
        ))}

        {/* Suggerimenti: solo prima del primo messaggio, massimo 3, corti */}
        {suggestions && suggestions.length > 0 && messages.length <= 1 && !isLoading && (
          <div className="flex flex-wrap gap-2 pt-1" aria-label="Suggerimenti per iniziare">
            {suggestions.slice(0, 3).map((s, i) => (
              <Chip key={i} onClick={() => sendMessageText(s)}>
                {s}
              </Chip>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface-2 rounded-[18px] rounded-bl-md px-4 py-3.5 flex items-center gap-1.5" role="status" aria-label="Il Coach sta scrivendo">
              {[0, 150, 300].map((delay) => (
                <span key={delay} className="w-2 h-2 rounded-full bg-forest-400 animate-bounce motion-reduce:animate-none" style={{ animationDelay: `${delay}ms` }} aria-hidden />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
        {paywalled && (
          <div className="mx-1 mt-1 bg-forest-500/10 border border-forest-500/35 rounded-card p-4 text-center">
            <p className="text-body text-app font-semibold mb-3">Il Coach continua con Season 1</p>
            <Button variant="primary" href="/pricing">Sblocca Season 1</Button>
          </div>
        )}
      </div>

      {/* Input: Enter invia (submit del form) */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-divider bg-surface">
        <div className="flex gap-2 items-center">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi al Coach…"
            disabled={isLoading}
            aria-label="Messaggio per il Coach"
            className="flex-1"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Invia messaggio"
            className="w-12 h-12 flex items-center justify-center bg-forest-500 text-white rounded-btn hover:bg-forest-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-e1 shrink-0"
          >
            <Send className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}
