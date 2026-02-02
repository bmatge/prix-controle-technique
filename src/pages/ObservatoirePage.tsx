import { useStats } from '@/hooks/useStats';
import { useData } from '@/contexts/DataContext';
import { StatCard } from '@/components/observatoire/StatCard';
import { BarChart } from '@/components/observatoire/BarChart';
import { TopList } from '@/components/observatoire/TopList';
import { formatPrix, formatNumber, formatDate } from '@/utils/formatters';

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="fr-mb-2w">
      <h2
        style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          marginBottom: subtitle ? '0.25rem' : 0,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p style={{ color: 'var(--text-mention-grey)', fontSize: '0.9rem', margin: 0 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--background-alt-grey)',
        borderRadius: '12px',
        padding: '1.5rem',
        height: '100%',
      }}
    >
      <h3
        style={{
          fontSize: '1rem',
          fontWeight: 700,
          marginBottom: '0.25rem',
        }}
      >
        {title}
      </h3>
      {subtitle && (
        <p
          style={{
            color: 'var(--text-mention-grey)',
            fontSize: '0.85rem',
            marginBottom: '1rem',
          }}
        >
          {subtitle}
        </p>
      )}
      <div style={{ marginTop: subtitle ? 0 : '1rem' }}>{children}</div>
    </div>
  );
}

export function ObservatoirePage() {
  const stats = useStats();
  const { lastUpdate } = useData();

  if (!stats) {
    return (
      <div className="fr-container fr-py-4w">
        <p>Chargement des statistiques...</p>
      </div>
    );
  }

  return (
    <div className="fr-container fr-py-4w">
      {/* Header */}
      <div className="fr-mb-4w">
        <h1 style={{ marginBottom: '0.5rem' }}>Observatoire des prix</h1>
        {lastUpdate && (
          <p style={{ color: 'var(--text-mention-grey)', fontSize: '0.9rem' }}>
            Données mises à jour le {formatDate(lastUpdate)}
          </p>
        )}
      </div>

      {/* Key metrics */}
      <div className="fr-grid-row fr-grid-row--gutters fr-mb-5w">
        <div className="fr-col-6 fr-col-md-3">
          <StatCard
            value={formatPrix(stats.prixMoyen)}
            label="Prix moyen national"
          />
        </div>
        <div className="fr-col-6 fr-col-md-3">
          <StatCard
            value={formatPrix(stats.prixMedian)}
            label="Prix médian"
          />
        </div>
        <div className="fr-col-6 fr-col-md-3">
          <StatCard
            value={`${formatPrix(stats.prixMin)} - ${formatPrix(stats.prixMax)}`}
            label="Fourchette de prix"
          />
        </div>
        <div className="fr-col-6 fr-col-md-3">
          <StatCard
            value={formatNumber(stats.nombreCentres)}
            label="Centres agréés"
          />
        </div>
      </div>

      {/* Top centres */}
      <SectionHeader title="Classement des centres" />
      <div className="fr-grid-row fr-grid-row--gutters fr-mb-5w">
        <div className="fr-col-12 fr-col-lg-6">
          <TopList
            title="Top 10 des moins chers"
            centres={stats.topMoinsChers}
            variant="success"
          />
        </div>
        <div className="fr-col-12 fr-col-lg-6">
          <TopList
            title="Top 10 des plus chers"
            centres={stats.topPlusChers}
            variant="error"
          />
        </div>
      </div>

      {/* Price by region */}
      <SectionHeader title="Analyse par région" />
      <div className="fr-grid-row fr-grid-row--gutters fr-mb-5w">
        <div className="fr-col-12 fr-col-lg-6">
          <ChartCard title="Régions les moins chères">
            <BarChart
              data={stats.parRegion.slice(0, 8).map((r) => ({
                label: r.nom,
                value: r.prixMoyen,
              }))}
              valueFormatter={formatPrix}
              color="#18753c"
              showRank
            />
          </ChartCard>
        </div>
        <div className="fr-col-12 fr-col-lg-6">
          <ChartCard title="Régions les plus chères">
            <BarChart
              data={stats.parRegion.slice(-8).reverse().map((r) => ({
                label: r.nom,
                value: r.prixMoyen,
              }))}
              valueFormatter={formatPrix}
              color="#ce0500"
              showRank
            />
          </ChartCard>
        </div>
      </div>

      {/* Price spread */}
      <SectionHeader
        title="Écarts de prix par département"
        subtitle="Différence entre le centre le moins cher et le plus cher"
      />
      <div className="fr-mb-5w">
        <ChartCard title="Départements avec les plus grands écarts">
          <BarChart
            data={stats.ecartsMax.slice(0, 8).map((d) => ({
              label: d.nom,
              value: d.ecart,
            }))}
            valueFormatter={(v) => `${formatPrix(v)}`}
            color="#6a6af4"
            showRank
          />
        </ChartCard>
      </div>

      {/* Centres count by region */}
      <SectionHeader title="Répartition géographique" />
      <div className="fr-mb-4w">
        <ChartCard title="Nombre de centres par région">
          <BarChart
            data={[...stats.parRegion]
              .sort((a, b) => b.count - a.count)
              .map((r) => ({
                label: r.nom,
                value: r.count,
              }))}
            valueFormatter={(v) => `${formatNumber(v)} centres`}
            color="#000091"
          />
        </ChartCard>
      </div>
    </div>
  );
}
