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

const NODE_W = 130
const NODE_H = 90
const H_GAP = 60
const V_GAP = 100
const DRAG_THRESHOLD = 5 // px moved before considered a drag

function buildLayout(members, relationships) {
  if (!members.length) return { nodes: [], edges: [], canvasW: 800, canvasH: 600 }

  const adj = {}
  members.forEach(m => { adj[m.id] = [] })
  relationships.forEach(r => {
    adj[r.from]?.push({ id: r.to, type: r.type })
    adj[r.to]?.push({ id: r.from, type: r.type })
  })

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
  members.forEach(m => { if (!(m.id in levels)) levels[m.id] = 0 })

  const byLevel = {}
  members.forEach(m => {
    const l = levels[m.id]
    if (!byLevel[l]) byLevel[l] = []
    byLevel[l].push(m.id)
  })

  const sortedLevels = Object.keys(byLevel).map(Number).sort((a, b) => a - b)
  const maxPerRow = Math.max(...sortedLevels.map(l => byLevel[l].length))
  const canvasW = Math.max(800, maxPerRow * (NODE_W + H_GAP) + H_GAP * 2)

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

  const canvasH = sortedLevels.length * (NODE_H + V_GAP) + 120

  return { defaultPos: pos, canvasW, canvasH }
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

// Split a name into lines that fit within maxChars per line
function wrapName(name, maxChars = 13) {
  const words = name.split(' ')
  const lines = []
  let current = ''
  for (const word of words) {
    if ((current + (current ? ' ' : '') + word).length <= maxChars) {
      current += (current ? ' ' : '') + word
    } else {
      if (current) lines.push(current)
      current = word.length > maxChars ? word.slice(0, maxChars - 1) + '…' : word
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 2) // max 2 lines
}

function getAge(birthdate) {
  if (!birthdate) return null
  return Math.floor((Date.now() - new Date(birthdate)) / (365.25 * 24 * 3600 * 1000))
}

const POSITIONS_KEY = 'family-roots-node-positions'

export default function FamilyTree({ members, relationships, onMemberClick }) {
  const { defaultPos, canvasW, canvasH } = buildLayout(members, relationships)

  // Load saved custom positions from localStorage
  const [customPos, setCustomPos] = useState(() => {
    try { return JSON.parse(localStorage.getItem(POSITIONS_KEY) || '{}') }
    catch { return {} }
  })

  // Merge default layout with any custom drag positions
  const getPos = useCallback((id) => customPos[id] || defaultPos[id] || { x: 0, y: 0 }, [customPos, defaultPos])

  // Save positions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(customPos))
  }, [customPos])

  const [hovered, setHovered] = useState(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  // Drag state
  const dragState = useRef(null) // { nodeId, startMouseX, startMouseY, startNodeX, startNodeY, isDragging }
  const canvasDragState = useRef(null) // for panning

  const svgRef = useRef()
  const containerRef = useRef()

  // Zoom with scroll wheel
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    setZoom(z => Math.min(2.5, Math.max(0.2, z - e.deltaY * 0.001)))
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // ── Node drag handlers ─────────────────────────
  const handleNodeMouseDown = useCallback((e, nodeId) => {
    e.stopPropagation() // don't trigger canvas pan
    const pos = getPos(nodeId)
    dragState.current = {
      nodeId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startNodeX: pos.x,
      startNodeY: pos.y,
      isDragging: false,
    }
  }, [getPos])

  const handleMouseMove = useCallback((e) => {
    // Node dragging
    if (dragState.current) {
      const dx = (e.clientX - dragState.current.startMouseX) / zoom
      const dy = (e.clientY - dragState.current.startMouseY) / zoom
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (!dragState.current.isDragging && dist > DRAG_THRESHOLD) {
        dragState.current.isDragging = true
      }

      if (dragState.current.isDragging) {
        const { nodeId, startNodeX, startNodeY } = dragState.current
        setCustomPos(prev => ({
          ...prev,
          [nodeId]: {
            x: startNodeX + dx,
            y: startNodeY + dy,
          }
        }))
      }
      return
    }

    // Canvas panning
    if (canvasDragState.current) {
      setPan({
        x: e.clientX - canvasDragState.current.startX,
        y: e.clientY - canvasDragState.current.startY,
      })
    }
  }, [zoom])

  const handleMouseUp = useCallback((e) => {
    if (dragState.current) {
      // If barely moved → treat as click
      if (!dragState.current.isDragging) {
        const node = members.find(m => m.id === dragState.current.nodeId)
        if (node) onMemberClick(node)
      }
      dragState.current = null
    }
    canvasDragState.current = null
  }, [members, onMemberClick])

  // Canvas pan on background mousedown
  const handleCanvasMouseDown = useCallback((e) => {
    if (e.target === svgRef.current || e.target.tagName === 'svg') {
      canvasDragState.current = {
        startX: e.clientX - pan.x,
        startY: e.clientY - pan.y,
      }
    }
  }, [pan])

  // Reset all custom positions
  const resetLayout = useCallback(() => {
    setCustomPos({})
    localStorage.removeItem(POSITIONS_KEY)
  }, [])

  if (!members.length) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>🌱</div>
        <h3>Your family tree awaits</h3>
        <p>Add your first family member to begin</p>
      </div>
    )
  }

  // Build edges using current positions
  const edges = relationships.map(r => {
    const fromPos = getPos(r.from)
    const toPos = getPos(r.to)
    return {
      ...r,
      x1: fromPos.x + NODE_W / 2,
      y1: fromPos.y + NODE_H,
      x2: toPos.x + NODE_W / 2,
      y2: toPos.y,
      color: REL_COLORS[r.type] || '#aaa'
    }
  })

  const isDraggingNode = dragState.current?.isDragging

  return (
    <div className={styles.wrapper}>
      {/* Controls */}
      <div className={styles.controls}>
        <button className="btn btn-sm btn-secondary" onClick={() => setZoom(z => Math.min(2.5, z + 0.1))}>+</button>
        <span style={{ fontSize: '0.78rem', color: 'var(--mist)', minWidth: '3rem', textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button className="btn btn-sm btn-secondary" onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}>−</button>
        <button className="btn btn-sm btn-secondary" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}>Reset View</button>
        <div style={{ width: 1, height: 16, background: 'var(--parchment)' }} />
        <button className="btn btn-sm btn-secondary" onClick={resetLayout} title="Reset all nodes to default positions">
          ↺ Reset Layout
        </button>
      </div>

      {/* Drag hint */}
      <div className={styles.hint}>
        🖱️ Drag nodes to rearrange · Scroll to zoom · Drag background to pan · Click node to edit
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {Object.entries(REL_LABELS).map(([k, v]) => (
          <div key={k} className={styles.legendItem}>
            <span style={{ width: 16, height: 3, background: REL_COLORS[k], borderRadius: 2, display: 'inline-block' }} />
            <span>{v}</span>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className={styles.canvas}
        style={{ cursor: isDraggingNode ? 'grabbing' : canvasDragState.current ? 'grabbing' : 'default' }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          ref={svgRef}
          width={canvasW}
          height={canvasH}
          style={{
            transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center top',
            transition: isDraggingNode || canvasDragState.current ? 'none' : 'transform 0.1s',
            userSelect: 'none',
          }}
        >
          <defs>
            <filter id="shadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
            </filter>
            <filter id="shadow-drag">
              <feDropShadow dx="0" dy="8" stdDeviation="10" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Edges — drawn first so they appear behind nodes */}
          {edges.map(e => {
            const midY = (e.y1 + e.y2) / 2
            const path = `M ${e.x1} ${e.y1} C ${e.x1} ${midY}, ${e.x2} ${midY}, ${e.x2} ${e.y2}`
            return (
              <g key={e.id}>
                <path
                  d={path} fill="none" stroke={e.color} strokeWidth="2"
                  strokeDasharray={e.type === 'spouse' ? '6,3' : undefined}
                  opacity="0.7"
                />
                <text
                  x={(e.x1 + e.x2) / 2} y={midY - 4}
                  textAnchor="middle" fontSize="9"
                  fill={e.color} fontFamily="var(--font-body)" opacity="0.85"
                >
                  {REL_LABELS[e.type]}
                </text>
              </g>
            )
          })}

          {/* Nodes */}
          {members.map(member => {
            const pos = getPos(member.id)
            const isHov = hovered === member.id
            const isDraggingThis = dragState.current?.nodeId === member.id && dragState.current?.isDragging
            const age = getAge(member.birthdate)

            return (
              <g
                key={member.id}
                transform={`translate(${pos.x},${pos.y})`}
                onMouseDown={e => handleNodeMouseDown(e, member.id)}
                onMouseEnter={() => setHovered(member.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: isDraggingThis ? 'grabbing' : 'grab' }}
              >
                {/* Card background */}
                <rect
                  width={NODE_W} height={NODE_H} rx="10"
                  fill={isDraggingThis ? 'var(--forest)' : isHov ? '#f0f7f3' : '#fff'}
                  stroke={isDraggingThis ? 'var(--gold)' : isHov ? 'var(--forest)' : 'var(--parchment)'}
                  strokeWidth={isDraggingThis ? 2.5 : 1.5}
                  filter={isDraggingThis ? 'url(#shadow-drag)' : 'url(#shadow)'}
                />

                {/* Top accent bar */}
                <rect
                  width={NODE_W} height={4} rx="2"
                  fill={isDraggingThis ? 'var(--gold)' : 'var(--forest)'}
                />

                {/* Avatar */}
                <clipPath id={`clip-${member.id}`}><circle cx="24" cy="38" r="18" /></clipPath>
                <circle
                  cx="24" cy="38" r="18"
                  fill={isDraggingThis ? 'rgba(255,255,255,0.2)' : 'var(--cream-dk)'}
                  stroke={isDraggingThis ? 'var(--gold)' : 'var(--parchment)'}
                  strokeWidth="1.5"
                />
                {member.photo
                  ? <image href={member.photo} x="6" y="20" width="36" height="36"
                      clipPath={`url(#clip-${member.id})`} preserveAspectRatio="xMidYMid slice" />
                  : <text x="24" y="44" textAnchor="middle" fontSize="12" fontWeight="700"
                      fill={isDraggingThis ? '#fff' : 'var(--forest)'}
                      fontFamily="var(--font-head)">
                      {getInitials(member.name)}
                    </text>
                }

                {/* Name — word wrapped */}
                {(() => {
                  const lines = wrapName(member.name)
                  const isTwoLine = lines.length > 1
                  const nameY = isTwoLine ? 26 : 34
                  return (
                    <text
                      x="50" fontSize="11" fontWeight="600"
                      fill={isDraggingThis ? '#fff' : 'var(--ink)'}
                      fontFamily="var(--font-body)"
                    >
                      {lines.map((line, li) => (
                        <tspan key={li} x="50" y={nameY + li * 14} dominantBaseline="middle">
                          {line}
                        </tspan>
                      ))}
                    </text>
                  )
                })()}

                {/* Age / year */}
                {member.birthdate && (
                  <text
                    x="50" y={wrapName(member.name).length > 1 ? 58 : 50}
                    fontSize="9"
                    fill={isDraggingThis ? 'rgba(255,255,255,0.8)' : 'var(--mist)'}
                    fontFamily="var(--font-body)" dominantBaseline="middle"
                  >
                    {age} yrs · {new Date(member.birthdate).getFullYear()}
                  </text>
                )}

                {/* Drag indicator */}
                {isDraggingThis && (
                  <text x={NODE_W / 2} y={NODE_H - 6} textAnchor="middle"
                    fontSize="8" fill="rgba(255,255,255,0.7)" fontFamily="var(--font-body)">
                    moving…
                  </text>
                )}

                {/* Hover hint */}
                {isHov && !isDraggingThis && (
                  <text x={NODE_W / 2} y={NODE_H - 6} textAnchor="middle"
                    fontSize="8" fill="var(--mist)" fontFamily="var(--font-body)">
                    drag · click to edit
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
