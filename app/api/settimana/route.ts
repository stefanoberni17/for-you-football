import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('id');

    if (!pageId) {
      return NextResponse.json({ error: 'Page ID mancante' }, { status: 400 });
    }

    console.log('🔍 Recupero pagina:', pageId);

    // Fetch contenuto pagina
    const pageResponse = await fetch('https://api.notion.com/v1/pages/' + pageId, {
      headers: {
        'Authorization': 'Bearer ' + process.env.NOTION_TOKEN,
        'Notion-Version': '2022-06-28',
      },
    });

    const pageData = await pageResponse.json();

    // Fetch TUTTI i blocchi della pagina (con pagination)
    const allBlocks: any[] = [];
    let hasMore = true;
    let startCursor: string | null = null;

    while (hasMore) {
      let url = 'https://api.notion.com/v1/blocks/' + pageId + '/children';
      if (startCursor) {
        url = url + '?start_cursor=' + startCursor;
      }

      const blocksResponse = await fetch(url, {
        headers: {
          'Authorization': 'Bearer ' + process.env.NOTION_TOKEN,
          'Notion-Version': '2022-06-28',
        },
      });

      const blocksData = await blocksResponse.json();
      
      allBlocks.push(...blocksData.results);
      hasMore = blocksData.has_more || false;
      startCursor = blocksData.next_cursor || null;

      console.log('✅ Caricati', allBlocks.length, 'blocchi...');
    }

    console.log('✅ Totale blocchi caricati:', allBlocks.length);

    return NextResponse.json({
      page: pageData,
      blocks: allBlocks,
    });
  } catch (error: any) {
    console.error('❌ Errore:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}