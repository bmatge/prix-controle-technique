import { Input } from '@codegouvfr/react-dsfr/Input';
import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { useFilterStore } from '@/stores/filterStore';
import { useSearchConflict } from '@/hooks/useSearchConflict';
import { useCallback, useState, useEffect } from 'react';

export function SearchBar() {
  const { filters, setFilter } = useFilterStore();
  const [localSearch, setLocalSearch] = useState(filters.search);
  const conflict = useSearchConflict();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilter('search', localSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, setFilter]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
  }, []);

  const handleClearGeoFilters = useCallback(() => {
    setFilter('region', null);
    setFilter('departement', null);
  }, [setFilter]);

  // Construire le message de conflit
  const getConflictMessage = () => {
    const parts: string[] = [];
    if (conflict.conflictingFilters.region) {
      parts.push(`région "${conflict.conflictingFilters.region}"`);
    }
    if (conflict.conflictingFilters.departement) {
      parts.push(`département "${conflict.conflictingFilters.departement}"`);
    }
    const filtersText = parts.join(' et ');
    return `Votre recherche correspond à ${conflict.searchResultsCount} centre${conflict.searchResultsCount > 1 ? 's' : ''}, mais aucun dans ${filtersText}.`;
  };

  return (
    <>
      <Input
        label="Rechercher un centre"
        hintText="Par nom, adresse, commune ou code postal"
        nativeInputProps={{
          type: 'search',
          value: localSearch,
          onChange: handleChange,
          placeholder: 'Ex: Paris, Speedy, 75001...',
        }}
      />

      {conflict.hasConflict && (
        <Alert
          severity="info"
          small
          className="fr-mt-2w"
          title="Aucun résultat avec les filtres actuels"
          description={
            <div>
              <p className="fr-mb-2w">{getConflictMessage()}</p>
              <Button
                size="small"
                priority="secondary"
                onClick={handleClearGeoFilters}
              >
                Supprimer les filtres géographiques
              </Button>
            </div>
          }
        />
      )}
    </>
  );
}
