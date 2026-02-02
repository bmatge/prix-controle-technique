import { useState, useMemo } from 'react';
import { Table } from '@codegouvfr/react-dsfr/Table';
import { Pagination } from '@codegouvfr/react-dsfr/Pagination';
import { Tag } from '@codegouvfr/react-dsfr/Tag';
import { useFilterStore } from '@/stores/filterStore';
import { useFilteredCentres } from '@/hooks/useFilteredCentres';
import { formatPrix } from '@/utils/formatters';
import { calculateDistance, formatDistance } from '@/utils/geo';
import type { Centre } from '@/types';

const ITEMS_PER_PAGE = 25;

export function CentresTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const centres = useFilteredCentres();
  const { filters, setFilter } = useFilterStore();

  // Générer les combinaisons véhicule/énergie sélectionnées pour les colonnes dynamiques
  const colonnesDynamiques = useMemo(() => {
    const colonnes: { vehicule: string; energie: string; label: string }[] = [];
    const vehicules = (filters.vehicules || []).length > 0 ? filters.vehicules : [];
    const energies = (filters.energies || []).length > 0 ? filters.energies : [];

    if (vehicules.length > 0 && energies.length > 0) {
      // Toutes les combinaisons
      for (const v of vehicules) {
        for (const e of energies) {
          colonnes.push({ vehicule: v, energie: e, label: `${v} ${e}` });
        }
      }
    } else if (vehicules.length > 0) {
      // Uniquement véhicules
      for (const v of vehicules) {
        colonnes.push({ vehicule: v, energie: '', label: v });
      }
    } else if (energies.length > 0) {
      // Uniquement énergies
      for (const e of energies) {
        colonnes.push({ vehicule: '', energie: e, label: e });
      }
    }

    return colonnes;
  }, [filters.vehicules || [], filters.energies || []]);

  // Helper pour trouver le prix d'un centre pour une combinaison
  const getPrixPourCombinaison = (centre: Centre, vehicule: string, energie: string): number | null => {
    const tarif = centre.tarifs.find((t) => {
      const matchV = !vehicule || t.vehicule === vehicule;
      const matchE = !energie || t.energie === energie;
      return matchV && matchE;
    });
    return tarif ? tarif.prix : null;
  };

  const totalPages = Math.ceil(centres.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCentres = centres.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSort = (column: 'prix' | 'nom' | 'commune' | 'departement') => {
    if (filters.sortBy === column) {
      setFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setFilter('sortBy', column);
      setFilter('sortOrder', 'asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (filters.sortBy !== column) return '';
    return filters.sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  const hasReferencePoint = Boolean(filters.referencePoint);

  const baseHeaders = [
    // Colonne Distance en premier si point de référence défini
    ...(hasReferencePoint
      ? [
          <span key="distance" style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            Distance{filters.sortBy === 'distance' ? (filters.sortOrder === 'asc' ? ' ↑' : ' ↓') : ''}
          </span>,
        ]
      : []),
    <button
      key="nom"
      onClick={() => handleSort('nom')}
      className="fr-btn--tertiary-no-outline"
      style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
    >
      Nom{getSortIcon('nom')}
    </button>,
    'Adresse',
    <button
      key="commune"
      onClick={() => handleSort('commune')}
      className="fr-btn--tertiary-no-outline"
      style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
    >
      Commune{getSortIcon('commune')}
    </button>,
    <button
      key="departement"
      onClick={() => handleSort('departement')}
      className="fr-btn--tertiary-no-outline"
      style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
    >
      Département{getSortIcon('departement')}
    </button>,
  ];

  // Ajouter les colonnes dynamiques ou la colonne par défaut
  const headers = colonnesDynamiques.length > 0
    ? [
        ...baseHeaders,
        ...colonnesDynamiques.map((col) => (
          <span key={col.label} style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            {col.label}
          </span>
        )),
      ]
    : [
        ...baseHeaders,
        <button
          key="prix"
          onClick={() => handleSort('prix')}
          className="fr-btn--tertiary-no-outline"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Prix (VP){getSortIcon('prix')}
        </button>,
      ];

  const data = paginatedCentres.map((centre: Centre) => {
    // Calculer la distance si point de référence défini
    const distanceCell = hasReferencePoint && filters.referencePoint
      ? [
          <span
            key={`dist-${centre.siret}`}
            style={{ fontWeight: 500, color: 'var(--text-action-high-blue-france)' }}
          >
            {formatDistance(
              calculateDistance(
                filters.referencePoint.lat,
                filters.referencePoint.lng,
                centre.lat,
                centre.lng
              )
            )}
          </span>,
        ]
      : [];

    const baseData = [
      ...distanceCell,
      <strong key={centre.siret}>{centre.nom}</strong>,
      `${centre.adresse}, ${centre.codePostal}`,
      centre.commune,
      centre.nomDepartement,
    ];

    if (colonnesDynamiques.length > 0) {
      // Ajouter les prix pour chaque combinaison sélectionnée
      const prixCols = colonnesDynamiques.map((col) => {
        const prix = getPrixPourCombinaison(centre, col.vehicule, col.energie);
        return prix !== null ? (
          <Tag key={`${centre.siret}-${col.label}`}>{formatPrix(prix)}</Tag>
        ) : (
          <span key={`${centre.siret}-${col.label}`} style={{ color: 'var(--text-mention-grey)' }}>
            —
          </span>
        );
      });
      return [...baseData, ...prixCols];
    }

    // Colonne par défaut : prix de référence
    return [
      ...baseData,
      <Tag key={`price-${centre.siret}`}>{formatPrix(centre.prixReference)}</Tag>,
    ];
  });

  return (
    <>
      <Table
        caption="Liste des centres de contrôle technique"
        headers={headers}
        data={data}
      />

      {totalPages > 1 && (
        <div className="fr-mt-3w">
          <Pagination
            count={totalPages}
            defaultPage={currentPage}
            getPageLinkProps={(page) => ({
              onClick: (e) => {
                e.preventDefault();
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              },
              href: '#',
            })}
          />
        </div>
      )}
    </>
  );
}
