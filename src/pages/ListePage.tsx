import { FilterPanel } from '@/components/filters/FilterPanel';
import { CentresTable } from '@/components/liste/CentresTable';

export function ListePage() {
  return (
    <>
      <div className="fr-container">
        <h1 className="fr-py-2w fr-mb-0">Liste des centres de contrôle technique</h1>
      </div>

      <FilterPanel showProximitySearch />

      <div className="fr-container fr-py-2w">
        <CentresTable />
      </div>
    </>
  );
}
