import { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import type { Stats } from '@/types';

export function useStats(): Stats | null {
  const { centres } = useData();

  return useMemo(() => {
    if (centres.length === 0) return null;

    const prices = centres.map((c) => c.prixReference).filter((p) => p > 0);
    prices.sort((a, b) => a - b);

    const prixMoyen = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const prixMin = prices[0];
    const prixMax = prices[prices.length - 1];
    const prixMedian = prices[Math.floor(prices.length / 2)];

    // Stats par région
    const regionMap = new Map<string, { sum: number; count: number }>();
    for (const centre of centres) {
      const existing = regionMap.get(centre.region) || { sum: 0, count: 0 };
      regionMap.set(centre.region, {
        sum: existing.sum + centre.prixReference,
        count: existing.count + 1,
      });
    }
    const parRegion = Array.from(regionMap.entries())
      .map(([nom, { sum, count }]) => ({
        nom,
        prixMoyen: sum / count,
        count,
      }))
      .sort((a, b) => a.prixMoyen - b.prixMoyen);

    // Stats par département
    const deptMap = new Map<string, { sum: number; count: number; prices: number[] }>();
    for (const centre of centres) {
      const existing = deptMap.get(centre.nomDepartement) || { sum: 0, count: 0, prices: [] };
      deptMap.set(centre.nomDepartement, {
        sum: existing.sum + centre.prixReference,
        count: existing.count + 1,
        prices: [...existing.prices, centre.prixReference],
      });
    }
    const parDepartement = Array.from(deptMap.entries())
      .map(([nom, { sum, count }]) => ({
        nom,
        prixMoyen: sum / count,
        count,
      }))
      .sort((a, b) => a.prixMoyen - b.prixMoyen);

    // Écarts max par département
    const ecartsMax = Array.from(deptMap.entries())
      .map(([nom, { prices }]) => {
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return { nom, ecart: max - min, min, max };
      })
      .filter((d) => d.ecart > 0)
      .sort((a, b) => b.ecart - a.ecart)
      .slice(0, 10);

    // Top centres
    const sortedByPrice = [...centres]
      .filter((c) => c.prixReference > 0)
      .sort((a, b) => a.prixReference - b.prixReference);

    const topMoinsChers = sortedByPrice.slice(0, 10);
    const topPlusChers = sortedByPrice.slice(-10).reverse();

    return {
      prixMoyen,
      prixMin,
      prixMax,
      prixMedian,
      nombreCentres: centres.length,
      parRegion,
      parDepartement,
      topMoinsChers,
      topPlusChers,
      ecartsMax,
    };
  }, [centres]);
}
