import { useState, useRef, useEffect, useMemo } from 'react';
import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { Button } from '@codegouvfr/react-dsfr/Button';

interface MultiSelectProps {
  label: string;
  hint?: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  singleSelect?: boolean;
}

export function MultiSelect({
  label,
  hint,
  options,
  selected: selectedProp,
  onChange,
  placeholder = 'Sélectionner',
  searchPlaceholder = 'Rechercher...',
  singleSelect = false,
}: MultiSelectProps) {
  // Fallback pour gérer les anciennes valeurs du store
  const selected = selectedProp || [];
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrer les options selon la recherche
  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const searchLower = search.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(searchLower));
  }, [options, search]);

  const handleToggle = (option: string) => {
    if (singleSelect) {
      // Mode sélection unique
      if (selected.includes(option)) {
        onChange([]);
      } else {
        onChange([option]);
      }
      setIsOpen(false);
      setSearch('');
    } else {
      // Mode multi-sélection
      if (selected.includes(option)) {
        onChange(selected.filter((s) => s !== option));
      } else {
        onChange([...selected, option]);
      }
    }
  };

  const handleClearAll = () => {
    onChange([]);
    setSearch('');
  };

  const displayText =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? selected[0]
        : `${selected.length} sélectionnés`;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Label et hint */}
      <label className="fr-label">
        {label}
        {hint && <span className="fr-hint-text">{hint}</span>}
      </label>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fr-select"
        style={{
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          backgroundColor: 'var(--background-contrast-grey)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: selected.length === 0 ? 'var(--text-mention-grey)' : 'inherit',
        }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {displayText}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'var(--background-default-grey)',
            border: '1px solid var(--border-default-grey)',
            borderRadius: '0 0 4px 4px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
            maxHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Clear all button */}
          {selected.length > 0 && (
            <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-default-grey)' }}>
              <Button
                priority="tertiary no outline"
                size="small"
                iconId="fr-icon-close-circle-line"
                onClick={handleClearAll}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {singleSelect ? 'Effacer la sélection' : 'Tout désélectionner'}
              </Button>
            </div>
          )}

          {/* Search input */}
          {options.length > 6 && (
            <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-default-grey)' }}>
              <input
                type="search"
                className="fr-input"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                style={{ marginBottom: 0 }}
              />
            </div>
          )}

          {/* Options list */}
          <div
            style={{
              overflowY: 'auto',
              padding: '0.5rem 0.75rem',
              flex: 1,
            }}
            role="listbox"
            aria-multiselectable={!singleSelect}
          >
            {filteredOptions.length === 0 ? (
              <p style={{ padding: '0.5rem', color: 'var(--text-mention-grey)', margin: 0 }}>
                Aucun résultat
              </p>
            ) : (
              <Checkbox
                options={filteredOptions.map((option) => ({
                  label: option,
                  nativeInputProps: {
                    checked: selected.includes(option),
                    onChange: () => handleToggle(option),
                  },
                }))}
                small
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
