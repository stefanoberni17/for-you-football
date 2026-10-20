/**
 * Codici invito beta (env BETA_INVITE_CODES, CSV, case-insensitive, whitespace trimmato). Server-only.
 * Esempio env: BETA_INVITE_CODES=BETA2_2026,PARTNER_FYF → "BETA2_2026", "beta2_2026", "  Beta2_2026  " valgono tutti.
 */
export function isValidBetaCode(input: unknown): boolean {
  if (!input || typeof input !== 'string') return false;
  const allowed = (process.env.BETA_INVITE_CODES || '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
  if (allowed.length === 0) return false;
  return allowed.includes(input.trim().toUpperCase());
}
