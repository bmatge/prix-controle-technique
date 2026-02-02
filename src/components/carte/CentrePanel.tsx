import { useMemo } from 'react';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { Badge } from '@codegouvfr/react-dsfr/Badge';
import { Accordion } from '@codegouvfr/react-dsfr/Accordion';
import { Table } from '@codegouvfr/react-dsfr/Table';
import { useFilterStore } from '@/stores/filterStore';
import type { Centre, Tarif } from '@/types';
import { formatPrix, formatDate } from '@/utils/formatters';

interface TarifAffiche {
  tarif: Tarif;
  label: string;
}

interface CentrePanelProps {
  centre: Centre | null;
  onClose: () => void;
  height?: number;
}

export function CentrePanel({ centre, onClose, height = 600 }: CentrePanelProps) {
  const filters = useFilterStore((s) => s.filters);
  const filtreVehicules = filters.vehicules || [];
  const filtreEnergies = filters.energies || [];

  // Trouver les tarifs correspondant aux filtres multi-sélection
  const tarifsAffiches = useMemo((): TarifAffiche[] => {
    if (!centre) return [];

    const hasVehiculeFilter = filtreVehicules.length > 0;
    const hasEnergieFilter = filtreEnergies.length > 0;

    // Si pas de filtre, afficher le prix de référence
    if (!hasVehiculeFilter && !hasEnergieFilter) {
      const tarifRef = centre.tarifs.find(
        (t) => t.vehicule === 'VP' && (t.energie === 'Essence' || t.energie === 'Diesel')
      );
      if (tarifRef) {
        return [{ tarif: tarifRef, label: 'VP Essence/Diesel' }];
      }
      return [{
        tarif: { vehicule: '', energie: '', prix: centre.prixReference, contreVisiteMin: 0, contreVisiteMax: 0 },
        label: 'Prix de référence'
      }];
    }

    // Filtrer les tarifs selon les sélections
    const tarifsFiltres = centre.tarifs.filter((t) => {
      const matchVehicule = !hasVehiculeFilter || filtreVehicules.includes(t.vehicule);
      const matchEnergie = !hasEnergieFilter || filtreEnergies.includes(t.energie);
      return matchVehicule && matchEnergie;
    });

    return tarifsFiltres.map((t) => ({
      tarif: t,
      label: `${t.vehicule} · ${t.energie}`,
    }));
  }, [centre, filtreVehicules, filtreEnergies]);

  // Prix principal (premier tarif ou prix moyen si plusieurs)
  const { prixPrincipal, labelPrincipal } = useMemo(() => {
    if (tarifsAffiches.length === 0) {
      return { prixPrincipal: centre?.prixReference || 0, labelPrincipal: 'Prix de référence' };
    }
    if (tarifsAffiches.length === 1) {
      return { prixPrincipal: tarifsAffiches[0].tarif.prix, labelPrincipal: tarifsAffiches[0].label };
    }
    // Plusieurs tarifs : afficher le prix moyen
    const moyenne = tarifsAffiches.reduce((acc, t) => acc + t.tarif.prix, 0) / tarifsAffiches.length;
    return { prixPrincipal: moyenne, labelPrincipal: `Moyenne (${tarifsAffiches.length} tarifs)` };
  }, [tarifsAffiches, centre]);

  if (!centre) return null;

  return (
    <div
      style={{
        height,
        backgroundColor: 'var(--background-alt-grey)',
        borderRadius: '4px',
        overflowY: 'auto',
        padding: '1.5rem',
      }}
    >
      <div className="fr-grid-row fr-grid-row--middle fr-mb-2w">
        <div className="fr-col">
          <h2 className="fr-h5 fr-mb-0">{centre.nom}</h2>
        </div>
        <div className="fr-col-auto">
          <Button
            iconId="fr-icon-close-line"
            priority="tertiary no outline"
            title="Fermer"
            onClick={onClose}
            size="small"
          />
        </div>
      </div>

      <p className="fr-text--xs fr-hint-text fr-mb-2w">
        SIRET : {centre.siret}
      </p>

      {/* Prix principal avec badge type de prestation */}
      <div className="fr-mb-3w">
        <p
          className="fr-mb-1w"
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--text-title-grey)',
            lineHeight: 1,
          }}
        >
          {formatPrix(prixPrincipal)}
        </p>
        <Badge severity="info" noIcon small>
          {labelPrincipal}
        </Badge>
      </div>

      {/* Affichage des tarifs sélectionnés si plusieurs */}
      {tarifsAffiches.length > 1 && (
        <div className="fr-mb-3w">
          <h3 className="fr-text--bold fr-text--sm fr-mb-1w">Tarifs sélectionnés</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tarifsAffiches.map((item, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'var(--background-default-grey)',
                  borderRadius: '4px',
                }}
              >
                <span className="fr-text--sm">{item.label}</span>
                <Badge severity="new" noIcon small>
                  {formatPrix(item.tarif.prix)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="fr-mb-3w">
        <h3 className="fr-text--bold fr-text--sm fr-mb-1w">Adresse</h3>
        <p className="fr-text--sm fr-mb-0">
          {centre.adresse}<br />
          {centre.codePostal} {centre.commune}<br />
          {centre.nomDepartement} ({centre.departement})
        </p>
      </div>

      {(centre.tel || centre.url) && (
        <div className="fr-mb-3w">
          <h3 className="fr-text--bold fr-text--sm fr-mb-1w">Contact</h3>
          {centre.tel && (
            <p className="fr-text--sm fr-mb-1w">
              <a href={`tel:${centre.tel}`} className="fr-link">
                {centre.tel}
              </a>
            </p>
          )}
          {centre.url && (
            <p className="fr-text--sm fr-mb-0">
              <a href={centre.url} target="_blank" rel="noopener noreferrer" className="fr-link">
                Site web
              </a>
            </p>
          )}
        </div>
      )}

      {/* Tarifs détaillés en accordéon */}
      <Accordion label={`Tous les tarifs (${centre.tarifs.length})`} defaultExpanded={false}>
        <Table
          caption="Tarifs par type de véhicule et énergie"
          headers={['Véhicule', 'Énergie', 'Prix']}
          data={centre.tarifs.map((t) => [
            t.vehicule,
            t.energie,
            formatPrix(t.prix),
          ])}
        />
      </Accordion>

      <p className="fr-text--xs fr-hint-text fr-mt-3w">
        Mis à jour le {formatDate(centre.dateMAJ)}
      </p>
    </div>
  );
}
