import { useState } from 'react';

/**
 * LineChart - SVG-based dual-line trend chart
 * @param {Array} data - Array of objects (e.g. { monthName: 'Jan', sales: 100, purchases: 80 })
 * @param {Array} keys - Array of keys to plot (e.g. ['sales', 'purchases'])
 * @param {Array} colors - Array of stroke colors matching keys (e.g. ['#10b981', '#6366f1'])
 * @param {Array} labels - Array of display labels for keys (e.g. ['Sales', 'Purchases'])
 */
export const LineChart = ({ data = [], keys = [], colors = [], labels = [] }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm border border-dashed rounded-xl">
        No trend data available
      </div>
    );
  }

  const width = 600;
  const height = 300;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find max value across all keys to scale Y axis
  const maxVal = Math.max(
    ...data.flatMap(d => keys.map(k => d[k] || 0)),
    1000 // default minimum height floor
  );

  // Round up to a nice number
  const roundToNiceNumber = (num) => {
    if (num <= 0) return 1000;
    const power = Math.pow(10, Math.floor(Math.log10(num)));
    const ratio = num / power;
    let niceRatio;
    if (ratio <= 1) niceRatio = 1;
    else if (ratio <= 2) niceRatio = 2;
    else if (ratio <= 5) niceRatio = 5;
    else niceRatio = 10;
    return niceRatio * power;
  };
  const niceMaxVal = roundToNiceNumber(maxVal);

  const getX = (index) => {
    if (data.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (value) => {
    return height - paddingBottom - (value / niceMaxVal) * chartHeight;
  };

  // Generate grid values at 0%, 25%, 50%, 75%, 100%
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  const getPathData = (key) => {
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d[key] || 0)}`).join(' ');
  };

  const getAreaPathData = (key) => {
    const linePath = getPathData(key);
    if (!linePath) return '';
    const startX = getX(0);
    const endX = getX(data.length - 1);
    const baseY = height - paddingBottom;
    return `${linePath} L ${endX} ${baseY} L ${startX} ${baseY} Z`;
  };

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
        <defs>
          {keys.map((key, i) => (
            <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors[i]} stopOpacity="0.3" />
              <stop offset="100%" stopColor={colors[i]} stopOpacity="0.0" />
            </linearGradient>
          ))}
        </defs>

        {/* Grid lines */}
        {gridLines.map((ratio, i) => {
          const y = height - paddingBottom - ratio * chartHeight;
          const val = ratio * niceMaxVal;
          return (
            <g key={i} className="opacity-50">
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 4"
                className="text-border"
              />
              <text
                x={paddingLeft - 10}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-muted-foreground font-medium"
              >
                ₹{val >= 100000 ? `${(val / 100000).toFixed(1)}L` : val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
              </text>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={getX(i)}
            y={height - 15}
            textAnchor="middle"
            className="text-[11px] fill-muted-foreground font-semibold"
          >
            {d.monthName}
          </text>
        ))}

        {/* Area paths */}
        {keys.map((key, i) => (
          <path
            key={`area-${key}`}
            d={getAreaPathData(key)}
            fill={`url(#gradient-${key})`}
            className="transition-all duration-300"
          />
        ))}

        {/* Lines */}
        {keys.map((key, i) => (
          <path
            key={`line-${key}`}
            d={getPathData(key)}
            fill="none"
            stroke={colors[i]}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
        ))}

        {/* Hover vertical guideline */}
        {hoveredIndex !== null && (
          <line
            x1={getX(hoveredIndex)}
            y1={paddingTop}
            x2={getX(hoveredIndex)}
            y2={height - paddingBottom}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            className="text-muted-foreground/45"
          />
        )}

        {/* Highlighted circles for hovered index */}
        {keys.map((key, kIdx) =>
          data.map((d, i) => {
            const x = getX(i);
            const y = getY(d[key] || 0);
            const isHovered = hoveredIndex === i;
            return (
              <circle
                key={`dot-${key}-${i}`}
                cx={x}
                cy={y}
                r={isHovered ? 5.5 : 3.5}
                fill={colors[kIdx]}
                stroke="white"
                strokeWidth={isHovered ? 2 : 1}
                className="transition-all duration-150 shadow-sm"
              />
            );
          })
        )}

        {/* Invisible columns for mouse interactions */}
        {data.map((_, i) => {
          const colWidth = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;
          const x = getX(i) - colWidth / 2;
          return (
            <rect
              key={`hover-rect-${i}`}
              x={i === 0 ? paddingLeft : x}
              y={paddingTop}
              width={i === 0 || i === data.length - 1 ? colWidth / 2 : colWidth}
              height={chartHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          );
        })}
      </svg>

      {/* HTML absolute position Tooltip overlay */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          className="absolute z-10 p-3 bg-card border rounded-lg shadow-xl text-[11px] flex flex-col gap-1 pointer-events-none transition-all duration-100 ease-out border-border/80"
          style={{
            left: `${((getX(hoveredIndex) - 10) / width) * 100}%`,
            top: '0px',
            transform: `translateX(-50%)`,
            minWidth: '130px'
          }}
        >
          <div className="font-bold border-b pb-1 mb-1 text-foreground text-[11px]">
            {data[hoveredIndex].monthName} {data[hoveredIndex].year}
          </div>
          {keys.map((key, i) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i] }} />
                {labels[i]}:
              </span>
              <span className="font-bold text-foreground">
                ₹{(data[hoveredIndex][key] || 0).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * DonutChart - SVG-based segment circular chart
 * @param {Array} data - Array of objects (e.g. { name: 'Cash', value: 45000 })
 * @param {Array} colors - Array of color strings
 */
export const DonutChart = ({ data = [], colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-muted-foreground text-sm border border-dashed rounded-xl">
        No distribution data
      </div>
    );
  }

  const radius = 65;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius; // ~408.4
  const center = 90;

  let accumulatedPercent = 0;

  const segments = data.map((item, index) => {
    const percent = (item.value || 0) / total;
    const strokeLength = percent * circumference;
    const strokeOffset = circumference - (accumulatedPercent * circumference) + (circumference / 4);
    accumulatedPercent += percent;

    return {
      ...item,
      percent,
      strokeLength,
      strokeOffset,
      color: colors[index % colors.length],
      index
    };
  });

  const activeSegment = activeIndex !== null ? segments[activeIndex] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center w-full py-2">
      {/* Donut Circle */}
      <div className="relative w-40 h-40 flex-shrink-0">
        <svg viewBox="0 0 180 180" className="w-full h-full transform -rotate-90">
          {segments.map((seg) => {
            const isHighlighted = activeIndex === seg.index;
            return (
              <circle
                key={seg.name}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={isHighlighted ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={`${seg.strokeLength} ${circumference}`}
                strokeDashoffset={-seg.strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-200 cursor-pointer"
                style={{ transformOrigin: 'center' }}
                onMouseEnter={() => setActiveIndex(seg.index)}
                onMouseLeave={() => setActiveIndex(null)}
              />
            );
          })}
        </svg>

        {/* Center overlay labels */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate max-w-full">
            {activeSegment ? activeSegment.name : 'Total'}
          </span>
          <span className="text-[15px] font-extrabold text-foreground mt-0.5 leading-none">
            ₹{(activeSegment ? activeSegment.value : total).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          {activeSegment && (
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
              {(activeSegment.percent * 100).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 w-full max-w-[180px] justify-center">
        {segments.map((seg) => {
          const isHighlighted = activeIndex === seg.index;
          return (
            <div
              key={seg.name}
              className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
                isHighlighted ? 'bg-accent font-semibold shadow-sm' : 'hover:bg-accent/40'
              }`}
              onMouseEnter={() => setActiveIndex(seg.index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div className="flex items-center gap-2 truncate text-muted-foreground mr-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="truncate text-foreground text-[11px] font-medium">{seg.name}</span>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground flex-shrink-0">
                {(seg.percent * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * HorizontalBarChart - Best-selling product list
 * @param {Array} data - Array of objects (e.g. { name: 'iPhone', value: 12 })
 * @param {String} color - Color of the filled bar
 */
export const HorizontalBarChart = ({ data = [], color = '#3b82f6' }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const maxVal = Math.max(...data.map(d => d.value || 0), 1);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-muted-foreground text-sm border border-dashed rounded-xl">
        No product sales data
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {data.map((item, index) => {
        const percent = ((item.value || 0) / maxVal) * 100;
        const isHovered = hoveredIndex === index;

        return (
          <div
            key={item.name}
            className="flex flex-col gap-1 transition-all duration-150 p-2 rounded-xl hover:bg-accent/30"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span className="truncate max-w-[70%] font-medium" title={item.name}>
                {item.name}
              </span>
              <span className="text-muted-foreground font-bold flex-shrink-0">
                {item.value} units
              </span>
            </div>
            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${percent}%`,
                  backgroundColor: color,
                  opacity: isHovered ? 1 : 0.85,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * RadialBarChart - Concentric arc-style chart for categorical percentage breakdown
 * @param {Array} data - Array of objects (e.g. { name: 'Cash', value: 45000 })
 * @param {Array} colors - Array of color strings
 */
export const RadialBarChart = ({ data = [], colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'] }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-muted-foreground text-sm border border-dashed rounded-xl">
        No distribution data
      </div>
    );
  }

  const cx = 120;
  const cy = 120;
  const baseRadius = 30;
  const ringGap = 18;
  const strokeWidth = 13;

  const rings = data.map((item, i) => {
    const r = baseRadius + i * ringGap;
    const circumference = 2 * Math.PI * r;
    const percent = (item.value || 0) / total;
    const filled = percent * circumference;
    const color = colors[i % colors.length];
    return { ...item, r, circumference, percent, filled, color, index: i };
  });

  const svgSize = baseRadius + data.length * ringGap + strokeWidth + 20;
  const viewSize = svgSize * 2;

  const activeRing = activeIndex !== null ? rings[activeIndex] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full py-2">
      {/* Radial arcs + label below */}
      <div className="flex flex-col items-center gap-2 flex-shrink-0">
        <div style={{ width: viewSize, height: viewSize, maxWidth: 200, maxHeight: 200 }}>
          <svg viewBox={`0 0 ${viewSize} ${viewSize}`} className="w-full h-full">
            {/* Track rings (background) */}
            {rings.map((ring) => (
              <circle
                key={`track-${ring.index}`}
                cx={cx}
                cy={cy}
                r={ring.r}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-muted/30"
              />
            ))}
            {/* Filled arcs */}
            {rings.map((ring) => {
              const isActive = activeIndex === ring.index;
              return (
                <circle
                  key={`arc-${ring.index}`}
                  cx={cx}
                  cy={cy}
                  r={ring.r}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={isActive ? strokeWidth + 3 : strokeWidth}
                  strokeDasharray={`${ring.filled} ${ring.circumference}`}
                  strokeDashoffset={ring.circumference / 4}
                  strokeLinecap="round"
                  style={{ transformOrigin: `${cx}px ${cy}px`, transform: 'rotate(-90deg)', transition: 'all 0.2s' }}
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveIndex(ring.index)}
                  onMouseLeave={() => setActiveIndex(null)}
                />
              );
            })}
          </svg>
        </div>
        {/* Label below the chart */}
        <div className="text-center min-h-[40px] flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {activeRing ? activeRing.name : 'Total'}
          </span>
          <span className="text-[15px] font-extrabold text-foreground leading-tight">
            ₹{(activeRing ? activeRing.value : total).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
          {activeRing && (
            <span className="text-[11px] font-bold text-emerald-500 mt-0.5">
              {(activeRing.percent * 100).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 w-full max-w-[190px]">
        {rings.map((ring) => (
          <div
            key={ring.name}
            className={`flex items-center justify-between text-xs p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${
              activeIndex === ring.index ? 'bg-accent font-semibold' : 'hover:bg-accent/40'
            }`}
            onMouseEnter={() => setActiveIndex(ring.index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div className="flex items-center gap-2 min-w-0 mr-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ring.color }} />
              <span className="truncate text-foreground text-[11px] font-medium">{ring.name}</span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground flex-shrink-0">{(ring.percent * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * VerticalStackedBarChart - Stacked bar + individual bars for category value breakdown
 * @param {Array} data - Array of objects (e.g. { name: 'Wiring', value: 45000 })
 * @param {Array} colors - Array of color strings
 */
export const VerticalStackedBarChart = ({ data = [], colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'] }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-muted-foreground text-sm border border-dashed rounded-xl">
        No category data available
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => d.value || 0), 1);

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Individual breakdown bars */}
      <div className="flex flex-col gap-1.5">
        {data.map((item, i) => {
          const pct = ((item.value || 0) / total) * 100;
          const isHovered = hoveredIndex === i;
          return (
            <div
              key={item.name}
              className={`flex flex-col gap-0.5 p-1.5 rounded-lg transition-all duration-150 cursor-pointer ${isHovered ? 'bg-accent/50' : 'hover:bg-accent/20'}`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
                  <span className="truncate font-medium text-foreground text-[11px]" title={item.name}>{item.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.qty !== undefined ? (
                    <span className="text-[10px] font-bold text-muted-foreground">{item.qty} units</span>
                  ) : (
                    <span className="text-[10px] font-bold text-muted-foreground">{pct.toFixed(1)}%</span>
                  )}
                  <span className="text-[10px] font-bold text-foreground">₹{(item.value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(item.value / maxVal) * 100}%`, backgroundColor: colors[i % colors.length] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
