import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthUser } from '@/lib/auth';
import { hasTrainingAccess } from '@/lib/trainingAccess';
import { loadSquadraCompleta, todayRome } from '@/lib/trainingPlanner';
import { SQUADRA_QUALITA, type SquadraQualitaId } from '@/lib/trainingSquadra';
import { ZONE_FASCIA } from '@/lib/trainingFascia';
import { previstoPer, resocontoAncoraAperto, STANCHEZZE, TESTE, valutaResoconto, RESOCONTO_FINESTRA_GIORNI, type Resoconto, type VotiResoconto } from '@/lib/trainingResoconto';
import { logEvent } from '@/lib/events';
import { loadResoconti } from '@/lib/trainingResocontoServer';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder'
);

/** GET ?da=YYYY-MM-DD → i propri resoconti (hub e storico). */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });
    const da = request.nextUrl.searchParams.get('da');
    const giorni = da && /^\d{4}-\d{2}-\d{2}$/.test(da) ? Math.max(1, Math.min(365, Math.round((Date.now() - new Date(`${da}T00:00:00Z`).getTime()) / 86400000))) : RESOCONTO_FINESTRA_GIORNI;
    return NextResponse.json({ resoconti: await loadResoconti(userId, giorni) });
  } catch (err) {
    console.error('training/resoconto GET error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

const voto = (x: unknown): number | undefined => { const n = Number(x); return Number.isInteger(n) && n >= 1 && n <= 10 ? n : undefined; };
const puliscoVoti = (v: unknown): VotiResoconto | null => {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, Record<string, unknown> | undefined>;
  const t = o.tecnica ?? {}, f = o.fisico ?? {};
  const tecnica = { generale: voto(t.generale), passaggio: voto(t.passaggio), stop: voto(t.stop), lancio: voto(t.lancio), tiro: voto(t.tiro) };
  const fisico = { generale: voto(f.generale), velocita: voto(f.velocita), forza: voto(f.forza), resistenza: voto(f.resistenza) };
  const out: VotiResoconto = {};
  if (Object.values(tecnica).some((x) => x !== undefined)) out.tecnica = tecnica;
  if (Object.values(fisico).some((x) => x !== undefined)) out.fisico = fisico;
  return Object.keys(out).length ? out : null;
};

/**
 * POST { data, tipo, rpe, durata_min?, qualita?, stanchezza?, fastidio_zona?, testa?, testa_nota?, voti? } → upsert su
 * (utente, data, tipo). Si accetta il giorno stesso o il giorno dopo (Ste, 18/10). `rpe_previsto` lo mette il server
 * (abitudine del setup, 9 per la partita) così il confronto non dipende da cambi successivi del setup.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUser(request);
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!(await hasTrainingAccess(userId))) return NextResponse.json({ error: 'no_access' }, { status: 403 });
    const body = await request.json().catch(() => ({}));
    const oggi = todayRome();
    const data = typeof body?.data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.data) ? body.data : oggi;
    if (!resocontoAncoraAperto(data, oggi)) return NextResponse.json({ error: 'Il resoconto si dà il giorno stesso o quello dopo' }, { status: 400 });
    const tipo = body?.tipo === 'partita' ? 'partita' : body?.tipo === 'squadra' ? 'squadra' : null;
    if (!tipo) return NextResponse.json({ error: 'tipo non valido' }, { status: 400 });
    const rpe = Number(body?.rpe);
    if (!Number.isInteger(rpe) || rpe < 1 || rpe > 10) return NextResponse.json({ error: 'fatica non valida (1-10)' }, { status: 400 });
    const durataRaw = body?.durata_min == null || body?.durata_min === '' ? null : Number(body.durata_min);
    if (durataRaw !== null && (!Number.isFinite(durataRaw) || durataRaw < 0 || durataRaw > (tipo === 'partita' ? 120 : 180))) return NextResponse.json({ error: 'minuti non validi' }, { status: 400 });
    const durata_min = durataRaw === null ? null : Math.round(durataRaw);
    const qualita = tipo === 'squadra' && Array.isArray(body?.qualita)
      ? [...new Set((body.qualita as unknown[]).filter((q): q is SquadraQualitaId => SQUADRA_QUALITA.some((x) => x.id === q)))] : null;
    const stanchezza = tipo === 'partita' && (STANCHEZZE as readonly string[]).includes(String(body?.stanchezza)) ? String(body.stanchezza) : null;
    const fastidio_zona = typeof body?.fastidio_zona === 'string' && (ZONE_FASCIA as readonly string[]).includes(body.fastidio_zona) ? body.fastidio_zona : null;
    const testa = (TESTE as readonly string[]).includes(String(body?.testa)) ? String(body.testa) : null;
    const testa_nota = typeof body?.testa_nota === 'string' ? body.testa_nota.replace(/<\/?[a-z_]+>/gi, '').trim().slice(0, 200) || null : null;
    const voti = puliscoVoti(body?.voti);
    const { squadra } = await loadSquadraCompleta(userId);
    const rpe_previsto = previstoPer(tipo, data, squadra);
    const riga = { user_id: userId, data, tipo, rpe, durata_min, qualita, stanchezza, fastidio_zona, testa, testa_nota, voti, rpe_previsto };
    const { error } = await supabaseAdmin.from('training_resoconti').upsert(riga, { onConflict: 'user_id,data,tipo' });
    if (error) {
      // Migration 031 non applicata: niente resoconto, ma l'app non si rompe
      if (/relation .* does not exist|schema cache/i.test(error.message)) return NextResponse.json({ success: false, skipped: 'migration_031' });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const v = valutaResoconto({ ...riga, qualita: qualita ?? undefined } as Resoconto, rpe_previsto);
    logEvent(userId, 'training_resoconto_salvato', { tipo, livello: v.livello, delta: v.delta, pocoGiocato: v.pocoGiocato, faticaAlta: v.faticaAlta });
    return NextResponse.json({ success: true, valutazione: v });
  } catch (err) {
    console.error('training/resoconto POST error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
