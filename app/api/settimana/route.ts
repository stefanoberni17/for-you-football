import { NextRequest, NextResponse } from 'next/server';
import { queryDatabase, mapSettimana, mapGiorno } from '@/lib/notion';

export const dynamic = 'force-dynamic';

/**
 * GET /api/settimana?week=N
 * Restituisce i dettagli di una settimana + la lista dei 7 giorni.
 *
 * Response: { settimana: Settimana, giorni: Giorno[] }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekNumber = parseInt(searchParams.get('week') || '0');

    if (!weekNumber) {
      return NextResponse.json({ error: 'Parametro week mancante' }, { status: 400 });
    }

    // Fetch settimana e giorni in parallelo
    const [weekPages, dayPages] = await Promise.all([
      queryDatabase(process.env.NOTION_DATABASE_SETTIMANE!, {
        filter: {
          property: 'Numero Settimana',
          number: { equals: weekNumber },
        },
      }),
      queryDatabase(process.env.NOTION_DATABASE_GIORNI!, {
        filter: {
          property: 'Numero Settimana',
          number: { equals: weekNumber },
        },
        sorts: [{ property: 'Numero Giorno', direction: 'ascending' }],
      }),
    ]);

    if (!weekPages.length) {
      return NextResponse.json({ error: `Settimana ${weekNumber} non trovata` }, { status: 404 });
    }

    const settimana = mapSettimana(weekPages[0]);
    const giorni = dayPages.map(mapGiorno);

    return NextResponse.json({ settimana, giorni });
  } catch (error: any) {
    console.error('❌ GET /api/settimana:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
