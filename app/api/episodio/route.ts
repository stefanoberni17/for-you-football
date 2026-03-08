import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { createClient } from '@supabase/supabase-js';
import { getEpisodePageId, getWeekFromEpisode, isEpisodeInMVP } from '@/lib/episodeMapping';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ✅ Ultimo episodio di ogni COPPIA di settimane
const WEEK_PAIR_LAST_EPISODES: Record<number, number> = {
  1: 5,   // Week 1-2 finisce con episodio 5 → passa a Week 3
  3: 12,  // Week 3-4 finisce con episodio 12 → passa a Week 5
  5: 19,  // Week 5-6 finisce con episodio 19 → fine MVP
};

async function fetchAllBlocks(pageId: string): Promise<any[]> {
  const blocks: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response: any = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
      ...(cursor ? { start_cursor: cursor } : {}),
    });
    blocks.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return blocks;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const episodeNumber = parseInt(searchParams.get('number') || '1');
  const userId = searchParams.get('userId');
  const extended = searchParams.get('extended') === 'true';

  try {
    if (!isEpisodeInMVP(episodeNumber)) {
      return NextResponse.json({ error: 'Episodio fuori scope MVP', locked: true }, { status: 400 });
    }

    if (userId && episodeNumber > 1) {
      const { data: prev } = await supabaseAdmin
        .from('user_episode_progress')
        .select('completed')
        .eq('user_id', userId)
        .eq('episode_number', episodeNumber - 1)
        .single();

      if (!prev?.completed) {
        return NextResponse.json({
          locked: true,
          message: `Completa l'episodio ${episodeNumber - 1} per sbloccare questo`,
          episodeNumber,
        });
      }
    }

    let isCompleted = false;
    if (userId) {
      const { data: curr } = await supabaseAdmin
        .from('user_episode_progress')
        .select('completed')
        .eq('user_id', userId)
        .eq('episode_number', episodeNumber)
        .single();
      isCompleted = curr?.completed || false;
    }

    const pageId = getEpisodePageId(episodeNumber);
    if (!pageId) {
      return NextResponse.json({ error: 'ID Notion non configurato', episodeNumber }, { status: 404 });
    }

    const page = await notion.pages.retrieve({ page_id: pageId });
    const properties = (page as any).properties;

    let blocks: any[] = [];
    if (extended) {
      blocks = await fetchAllBlocks(pageId);
    }

    return NextResponse.json({
      episode: {
        number: episodeNumber,
        title: properties['Titolo episodio']?.rich_text?.[0]?.plain_text || `Episodio ${episodeNumber}`,
        miniLesson: properties['Mini-lezione breve']?.rich_text?.[0]?.plain_text || '',
        reflectionQuestion: properties['Domanda riflessiva']?.rich_text?.[0]?.plain_text || '',
        mainTheme: properties['Tema principale']?.rich_text?.[0]?.plain_text || '',
        concepts: properties['Concetti collegati']?.rich_text?.[0]?.plain_text || '',
        weekNumber: getWeekFromEpisode(episodeNumber),
        locked: false,
        completed: isCompleted,
      },
      blocks,
      locked: false,
    });

  } catch (error: any) {
    console.error('Errore API episodio:', error);
    return NextResponse.json({ error: 'Errore nel caricamento', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { episodeNumber, userId } = await request.json();

    if (!userId || !episodeNumber) {
      return NextResponse.json({ error: 'userId e episodeNumber richiesti' }, { status: 400 });
    }

    // Salva completamento episodio
    const { data, error } = await supabaseAdmin
      .from('user_episode_progress')
      .upsert({
        user_id: userId,
        episode_number: episodeNumber,
        week_number: getWeekFromEpisode(episodeNumber),
        completed: true,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,episode_number' })
      .select()
      .single();

    if (error) throw error;

    // ✅ Auto-update current_week se necessario
    // Controlla se episodio completato è l'ultimo di una coppia di settimane
    for (const [weekPair, lastEp] of Object.entries(WEEK_PAIR_LAST_EPISODES)) {
      if (episodeNumber === lastEp) {
        // Verifica current_week dell'utente
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('current_week')
          .eq('user_id', userId)
          .single();

        const currentWeek = profile?.current_week || 1;
        const completedWeekPair = parseInt(weekPair);

        // Aggiorna solo se l'utente è in quella week-pair o precedente
        if (currentWeek <= completedWeekPair + 1) { // +1 perché le week sono a coppie (1-2, 3-4, 5-6)
          const nextWeek = completedWeekPair + 2; // Salta di 2 (1→3, 3→5, 5→7)
          
          await supabaseAdmin
            .from('profiles')
            .update({ current_week: nextWeek })
            .eq('user_id', userId);

          console.log(`✅ Week auto-updated: ${currentWeek} → ${nextWeek} (completato episodio ${episodeNumber})`);
        }
        break;
      }
    }

    return NextResponse.json({
      success: true,
      progress: data,
      nextEpisode: episodeNumber + 1,
      unlockedNext: episodeNumber < 19,
    });

  } catch (error: any) {
    return NextResponse.json({ error: 'Errore nel salvataggio', details: error.message }, { status: 500 });
  }
}