import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FilterState } from '@/types';

interface FilterStore {
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  region: null,
  departement: null,
  vehicules: [],
  energies: [],
  prixMin: null,
  prixMax: null,
  search: '',
  sortBy: 'prix',
  sortOrder: 'asc',
  referencePoint: null,
};

export const useFilterStore = create<FilterStore>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      setFilter: (key, value) =>
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        })),
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
      resetFilters: () => set({ filters: defaultFilters }),
    }),
    {
      name: 'prix-ct-filters',
      version: 3,
      migrate: (persistedState: unknown, _version: number) => {
        const state = persistedState as { filters?: Record<string, unknown> };
        if (state.filters) {
          const oldFilters = state.filters;
          // Toujours réinitialiser referencePoint à null (ne pas persister)
          return {
            filters: {
              ...defaultFilters,
              region: oldFilters.region ?? null,
              departement: oldFilters.departement ?? null,
              vehicules: oldFilters.vehicules ?? [],
              energies: oldFilters.energies ?? [],
              prixMin: oldFilters.prixMin ?? null,
              prixMax: oldFilters.prixMax ?? null,
              search: oldFilters.search ?? '',
              sortBy: oldFilters.sortBy === 'distance' ? 'prix' : (oldFilters.sortBy ?? 'prix'),
              sortOrder: oldFilters.sortOrder ?? 'asc',
              referencePoint: null, // Toujours réinitialiser
            },
          };
        }
        return { filters: defaultFilters };
      },
    }
  )
);
