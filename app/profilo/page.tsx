'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ProfiloPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [eta, setEta] = useState('');
  const [currentWeek, setCurrentWeek] = useState('1');
  const [obiettivi, setObiettivi] = useState('');
  const [passioni, setPassioni] = useState('');
  const [sogno, setSogno] = useState('');
  const [situazioneAttuale, setSituazioneAttuale] = useState('');
  const [telegramId, setTelegramId] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      setUserId(session.user.id);
      setEmail(session.user.email || '');

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profileData) {
        setNome(profileData.name || '');
        setEta(profileData.age?.toString() || '');
        setCurrentWeek(profileData.current_week?.toString() || '1');
        setObiettivi(profileData.goals || '');
        setPassioni(profileData.passions || '');
        setSogno(profileData.dream || '');
        setSituazioneAttuale(profileData.current_situation || '');
        setTelegramId(profileData.telegram_id || '');
      }

      setLoading(false);
    };

    loadProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: nome.trim(),
          age: eta ? parseInt(eta) : null,
          goals: obiettivi.trim() || null,
          passions: passioni.trim() || null,
          dream: sogno.trim() || null,
          current_situation: situazioneAttuale.trim() || null,
          telegram_id: telegramId.trim() || null,
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      router.push('/login');
    } else {
      setError('Errore durante il logout');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🍥</div>
          <p className="text-xl text-gray-600">Caricamento...</p>
        </div>
      </main>
    );
  }

  const getWeekName = (week: string) => {
    const weekNames: Record<string, string> = {
      '1': 'Week 1 - La ferita del rifiuto',
      '2': 'Week 2 - La ferita del rifiuto',
      '3': 'Week 3 - Presenza e ascolto',
      '4': 'Week 4 - Presenza e ascolto',
      '5': 'Week 5 - Valore e appartenenza',
      '6': 'Week 6 - Valore e appartenenza',
    };
    return weekNames[week] || `Week ${week}`;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-orange-100 py-8 px-4 pb-24">
      {/* Header */}
      <div className="max-w-3xl mx-auto mb-6">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-md relative">
            <span className="text-white font-bold text-xl">
              {nome ? nome.charAt(0).toUpperCase() : '🍥'}
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 text-lg">🍥</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Il tuo Profilo
            </h1>
            <p className="text-sm text-gray-600">{email}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSave} className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
              ✅ Profilo aggiornato con successo!
            </div>
          )}

          {/* Info Personali */}
          <div className="space-y-6 pb-6 border-b mb-6">
            <h3 className="font-semibold text-gray-700 text-lg">Informazioni personali</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Come ti chiami?"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Età
              </label>
              <input
                type="number"
                value={eta}
                onChange={(e) => setEta(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Es. 25"
                min="13"
                max="120"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Settimana corrente
              </label>
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="font-bold text-gray-800">{getWeekName(currentWeek)}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      La settimana si aggiorna automaticamente quando completi tutti gli episodi
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Collega Telegram */}
            <div className="space-y-4 pb-6 border-b mb-6">
              <h3 className="font-semibold text-gray-700 text-lg">🤖 Collega Telegram</h3>
              
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-2">Come trovare il tuo ID Telegram:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>Apri Telegram e cerca <strong>@getidsbot</strong></li>
                  <li>Scrivili qualsiasi messaggio</li>
                  <li>Copia il numero che ti risponde e incollalo qui sotto</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Il tuo ID Telegram
                </label>
                <input
                  type="text"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  autoComplete="off"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Es. 766672351"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Una volta salvato potrai parlare con il Maestro AI su <strong>@Sensei_naruto_bot</strong>
                </p>
              </div>
            </div>

          {/* Il tuo percorso */}
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-700 text-lg">Il tuo percorso</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Obiettivi
              </label>
              <textarea
                value={obiettivi}
                onChange={(e) => setObiettivi(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Cosa vuoi ottenere da questo percorso?"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passioni e interessi
              </label>
              <input
                type="text"
                value={passioni}
                onChange={(e) => setPassioni(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Cosa ti appassiona?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Il tuo sogno
              </label>
              <input
                type="text"
                value={sogno}
                onChange={(e) => setSogno(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Qual è il tuo sogno più grande?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Situazione attuale
              </label>
              <textarea
                value={situazioneAttuale}
                onChange={(e) => setSituazioneAttuale(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Dove ti trovi ora nella vita?"
                rows={3}
              />
            </div>
          </div>

          {/* Bottone salva + feedback inline */}
          <div className="mt-8 space-y-3">
            <button
              type="submit"
              disabled={saving}
              className={`w-full font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white ${
                success
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {saving ? 'Salvataggio…' : success ? '✅ Salvato!' : '💾 Salva Modifiche'}
            </button>

            {/* Feedback testuale inline (scompare dopo 3 sec insieme al colore del bottone) */}
            {success && (
              <p className="text-center text-sm text-green-600 font-medium animate-pulse">
                Profilo aggiornato con successo
              </p>
            )}
          </div>

          {/* Logout */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-red-100 hover:border-red-200"
            >
              <span>🚪</span>
              <span>Esci dall'account</span>
            </button>
          </div>

          {/* Link privacy */}
          <div className="mt-4 text-center">
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-gray-500 underline"
            >
              🔒 Privacy Policy
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}