import { useMemo, useCallback } from 'react';
import { Marker } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import type { Centre } from '@/types';
import { useFilterStore } from '@/stores/filterStore';

interface MarkersLayerProps {
  centres: Centre[];
  onCentreSelect: (centre: Centre) => void;
}

function getPriceColor(prix: number, min: number, max: number): string {
  const range = max - min || 1;
  const ratio = (prix - min) / range;

  if (ratio < 0.33) return '#18753c'; // Vert - pas cher
  if (ratio < 0.66) return '#fcc63a'; // Jaune - moyen
  return '#ce0500'; // Rouge - cher
}

function createIcon(color: string) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      cursor: pointer;
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export function MarkersLayer({ centres, onCentreSelect }: MarkersLayerProps) {
  const filters = useFilterStore((s) => s.filters);
  const filtreVehicules = filters.vehicules || [];
  const filtreEnergies = filters.energies || [];

  // Fonction pour obtenir le prix filtré d'un centre (moyenne si plusieurs sélections)
  const getFilteredPrice = useCallback(
    (centre: Centre): number => {
      const hasVehiculeFilter = filtreVehicules.length > 0;
      const hasEnergieFilter = filtreEnergies.length > 0;

      if (hasVehiculeFilter || hasEnergieFilter) {
        const tarifsFiltres = centre.tarifs.filter((t) => {
          const matchVehicule = !hasVehiculeFilter || filtreVehicules.includes(t.vehicule);
          const matchEnergie = !hasEnergieFilter || filtreEnergies.includes(t.energie);
          return matchVehicule && matchEnergie;
        });
        if (tarifsFiltres.length > 0) {
          // Retourner la moyenne des tarifs filtrés
          return tarifsFiltres.reduce((acc, t) => acc + t.prix, 0) / tarifsFiltres.length;
        }
      }
      return centre.prixReference;
    },
    [filtreVehicules, filtreEnergies]
  );

  const priceRange = useMemo(() => {
    const prices = centres.map((c) => getFilteredPrice(c)).filter((p) => p > 0);
    if (prices.length === 0) return { min: 0, max: 100 };
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [centres, getFilteredPrice]);

  return (
    <MarkerClusterGroup
      chunkedLoading
      maxClusterRadius={60}
      spiderfyOnMaxZoom
      showCoverageOnHover={false}
    >
      {centres
        .filter((c) => c.lat && c.lng)
        .map((centre) => (
          <Marker
            key={centre.siret}
            position={[centre.lat, centre.lng]}
            icon={createIcon(getPriceColor(getFilteredPrice(centre), priceRange.min, priceRange.max))}
            eventHandlers={{
              click: () => onCentreSelect(centre),
            }}
          />
        ))}
    </MarkerClusterGroup>
  );
}
