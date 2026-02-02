import { formatPrix } from '@/utils/formatters';

interface MapLegendProps {
  mode: 'choropleth' | 'poi';
  priceRange: { min: number; max: number };
}

export function MapLegend({ mode, priceRange }: MapLegendProps) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        background: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 1000,
        fontSize: '0.85em',
      }}
    >
      <strong style={{ display: 'block', marginBottom: '8px' }}>
        {mode === 'choropleth' ? 'Prix moyen par département' : 'Prix des centres'}
      </strong>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{formatPrix(priceRange.min)}</span>
        <div
          style={{
            width: '100px',
            height: '12px',
            borderRadius: '6px',
            background: 'linear-gradient(to right, #18753c, #8dc572, #fcc63a, #ce0500)',
          }}
        />
        <span>{formatPrix(priceRange.max)}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ color: '#18753c', fontSize: '0.85em' }}>Moins cher</span>
        <span style={{ color: '#ce0500', fontSize: '0.85em' }}>Plus cher</span>
      </div>

      <p style={{ margin: '8px 0 0', fontSize: '0.85em', color: 'var(--text-mention-grey)' }}>
        {mode === 'choropleth'
          ? 'Zoomez ou cliquez pour voir les centres'
          : 'Dézoomez pour la vue par département'}
      </p>
    </div>
  );
}
