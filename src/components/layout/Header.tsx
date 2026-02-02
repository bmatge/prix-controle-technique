import { Header as DsfrHeader } from '@codegouvfr/react-dsfr/Header';
import { useLocation } from 'react-router-dom';

export function Header() {
  const location = useLocation();

  return (
    <DsfrHeader
      brandTop={
        <>
          RÉPUBLIQUE
          <br />
          FRANÇAISE
        </>
      }
      homeLinkProps={{
        to: '/',
        title: 'Accueil - Prix des Contrôles Techniques',
      }}
      serviceTitle="Prix des Contrôles Techniques"
      serviceTagline="Comparez les tarifs des centres agréés en France"
      navigation={[
        {
          text: 'Carte',
          linkProps: {
            to: '/carte',
          },
          isActive: location.pathname === '/carte',
        },
        {
          text: 'Liste',
          linkProps: {
            to: '/liste',
          },
          isActive: location.pathname === '/liste',
        },
        {
          text: 'Observatoire',
          linkProps: {
            to: '/observatoire',
          },
          isActive: location.pathname === '/observatoire',
        },
      ]}
    />
  );
}
