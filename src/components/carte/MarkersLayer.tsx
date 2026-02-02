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

  // Map des prix par position (lat,lng) pour les clusters
  const positionPrices = useMemo(() => {
    const map = new Map<string, number>();
    centres.forEach((c) => {
      if (c.lat && c.lng) {
        const key = `${c.lat.toFixed(6)},${c.lng.toFixed(6)}`;
        map.set(key, getFilteredPrice(c));
      }
    });
    return map;
  }, [centres, getFilteredPrice]);

  // Fonction pour créer l'icône du cluster
  const createClusterIcon = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (cluster: any) => {
      const markers = cluster.getAllChildMarkers();
      const count = markers.length;

      // Calculer le prix moyen du cluster
      let totalPrice = 0;
      let priceCount = 0;
      markers.forEach((marker: L.Marker) => {
        const latlng = marker.getLatLng();
        const key = `${latlng.lat.toFixed(6)},${latlng.lng.toFixed(6)}`;
        if (positionPrices.has(key)) {
          totalPrice += positionPrices.get(key)!;
          priceCount++;
        }
      });

      const avgPrice = priceCount > 0 ? totalPrice / priceCount : 0;
      const color = getPriceColor(avgPrice, priceRange.min, priceRange.max);

      return L.divIcon({
        html: `<div style="
          background-color: ${color};
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 14px;
        ">${count}</div>`,
        className: 'custom-cluster-icon',
        iconSize: [40, 40],
      });
    },
    [positionPrices, priceRange]
  );

  return (
    <MarkerClusterGroup
      chunkedLoading
      maxClusterRadius={60}
      spiderfyOnMaxZoom
      showCoverageOnHover={false}
      iconCreateFunction={createClusterIcon}
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
