import type { Centre } from '@/types';
import { formatPrix } from '@/utils/formatters';

interface TopListProps {
  title: string;
  centres: Centre[];
  variant?: 'success' | 'error';
}

export function TopList({ title, centres, variant = 'success' }: TopListProps) {
  const badgeClass = variant === 'success' ? 'fr-badge--success' : 'fr-badge--error';
  const accentColor = variant === 'success' ? '#18753c' : '#ce0500';

  return (
    <div
      style={{
        backgroundColor: 'var(--background-alt-grey)',
        borderRadius: '8px',
        padding: '1.5rem',
        height: '100%',
      }}
    >
      <h3 className="fr-h6 fr-mb-2w">{title}</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {centres.map((centre, index) => (
          <div
            key={centre.siret}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              backgroundColor: 'var(--background-default-grey)',
              borderRadius: '8px',
            }}
          >
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: index < 3 ? accentColor : 'var(--background-contrast-grey)',
                color: index < 3 ? '#fff' : 'var(--text-default-grey)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {index + 1}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={centre.nom}
              >
                {centre.nom}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8rem',
                  color: 'var(--text-mention-grey)',
                }}
              >
                {centre.commune} ({centre.departement})
              </p>
            </div>
            <span className={`fr-badge ${badgeClass}`}>
              {formatPrix(centre.prixReference)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
