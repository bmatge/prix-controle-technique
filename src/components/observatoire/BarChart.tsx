import { useMemo } from 'react';

interface BarChartProps {
  data: { label: string; value: number }[];
  maxBars?: number;
  valueFormatter?: (value: number) => string;
  color?: string;
  showRank?: boolean;
}

export function BarChart({
  data,
  maxBars = 10,
  valueFormatter = (v) => v.toFixed(0),
  color = '#000091',
  showRank = false,
}: BarChartProps) {
  const displayData = useMemo(() => data.slice(0, maxBars), [data, maxBars]);

  const maxValue = useMemo(
    () => Math.max(...displayData.map((d) => d.value)),
    [displayData]
  );

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
            {showRank && (
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
            )}
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
                {valueFormatter(item.value)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
