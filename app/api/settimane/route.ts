import { NextResponse } from 'next/server';
import { queryDatabase, mapSettimana } from '@/lib/notion';

export const dynamic = 'force-dynamic';

/**
 * GET /api/settimane
 * Restituisce la lista di tutte le settimane Football dal DB Notion Settimane,
 * ordinate per numero settimana crescente.
 *
 * Response: { settimane: Settimana[] }
 */
export async function GET() {
  try {
    const pages = await queryDatabase(process.env.NOTION_DATABASE_SETTIMANE!, {
      sorts: [{ property: 'Numero Settimana', direction: 'ascending' }],
    });

    const settimane = pages.map(mapSettimana);

    return NextResponse.json({ settimane });
  } catch (error: any) {
    console.error('❌ GET /api/settimane:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
