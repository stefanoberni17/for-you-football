import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🔍 Inizializzazione Notion Client v5...');
    
    const notion = new Client({
      auth: process.env.NOTION_TOKEN,
    });

    console.log('Token presente:', !!process.env.NOTION_TOKEN);
    console.log('Database ID:', process.env.NOTION_DATABASE_SETTIMANE);

    // Prova con la proprietà 'pages' invece di 'databases'
    const response = await (notion as any).pages.query({
      database_id: process.env.NOTION_DATABASE_SETTIMANE!,
      sorts: [
        {
          property: 'Numero',
          direction: 'ascending',
        },
      ],
    });

    console.log('✅ Risposta ricevuta');

    const settimane = (response.results || []).map((page: any) => ({
      id: page.id,
      numero: page.properties?.Numero?.number || 0,
      settimana: page.properties?.Settimana?.title?.[0]?.plain_text || '',
      titolo: page.properties?.Titolo?.rich_text?.[0]?.plain_text || '',
      tema: page.properties?.['Tema principale']?.rich_text?.[0]?.plain_text || '',
      episodi: page.properties?.Episodi?.rich_text?.[0]?.plain_text || '',
      stato: page.properties?.Stato?.select?.name || 'Da fare',
    }));

    return NextResponse.json({ settimane });
  } catch (error: any) {
    console.error('❌ ERRORE:', error.message);
    
    // Se fallisce, proviamo con fetch diretto alle API Notion
    try {
      console.log('🔄 Tentativo con fetch diretto...');
      
      const fetchResponse = await fetch(`https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_SETTIMANE}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sorts: [
            {
              property: 'Numero',
              direction: 'ascending',
            },
          ],
        }),
      });

      const data = await fetchResponse.json();
      
      if (!fetchResponse.ok) {
        throw new Error(JSON.stringify(data));
      }

      const settimane = (data.results || []).map((page: any) => ({
        id: page.id,
        numero: page.properties?.Numero?.number || 0,
        settimana: page.properties?.Settimana?.title?.[0]?.plain_text || '',
        titolo: page.properties?.Titolo?.rich_text?.[0]?.plain_text || '',
        tema: page.properties?.['Tema principale']?.rich_text?.[0]?.plain_text || '',
        episodi: page.properties?.Episodi?.rich_text?.[0]?.plain_text || '',
        stato: page.properties?.Stato?.select?.name || 'Da fare',
      }));

      console.log('✅ Fetch diretto riuscito!', settimane.length, 'settimane');
      return NextResponse.json({ settimane });
      
    } catch (fetchError: any) {
      console.error('❌ Anche fetch diretto fallito:', fetchError.message);
      return NextResponse.json({ 
        error: 'Entrambi i metodi falliti',
        sdk_error: error.message,
        fetch_error: fetchError.message
      }, { status: 500 });
    }
  }
}