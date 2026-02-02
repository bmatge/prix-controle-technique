import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface ApiRecord {
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

interface Tarif {
  vehicule: string;
  energie: string;
  prix: number;
  contreVisiteMin: number;
  contreVisiteMax: number;
}

interface Centre {
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

const EXPORT_URL = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-controle-technique/exports/json?lang=fr&timezone=Europe%2FBerlin';

async function fetchAllRecords(): Promise<ApiRecord[]> {
  console.log('Fetching complete dataset from API...');
  console.log('This may take a moment...\n');

  const response = await fetch(EXPORT_URL);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const records: ApiRecord[] = await response.json();
  console.log(`Fetched ${records.length} records`);
  return records;
}

function aggregateCentres(records: ApiRecord[]): Centre[] {
  const centresMap = new Map<string, Centre>();

  for (const record of records) {
    const key = record.cct_siret;

    if (!centresMap.has(key)) {
      centresMap.set(key, {
        siret: record.cct_siret,
        nom: record.cct_denomination,
        adresse: record.cct_adresse,
        codePostal: record.cct_code_postal,
        commune: record.cct_commune,
        departement: record.code_departement,
        nomDepartement: record.nom_departement,
        region: record.nom_region,
        tel: record.cct_tel,
        url: record.cct_url,
        lat: record.latitude,
        lng: record.longitude,
        tarifs: [],
        prixReference: 0,
        dateMAJ: record.cct_update_date_time,
      });
    }

    const centre = centresMap.get(key)!;

    // Add tarif (avoid duplicates)
    const tarifKey = `${record.cat_vehicule_libelle}-${record.cat_energie_libelle}`;
    const existingTarif = centre.tarifs.find(
      t => `${t.vehicule}-${t.energie}` === tarifKey
    );

    if (!existingTarif) {
      centre.tarifs.push({
        vehicule: record.cat_vehicule_libelle,
        energie: record.cat_energie_libelle,
        prix: record.prix_visite,
        contreVisiteMin: record.prix_contre_visite_mini,
        contreVisiteMax: record.prix_contre_visite_maxi,
      });
    }

    // Update dateMAJ if more recent
    if (record.cct_update_date_time > centre.dateMAJ) {
      centre.dateMAJ = record.cct_update_date_time;
    }
  }

  // Calculate reference price (Voiture particulière, Essence or Diesel)
  for (const centre of centresMap.values()) {
    const refTarif = centre.tarifs.find(
      t => t.vehicule === 'Voiture particulière' && (t.energie === 'Essence' || t.energie === 'Diesel')
    );
    centre.prixReference = refTarif?.prix ?? centre.tarifs[0]?.prix ?? 0;
  }

  return Array.from(centresMap.values());
}

function extractMetadata(centres: Centre[]) {
  const regions = new Set<string>();
  const departements = new Set<string>();
  const vehicules = new Set<string>();
  const energies = new Set<string>();

  for (const centre of centres) {
    regions.add(centre.region);
    departements.add(centre.nomDepartement);
    for (const tarif of centre.tarifs) {
      vehicules.add(tarif.vehicule);
      energies.add(tarif.energie);
    }
  }

  return {
    totalCentres: centres.length,
    regions: Array.from(regions).sort(),
    departements: Array.from(departements).sort(),
    vehicules: Array.from(vehicules).sort(),
    energies: Array.from(energies).sort(),
  };
}

async function main() {
  try {
    const records = await fetchAllRecords();
    const centres = aggregateCentres(records);
    const metadata = extractMetadata(centres);

    console.log(`\nAggregated ${centres.length} unique centres`);
    console.log(`Regions: ${metadata.regions.length}`);
    console.log(`Départements: ${metadata.departements.length}`);
    console.log(`Types de véhicules: ${metadata.vehicules.length}`);
    console.log(`Types d'énergie: ${metadata.energies.length}`);

    const dataset = {
      centres,
      lastUpdate: new Date().toISOString(),
      metadata,
    };

    // Ensure directory exists
    const outputDir = resolve(__dirname, '../public/data');
    mkdirSync(outputDir, { recursive: true });

    const outputPath = resolve(outputDir, 'centres.json');
    writeFileSync(outputPath, JSON.stringify(dataset));

    console.log(`\nData saved to ${outputPath}`);

    // Calculate file size
    const stats = JSON.stringify(dataset);
    console.log(`File size: ${(stats.length / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
