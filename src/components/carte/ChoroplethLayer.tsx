import { useEffect, useState, useMemo } from 'react';
import { GeoJSON } from 'react-leaflet';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { Layer, PathOptions } from 'leaflet';
import type { Centre } from '@/types';
import { useFilterStore } from '@/stores/filterStore';
import { formatPrix } from '@/utils/formatters';

interface DepartementProperties {
  code: string;
  nom: string;
}

interface ChoroplethLayerProps {
  centres: Centre[];
  onDepartementClick: (codeDept: string, nomDept: string) => void;
}

// Calcul des stats par département avec filtres véhicule/énergie (multi-sélection)
function computeDeptStats(
  centres: Centre[],
  filtreVehicules: string[],
  filtreEnergies: string[]
) {
  const deptMap = new Map<string, { sum: number; count: number; code: string }>();

  const hasVehiculeFilter = filtreVehicules.length > 0;
  const hasEnergieFilter = filtreEnergies.length > 0;

  for (const centre of centres) {
    // Trouver le tarif correspondant aux filtres
    let prix = centre.prixReference;

    if (hasVehiculeFilter || hasEnergieFilter) {
      const tarifsFiltres = centre.tarifs.filter((t) => {
        const matchVehicule = !hasVehiculeFilter || filtreVehicules.includes(t.vehicule);
        const matchEnergie = !hasEnergieFilter || filtreEnergies.includes(t.energie);
        return matchVehicule && matchEnergie;
      });
      if (tarifsFiltres.length > 0) {
        // Moyenne des tarifs filtrés
        prix = tarifsFiltres.reduce((acc, t) => acc + t.prix, 0) / tarifsFiltres.length;
      }
    }

    if (!prix || prix <= 0) continue;

    const key = centre.nomDepartement;
    const existing = deptMap.get(key) || { sum: 0, count: 0, code: centre.departement };
    deptMap.set(key, {
      sum: existing.sum + prix,
      count: existing.count + 1,
      code: centre.departement,
    });
  }

  const stats = new Map<string, { moyenne: number; count: number }>();
  for (const [nom, { sum, count, code }] of deptMap) {
    stats.set(code, { moyenne: sum / count, count });
    stats.set(nom.toUpperCase(), { moyenne: sum / count, count });
  }

  return stats;
}

// Couleur selon le prix (vert = pas cher, rouge = cher)
function getColor(prix: number, min: number, max: number): string {
  if (!prix || prix <= 0) return '#e0e0e0'; // Gris pour pas de données

  const range = max - min || 1;
  const ratio = (prix - min) / range;

  // Palette vert -> jaune -> rouge
  if (ratio < 0.25) return '#18753c';
  if (ratio < 0.5) return '#8dc572';
  if (ratio < 0.75) return '#fcc63a';
  return '#ce0500';
}

export function ChoroplethLayer({ centres, onDepartementClick }: ChoroplethLayerProps) {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const filters = useFilterStore((s) => s.filters);
  const filtreVehicules = filters.vehicules || [];
  const filtreEnergies = filters.energies || [];

  // Label du type de prestation
  const typePrestation = useMemo(() => {
    const parts = [];
    if (filtreVehicules.length > 0) {
      parts.push(filtreVehicules.length === 1 ? filtreVehicules[0] : `${filtreVehicules.length} véhicules`);
    }
    if (filtreEnergies.length > 0) {
      parts.push(filtreEnergies.length === 1 ? filtreEnergies[0] : `${filtreEnergies.length} énergies`);
    }
    return parts.length > 0 ? parts.join(' · ') : 'VP Essence/Diesel';
  }, [filtreVehicules, filtreEnergies]);

  // Charger les contours des départements
  useEffect(() => {
    async function loadGeoJSON() {
      try {
        // GeoJSON des départements français (version simplifiée pour les performances)
        const response = await fetch('/departements.geojson');
        const data: FeatureCollection = await response.json();
        setGeoData(data);
      } catch (error) {
        console.error('Erreur chargement GeoJSON:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadGeoJSON();
  }, []);

  // Calculer les stats par département
  const deptStats = useMemo(
    () => computeDeptStats(centres, filtreVehicules, filtreEnergies),
    [centres, filtreVehicules, filtreEnergies]
  );

  // Calculer min/max pour l'échelle de couleurs
  const { min, max } = useMemo(() => {
    const moyennes = Array.from(deptStats.values()).map((s) => s.moyenne);
    if (moyennes.length === 0) return { min: 50, max: 100 };
    return {
      min: Math.min(...moyennes),
      max: Math.max(...moyennes),
    };
  }, [deptStats]);

  // Style pour chaque département
  const style = (feature: Feature<Geometry, DepartementProperties> | undefined): PathOptions => {
    if (!feature) return {};

    const code = feature.properties.code;
    const stats = deptStats.get(code);
    const moyenne = stats?.moyenne || 0;

    return {
      fillColor: getColor(moyenne, min, max),
      weight: 1,
      opacity: 1,
      color: '#ffffff',
      fillOpacity: 0.7,
    };
  };

  // Vérifier si des filtres géographiques sont actifs
  const hasGeoFilter = Boolean(filters.region || filters.departement);

  // Événements pour chaque département
  const onEachFeature = (
    feature: Feature<Geometry, DepartementProperties>,
    layer: Layer
  ) => {
    const code = feature.properties.code;
    const nom = feature.properties.nom;
    const stats = deptStats.get(code);

    // Tooltip - distinguer "filtré" de "pas de données"
    let tooltipContent: string;
    if (stats) {
      tooltipContent = `<strong>${nom}</strong><br/>Prix moyen: ${formatPrix(stats.moyenne)}<br/><small style="color:#666">${typePrestation}</small><br/>${stats.count} centre${stats.count > 1 ? 's' : ''}`;
    } else if (hasGeoFilter) {
      tooltipContent = `<strong>${nom}</strong><br/><small style="color:#666">Hors du filtre actuel</small>`;
    } else {
      tooltipContent = `<strong>${nom}</strong><br/><small style="color:#666">Aucune donnée</small>`;
    }

    layer.bindTooltip(tooltipContent, {
      sticky: true,
      className: 'fr-tooltip',
    });

    // Événements de survol
    layer.on({
      mouseover: (e) => {
        const target = e.target;
        target.setStyle({
          weight: 3,
          color: '#000091',
          fillOpacity: 0.9,
        });
        target.bringToFront();
      },
      mouseout: (e) => {
        const target = e.target;
        target.setStyle({
          weight: 1,
          color: '#ffffff',
          fillOpacity: 0.7,
        });
      },
      click: () => {
        if (stats && stats.count > 0) {
          onDepartementClick(code, nom);
        }
      },
    });
  };

  if (isLoading || !geoData) {
    return null;
  }

  return (
    <GeoJSON
      key={`choropleth-${centres.length}-${filtreVehicules.join(',')}-${filtreEnergies.join(',')}`}
      data={geoData}
      style={style}
      onEachFeature={onEachFeature}
    />
  );
}
