import { FilterPanel } from '@/components/filters/FilterPanel';
import { Map } from '@/components/carte/Map';

export function CartePage() {
  return (
    <>
      <div className="fr-container">
        <h1 className="fr-py-2w fr-mb-0">Carte des centres de contrôle technique</h1>
      </div>

      <FilterPanel showAddressSearch />

      <Map />
    </>
  );
}
