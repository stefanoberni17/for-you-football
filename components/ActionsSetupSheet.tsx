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
import { ChevronDown, X, Plus, Sparkles, ListFilter } from 'lucide-react';

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
  const [filterMode, setFilterMode] = useState<'week' | 'all'>('week');
  const [selected, setSelected] = useState<SelectedAction[]>(initialActions);
  const [customText, setCustomText] = useState('');
  const [customCategory, setCustomCategory] = useState<ActionCategory>('mentale');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [openCategories, setOpenCategories] = useState<Set<ActionCategory>>(
    new Set(CATEGORY_ORDER)
  );
  const [saving, setSaving] = useState(false);

  const allowed = useMemo(() => allowedPrinciplesForWeek(currentWeek), [currentWeek]);

  const weekFilteredCatalog = useMemo(
    () => ACTIONS_CATALOG.filter(a => allowed.includes(a.principle)),
    [allowed]
  );
  const hiddenCount = ACTIONS_CATALOG.length - weekFilteredCatalog.length;
  const hasFilter = hiddenCount > 0;

  const visibleCatalog = useMemo(() => {
    if (!hasFilter || filterMode === 'all') return ACTIONS_CATALOG;
    return weekFilteredCatalog;
  }, [filterMode, hasFilter, weekFilteredCatalog]);

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
    try {
      await onSave(selected);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-end md:items-center justify-center animate-fadeIn">
      <div className="bg-surface w-full md:max-w-2xl md:rounded-3xl shadow-2xl flex flex-col h-[92vh] md:h-[88vh] overflow-hidden animate-scaleIn">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-divider">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-app">Le tue 5 azioni</h2>
            <p className="text-xs text-muted mt-0.5 leading-relaxed">
              Scegli max 5 azioni. Stesse per la settimana — le ticki ogni giorno, si resettano la notte.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="text-faint hover:text-muted p-1 -mt-1 rounded-full hover:bg-surface-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter toggle — visibile solo se ci sono azioni nascoste per la settimana corrente */}
        {hasFilter ? (
          <div className="px-5 pt-3 pb-3 border-b border-divider">
            <div className="inline-flex bg-surface-2 rounded-full p-0.5 text-xs">
              <button
                onClick={() => setFilterMode('week')}
                aria-pressed={filterMode === 'week'}
                className={`px-3 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1.5 ${
                  filterMode === 'week' ? 'bg-surface text-forest-300 shadow-sm' : 'text-muted'
                }`}
              >
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                Settimana {currentWeek} ({weekFilteredCatalog.length})
              </button>
              <button
                onClick={() => setFilterMode('all')}
                aria-pressed={filterMode === 'all'}
                className={`px-3 py-1.5 rounded-full font-semibold transition-colors flex items-center gap-1.5 ${
                  filterMode === 'all' ? 'bg-surface text-forest-300 shadow-sm' : 'text-muted'
                }`}
              >
                <ListFilter className="w-3 h-3" aria-hidden="true" />
                Tutte ({ACTIONS_CATALOG.length})
              </button>
            </div>
            {filterMode === 'week' && (
              <p className="text-[11px] text-faint mt-2 leading-relaxed">
                {hiddenCount} {hiddenCount === 1 ? 'azione nascosta' : 'azioni nascoste'} — disponibili dalle prossime settimane.
              </p>
            )}
          </div>
        ) : (
          <div className="px-5 pt-2.5 pb-2.5 border-b border-divider">
            <p className="text-[11px] text-forest-300 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              Tutte le {ACTIONS_CATALOG.length} azioni sono disponibili dalla settimana {currentWeek}
            </p>
          </div>
        )}

        {/* Body — scroll */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {CATEGORY_ORDER.map(cat => {
            const items = groupedCatalog[cat];
            if (items.length === 0) return null;
            const open = openCategories.has(cat);
            return (
              <div key={cat} className="border border-divider rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-surface-2 hover:bg-[#293429] transition-colors"
                >
                  <span className="text-sm font-semibold text-app">
                    {CATEGORY_LABELS[cat]} <span className="text-faint font-normal">({items.length})</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-faint transition-transform ${open ? 'rotate-180' : ''}`}
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
                          onClick={() => toggleCatalog(a)}
                          disabled={disabled}
                          aria-pressed={checked}
                          className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                            checked
                              ? 'bg-forest-500/10'
                              : disabled
                              ? 'opacity-40 cursor-not-allowed'
                              : 'hover:bg-surface-2'
                          }`}
                        >
                          <span
                            className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                              checked
                                ? 'bg-forest-500 border-forest-500'
                                : 'border-divider bg-surface-2'
                            }`}
                            aria-hidden="true"
                          >
                            {checked && (
                              <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </span>
                          <span className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${checked ? 'text-app font-medium' : 'text-app'}`}>
                              {a.text}
                            </p>
                            {a.principle && (
                              <span className="inline-block mt-1 text-[10px] font-semibold text-forest-300 bg-forest-500/20 px-1.5 py-0.5 rounded">
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
          <div className="border border-dashed border-divider rounded-xl p-4">
            {!showCustomForm ? (
              <button
                onClick={() => setShowCustomForm(true)}
                disabled={selected.length >= MAX_ACTIONS}
                className="w-full flex items-center justify-center gap-2 text-sm text-forest-300 font-semibold py-2 hover:text-forest-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Aggiungi un'azione tua
              </button>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={customText}
                  onChange={e => setCustomText(e.target.value.slice(0, CUSTOM_MAX_LEN))}
                  placeholder="Es. Faccio 50 passaggi al muro ogni giorno"
                  className="w-full px-3 py-2.5 bg-surface-2 border border-divider rounded-xl text-sm focus:ring-2 focus:ring-forest-400 focus:border-transparent outline-none text-app"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <select
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value as ActionCategory)}
                    className="flex-1 px-3 py-2 bg-surface-2 border border-divider rounded-xl text-xs text-app"
                  >
                    {CATEGORY_ORDER.map(c => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-faint tabular-nums">
                    {customText.length}/{CUSTOM_MAX_LEN}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addCustom}
                    disabled={!customText.trim() || selected.length >= MAX_ACTIONS}
                    className="flex-1 bg-forest-500 hover:bg-forest-600 text-white text-sm font-semibold py-2 rounded-xl transition-colors disabled:opacity-40"
                  >
                    Aggiungi
                  </button>
                  <button
                    onClick={() => { setShowCustomForm(false); setCustomText(''); }}
                    className="text-sm text-muted px-3"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected summary + Save */}
        <div className="border-t border-divider bg-surface px-5 pt-3 pb-3" style={{ paddingBottom: 'max(5.5rem, calc(4.5rem + env(safe-area-inset-bottom)))' }}>
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 max-h-20 overflow-y-auto">
              {selected.map(s => (
                <span
                  key={s.key}
                  className="inline-flex items-center gap-1 text-[11px] bg-forest-500/20 text-forest-300 px-2 py-1 rounded-full max-w-[200px]"
                >
                  <span className="truncate">{s.text}</span>
                  <button
                    onClick={() => removeSelected(s.key)}
                    aria-label="Rimuovi"
                    className="hover:text-forest-200 flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted tabular-nums">
              <span className={`font-bold ${canSave ? 'text-forest-300' : 'text-faint'}`}>
                {selected.length}
              </span>
              <span className="text-faint">/{MAX_ACTIONS} selezionate</span>
            </p>
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className="flex-1 bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white text-sm font-bold py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? 'Salvataggio…' : 'Salva le 5 azioni'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
