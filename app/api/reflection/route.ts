import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Recupera riflessione esistente
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const episodeNumber = parseInt(searchParams.get('episodeNumber') || '0');

    if (!userId || !episodeNumber) {
      return NextResponse.json(
        { error: 'userId e episodeNumber richiesti' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('episode_reflections')
      .select('*')
      .eq('user_id', userId)
      .eq('episode_number', episodeNumber)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    return NextResponse.json({ reflection: data });
  } catch (error: any) {
    console.error('Errore GET reflection:', error);
    return NextResponse.json(
      { error: 'Errore nel caricamento', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Salva o aggiorna riflessione
export async function POST(request: NextRequest) {
  try {
    const { userId, episodeNumber, reflectionText, reflectionQuestion } = await request.json();

    if (!userId || !episodeNumber || !reflectionText) {
      return NextResponse.json(
        { error: 'userId, episodeNumber e reflectionText richiesti' },
        { status: 400 }
      );
    }

    // Max 500 caratteri
    if (reflectionText.length > 500) {
      return NextResponse.json(
        { error: 'Riflessione troppo lunga (max 500 caratteri)' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
  .from('episode_reflections')
  .upsert(
    {
      user_id: userId,
      episode_number: episodeNumber,
      reflection_text: reflectionText,
      reflection_question: reflectionQuestion || null,
      updated_at: new Date().toISOString(),
    },
        { onConflict: 'user_id,episode_number' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      reflection: data,
    });
  } catch (error: any) {
    console.error('Errore POST reflection:', error);
    return NextResponse.json(
      { error: 'Errore nel salvataggio', details: error.message },
      { status: 500 }
    );
  }
}
