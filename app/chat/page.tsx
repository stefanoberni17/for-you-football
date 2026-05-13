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

  // Flow normale del body (no piu fixed inset-0): le pagine fixed full-screen
  // su PWA iOS standalone facevano collassare il viewport sotto la safe-area-bottom,
  // creando un gap visibile (~1cm) tra BottomTabBar e bordo schermo.
  // Ora la chat usa h-screen + flex-col come "<main>" normale, identica
  // struttura alle altre pagine -> la tab bar resta attaccata al bordo.
  return (
    <main
      className="flex flex-col bg-app pt-safe px-0 sm:px-4 pb-tabbar overflow-hidden"
      style={{ height: '100vh' }}
    >
      <div className="flex-1 flex flex-col min-h-0 max-w-4xl w-full mx-auto">
        <ChatBot ref={chatBotRef} suggestions={suggestions} />
      </div>
    </main>
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
