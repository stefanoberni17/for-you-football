'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ChatBot, { ChatBotRef } from '@/components/ChatBot';

const suggestions = [
  "Come gestisco l'ansia prima di una partita?",
  "Aiutami a riflettere sulla settimana corrente",
  "Ho sbagliato un gol importante, come faccio a resettarmi?",
  "Sto perdendo fiducia in me stesso, cosa faccio?",
];

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [promptSent, setPromptSent] = useState(false);
  const chatBotRef = useRef<ChatBotRef>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  // Auto-send prompt from query param (e.g. /chat?prompt=...)
  useEffect(() => {
    if (loading || promptSent) return;
    const prompt = searchParams.get('prompt');
    if (prompt && chatBotRef.current) {
      setTimeout(() => {
        chatBotRef.current?.sendSuggestion(prompt);
        setPromptSent(true);
      }, 500);
    }
  }, [loading, promptSent, searchParams]);

  if (loading) {
    return (
      <main className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-ball-bounce">⚽</div>
          <p className="text-xl text-muted">Caricamento...</p>
        </div>
      </main>
    );
  }

  // fixed inset-0 standard (no h-dvh-screen): il 100dvh su PWA iOS
  // standalone aveva un side-effect che faceva sembrare la BottomTabBar
  // "rialzata" rispetto alle altre pagine. Inset-0 e' identico al viewport
  // del browser e mantiene la tab bar in posizione assoluta corretta.
  return (
    <div
      className="fixed inset-0 flex flex-col bg-app"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        // Tab bar full-width h-16 (4rem) + safe-area-inset-bottom interno
        paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex-1 flex flex-col min-h-0 max-w-4xl w-full mx-auto px-0 sm:px-4 pt-0 pb-0">
        <ChatBot ref={chatBotRef} suggestions={suggestions} />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-app flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-ball-bounce">⚽</div>
          <p className="text-xl text-muted">Caricamento...</p>
        </div>
      </main>
    }>
      <ChatContent />
    </Suspense>
  );
}
