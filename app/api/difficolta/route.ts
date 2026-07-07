import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { requirePaidAccess } from '@/lib/serverAccess';
import { fetchDifficoltaCards, type DifficoltaCard } from '@/lib/notion';
import { SOS_CARDS } from '@/lib/sosCards';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/** Fallback statico (lib/sosCards.ts) mappato al modello a layer — 1 scheda = 1 layer "Adesso". */
function fallbackCards(): DifficoltaCard[] {
  return SOS_CARDS.map((c, i) => ({
    id: c.id,
    difficolta: c.titolo,
    emoji: c.emoji,
    sottotitolo: c.sottotitolo,
    ordine: i + 1,
    layers: [
      {
        sbloccoSettimana: 1,
        strumento: 'Il Reset',
        titoloLayer: 'Adesso',
        apertura: c.apertura,
        pratica: c.pratica,
        chiusura: c.chiusura,
        coachPrompt: c.coachPrompt,
      },
    ],
  }));
}

/**
 * GET /api/difficolta
 * Schede "Come affrontare le difficoltà" con lock per layer in base alla settimana
 * dell'utente. I layer bloccati tornano senza corpo (solo titolo/strumento/sblocco) → teaser.
 */
export async function GET(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!(await requirePaidAccess(userId))) {
    return NextResponse.json({ error: 'payment_required' }, { status: 403 });
  }

  let currentWeek = 1;
  try {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('current_week')
      .eq('user_id', userId)
      .single();
    currentWeek = data?.current_week || 1;
  } catch {
    /* profilo non leggibile — default settimana 1 */
  }

  let cards: DifficoltaCard[] = [];
  try {
    cards = await fetchDifficoltaCards();
  } catch (err) {
    console.error('[difficolta] fetch Notion fallito:', err);
  }
  if (!cards.length) cards = fallbackCards();

  const result = cards.map((c) => {
    const layers = c.layers.map((l) => {
      const unlocked = currentWeek >= l.sbloccoSettimana;
      if (unlocked) return { ...l, unlocked: true };
      // teaser: niente corpo, solo cosa sblocchi e quando
      return {
        sbloccoSettimana: l.sbloccoSettimana,
        strumento: l.strumento,
        titoloLayer: l.titoloLayer,
        unlocked: false,
        apertura: '',
        pratica: [] as string[],
        chiusura: '',
        coachPrompt: '',
      };
    });
    return {
      id: c.id,
      difficolta: c.difficolta,
      emoji: c.emoji,
      sottotitolo: c.sottotitolo,
      unlockedCount: layers.filter((l) => l.unlocked).length,
      totalCount: layers.length,
      layers,
    };
  });

  return NextResponse.json({ cards: result });
}
