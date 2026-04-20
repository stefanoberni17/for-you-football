'use client';

import { PROTOCOL_MAX_CHARS } from '@/lib/constants';

export type ProtocolValue = {
  physical_signal: string;
  recurring_thought: string;
  mantra: string;
};

type Props = {
  value: ProtocolValue;
  onChange: (next: ProtocolValue) => void;
  disabled?: boolean;
  compact?: boolean;
};

const FIELDS: {
  key: keyof ProtocolValue;
  label: string;
  hint: string;
  placeholder: string;
}[] = [
  {
    key: 'physical_signal',
    label: 'Il mio segnale fisico',
    hint: "L'hai trovato in W3 — dove arriva la pressione per prima?",
    placeholder: 'Es. Stomaco che si chiude, spalle rigide…',
  },
  {
    key: 'recurring_thought',
    label: 'Il mio pensiero ricorrente',
    hint: "L'hai mappato in W2 — Passato, Futuro o Giudizio?",
    placeholder: 'Es. Giudizio — "stanno pensando che non sono all\'altezza"',
  },
  {
    key: 'mantra',
    label: 'Il mio mantra',
    hint: "L'hai scelto in W1 — è ancora quello giusto?",
    placeholder: 'Es. Qui e ora.',
  },
];

export default function ProtocolEditor({ value, onChange, disabled, compact }: Props) {
  const set = (key: keyof ProtocolValue, v: string) => onChange({ ...value, [key]: v });

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {FIELDS.map(({ key, label, hint, placeholder }) => {
        const v = value[key] || '';
        return (
          <div key={key}>
            <label className="block text-sm font-semibold text-gray-800">{label}</label>
            <p className="text-xs text-gray-400 mt-0.5 mb-1.5">{hint}</p>
            <textarea
              value={v}
              onChange={(e) => set(key, e.target.value)}
              disabled={disabled}
              rows={compact ? 2 : 3}
              maxLength={PROTOCOL_MAX_CHARS}
              placeholder={placeholder}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-forest-400 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-400 transition-all"
            />
            {!disabled && v.length > 0 && (
              <p className="text-xs text-gray-400 mt-1 text-right">
                {v.length}/{PROTOCOL_MAX_CHARS}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function isProtocolComplete(value: ProtocolValue): boolean {
  return (
    value.physical_signal.trim().length > 0 &&
    value.recurring_thought.trim().length > 0 &&
    value.mantra.trim().length > 0
  );
}
