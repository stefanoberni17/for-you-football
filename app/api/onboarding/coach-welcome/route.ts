import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { anthropic, supabaseAdmin } from '@/lib/coach-ai';

export const runtime = 'nodejs';

async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

const FALLBACK_MESSAGE =
  'Ciao! Sono il tuo Coach. Ci sono per aiutarti a giocare con più lucidità — prima di una partita, dopo un errore, o solo per fare il punto. Come stai vivendo il campo in questo momento?';

/**
 * POST /api/onboarding/coach-welcome
 * Genera e salva il primo messaggio proattivo del Coach all'attivazione.
 * - Idempotente: no-op se last_coach_message già valorizzato o se esiste
 *   già un messaggio assistant in telegram_conversations.
 * - Personalizzato sul profilo, rispetta la REGOLA ANTICIPAZIONI (l'utente è
 *   a W1-D0: niente strumenti futuri).
 * - Salva in profiles.last_coach_message; se telegram_id presente, invia anche
 *   su Telegram + salva in telegram_conversations.
 */
export async function POST(request: NextRequest) {
  const userId = await getAuthUser(request);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // ── Carica profilo + check idempotenza ──────────────────────────────────
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('name, sport, role, level, biggest_fear, goals, dream, current_situation, telegram_id, last_coach_message')
    .eq('user_id', userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Già un messaggio Coach salvato → no-op (fast path)
  if (profile.last_coach_message) {
    return NextResponse.json({ ok: true, skipped: 'already_has_message' });
  }

  // Già una conversazione Coach (assistant) → no-op
  const { data: existingAssistant } = await supabaseAdmin
    .from('telegram_conversations')
    .select('id')
    .eq('user_id', userId)
    .eq('role', 'assistant')
    .limit(1);

  if (existingAssistant && existingAssistant.length > 0) {
    return NextResponse.json({ ok: true, skipped: 'already_has_conversation' });
  }

  // ── Lock atomico anti doppio-invio ──────────────────────────────────────
  // Setta un sentinella SOLO se last_coach_message è ancora NULL. L'UPDATE
  // condizionale di Postgres è atomico: se due richieste arrivano in parallelo,
  // una sola "vince" (rows.length === 1), l'altra trova 0 righe e fa no-op —
  // evitando la doppia chiamata a Claude e il doppio messaggio.
  const SENTINEL = '__coach_welcome_pending__';
  const { data: lockRows } = await supabaseAdmin
    .from('profiles')
    .update({ last_coach_message: SENTINEL })
    .eq('user_id', userId)
    .is('last_coach_message', null)
    .select('user_id');

  if (!lockRows || lockRows.length === 0) {
    return NextResponse.json({ ok: true, skipped: 'lock_not_acquired' });
  }

  // ── Genera il messaggio con Claude Haiku ────────────────────────────────
  const firstName = profile.name?.split(' ')[0] || '';
  const sport = profile.sport || 'calcio';

  const systemPrompt = `Sei il Coach AI di For You Football. Scrivi il PRIMO messaggio a un atleta che ha appena completato l'onboarding e sta per iniziare il percorso (Settimana 1, Giorno 0 — non ha ancora fatto nessuna pratica).

CHI SEI: una presenza calda, lucida e discreta. Un compagno di squadra più consapevole, non un guru, non uno psicologo. Parli poco ma con precisione.

OBIETTIVO DEL MESSAGGIO: accogliere l'atleta e aprire un primo scambio. Deve sentire che c'è qualcuno dall'altra parte. Chiudi SEMPRE con UNA domanda aperta semplice su come vive il campo / il suo sport in questo momento.

REGOLE RIGIDE:
- Tono caldo, essenziale, umano. Niente retorica motivazionale, niente "campione", niente esclamazioni esagerate.
- Usa il nome dell'atleta se disponibile.
- 3-5 righe, MAX 400 caratteri. Testo puro, niente markdown, al massimo un emoji.
- REGOLA ANTICIPAZIONI: l'atleta è all'inizio. NON nominare strumenti, tecniche o concetti del percorso (es. Reset, Observer, Body Check, Protocollo Pressione, Accettazione, Lasciare Andare, Perdono). NON descrivere pratiche o esercizi futuri. Parla solo del presente e di come si sente ORA.
- NON menzionare la pratica specifica del Giorno 1 (la scoprirà da solo).
- NON dare istruzioni o compiti.
- Output: SOLO il testo del messaggio, nessun preambolo, nessuna intestazione.`;

  const profileLines = [
    firstName ? `Nome: ${firstName}` : null,
    `Sport: ${sport}`,
    profile.role ? `Ruolo: ${profile.role}` : null,
    profile.level ? `Livello: ${profile.level}` : null,
    profile.biggest_fear ? `Cosa teme di più: ${profile.biggest_fear}` : null,
    profile.goals ? `Obiettivi col percorso: ${profile.goals}` : null,
    profile.dream ? `Sogno: ${profile.dream}` : null,
    profile.current_situation ? `Come sta vivendo questo periodo: ${profile.current_situation}` : null,
  ].filter(Boolean).join('\n');

  const userPrompt = `Profilo dell'atleta:
${profileLines}

Scrivi il primo messaggio di benvenuto del Coach.`;

  let text = FALLBACK_MESSAGE;
  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 250,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });
    const generated = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    if (generated) text = generated;
  } catch (err) {
    console.error('coach-welcome Claude failed, using fallback:', err);
  }

  // ── Salva su profiles + (se Telegram) invia e salva conversazione ───────
  await supabaseAdmin
    .from('profiles')
    .update({ last_coach_message: text })
    .eq('user_id', userId);

  if (profile.telegram_id) {
    await sendTelegramMessage(profile.telegram_id, text);
    await supabaseAdmin
      .from('telegram_conversations')
      .insert({ user_id: userId, role: 'assistant', content: text });
  }

  // Tracking server-side (service role, bypassa RLS)
  await supabaseAdmin
    .from('onboarding_events')
    .insert({ user_id: userId, event: 'coach_welcome_sent', meta: { via_telegram: !!profile.telegram_id } })
    .then(() => {}, () => {});

  return NextResponse.json({ ok: true, message: text });
}
