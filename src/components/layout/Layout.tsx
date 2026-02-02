import type { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { useData } from '@/contexts/DataContext';
import { Alert } from '@codegouvfr/react-dsfr/Alert';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isLoading, error } = useData();

  return (
    <>
      <Header />
      <main id="main-content" role="main">
        {error && (
          <div className="fr-container fr-py-2w">
            <Alert
              severity="error"
              title="Erreur de chargement"
              description={error}
            />
          </div>
        )}
        {isLoading ? (
          <div className="fr-container fr-py-8w" style={{ textAlign: 'center' }}>
            <p>Chargement des données...</p>
          </div>
        ) : (
          children
        )}
      </main>
      <Footer />
    </>
  );
}
