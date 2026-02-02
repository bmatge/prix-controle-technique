import { useMemo, useCallback } from 'react';
import { Select } from '@codegouvfr/react-dsfr/Select';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { Tag } from '@codegouvfr/react-dsfr/Tag';
import { useData } from '@/contexts/DataContext';
import { useFilterStore } from '@/stores/filterStore';
import { useFilteredCentres } from '@/hooks/useFilteredCentres';
import { MultiSelect } from './MultiSelect';
import { AddressSearch } from '@/components/carte/AddressSearch';
import { ProximitySearch } from './ProximitySearch';

interface FilterPanelProps {
  showAddressSearch?: boolean;
  showProximitySearch?: boolean;
}

export function FilterPanel({ showAddressSearch = false, showProximitySearch = false }: FilterPanelProps) {
  const { metadata, centres } = useData();
  const { filters, setFilter, resetFilters } = useFilterStore();
  const filteredCentres = useFilteredCentres();

  // Construire le mapping département→région à partir des centres
  const deptToRegion = useMemo(() => {
    const mapping = new Map<string, string>();
    for (const centre of centres) {
      if (!mapping.has(centre.nomDepartement)) {
        mapping.set(centre.nomDepartement, centre.region);
      }
    }
    return mapping;
  }, [centres]);

  // Départements filtrés selon la région sélectionnée
  const departementsFiltered = useMemo(() => {
    if (!filters.region || !metadata) return metadata?.departements || [];
    return (metadata.departements || []).filter(
      (dept) => deptToRegion.get(dept) === filters.region
    );
  }, [filters.region, metadata, deptToRegion]);

  // Handler pour le changement de région
  const handleRegionChange = useCallback(
    (newRegion: string | null) => {
      setFilter('region', newRegion);
      // Vider le département si non compatible avec la nouvelle région
      if (filters.departement && newRegion) {
        const deptRegion = deptToRegion.get(filters.departement);
        if (deptRegion !== newRegion) {
          setFilter('departement', null);
        }
      }
    },
    [filters.departement, deptToRegion, setFilter]
  );

  // Handler pour le changement de département
  const handleDepartementChange = useCallback(
    (nomDepartement: string | null) => {
      setFilter('departement', nomDepartement);
      // Auto-sélectionner la région correspondante
      if (nomDepartement) {
        const regionForDept = deptToRegion.get(nomDepartement);
        if (regionForDept && regionForDept !== filters.region) {
          setFilter('region', regionForDept);
        }
      }
    },
    [deptToRegion, filters.region, setFilter]
  );

  // Compter les filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.region) count++;
    if (filters.departement) count++;
    if ((filters.vehicules || []).length > 0) count++;
    if ((filters.energies || []).length > 0) count++;
    if (filters.referencePoint) count++;
    return count;
  }, [filters]);

  // Générer les tags des filtres actifs (détaillés pour véhicules/énergies)
  const activeTags = useMemo(() => {
    const tags: { label: string; onRemove: () => void }[] = [];

    // Tag pour le point de référence (recherche proximité)
    if (filters.referencePoint) {
      tags.push({
        label: `Proche de : ${filters.referencePoint.label.split(',')[0]}`,
        onRemove: () => {
          setFilter('referencePoint', null);
          if (filters.sortBy === 'distance') {
            setFilter('sortBy', 'prix');
          }
        },
      });
    }

    if (filters.region) {
      tags.push({
        label: filters.region,
        onRemove: () => {
          setFilter('region', null);
          setFilter('departement', null);
        },
      });
    }

    if (filters.departement) {
      tags.push({
        label: filters.departement,
        onRemove: () => setFilter('departement', null),
      });
    }

    // Tags individuels pour chaque véhicule
    const vehicules = filters.vehicules || [];
    for (const v of vehicules) {
      tags.push({
        label: v,
        onRemove: () => setFilter('vehicules', vehicules.filter((x) => x !== v)),
      });
    }

    // Tags individuels pour chaque énergie
    const energies = filters.energies || [];
    for (const e of energies) {
      tags.push({
        label: e,
        onRemove: () => setFilter('energies', energies.filter((x) => x !== e)),
      });
    }

    return tags;
  }, [filters, setFilter]);

  if (!metadata) return null;

  return (
    <div style={{ backgroundColor: 'var(--background-alt-grey)' }}>
      <div className="fr-container fr-py-2w">
        {/* Ligne 1 : Recherche (adresse pour carte ou proximité pour liste) */}
        {showAddressSearch && (
          <div className="fr-mb-2w">
            <AddressSearch />
          </div>
        )}
        {showProximitySearch && (
          <div className="fr-mb-2w">
            <ProximitySearch />
          </div>
        )}

        {/* Ligne 2 : Filtres */}
        <div className="fr-grid-row fr-grid-row--gutters">
          <div className="fr-col-6 fr-col-md-3">
            <Select
              label="Région"
              nativeSelectProps={{
                value: filters.region || '',
                onChange: (e) => handleRegionChange(e.target.value || null),
              }}
            >
              <option value="">Toutes les régions</option>
              {metadata.regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </Select>
          </div>

          <div className="fr-col-6 fr-col-md-3">
            <Select
              label="Département"
              nativeSelectProps={{
                value: filters.departement || '',
                onChange: (e) => handleDepartementChange(e.target.value || null),
              }}
            >
              <option value="">Tous les départements</option>
              {departementsFiltered.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </Select>
          </div>

          <div className="fr-col-6 fr-col-md-3">
            <MultiSelect
              label="Type de véhicule"
              options={metadata.vehicules}
              selected={filters.vehicules}
              onChange={(selected) => setFilter('vehicules', selected)}
              placeholder="Tous"
              searchPlaceholder="Rechercher..."
            />
          </div>

          <div className="fr-col-6 fr-col-md-3">
            <MultiSelect
              label="Énergie"
              options={metadata.energies}
              selected={filters.energies}
              onChange={(selected) => setFilter('energies', selected)}
              placeholder="Toutes"
              searchPlaceholder="Rechercher..."
            />
          </div>
        </div>

        {/* Ligne 3 : Tags des filtres actifs */}
        {activeTags.length > 0 && (
          <ul className="fr-tags-group fr-mt-2w">
            {activeTags.map((tag, index) => (
              <li key={index}>
                <Tag
                  dismissible
                  nativeButtonProps={{
                    onClick: tag.onRemove,
                  }}
                  small
                >
                  {tag.label}
                </Tag>
              </li>
            ))}
          </ul>
        )}

        {/* Ligne 4 : Compteur de résultats + bouton effacer */}
        <div
          className="fr-mt-2w"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <p className="fr-text--lg fr-text--bold fr-mb-0" style={{ color: 'var(--text-title-grey)' }}>
            {filteredCentres.length.toLocaleString('fr-FR')} centre{filteredCentres.length > 1 ? 's' : ''}
          </p>
          {activeFiltersCount > 0 && (
            <Button
              priority="secondary"
              size="small"
              onClick={resetFilters}
            >
              Effacer les filtres
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
