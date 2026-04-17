'use client';

import { useState, useRef, useEffect, useImperativeHandle } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatBotRef {
  sendSuggestion: (text: string) => void;
}

export default function ChatBot({ ref, suggestions }: { ref?: React.Ref<ChatBotRef>; suggestions?: string[] }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Ciao! Sono qui per accompagnarti nel tuo percorso di allenamento mentale con For You Football. Come posso aiutarti oggi?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        console.log('✅ ChatBot - userId impostato:', user.id);
      } else {
        console.warn('⚠️ ChatBot - Nessun userId trovato');
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      console.log('📤 Invio messaggio con userId:', userId);

      // Escludi il messaggio di benvenuto hardcoded (primo messaggio assistant)
      // per non confondere Claude con un messaggio che non ha generato lui
      const chatHistory = [...messages, userMessage]
        .filter((m, i) => !(i === 0 && m.role === 'assistant'))
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatHistory,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      console.log('📥 Risposta API:', data);

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

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white rounded-3xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-forest-500 to-forest-600 text-white p-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center font-bold text-lg" aria-hidden="true">
            C
          </div>
          <div>
            <h3 className="font-semibold text-base">Coach AI</h3>
            <p className="text-xs text-forest-50 opacity-90">Il tuo allenatore mentale</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-gray-50">
        {/* Suggestion pills — visible only before user sends first message */}
        {suggestions && suggestions.length > 0 && messages.length <= 1 && (
          <div className="pb-2">
            <p className="text-xs text-gray-400 mb-2 font-medium">💡 Suggerimenti per iniziare:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessageText(s)}
                  className="text-left text-xs bg-forest-50 text-forest-700 border border-forest-200 rounded-full px-3 py-1.5 hover:bg-forest-100 hover:border-forest-300 transition-colors active:scale-95"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-2.5 ${
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {message.role === 'assistant' && (
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-forest-500 text-white text-xs font-bold"
                aria-hidden="true"
              >
                C
              </div>
            )}
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                message.role === 'user'
                  ? 'bg-forest-500 text-white rounded-br-md'
                  : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              <p
                className={`text-[10px] mt-1 ${
                  message.role === 'user' ? 'text-forest-50 opacity-80' : 'text-gray-400'
                }`}
              >
                {message.timestamp.toLocaleTimeString('it-IT', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2.5">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-forest-500 text-white flex items-center justify-center text-xs font-bold" aria-hidden="true">
              C
            </div>
            <div className="bg-white rounded-2xl rounded-bl-md shadow-sm border border-gray-100 px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-forest-500" aria-label="Il Coach sta scrivendo" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 bg-white">
        <div className="flex gap-2 items-end">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi al Coach…"
            disabled={isLoading}
            aria-label="Messaggio per il Coach"
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-transparent disabled:bg-gray-100 text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Invia messaggio"
            className="w-12 h-12 flex items-center justify-center bg-forest-500 text-white rounded-2xl hover:bg-forest-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
