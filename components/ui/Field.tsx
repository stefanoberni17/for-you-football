'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

/**
 * Campi di testo unici (Ste, 16/9: "vedi anche i box dove bisogna scrivere dentro").
 * - Altezza minima 48 px, testo 16 px su mobile (globals.css evita lo zoom di iOS), padding generoso.
 * - Fondo più scuro della card, bordo che diventa verde al focus con un anello morbido.
 * - Field = label + helper/errore + contatore, sempre con lo stesso ritmo.
 */
const BASE = 'w-full rounded-btn bg-app-bg/80 border text-body text-app placeholder:text-faint outline-none transition-[border-color,box-shadow] duration-150 focus:border-forest-400 focus:ring-4 focus:ring-forest-500/20 disabled:opacity-60';
const OK = 'border-divider';
const BAD = 'border-danger/60 focus:border-danger focus:ring-danger/20';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className = '', invalid, ...props }, ref) {
    return <input ref={ref} className={`${BASE} ${invalid ? BAD : OK} min-h-[48px] px-4 py-3 ${className}`} aria-invalid={invalid || undefined} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className = '', invalid, rows = 4, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={`${BASE} ${invalid ? BAD : OK} px-4 py-3 leading-relaxed resize-none ${className}`} aria-invalid={invalid || undefined} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  function Select({ className = '', invalid, children, ...props }, ref) {
    return (
      <select ref={ref} className={`${BASE} ${invalid ? BAD : OK} min-h-[48px] px-4 py-3 appearance-none bg-[url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca7a0' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>")] bg-no-repeat bg-[right_1rem_center] pr-10 ${className}`} aria-invalid={invalid || undefined} {...props}>
        {children}
      </select>
    );
  },
);

export function Field({
  label, htmlFor, helper, error, counter, optional, children, className = '',
}: { label: ReactNode; htmlFor?: string; helper?: ReactNode; error?: ReactNode; counter?: { value: number; max: number }; optional?: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-label font-semibold text-app">
          {label}{optional && <span className="text-faint font-normal"> · facoltativo</span>}
        </label>
        {counter && (
          <span className={`text-caption tabular-nums ${counter.value > counter.max ? 'text-danger' : 'text-faint'}`} aria-live="polite">
            {counter.value}/{counter.max}
          </span>
        )}
      </div>
      {children}
      {error ? <p className="text-caption text-danger" role="alert">{error}</p> : helper ? <p className="text-caption text-muted">{helper}</p> : null}
    </div>
  );
}
