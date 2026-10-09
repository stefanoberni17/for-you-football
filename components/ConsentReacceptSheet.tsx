'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/authFetch';
import { Button, Sheet } from '@/components/ui';

/**
 * Ri-accettazione di privacy e termini (9/10/2026). Alla prima apertura di una pagina dell'app,
 * se la versione corrente (lib/constants.ts) è diversa dall'ultima accettata, un foglio senza X
 * chiede di accettare i documenti cambiati; "Accetto e continuo" scrive le righe in consent_events
 * (POST /api/consent/reaccept) e il foglio sparisce. Una verifica per utente per sessione;
 * fail-open: se la API non risponde non si blocca nessuno (la prova del consenso resta quella
 * che c'è). Niente foglio sulle pagine pubbliche, dove i documenti si leggono.
 */
const PAGINE_LIBERE = ['/login', '/register', '/reset-password', '/privacy', '/termini', '/genitori', '/riattiva'];
let verificatoPer = ''; // user id già controllato in questa sessione della pagina

type Doc = 'privacy' | 'terms';
const ETICHETTE: Record<Doc, { nome: string; href: string }> = {
  privacy: { nome: 'Privacy Policy', href: '/privacy' },
  terms: { nome: 'Termini di servizio', href: '/termini' },
};

export default function ConsentReacceptSheet() {
  const pathname = usePathname();
  const [daAccettare, setDaAccettare] = useState<Doc[]>([]);
  const [spuntati, setSpuntati] = useState<Record<Doc, boolean>>({ privacy: false, terms: false });
  const [saving, setSaving] = useState(false);
  const [errore, setErrore] = useState('');

  useEffect(() => {
    if (!pathname || PAGINE_LIBERE.some((p) => pathname === p || pathname.startsWith(p + '/'))) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || verificatoPer === session.user.id) return;
        const res = await authFetch('/api/consent/reaccept');
        if (!res.ok) return; // fail-open
        const r = await res.json();
        if (cancelled) return;
        verificatoPer = session.user.id;
        const docs: Doc[] = [];
        if (r.privacy) docs.push('privacy');
        if (r.terms) docs.push('terms');
        setDaAccettare(docs);
      } catch { /* fail-open */ }
    })();
    return () => { cancelled = true; };
  }, [pathname]);

  if (!daAccettare.length) return null;
  const tuttiSpuntati = daAccettare.every((d) => spuntati[d]);

  const accetta = async () => {
    if (!tuttiSpuntati || saving) return;
    setSaving(true);
    setErrore('');
    try {
      const res = await authFetch('/api/consent/reaccept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: daAccettare }),
      });
      if (!res.ok) throw new Error('save failed');
      setDaAccettare([]);
    } catch {
      setErrore('Non sono riuscito a salvare. Riprova tra un attimo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open
      eyebrow="Un attimo"
      title={daAccettare.length === 2 ? 'Abbiamo aggiornato privacy e termini' : `Abbiamo aggiornato ${daAccettare.length === 1 && daAccettare[0] === 'privacy' ? 'la Privacy Policy' : 'i Termini di servizio'}`}
      subtitle="Per continuare a usare l'app serve il tuo ok sul testo nuovo. Due minuti, poi non te lo chiediamo più."
      footer={(
        <>
          {errore && <p className="text-body-sm text-danger">{errore}</p>}
          <Button variant="primary" size="lg" onClick={accetta} disabled={!tuttiSpuntati} loading={saving}>
            Accetto e continuo
          </Button>
        </>
      )}
    >
      <div className="space-y-3 pt-1">
        {daAccettare.map((d) => (
          <label key={d} htmlFor={`reaccept-${d}`} className="flex items-start gap-3 min-h-[44px] py-2 text-body-sm text-app leading-relaxed cursor-pointer">
            <input type="checkbox" id={`reaccept-${d}`} checked={spuntati[d]}
              onChange={(e) => setSpuntati((s) => ({ ...s, [d]: e.target.checked }))}
              className="mt-0.5 w-5 h-5 shrink-0 accent-forest-500" />
            <span>
              Ho letto e accetto {d === 'privacy' ? 'la' : 'i'}{' '}
              <a href={ETICHETTE[d].href} target="_blank" rel="noopener noreferrer" className="text-forest-400 hover:text-forest-300 underline">
                {ETICHETTE[d].nome}
              </a>
              {d === 'privacy' ? ' (cosa salviamo, perché, per quanto, chi la vede)' : ' (cos’è l’app, cosa non è, prezzi, recesso, responsabilità)'}.
            </span>
          </label>
        ))}
        <p className="text-caption text-faint">Il link si apre in una nuova scheda: leggi, torna qui e spunta.</p>
      </div>
    </Sheet>
  );
}
