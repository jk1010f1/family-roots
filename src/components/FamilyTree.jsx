import { useRef, useEffect, useState, useCallback } from 'react'
import styles from './FamilyTree.module.css'

const REL_COLORS = {
  parent: '#2d5a40',
  spouse: '#c4622d',
  sibling: '#c8963e',
  grandparent: '#5c3d2e',
  aunt_uncle: '#8fa89a',
  cousin: '#8b6555',
  other: '#aaa',
}

const REL_LABELS = {
  parent: 'Parent/Child', spouse: 'Spouse', sibling: 'Sibling',
  grandparent: 'Grandparent', aunt_uncle: 'Aunt/Uncle', cousin: 'Cousin', other: 'Other'
}

const NODE_W = 120
const NODE_H = 80
const H_GAP = 60
const V_GAP = 100

function buildLayout(members, relationships) {
  if (!members.length) return { nodes: [], edges: [] }

  // Build adjacency
  const adj = {}
  members.forEach(m => { adj[m.id] = [] })
  relationships.forEach(r => {
    adj[r.from]?.push({ id: r.to, type: r.type, relId: r.id })
    adj[r.to]?.push({ id: r.from, type: r.type, relId: r.id })
  })

  // BFS to assign levels
  const levels = {}
  const visited = new Set()
  const queue = [{ id: members[0].id, level: 0 }]
  while (queue.length) {
    const { id, level } = queue.shift()
    if (visited.has(id)) continue
    visited.add(id)
    levels[id] = level
    adj[id].forEach(({ id: nid, type }) => {
      if (!visited.has(nid)) {
        const delta = type === 'parent' ? 1 : type === 'grandparent' ? 2 : 0
        queue.push({ id: nid, level: level + delta })
      }
    })
  }
  // unvisited get level 0
  members.forEach(m => { if (!(m.id in levels)) levels[m.id] = 0 })

  // Group by level
  const byLevel = {}
  members.forEach(m => {
    const l = levels[m.id]
    if (!byLevel[l]) byLevel[l] = []
    byLevel[l].push(m.id)
  })

  const sortedLevels = Object.keys(byLevel).map(Number).sort((a,b)=>a-b)
  const maxPerRow = Math.max(...sortedLevels.map(l => byLevel[l].length))
  const canvasW = Math.max(600, maxPerRow * (NODE_W + H_GAP) + H_GAP)

  const pos = {}
  sortedLevels.forEach((level, li) => {
    const row = byLevel[level]
    const rowW = row.length * NODE_W + (row.length - 1) * H_GAP
    const startX = (canvasW - rowW) / 2
    row.forEach((id, i) => {
      pos[id] = {
        x: startX + i * (NODE_W + H_GAP),
        y: li * (NODE_H + V_GAP) + 40
      }
    })
  })

  const canvasH = sortedLevels.length * (NODE_H + V_GAP) + 80

  const nodes = members.map(m => ({ ...m, ...pos[m.id] }))
  const edges = relationships.map(r => ({
    ...r,
    x1: pos[r.from]?.x + NODE_W / 2,
    y1: pos[r.from]?.y + NODE_H,
    x2: pos[r.to]?.x + NODE_W / 2,
    y2: pos[r.to]?.y,
    color: REL_COLORS[r.type] || '#aaa'
  }))

  return { nodes, edges, canvasW, canvasH }
}

function getInitials(name) {
  return name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
}

export default function FamilyTree({ members, relationships, onMemberClick }) {
  const { nodes, edges, canvasW, canvasH } = buildLayout(members, relationships)
  const [hovered, setHovered] = useState(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const svgRef = useRef()

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    setZoom(z => Math.min(2, Math.max(0.3, z - e.deltaY * 0.001)))
  }, [])

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  if (!members.length) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🌱</div>
        <h3>Your family tree awaits</h3>
        <p>Add your first family member to begin</p>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      {/* Zoom controls */}
      <div className={styles.controls}>
        <button className="btn btn-sm btn-secondary" onClick={() => setZoom(z => Math.min(2, z+0.1))}>+</button>
        <span style={{ fontSize:'0.78rem', color:'var(--mist)', minWidth:'3rem', textAlign:'center' }}>{Math.round(zoom*100)}%</span>
        <button className="btn btn-sm btn-secondary" onClick={() => setZoom(z => Math.max(0.3, z-0.1))}>−</button>
        <button className="btn btn-sm btn-secondary" onClick={() => { setZoom(1); setPan({x:0,y:0}) }}>Reset</button>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {Object.entries(REL_LABELS).map(([k,v]) => (
          <div key={k} className={styles.legendItem}>
            <span style={{ width:16, height:3, background:REL_COLORS[k], borderRadius:2, display:'inline-block' }}/>
            <span>{v}</span>
          </div>
        ))}
      </div>

      <div
        className={styles.canvas}
        ref={svgRef}
        onMouseDown={e => { setDragging(true); setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }) }}
        onMouseMove={e => { if (dragging && dragStart) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }) }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
      >
        <svg
          width={canvasW} height={canvasH}
          style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin:'center top', transition: dragging ? 'none' : 'transform 0.1s' }}
        >
          <defs>
            <filter id="shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12"/>
            </filter>
          </defs>

          {/* Edges */}
          {edges.map(e => {
            const midY = (e.y1 + e.y2) / 2
            const path = `M ${e.x1} ${e.y1} C ${e.x1} ${midY}, ${e.x2} ${midY}, ${e.x2} ${e.y2}`
            return (
              <g key={e.id}>
                <path d={path} fill="none" stroke={e.color} strokeWidth="2" strokeDasharray={e.type==='spouse'?'6,3':undefined} opacity="0.7"/>
                <text x={(e.x1+e.x2)/2} y={midY} textAnchor="middle" fontSize="9" fill={e.color} fontFamily="var(--font-body)" opacity="0.85">
                  {REL_LABELS[e.type]}
                </text>
              </g>
            )
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const isHov = hovered === node.id
            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                style={{ cursor:'pointer', transition:'all 0.15s' }}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onMemberClick(node)}
              >
                {/* Card bg */}
                <rect
                  width={NODE_W} height={NODE_H} rx="10"
                  fill={isHov ? 'var(--forest)' : '#fff'}
                  stroke={isHov ? 'var(--forest)' : 'var(--parchment)'}
                  strokeWidth="1.5"
                  filter="url(#shadow)"
                />
                {/* Top accent */}
                <rect width={NODE_W} height={4} rx="2" fill={isHov ? 'var(--gold)' : 'var(--forest)'} />

                {/* Avatar circle */}
                <clipPath id={`clip-${node.id}`}><circle cx="24" cy="38" r="18"/></clipPath>
                <circle cx="24" cy="38" r="18" fill={isHov ? 'rgba(255,255,255,0.15)' : 'var(--cream-dk)'}
                  stroke={isHov ? 'var(--gold)' : 'var(--parchment)'} strokeWidth="1.5"/>
                {node.photo
                  ? <image href={node.photo} x="6" y="20" width="36" height="36" clipPath={`url(#clip-${node.id})`} preserveAspectRatio="xMidYMid slice"/>
                  : <text x="24" y="44" textAnchor="middle" fontSize="12" fontWeight="700"
                      fill={isHov ? '#fff' : 'var(--forest)'} fontFamily="var(--font-head)">{getInitials(node.name)}</text>
                }

                {/* Name */}
                <text x="48" y="32" fontSize="11" fontWeight="600" fill={isHov ? '#fff' : 'var(--ink)'}
                  fontFamily="var(--font-body)" dominantBaseline="middle">
                  {node.name.length > 13 ? node.name.slice(0,12)+'…' : node.name}
                </text>

                {/* Age */}
                {node.birthdate && (
                  <text x="48" y="49" fontSize="9" fill={isHov ? 'rgba(255,255,255,0.75)' : 'var(--mist)'}
                    fontFamily="var(--font-body)" dominantBaseline="middle">
                    {(() => {
                      const age = Math.floor((Date.now() - new Date(node.birthdate)) / (365.25*24*3600*1000))
                      return `${age} yrs · ${new Date(node.birthdate).getFullYear()}`
                    })()}
                  </text>
                )}

                {/* Click hint */}
                {isHov && (
                  <text x={NODE_W/2} y={NODE_H-8} textAnchor="middle" fontSize="8"
                    fill="rgba(255,255,255,0.6)" fontFamily="var(--font-body)">click to edit</text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
