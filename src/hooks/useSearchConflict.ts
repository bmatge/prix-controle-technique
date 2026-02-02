import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { useData } from '@/contexts/DataContext';
import { useFilterStore } from '@/stores/filterStore';

const fuseOptions = {
  keys: ['nom', 'commune', 'adresse', 'codePostal'],
  threshold: 0.3,
  ignoreLocation: true,
};

interface SearchConflict {
  hasConflict: boolean;
  searchResultsCount: number;
  filteredResultsCount: number;
  conflictingFilters: {
    region: string | null;
    departement: string | null;
  };
}

/**
 * Détecte quand une recherche textuelle donne 0 résultats à cause des filtres
 * région/département, alors qu'elle donnerait des résultats sans ces filtres.
 */
export function useSearchConflict(): SearchConflict {
  const { centres } = useData();
  const { filters } = useFilterStore();

  const fuse = useMemo(() => new Fuse(centres, fuseOptions), [centres]);

  return useMemo(() => {
    const noConflict: SearchConflict = {
      hasConflict: false,
      searchResultsCount: 0,
      filteredResultsCount: 0,
      conflictingFilters: { region: null, departement: null },
    };

    // Pas de conflit si pas de recherche ou pas de filtres géo
    if (!filters.search.trim()) {
      return noConflict;
    }

    if (!filters.region && !filters.departement) {
      return noConflict;
    }

    // Résultats de la recherche seule (sans filtres géo)
    const searchResults = fuse.search(filters.search.trim());
    const searchResultsCount = searchResults.length;

    if (searchResultsCount === 0) {
      // Pas de résultats même sans filtres géo = pas un conflit de filtres
      return noConflict;
    }

    // Appliquer les filtres géo aux résultats de recherche
    let filteredResults = searchResults.map((r) => r.item);

    if (filters.region) {
      filteredResults = filteredResults.filter((c) => c.region === filters.region);
    }

    if (filters.departement) {
      filteredResults = filteredResults.filter((c) => c.nomDepartement === filters.departement);
    }

    // Conflit si filtres géo réduisent les résultats à 0
    if (filteredResults.length === 0 && searchResultsCount > 0) {
      return {
        hasConflict: true,
        searchResultsCount,
        filteredResultsCount: 0,
        conflictingFilters: {
          region: filters.region,
          departement: filters.departement,
        },
      };
    }

    return noConflict;
  }, [centres, filters, fuse]);
}
