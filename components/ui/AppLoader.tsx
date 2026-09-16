/** Schermata di caricamento unica (prima: ⚽ + "Caricamento…" duplicati in 6 file). */
export default function AppLoader({ label, fullscreen = true }: { label?: string; fullscreen?: boolean }) {
  const inner = (
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
      <span className="text-4xl animate-ball-bounce" aria-hidden>⚽</span>
      {label && <p className="text-body-sm text-muted">{label}</p>}
      <span className="sr-only">Caricamento</span>
    </div>
  );
  if (!fullscreen) return <div className="py-10 flex justify-center">{inner}</div>;
  return <main className="min-h-screen bg-app flex items-center justify-center">{inner}</main>;
}
