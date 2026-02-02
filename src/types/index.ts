export interface Tarif {
  vehicule: string;
  energie: string;
  prix: number;
  contreVisiteMin: number;
  contreVisiteMax: number;
}

export interface Centre {
  siret: string;
  nom: string;
  adresse: string;
  codePostal: string;
  commune: string;
  departement: string;
  nomDepartement: string;
  region: string;
  tel: string | null;
  url: string | null;
  lat: number;
  lng: number;
  tarifs: Tarif[];
  prixReference: number;
  dateMAJ: string;
}

export interface DataSet {
  centres: Centre[];
  lastUpdate: string;
  metadata: {
    totalCentres: number;
    regions: string[];
    departements: string[];
    vehicules: string[];
    energies: string[];
  };
}

export interface ReferencePoint {
  lat: number;
  lng: number;
  label: string;
}

export interface FilterState {
  region: string | null;
  departement: string | null;
  vehicules: string[];
  energies: string[];
  prixMin: number | null;
  prixMax: number | null;
  search: string;
  sortBy: 'prix' | 'nom' | 'commune' | 'departement' | 'distance';
  sortOrder: 'asc' | 'desc';
  referencePoint: ReferencePoint | null;
}

export interface Stats {
  prixMoyen: number;
  prixMin: number;
  prixMax: number;
  prixMedian: number;
  nombreCentres: number;
  parRegion: { nom: string; prixMoyen: number; count: number }[];
  parDepartement: { nom: string; prixMoyen: number; count: number }[];
  topMoinsChers: Centre[];
  topPlusChers: Centre[];
  ecartsMax: { nom: string; ecart: number; min: number; max: number }[];
}

// Types pour l'API data.gouv
export interface ApiRecord {
  cct_siret: string;
  cct_denomination: string;
  cct_adresse: string;
  cct_code_postal: string;
  cct_commune: string;
  code_departement: string;
  nom_departement: string;
  code_region: number;
  nom_region: string;
  cct_tel: string | null;
  cct_url: string | null;
  cct_update_date_time: string;
  longitude: number;
  latitude: number;
  cat_vehicule_id: number;
  cat_vehicule_libelle: string;
  cat_energie_id: number;
  cat_energie_libelle: string;
  prix_visite: number;
  date_application_visite: string;
  prix_contre_visite_mini: number;
  prix_contre_visite_maxi: number;
  date_application_contre_visite: string;
}

export interface ApiResponse {
  total_count: number;
  results: ApiRecord[];
}
