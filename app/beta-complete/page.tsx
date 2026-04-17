'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BETA_MAX_WEEK } from '@/lib/constants';

export default function BetaCompletePage() {
  const router = useRouter();
  const [name, setName] = useState('Campione');
  const [feedback, setFeedback] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, current_week')
        .eq('user_id', session.user.id)
        .single();

      if (profile?.name) setName(profile.name);

      // Se non ha davvero completato la beta, torna in home
      if (!profile || profile.current_week <= BETA_MAX_WEEK) {
        router.push('/');
      }
    };
    load();
  }, [router]);

  const sendFeedback = async () => {
    if (!feedback.trim()) return;
    setSending(true);
    try {
      // Salva feedback in una table dedicata non c'è: usiamo il bottone per aprire mail client.
      const subject = encodeURIComponent('Feedback Beta For You Football');
      const body = encodeURIComponent(feedback);
      window.location.href = `mailto:foryou.innerpath@gmail.com?subject=${subject}&body=${body}`;
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-forest-50 via-amber-50 to-forest-100 py-10 px-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Ce l&apos;hai fatta, {name}.
          </h1>
          <p className="text-gray-600 leading-relaxed">
            Hai completato tutte le {BETA_MAX_WEEK} settimane della Beta.
            Hai costruito il primo blocco: Presenza, Osservazione, Ascolto, Protocollo Pressione.
          </p>
          <p className="text-gray-600 leading-relaxed mt-3">
            Le prossime settimane — Accettazione, Lasciare Andare, Perdono — stanno arrivando.
            Ti scriveremo non appena saranno disponibili.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Com&apos;è andata?</h2>
          <p className="text-sm text-gray-500 mb-3">
            Il tuo feedback ci aiuta a costruire il resto del percorso. Due righe vanno benissimo.
          </p>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Cosa ha funzionato? Cosa cambieresti?"
            rows={5}
            className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-forest-400"
          />
          <button
            onClick={sendFeedback}
            disabled={sending || !feedback.trim() || sent}
            className="mt-3 w-full bg-forest-500 hover:bg-forest-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-all"
          >
            {sent ? '✓ Grazie' : sending ? 'Invio…' : 'Invia feedback'}
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6 space-y-3">
          <button
            onClick={() => router.push('/chat')}
            className="w-full bg-forest-50 hover:bg-forest-100 text-forest-700 font-bold py-3 rounded-xl transition-all"
          >
            💬 Parla con il Coach
          </button>
          <button
            onClick={() => router.push('/statistiche')}
            className="w-full bg-white border border-forest-300 text-forest-700 font-bold py-3 rounded-xl hover:bg-forest-50 transition-all"
          >
            📊 Rivedi le tue statistiche
          </button>
          <button
            onClick={() => router.push('/settimane')}
            className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-all"
          >
            🗺️ Torna al percorso
          </button>
        </div>
      </div>
    </main>
  );
}
