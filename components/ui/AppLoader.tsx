/**
 * Schermata di caricamento unica dell'app.
 *
 * Anello che gira col verde del brand e un alone che "respira" (il ritmo del
 * Reset), monogramma FYF al centro. Niente emoji: il brief del brand non le
 * vuole come decorazione. Appare con una dissolvenza dopo 150 ms, così i
 * passaggi veloci tra le pagine non sfarfallano; la scritta sotto compare solo
 * se l'attesa si allunga (dopo ~0,9 s), così non è mai la prima cosa che vedi.
 */
export default function AppLoader({ label, fullscreen = true }: { label?: string; fullscreen?: boolean }) {
  const inner = (
    <div className="app-loader flex flex-col items-center gap-5" role="status" aria-live="polite" data-loader>
      <div className="relative w-[76px] h-[76px]">
        <span className="app-loader-glow" aria-hidden />
        <svg viewBox="0 0 76 76" className="w-full h-full" aria-hidden>
          <defs>
            <linearGradient id="fyfLoaderArc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#4fd394" />
              <stop offset="1" stopColor="#2dd17a" />
            </linearGradient>
          </defs>
          <circle cx="38" cy="38" r="33" fill="none" stroke="var(--color-divider)" strokeWidth="3" />
          <circle
            cx="38" cy="38" r="33" fill="none"
            stroke="url(#fyfLoaderArc)" strokeWidth="3" strokeLinecap="round"
            strokeDasharray="62 146"
            className="app-loader-arc"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-label tracking-[0.22em] text-forest-300 pl-[0.22em]">
          FYF
        </span>
      </div>
      {label && <p className="app-loader-label text-body-sm text-muted">{label}</p>}
      <span className="sr-only">Caricamento</span>
    </div>
  );
  if (!fullscreen) return <div className="py-10 flex justify-center">{inner}</div>;
  return <main className="min-h-screen bg-app flex items-center justify-center">{inner}</main>;
}
