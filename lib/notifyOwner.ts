/**
 * Avviso a Ste su Telegram (SAFETY_ALERT_TELEGRAM_CHAT_ID + TELEGRAM_BOT_TOKEN): usato dal Campo
 * per la pausa dolore (messa e tolta dal ragazzo da solo). Non lancia mai: se manca la config, logga.
 */
export async function notificaSte(text: string): Promise<void> {
  const chatId = process.env.SAFETY_ALERT_TELEGRAM_CHAT_ID;
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!chatId || !token) { console.warn('notificaSte: SAFETY_ALERT_TELEGRAM_CHAT_ID o TELEGRAM_BOT_TOKEN mancanti —', text.slice(0, 120)); return; }
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
  } catch (err) {
    console.error('notificaSte error:', (err as Error)?.message);
  }
}
