/**
 * Email agli utenti via Resend (1/11: il promemoria prima della fine della prova). Server-only, fail-soft:
 * senza RESEND_API_KEY non manda niente e ritorna false. Testo semplice, niente tracciamento.
 */
export async function sendEmail(i: { to: string; subject: string; text: string }): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'For You Football <info@foryoufootball.it>',
        reply_to: 'info@foryoufootball.it',
        to: i.to,
        subject: i.subject,
        text: i.text,
      }),
    });
    if (!res.ok) console.error('sendEmail:', res.status, await res.text().catch(() => ''));
    return res.ok;
  } catch (e) {
    console.error('sendEmail:', (e as Error).message);
    return false;
  }
}
