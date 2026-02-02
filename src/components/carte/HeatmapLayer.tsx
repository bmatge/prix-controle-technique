import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import type { Centre } from '@/types';

interface HeatmapLayerProps {
  centres: Centre[];
}

// Extend Leaflet types for heatLayer
declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: {
      radius?: number;
      blur?: number;
      maxZoom?: number;
      max?: number;
      gradient?: Record<number, string>;
    }
  ): L.Layer;
}

export function HeatmapLayer({ centres }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (centres.length === 0) return;

    // Calculate price range for normalization
    const prices = centres.map((c) => c.prixReference).filter((p) => p > 0);
    if (prices.length === 0) return;

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;

    // Create heatmap points with intensity based on price
    // Lower price = higher intensity (green), higher price = lower intensity
    const points: [number, number, number][] = centres
      .filter((c) => c.lat && c.lng && c.prixReference > 0)
      .map((centre) => {
        // Normalize price to 0-1 range (inverted: cheaper = higher value)
        const normalizedPrice = (centre.prixReference - minPrice) / range;
        // Intensity: cheaper centers have higher intensity
        const intensity = 1 - normalizedPrice;
        return [centre.lat, centre.lng, intensity * 0.8 + 0.2];
      });

    const heat = L.heatLayer(points, {
      radius: 25,
      blur: 15,
      maxZoom: 12,
      max: 1,
      gradient: {
        0.0: '#ce0500', // Rouge DSFR - cher
        0.3: '#ff6f00',
        0.5: '#fcc63a', // Jaune - moyen
        0.7: '#8dc572',
        1.0: '#18753c', // Vert DSFR - pas cher
      },
    });

    heat.addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [centres, map]);

  return null;
}
