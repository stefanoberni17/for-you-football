'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ChatBot, { ChatBotRef } from '@/components/ChatBot';
import { AppLoader } from '@/components/ui';

// Massimo 3, corti (≤ 6 parole): si leggono in un colpo d'occhio (review 16/9)
const suggestions = [
  'Ansia prima della partita',
  'Ho sbagliato, come riparto?',
  'Sto perdendo fiducia',
];

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [promptSent, setPromptSent] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const chatBotRef = useRef<ChatBotRef>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', session.user.id)
        .single();
      if (profileData?.name) setUserName(profileData.name);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  // Auto-send prompt from query param (e.g. /chat?prompt=...)
  useEffect(() => {
    if (loading || promptSent) return;
    const prompt = searchParams.get('prompt');
    if (prompt && chatBotRef.current) {
      // Pulisci subito l'URL: refresh o back non devono rispedire il prompt
      router.replace('/chat');
      setTimeout(() => {
        chatBotRef.current?.sendSuggestion(prompt);
        setPromptSent(true);
      }, 500);
    }
  }, [loading, promptSent, searchParams, router]);

  if (loading) return <AppLoader />;

  // Flow normale del body (no piu fixed inset-0): le pagine fixed full-screen
  // su PWA iOS standalone facevano collassare il viewport sotto la safe-area-bottom,
  // creando un gap visibile (~1cm) tra BottomTabBar e bordo schermo.
  // Ora la chat usa h-screen + flex-col come "<main>" normale, identica
  // struttura alle altre pagine -> la tab bar resta attaccata al bordo.
  return (
    <main className="h-dvh-screen flex flex-col bg-app pt-safe px-0 sm:px-4 pb-tabbar overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 max-w-4xl w-full mx-auto">
        <ChatBot ref={chatBotRef} suggestions={suggestions} userName={userName} />
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<AppLoader />}>
      <ChatContent />
    </Suspense>
  );
}
