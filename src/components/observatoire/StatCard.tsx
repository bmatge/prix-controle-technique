interface StatCardProps {
  value: string;
  label: string;
  icon?: string;
}

export function StatCard({ value, label, icon }: StatCardProps) {
  return (
    <div
      className="fr-tile fr-tile--horizontal"
      style={{
        height: '100%',
        padding: '1.5rem',
      }}
    >
      <div className="fr-tile__body">
        {icon && (
          <div className="fr-tile__icon">
            <span className={icon} aria-hidden="true" />
          </div>
        )}
        <div className="fr-tile__content">
          <p
            className="fr-text--bold"
            style={{
              fontSize: '2rem',
              color: 'var(--text-title-blue-france)',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {value}
          </p>
          <p
            className="fr-text--sm fr-mb-0"
            style={{ color: 'var(--text-mention-grey)' }}
          >
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
