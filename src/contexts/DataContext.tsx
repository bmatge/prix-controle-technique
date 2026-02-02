import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Centre, DataSet } from '@/types';

interface DataContextValue {
  centres: Centre[];
  metadata: DataSet['metadata'] | null;
  lastUpdate: string | null;
  isLoading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [metadata, setMetadata] = useState<DataSet['metadata'] | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/data/centres.json');
        if (!response.ok) {
          throw new Error(`Erreur de chargement: ${response.status}`);
        }

        const data: DataSet = await response.json();
        setCentres(data.centres);
        setMetadata(data.metadata);
        setLastUpdate(data.lastUpdate);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        console.error('Erreur de chargement des données:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <DataContext.Provider value={{ centres, metadata, lastUpdate, isLoading, error }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
