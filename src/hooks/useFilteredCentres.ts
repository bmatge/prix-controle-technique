import { useMemo } from 'react';
import Fuse from 'fuse.js';
import { useData } from '@/contexts/DataContext';
import { useFilterStore } from '@/stores/filterStore';
import { calculateDistance } from '@/utils/geo';
import type { Centre } from '@/types';

const fuseOptions = {
  keys: ['nom', 'commune', 'adresse', 'codePostal'],
  threshold: 0.3,
  ignoreLocation: true,
};

export function useFilteredCentres() {
  const { centres } = useData();
  const { filters } = useFilterStore();

  const fuse = useMemo(() => new Fuse(centres, fuseOptions), [centres]);

  const filteredCentres = useMemo(() => {
    let result: Centre[] = centres;

    // Text search with Fuse.js
    if (filters.search.trim()) {
      const searchResults = fuse.search(filters.search.trim());
      result = searchResults.map((r) => r.item);
    }

    // Filter by region
    if (filters.region) {
      result = result.filter((c) => c.region === filters.region);
    }

    // Filter by departement
    if (filters.departement) {
      result = result.filter((c) => c.nomDepartement === filters.departement);
    }

    // Filter by vehicule types (multi-select)
    const vehicules = filters.vehicules || [];
    if (vehicules.length > 0) {
      result = result.filter((c) =>
        c.tarifs.some((t) => vehicules.includes(t.vehicule))
      );
    }

    // Filter by energie types (multi-select)
    const energies = filters.energies || [];
    if (energies.length > 0) {
      result = result.filter((c) =>
        c.tarifs.some((t) => energies.includes(t.energie))
      );
    }

    // Filter by price range
    if (filters.prixMin !== null) {
      result = result.filter((c) => c.prixReference >= filters.prixMin!);
    }
    if (filters.prixMax !== null) {
      result = result.filter((c) => c.prixReference <= filters.prixMax!);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'prix':
          comparison = a.prixReference - b.prixReference;
          break;
        case 'nom':
          comparison = a.nom.localeCompare(b.nom, 'fr');
          break;
        case 'commune':
          comparison = a.commune.localeCompare(b.commune, 'fr');
          break;
        case 'departement':
          comparison = a.nomDepartement.localeCompare(b.nomDepartement, 'fr');
          break;
        case 'distance':
          if (filters.referencePoint) {
            const distA = calculateDistance(
              filters.referencePoint.lat,
              filters.referencePoint.lng,
              a.lat,
              a.lng
            );
            const distB = calculateDistance(
              filters.referencePoint.lat,
              filters.referencePoint.lng,
              b.lat,
              b.lng
            );
            comparison = distA - distB;
          }
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [centres, filters, fuse]);

  return filteredCentres;
}
