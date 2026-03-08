'use client';

import { useRouter } from 'next/navigation';

interface EpisodeCardProps {
  episodeNumber: number;
  title: string;
  isCompleted: boolean;
  isLocked: boolean;
  weekNumber: number;
  userId: string;
  onComplete: () => void;
}

export default function EpisodeCard({ 
  episodeNumber, 
  title, 
  isCompleted, 
  isLocked,
  weekNumber,
  userId,
  onComplete
}: EpisodeCardProps) {
  const router = useRouter();

  const handleClick = () => {
    if (isLocked) return;
    // TODO: Navigare a pagina episodio
    router.push(`/episodio/${episodeNumber}?userId=${userId}`);
  };

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Non triggerare il click della card

    if (isCompleted || isLocked) return;

    try {
      const response = await fetch('/api/episodio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeNumber,
          userId,
        }),
      });

      if (response.ok) {
        onComplete(); // Callback per refresh
      }
    } catch (error) {
      console.error('Errore completamento episodio:', error);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        bg-white rounded-lg shadow p-4 transition-all
        ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:scale-102'}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-600">
          Episodio {episodeNumber}
        </span>
        <span className="text-2xl">
          {isLocked ? '🔒' : isCompleted ? '✅' : '📺'}
        </span>
      </div>
      
      <h3 className={`font-bold text-sm mb-3 ${
        isLocked ? 'text-gray-400' : 'text-gray-800'
      }`}>
        {title}
      </h3>
      
      {isLocked && (
        <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          🔒 Completa episodio {episodeNumber - 1} per sbloccare
        </p>
      )}

      {isCompleted && (
        <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded text-center">
          ✅ Completato
        </div>
      )}
    </div>
  );
}
