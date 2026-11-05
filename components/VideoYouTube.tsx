'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui';
import { consentiYoutube, youtubeConsentito } from '@/lib/youtube';

/**
 * Un video di YouTube che si carica solo dopo il sì del ragazzo (5/11). Prima del sì al posto del video c'è una
 * riga che dice cosa succede aprendolo: nessuna richiesta parte verso Google. `src` è l'embed già con i parametri.
 */
export default function VideoYouTube({ src, title }: { src: string; title: string }) {
  const [ok, setOk] = useState(() => youtubeConsentito());
  if (ok) {
    return <iframe src={src} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={title} />;
  }
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4 text-center bg-surface-2">
      <p className="text-body-sm text-muted max-w-xs">
        Il video è su YouTube. Aprendolo, YouTube (Google) riceve il tuo indirizzo internet. Ti chiediamo il permesso una volta sola.{' '}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">Privacy</a>
      </p>
      <Button variant="secondary" size="sm" icon={<Play size={16} />} onClick={() => { consentiYoutube(); setOk(true); }}>
        Apri il video
      </Button>
    </div>
  );
}
