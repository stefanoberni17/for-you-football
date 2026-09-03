'use client';

/**
 * Istruzioni di un test della batteria (v1 e v2) a 4 campi:
 * cosa misura · cosa serve · come si fa (passi numerati) · cosa inserire.
 * I campi opzionali mancanti non lasciano buchi.
 */
export interface TestIstruzioniData {
  protocollo: string;
  serve?: string | null;
  passi?: string[] | null;
  inserisci?: string | null;
}

export default function TestIstruzioni({ t, nota }: { t: TestIstruzioniData; nota?: string | null }) {
  return (
    <div className="mb-3">
      <p className="text-xs text-app leading-relaxed">{t.protocollo}</p>
      {t.serve && (
        <p className="text-[11px] text-muted leading-relaxed mt-1.5"><span className="font-semibold text-faint">Serve:</span> {t.serve}</p>
      )}
      {t.passi && t.passi.length > 0 && (
        <ol className="mt-2 space-y-1">
          {t.passi.map((p, i) => (
            <li key={i} className="flex gap-2 text-[11px] text-muted leading-relaxed">
              <span className="w-4 h-4 rounded-full bg-surface-2 border border-divider text-[10px] font-bold text-app flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
      )}
      {t.inserisci && (
        <p className="text-[11px] text-forest-300 leading-relaxed mt-2 bg-forest-500/10 border border-forest-500/20 rounded-lg px-2.5 py-1.5">
          <span className="font-semibold">Inserisci:</span> {t.inserisci}
        </p>
      )}
      {nota && <p className="text-[11px] text-amber-300/90 mt-1.5">{nota}</p>}
    </div>
  );
}
