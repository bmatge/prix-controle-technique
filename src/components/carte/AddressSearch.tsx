import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@codegouvfr/react-dsfr/Input';
import { useMapStore } from '@/stores/mapStore';

interface BanFeature {
  geometry: {
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    label: string;
    context: string;
    type: string;
    name: string;
    postcode: string;
    city: string;
  };
}

interface BanResponse {
  features: BanFeature[];
}

export function AddressSearch() {
  const flyTo = useMapStore((s) => s.flyTo);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<BanFeature[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const searchAddress = useCallback(async (q: string) => {
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5`
      );
      const data: BanResponse = await response.json();
      setSuggestions(data.features);
      setIsOpen(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Erreur API BAN:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      // Debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        searchAddress(value);
      }, 300);
    },
    [searchAddress]
  );

  const handleSelect = useCallback(
    (feature: BanFeature) => {
      const [lng, lat] = feature.geometry.coordinates;
      setQuery(feature.properties.label);
      setSuggestions([]);
      setIsOpen(false);
      flyTo(lat, lng, 13);
    },
    [flyTo]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            handleSelect(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    },
    [isOpen, suggestions, selectedIndex, handleSelect]
  );

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <Input
        label="Rechercher une adresse"
        hintText="Entrez une adresse pour centrer la carte"
        nativeInputProps={{
          type: 'search',
          value: query,
          onChange: handleInputChange,
          onKeyDown: handleKeyDown,
          onFocus: () => suggestions.length > 0 && setIsOpen(true),
          placeholder: 'Ex: 20 avenue de Ségur, Paris',
          autoComplete: 'off',
        }}
      />

      {isOpen && suggestions.length > 0 && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'var(--background-default-grey)',
            border: '1px solid var(--border-default-grey)',
            borderRadius: '0 0 4px 4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            maxHeight: '250px',
            overflowY: 'auto',
          }}
        >
          {suggestions.map((feature, index) => (
            <li
              key={`${feature.properties.label}-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => handleSelect(feature)}
              onMouseEnter={() => setSelectedIndex(index)}
              style={{
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                backgroundColor:
                  index === selectedIndex
                    ? 'var(--background-alt-grey)'
                    : 'transparent',
                borderBottom:
                  index < suggestions.length - 1
                    ? '1px solid var(--border-default-grey)'
                    : 'none',
              }}
            >
              <div style={{ fontWeight: 500 }}>{feature.properties.name}</div>
              <div
                style={{
                  fontSize: '0.85em',
                  color: 'var(--text-mention-grey)',
                }}
              >
                {feature.properties.postcode} {feature.properties.city}
              </div>
            </li>
          ))}
        </ul>
      )}

      {isLoading && (
        <div
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-mention-grey)',
            fontSize: '0.85em',
          }}
        >
          ...
        </div>
      )}
    </div>
  );
}
