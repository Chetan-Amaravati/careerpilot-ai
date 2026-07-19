import React, { useState } from 'react'

interface SkillNode {
  id: string
  label: string
  level: 'Foundation' | 'Core' | 'Advanced'
  x: number
  y: number
  prereqs: string[]
}

export default function SkillTree() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const nodes: SkillNode[] = [
    // Foundation
    { id: 'python', label: 'Python Basics', level: 'Foundation', x: 60, y: 50, prereqs: [] },
    { id: 'html_css', label: 'HTML/CSS', level: 'Foundation', x: 60, y: 150, prereqs: [] },
    // Core
    { id: 'fastapi', label: 'FastAPI Dev', level: 'Core', x: 220, y: 50, prereqs: ['python'] },
    { id: 'sql', label: 'SQL / DBs', level: 'Core', x: 220, y: 100, prereqs: ['python'] },
    { id: 'react', label: 'React Frontend', level: 'Core', x: 220, y: 150, prereqs: ['html_css'] },
    // Advanced
    { id: 'docker', label: 'Docker Container', level: 'Advanced', x: 380, y: 50, prereqs: ['fastapi', 'sql'] },
    { id: 'devops', label: 'Kubernetes/Cloud', level: 'Advanced', x: 380, y: 120, prereqs: ['docker'] }
  ]

  const sizeX = 460
  const sizeY = 200

  // Check if a node is related to the hovered node (is a prereq or depends on it)
  const isHighlighted = (node: SkillNode) => {
    if (!hoveredNode) return false
    if (node.id === hoveredNode) return true
    
    const hoverItem = nodes.find(n => n.id === hoveredNode)
    if (!hoverItem) return false
    
    // Check if node is a prerequisite of hovered node
    if (hoverItem.prereqs.includes(node.id)) return true
    
    // Check if hovered node is a prerequisite of this node
    if (node.prereqs.includes(hoveredNode)) return true
    
    return false
  }

  // Draw connector path line
  const drawConnector = (start: SkillNode, end: SkillNode) => {
    const isLineHighlighted = hoveredNode && 
      ((hoveredNode === start.id && end.prereqs.includes(start.id)) || 
       (hoveredNode === end.id && end.prereqs.includes(start.id)))

    // Draw curve path
    const dx = end.x - start.x
    const cx1 = start.x + dx / 2
    const cy1 = start.y
    const cx2 = start.x + dx / 2
    const cy2 = end.y

    return (
      <path
        key={`${start.id}-${end.id}`}
        d={`M ${start.x} ${start.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${end.x} ${end.y}`}
        fill="none"
        stroke={isLineHighlighted ? 'var(--primary)' : 'var(--border-color)'}
        strokeWidth={isLineHighlighted ? '3.5' : '1.5'}
        strokeOpacity={isLineHighlighted ? 1.0 : 0.4}
        style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
      />
    )
  }

  return (
    <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <h4 style={{ fontSize: '0.95rem' }}>Skill Dependency Tree</h4>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hover over nodes to trace pathways</span>
      </div>

      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg width="100%" height={sizeY} viewBox={`0 0 ${sizeX} ${sizeY}`} preserveAspectRatio="xMidYMid meet">
          {/* Draw all prerequisites connecting lines */}
          {nodes.flatMap(endNode => 
            endNode.prereqs.map(prereqId => {
              const startNode = nodes.find(n => n.id === prereqId)
              return startNode ? drawConnector(startNode, endNode) : null
            })
          )}

          {/* Draw all nodes */}
          {nodes.map(node => {
            const active = hoveredNode === node.id
            const highlighted = isHighlighted(node)
            
            let color = 'var(--text-secondary)'
            let border = 'var(--border-color)'
            
            if (active) {
              color = '#fff'
              border = 'var(--accent)'
            } else if (highlighted) {
              color = 'var(--text-primary)'
              border = 'var(--primary)'
            }

            return (
              <g
                key={node.id}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="20"
                  fill="var(--bg-darker)"
                  stroke={border}
                  strokeWidth={active ? 3 : highlighted ? 2 : 1}
                  style={{ transition: 'stroke 0.2s, stroke-width 0.2s', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                />
                
                {/* Visual Indicators */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="4"
                  fill={node.level === 'Foundation' ? 'var(--success)' : node.level === 'Core' ? 'var(--primary)' : 'var(--secondary)'}
                />

                {/* Node Label Text */}
                <text
                  x={node.x}
                  y={node.y + 35}
                  fill={color}
                  fontSize="0.7rem"
                  fontWeight="800"
                  textAnchor="middle"
                  style={{ letterSpacing: '0.01em', pointerEvents: 'none' }}
                >
                  {node.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '0.75rem', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></span>
          <span style={{ color: 'var(--text-secondary)' }}>Foundational</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></span>
          <span style={{ color: 'var(--text-secondary)' }}>Core Stack</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary)' }}></span>
          <span style={{ color: 'var(--text-secondary)' }}>Advanced</span>
        </div>
      </div>
    </div>
  )
}
