import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, useMap } from 'react-leaflet';
import { useFilteredCentres } from '@/hooks/useFilteredCentres';
import { useData } from '@/contexts/DataContext';
import { useMapStore } from '@/stores/mapStore';
import { useFilterStore } from '@/stores/filterStore';
import { ChoroplethLayer } from './ChoroplethLayer';
import { MarkersLayer } from './MarkersLayer';
import { MapLegend } from './MapLegend';
import { CentrePanel } from './CentrePanel';
import type { LatLngBounds, Map as LeafletMap } from 'leaflet';
import type { Centre } from '@/types';
import 'leaflet/dist/leaflet.css';

type MapMode = 'choropleth' | 'poi';

// Seuil de zoom pour basculer entre choropleth et POI
const ZOOM_THRESHOLD = 9;

// France center
const FRANCE_CENTER: [number, number] = [46.603354, 1.888334];
const DEFAULT_ZOOM = 6;

// Fond de carte sobre (CartoDB Positron - gris clair sans couleurs)
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

const MAP_HEIGHT = 600;

interface BoundsUpdaterProps {
  onBoundsChange: (bounds: LatLngBounds) => void;
  onZoomChange: (zoom: number) => void;
}

function BoundsUpdater({ onBoundsChange, onZoomChange }: BoundsUpdaterProps) {
  const map = useMapEvents({
    moveend: () => onBoundsChange(map.getBounds()),
    zoomend: () => {
      onBoundsChange(map.getBounds());
      onZoomChange(map.getZoom());
    },
  });

  // Initial bounds and zoom
  useState(() => {
    setTimeout(() => {
      onBoundsChange(map.getBounds());
      onZoomChange(map.getZoom());
    }, 100);
  });

  return null;
}

// Composant pour exposer la référence de la carte et gérer les actions
function MapController({
  mapRef,
  allCentres,
}: {
  mapRef: React.MutableRefObject<LeafletMap | null>;
  allCentres: Centre[];
}) {
  const map = useMap();
  const pendingAction = useMapStore((s) => s.pendingAction);
  const clearAction = useMapStore((s) => s.clearAction);
  const { region, departement } = useFilterStore((s) => s.filters);
  const prevRegionRef = useRef<string | null>(null);
  const prevDeptRef = useRef<string | null>(null);

  mapRef.current = map;

  // Exécuter les actions en attente
  useEffect(() => {
    if (pendingAction && map) {
      if (pendingAction.type === 'flyTo') {
        map.setView([pendingAction.lat, pendingAction.lng], pendingAction.zoom || 13, {
          animate: true,
        });
      }
      clearAction();
    }
  }, [pendingAction, map, clearAction]);

  // Réagir aux changements de filtres région/département
  useEffect(() => {
    if (!map) return;

    // Département a changé
    if (departement && departement !== prevDeptRef.current) {
      // Calculer le centre à partir de nos données
      const deptCentres = allCentres.filter((c) => c.nomDepartement === departement);
      if (deptCentres.length > 0) {
        const lats = deptCentres.map((c) => c.lat);
        const lngs = deptCentres.map((c) => c.lng);
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        map.flyTo([centerLat, centerLng], 10, { animate: true, duration: 1 });
      }
    }
    // Région a changé (et pas de département sélectionné)
    else if (region && region !== prevRegionRef.current && !departement) {
      const regionCentres = allCentres.filter((c) => c.region === region);
      if (regionCentres.length > 0) {
        const lats = regionCentres.map((c) => c.lat);
        const lngs = regionCentres.map((c) => c.lng);
        const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
        const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        map.flyTo([centerLat, centerLng], 7, { animate: true, duration: 1 });
      }
    }
    // Si tout est désélectionné, revenir à la vue France
    else if (!region && !departement && (prevRegionRef.current || prevDeptRef.current)) {
      map.flyTo(FRANCE_CENTER, DEFAULT_ZOOM, { animate: true, duration: 1 });
    }

    prevRegionRef.current = region;
    prevDeptRef.current = departement;
  }, [region, departement, map, allCentres]);

  return null;
}

export function Map() {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [bounds, setBounds] = useState<LatLngBounds | null>(null);
  const [selectedCentre, setSelectedCentre] = useState<Centre | null>(null);
  const [selectedDept, setSelectedDept] = useState<{ code: string; nom: string } | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const { centres: allCentresUnfiltered } = useData();
  const filteredCentres = useFilteredCentres();

  // Mode automatique basé sur le zoom
  const mode: MapMode = zoom >= ZOOM_THRESHOLD ? 'poi' : 'choropleth';

  // Filter centres by viewport for performance
  const visibleCentres = useMemo(() => {
    // En mode POI avec un département sélectionné, filtrer par département
    if (mode === 'poi' && selectedDept) {
      return filteredCentres.filter((centre) => centre.departement === selectedDept.code);
    }

    if (!bounds) return filteredCentres.slice(0, 1000);

    const filtered = filteredCentres.filter((centre) => {
      return (
        centre.lat >= bounds.getSouth() &&
        centre.lat <= bounds.getNorth() &&
        centre.lng >= bounds.getWest() &&
        centre.lng <= bounds.getEast()
      );
    });

    // Limit for performance
    return filtered.slice(0, 2000);
  }, [filteredCentres, bounds, mode, selectedDept]);

  // Calculate price range for legend
  const priceRange = useMemo(() => {
    if (visibleCentres.length === 0) return { min: 0, max: 100 };
    const prices = visibleCentres.map((c) => c.prixReference).filter((p) => p > 0);
    if (prices.length === 0) return { min: 0, max: 100 };
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [visibleCentres]);

  const handleCentreSelect = useCallback((centre: Centre) => {
    setSelectedCentre(centre);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedCentre(null);
  }, []);

  const handleDepartementClick = useCallback((codeDept: string, nomDept: string) => {
    setSelectedDept({ code: codeDept, nom: nomDept });
    // Zoom sur les centres du département (passera automatiquement en mode POI)
    const deptCentres = filteredCentres.filter((c) => c.departement === codeDept);
    if (deptCentres.length > 0 && mapRef.current) {
      const lats = deptCentres.map((c) => c.lat);
      const lngs = deptCentres.map((c) => c.lng);
      const bounds: [[number, number], [number, number]] = [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ];
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [filteredCentres]);

  const handleZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
    // Réinitialiser la sélection de département quand on dézoome
    if (newZoom < ZOOM_THRESHOLD) {
      setSelectedDept(null);
      setSelectedCentre(null);
    }
  }, []);

  const showPanel = mode === 'poi' && selectedCentre !== null;

  return (
    <div className="fr-container fr-py-2w">
      {/* Indication contextuelle */}
      <div className="fr-mb-1w">
        {mode === 'poi' && selectedDept ? (
          <p className="fr-text--sm fr-mb-0">
            <strong>{selectedDept.nom}</strong> : {visibleCentres.length} centre{visibleCentres.length > 1 ? 's' : ''}
          </p>
        ) : mode === 'choropleth' ? (
          <p className="fr-text--sm fr-hint-text fr-mb-0">
            Cliquez sur un département ou zoomez pour voir les centres
          </p>
        ) : (
          <p className="fr-text--sm fr-mb-0">
            <strong>{visibleCentres.length}</strong> centre{visibleCentres.length > 1 ? 's' : ''} visible{visibleCentres.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Carte et panneau */}
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className={showPanel ? 'fr-col-12 fr-col-lg-8' : 'fr-col-12'}>
          <div style={{ position: 'relative', height: MAP_HEIGHT }}>
            <MapContainer
              center={FRANCE_CENTER}
              zoom={DEFAULT_ZOOM}
              style={{ height: '100%', width: '100%', borderRadius: '4px' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution={TILE_ATTRIBUTION}
                url={TILE_URL}
              />
              <MapController mapRef={mapRef} allCentres={allCentresUnfiltered} />
              <BoundsUpdater onBoundsChange={setBounds} onZoomChange={handleZoomChange} />

              {mode === 'choropleth' && (
                <ChoroplethLayer
                  centres={filteredCentres}
                  onDepartementClick={handleDepartementClick}
                />
              )}
              {mode === 'poi' && (
                <MarkersLayer
                  centres={visibleCentres}
                  onCentreSelect={handleCentreSelect}
                />
              )}
            </MapContainer>

            <MapLegend mode={mode} priceRange={priceRange} />
          </div>
        </div>

        {showPanel && (
          <div className="fr-col-12 fr-col-lg-4">
            <CentrePanel
              centre={selectedCentre}
              onClose={handleClosePanel}
              height={MAP_HEIGHT}
            />
          </div>
        )}
      </div>
    </div>
  );
}
