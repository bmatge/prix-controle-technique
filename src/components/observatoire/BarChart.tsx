import { useMemo, useEffect } from 'react';
import '@gouvfr/dsfr-chart/BarChart';
import '@gouvfr/dsfr-chart/BarChart.css';

interface BarChartProps {
  data: { label: string; value: number }[];
  maxBars?: number;
  valueFormatter?: (value: number) => string;
  color?: string;
  showRank?: boolean;
  horizontal?: boolean;
}

// Déclarer le custom element pour TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'bar-chart': {
        x: string;
        y: string;
        horizontal?: string;
        'selected-palette'?: string;
        name?: string;
        'unit-tooltip'?: string;
      };
    }
  }
}

// Mapping des couleurs custom vers les palettes DSFR
const getDSFRPalette = (color: string): string => {
  const paletteMap: Record<string, string> = {
    '#000091': 'default',
    '#18753c': 'sequentialAscending', // Vert
    '#ce0500': 'divergentDescending', // Rouge
    '#6a6af4': 'categorical',
  };
  return paletteMap[color] || 'default';
};

export function BarChart({
  data,
  maxBars = 10,
  valueFormatter,
  color = '#000091',
  showRank = false,
  horizontal = true,
}: BarChartProps) {
  const displayData = useMemo(() => data.slice(0, maxBars), [data, maxBars]);

  const maxValue = useMemo(
    () => Math.max(...displayData.map((d) => d.value)),
    [displayData]
  );

  // Si showRank est true, afficher une version custom avec numéros
  if (showRank) {
    const dsfrColor = `var(--${getDSFRPalette(color)})` || color;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {displayData.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;

          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                backgroundColor: index % 2 === 0 ? 'var(--background-alt-grey)' : 'transparent',
                borderRadius: '6px',
              }}
            >
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </span>
              <div
                style={{
                  width: '150px',
                  fontSize: '0.875rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  fontWeight: 500,
                }}
                title={item.label}
              >
                {item.label}
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    flex: 1,
                    height: '24px',
                    backgroundColor: 'var(--background-default-grey)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${percentage}%`,
                      background: `linear-gradient(90deg, ${color}dd 0%, ${color} 100%)`,
                      borderRadius: '12px',
                      transition: 'width 0.5s ease-out',
                      minWidth: '8px',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: color,
                    minWidth: '80px',
                    textAlign: 'right',
                  }}
                >
                  {valueFormatter ? valueFormatter(item.value) : item.value.toFixed(2) + ' €'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Utiliser le web component DSFR pour les graphiques sans rang
  const palette = getDSFRPalette(color);

  // Préparer les données au format DSFR: x et y doivent être des strings de listes de listes
  const labels = displayData.map((item) => item.label);
  const values = displayData.map((item) => item.value);

  const xData = JSON.stringify([labels]);
  const yData = JSON.stringify([values]);

  // Déterminer l'unité pour le tooltip
  const unit = valueFormatter && displayData.length > 0
    ? valueFormatter(displayData[0].value).replace(/[\d.,\s]/g, '').trim()
    : '';

  useEffect(() => {
    // Force le re-render du web component si besoin
    console.log('BarChart DSFR mounted with data:', { xData, yData, palette });
  }, [xData, yData, palette]);

  return (
    <div style={{ width: '100%', minHeight: '300px' }}>
      <bar-chart
        x={xData}
        y={yData}
        horizontal={horizontal ? 'true' : undefined}
        selected-palette={palette}
        name={JSON.stringify(['Prix'])}
        unit-tooltip={unit}
      />
    </div>
  );
}
