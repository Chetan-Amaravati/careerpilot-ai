import React from 'react'

interface HistoryPoint {
  date: string
  score: number
  role: string
}

interface HistoryChartProps {
  history: HistoryPoint[]
}

export default function HistoryChart({ history }: HistoryChartProps) {
  // Fallback demo data if history is empty
  const data = history && history.length > 0 ? history : [
    { date: 'Jul 1', score: 62, role: 'Python Developer' },
    { date: 'Jul 5', score: 71, role: 'Backend Engineer' },
    { date: 'Jul 10', score: 68, role: 'Fullstack Dev' },
    { date: 'Jul 15', score: 85, role: 'FastAPI Dev' }
  ]

  const width = 500
  const height = 180
  const paddingLeft = 40
  const paddingRight = 20
  const paddingTop = 20
  const paddingBottom = 30

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  // Get coordinates for each data point
  const getCoordinates = (index: number, score: number) => {
    const totalPoints = data.length
    const x = paddingLeft + (index / Math.max(1, totalPoints - 1)) * chartWidth
    // In SVG, y=0 is top, so we invert it: higher score -> smaller y
    const y = paddingTop + chartHeight - (score / 100) * chartHeight
    return { x, y }
  }

  const points = data.map((d, index) => getCoordinates(index, d.score))
  
  // Build SVG path string for the line
  const linePath = points.map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  
  // Build area path string (filled below the line)
  const areaPath = points.length > 0 
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : ''

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--secondary)" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0, 25, 50, 75, 100].map(level => {
          const y = paddingTop + chartHeight - (level / 100) * chartHeight
          return (
            <g key={level}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="var(--border-color)"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text
                x={paddingLeft - 10}
                y={y + 4}
                fill="var(--text-muted)"
                fontSize="0.7rem"
                textAnchor="end"
                fontWeight="600"
              >
                {level}%
              </text>
            </g>
          )
        })}

        {/* Shaded Area underneath the line */}
        {points.length > 0 && (
          <path d={areaPath} fill="url(#area-gradient)" />
        )}

        {/* The connecting line */}
        {points.length > 0 && (
          <path d={linePath} fill="none" stroke="url(#line-gradient)" strokeWidth="3" strokeLinecap="round" />
        )}

        {/* Data point markers */}
        {points.map((p, index) => (
          <g key={index} style={{ cursor: 'pointer' }}>
            <circle
              cx={p.x}
              cy={p.y}
              r="6"
              fill="var(--accent)"
              stroke="var(--bg-darker)"
              strokeWidth="2"
            />
            {/* Show score text above point */}
            <text
              x={p.x}
              y={p.y - 10}
              fill="var(--text-primary)"
              fontSize="0.75rem"
              fontWeight="800"
              textAnchor="middle"
            >
              {data[index].score}
            </text>
            {/* X-axis date labels */}
            <text
              x={p.x}
              y={paddingTop + chartHeight + 18}
              fill="var(--text-secondary)"
              fontSize="0.7rem"
              fontWeight="700"
              textAnchor="middle"
            >
              {data[index].date}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
