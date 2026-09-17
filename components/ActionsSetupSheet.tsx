'use client';

import { useMemo, useState } from 'react';
import {
  ACTIONS_CATALOG,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  PRINCIPLE_LABELS,
  allowedPrinciplesForWeek,
  type ActionCategory,
  type ActionPrinciple,
  type CatalogAction,
} from '@/lib/actionsCatalog';
import { ChevronDown, X, Plus, Sparkles } from 'lucide-react';
import SaveErrorBanner from './SaveErrorBanner';
import { Button, Field, Input, Select, Sheet } from '@/components/ui';

const MAX_ACTIONS = 5;
const CUSTOM_MAX_LEN = 120;

export type SelectedAction = {
  /** identifier locale: catalog_id se da catalogo, custom-N se custom */
  key: string;
  text: string;
  source: 'catalog' | 'custom';
  catalog_id: string | null;
  category: ActionCategory;
  principle: ActionPrinciple;
};

interface ActionsSetupSheetProps {
  /** Settimana corrente dell'utente — usata per filtrare suggerimenti */
  currentWeek: number;
  /** Set iniziale di azioni (per pre-popolare modifica) */
  initialActions?: SelectedAction[];
  /** Callback al salvataggio. Riceve le azioni selezionate (1-5). */
  onSave: (actions: SelectedAction[]) => Promise<void> | void;
  onClose: () => void;
}

export default function ActionsSetupSheet({
  currentWeek,
  initialActions = [],
  onSave,
  onClose,
}: ActionsSetupSheetProps) {
  const [selected, setSelected] = useState<SelectedAction[]>(initialActions);
  const [customText, setCustomText] = useState('');
  const [customCategory, setCustomCategory] = useState<ActionCategory>('mentale');
  const [showCustomForm, setShowCustomForm] = useState(false);
  // Solo la prima categoria aperta di default (review 16/9: meno muro di testo)
  const [openCategories, setOpenCategories] = useState<Set<ActionCategory>>(
    new Set(CATEGORY_ORDER.slice(0, 1))
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const allowed = useMemo(() => allowedPrinciplesForWeek(currentWeek), [currentWeek]);

  const weekFilteredCatalog = useMemo(
    () => ACTIONS_CATALOG.filter(a => allowed.includes(a.principle)),
    [allowed]
  );
  const hiddenCount = ACTIONS_CATALOG.length - weekFilteredCatalog.length;
  const hasFilter = hiddenCount > 0;

  // Solo le azioni dei principi già costruiti (REGOLA ANTICIPAZIONI): il toggle "Tutte"
  // mostrava le azioni delle settimane future — tolto il 14/9 (review 13/9).
  const visibleCatalog = weekFilteredCatalog;

  const groupedCatalog = useMemo(() => {
    const map: Record<ActionCategory, CatalogAction[]> = {
      'pre-allenamento': [],
      'in-campo': [],
      'post-errore': [],
      'recupero': [],
      'mentale': [],
      'vita': [],
    };
    for (const a of visibleCatalog) map[a.category].push(a);
    return map;
  }, [visibleCatalog]);

  const isSelected = (key: string) => selected.some(s => s.key === key);

  const toggleCatalog = (a: CatalogAction) => {
    if (isSelected(a.id)) {
      setSelected(prev => prev.filter(s => s.key !== a.id));
      return;
    }
    if (selected.length >= MAX_ACTIONS) return;
    setSelected(prev => [
      ...prev,
      {
        key: a.id,
        text: a.text,
        source: 'catalog',
        catalog_id: a.id,
        category: a.category,
        principle: a.principle,
      },
    ]);
  };

  const removeSelected = (key: string) => {
    setSelected(prev => prev.filter(s => s.key !== key));
  };

  const addCustom = () => {
    const text = customText.trim();
    if (!text || selected.length >= MAX_ACTIONS) return;
    const key = `custom-${Date.now()}`;
    setSelected(prev => [
      ...prev,
      {
        key,
        text,
        source: 'custom',
        catalog_id: null,
        category: customCategory,
        principle: null,
      },
    ]);
    setCustomText('');
    setShowCustomForm(false);
  };

  const toggleCategory = (cat: ActionCategory) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const canSave = selected.length >= 1 && selected.length <= MAX_ACTIONS;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      await onSave(selected);
    } catch {
      // Il salvataggio è fallito: il foglio resta aperto e lo dice
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {selected.map(s => (
            <span
              key={s.key}
              className="inline-flex items-center gap-1 h-11 pl-3 pr-1 text-body-sm bg-forest-500/20 text-forest-300 rounded-full max-w-[240px]"
            >
              <span className="truncate">{s.text}</span>
              <button
                type="button"
                onClick={() => removeSelected(s.key)}
                aria-label={`Rimuovi: ${s.text}`}
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-forest-500/30 hover:text-forest-200"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
      {saveError && (
        <SaveErrorBanner
          message="Le azioni non sono state salvate. Riprova."
          onRetry={handleSave}
        />
      )}
      <p className="text-body font-bold tabular-nums">
        <span className={canSave ? 'text-forest-300' : 'text-faint'}>{selected.length}</span>
        <span className="text-faint font-normal">/{MAX_ACTIONS} selezionate</span>
      </p>
      <Button
        variant="primary"
        fullWidth
        onClick={handleSave}
        disabled={!canSave}
        loading={saving}
      >
        {saving ? 'Salvataggio…' : 'Salva le azioni'}
      </Button>
    </>
  );

  return (
    <div>
      <Sheet
        open
        onClose={onClose}
        title="Le tue 5 azioni"
        subtitle="Scegli max 5 azioni. Restano le stesse per la settimana — le spunti ogni giorno, ripartono la notte."
        footer={footer}
      >
        {/* Nota sulle azioni in arrivo (REGOLA ANTICIPAZIONI: le azioni dei principi futuri non si vedono) */}
        <p className="text-caption text-forest-300 font-medium flex items-center gap-1.5 pb-3 border-b border-divider mb-3">
          <Sparkles size={14} aria-hidden="true" />
          {hasFilter
            ? `Settimana ${currentWeek}: ${weekFilteredCatalog.length} azioni. ${hiddenCount === 1 ? 'Un\'altra arriva' : `Altre ${hiddenCount} arrivano`} con le prossime settimane.`
            : `Tutte le ${ACTIONS_CATALOG.length} azioni sono disponibili dalla settimana ${currentWeek}`}
        </p>

        <div className="space-y-3">
          {CATEGORY_ORDER.map(cat => {
            const items = groupedCatalog[cat];
            if (items.length === 0) return null;
            const open = openCategories.has(cat);
            return (
              <div key={cat} className="border border-divider rounded-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  aria-expanded={open}
                  className="w-full min-h-[48px] flex items-center justify-between px-4 py-3 bg-surface-2 hover:bg-surface-3 transition-colors"
                >
                  <span className="text-body font-semibold text-app">
                    {CATEGORY_LABELS[cat]} <span className="text-faint font-normal">({items.length})</span>
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-faint transition-transform ${open ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                {open && (
                  <div className="divide-y divide-divider">
                    {items.map(a => {
                      const checked = isSelected(a.id);
                      const disabled = !checked && selected.length >= MAX_ACTIONS;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => toggleCatalog(a)}
                          disabled={disabled}
                          role="checkbox"
                          aria-checked={checked}
                          className={`w-full text-left px-4 py-3 min-h-[56px] flex items-start gap-3 transition-colors ${
                            checked
                              ? 'bg-forest-500/10'
                              : disabled
                              ? 'opacity-40 cursor-not-allowed'
                              : 'hover:bg-surface-2'
                          }`}
                        >
                          <span
                            className={`mt-0.5 w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              checked
                                ? 'bg-forest-500 border-forest-500'
                                : 'border-divider bg-surface-2'
                            }`}
                            aria-hidden="true"
                          >
                            {checked && (
                              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </span>
                          <span className="flex-1 min-w-0">
                            <p className={`text-body leading-snug ${checked ? 'text-app font-medium' : 'text-app'}`}>
                              {a.text}
                            </p>
                            {a.principle && (
                              <span className="inline-block mt-1 text-overline uppercase tracking-wider font-semibold text-forest-300 bg-forest-500/20 px-1.5 py-0.5 rounded">
                                {PRINCIPLE_LABELS[a.principle]}
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Custom action */}
          <div className="border border-dashed border-divider rounded-card p-4">
            {!showCustomForm ? (
              <Button
                variant="ghost"
                fullWidth
                onClick={() => setShowCustomForm(true)}
                disabled={selected.length >= MAX_ACTIONS}
                icon={<Plus size={18} aria-hidden="true" />}
              >
                Aggiungi un&apos;azione tua
              </Button>
            ) : (
              <div className="space-y-3">
                <Field
                  label="La tua azione"
                  htmlFor="custom-action-text"
                  counter={{ value: customText.length, max: CUSTOM_MAX_LEN }}
                >
                  <Input
                    id="custom-action-text"
                    type="text"
                    value={customText}
                    onChange={e => setCustomText(e.target.value.slice(0, CUSTOM_MAX_LEN))}
                    maxLength={CUSTOM_MAX_LEN}
                    placeholder="Es. Faccio 50 passaggi al muro ogni giorno"
                    autoFocus
                  />
                </Field>
                <Field label="Categoria" htmlFor="custom-action-category">
                  <Select
                    id="custom-action-category"
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value as ActionCategory)}
                  >
                    {CATEGORY_ORDER.map(c => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                    ))}
                  </Select>
                </Field>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={addCustom}
                    disabled={!customText.trim() || selected.length >= MAX_ACTIONS}
                  >
                    Aggiungi
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => { setShowCustomForm(false); setCustomText(''); }}
                  >
                    Annulla
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Sheet>
    </div>
  );
}
