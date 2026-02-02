import { Footer as DsfrFooter } from '@codegouvfr/react-dsfr/Footer';

export function Footer() {
  return (
    <DsfrFooter
      accessibility="partially compliant"
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
      bottomItems={[
        {
          text: 'Données ouvertes',
          linkProps: {
            href: 'https://data.economie.gouv.fr/explore/dataset/prix-controle-technique',
            target: '_blank',
            rel: 'noopener noreferrer',
          },
        },
      ]}
      contentDescription="Ce site permet de consulter et comparer les prix des contrôles techniques en France, à partir des données ouvertes publiées par le Ministère de l'Économie."
    />
  );
}
