import React from 'react'

interface RadarChartProps {
  skills: { label: string; value: number }[] // array of 5 skills, values from 0 to 100
}

export default function RadarChart({ skills }: RadarChartProps) {
  // Ensure we have exactly 5 skills to draw a regular pentagon
  const data = skills.length === 5 ? skills : [
    { label: 'Backend', value: 80 },
    { label: 'Frontend', value: 65 },
    { label: 'Database', value: 75 },
    { label: 'DevOps', value: 50 },
    { label: 'Soft Skills', value: 90 }
  ]

  const size = 300
  const center = size / 2
  const rMax = 100 // maximum radius representing 100%

  // Calculate coordinates for a 5-sided pentagon point
  const getCoordinates = (index: number, value: number) => {
    const angle = (Math.PI * 2 / 5) * index - Math.PI / 2
    const r = (value / 100) * rMax
    const x = center + r * Math.cos(angle)
    const y = center + r * Math.sin(angle)
    return { x, y }
  }

  // Draw grid pentagons at 25%, 50%, 75%, and 100%
  const gridLevels = [25, 50, 75, 100]
  const gridPaths = gridLevels.map(level => {
    const points = []
    for (let i = 0; i < 5; i++) {
      const { x, y } = getCoordinates(i, level)
      points.push(`${x},${y}`)
    }
    return points.join(' ')
  })

  // Calculate coordinates for the actual candidate skill values
  const skillPoints = data.map((item, index) => {
    return getCoordinates(index, item.value)
  })
  const skillPathString = skillPoints.map(p => `${p.x},${p.y}`).join(' ')

  // Calculate coordinates for drawing text labels slightly outside the 100% line
  const labelPoints = data.map((item, index) => {
    return getCoordinates(index, 125) // push labels 25% further out
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.0" />
          </radialGradient>
        </defs>

        {/* Glow Background */}
        <circle cx={center} cy={center} r={rMax} fill="url(#radar-glow)" />

        {/* Grid Polygons */}
        {gridPaths.map((path, i) => (
          <polygon
            key={i}
            points={path}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth="1"
            strokeDasharray={i < 3 ? '4,4' : 'none'}
          />
        ))}

        {/* Grid Axis Lines from Center to Vertices */}
        {Array.from({ length: 5 }).map((_, i) => {
          const outerPoint = getCoordinates(i, 100)
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={outerPoint.x}
              y2={outerPoint.y}
              stroke="var(--border-color)"
              strokeWidth="1"
            />
          )
        })}

        {/* Skill Polygon Area */}
        <polygon
          points={skillPathString}
          fill="rgba(99, 102, 241, 0.25)"
          stroke="var(--primary)"
          strokeWidth="2.5"
        />

        {/* Skill Coordinates Circles */}
        {skillPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="5"
            fill="var(--accent)"
            stroke="#fff"
            strokeWidth="1.5"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
          />
        ))}

        {/* Labels */}
        {data.map((item, i) => {
          const lp = labelPoints[i]
          let textAnchor = 'middle'
          if (lp.x < center - 10) textAnchor = 'end'
          else if (lp.x > center + 10) textAnchor = 'start'

          return (
            <text
              key={i}
              x={lp.x}
              y={lp.y + 4} // slight adjustment
              fill="var(--text-secondary)"
              fontSize="0.75rem"
              fontWeight="700"
              textAnchor={textAnchor}
              style={{ letterSpacing: '0.02em' }}
            >
              {item.label} ({item.value}%)
            </text>
          )
        })}
      </svg>
    </div>
  )
}
