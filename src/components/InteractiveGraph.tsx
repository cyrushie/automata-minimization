import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { DFA, StateId } from '../types/dfa'
import { layoutDfa } from '../lib/layout'
import { curvedPath, groupEdges, selfLoopPath, type Point } from '../lib/edgeGeometry'
import {
  EDGE_COLOR,
  EDGE_HALO_COLOR,
  EDGE_LABEL_COLOR,
  NEUTRAL_COLOR,
  type BlockColor,
} from '../lib/palette'
import { MaximizeIcon, MinusIcon, PlusIcon, ResetIcon } from './icons'

const MIN_SCALE = 0.25
const MAX_SCALE = 2.5
const GRID = 24
const ACCENT = '#8875ff'

export interface SimEdge {
  from: StateId
  to: StateId
}

interface Transform {
  scale: number
  x: number
  y: number
}

interface Rect {
  x1: number
  y1: number
  x2: number
  y2: number
}

interface InteractiveGraphProps {
  dfa: DFA
  ariaLabel?: string
  colorForState?: (state: StateId) => BlockColor
  badgeForState?: (state: StateId) => string | undefined
  highlightStates?: Set<StateId>
  activeState?: StateId
  takenEdge?: SimEdge
  /** Changes on every simulation step to replay the transient step cue. */
  pulseKey?: number
}

type Interaction =
  | { mode: 'pan'; pointerId: number; startX: number; startY: number; origX: number; origY: number }
  | { mode: 'marquee'; pointerId: number; startWorld: Point; additive: boolean }
  | {
      mode: 'node'
      pointerId: number
      startClient: Point
      snapshot: Record<StateId, Point>
      states: StateId[]
      moved: boolean
    }

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function normalizeRect(a: Point, b: Point): Rect {
  return {
    x1: Math.min(a.x, b.x),
    y1: Math.min(a.y, b.y),
    x2: Math.max(a.x, b.x),
    y2: Math.max(a.y, b.y),
  }
}

export function InteractiveGraph({
  dfa,
  ariaLabel = 'Interactive state diagram',
  colorForState,
  badgeForState,
  highlightStates,
  activeState,
  takenEdge,
  pulseKey,
}: InteractiveGraphProps) {
  const layout = useMemo(() => layoutDfa(dfa), [dfa])
  const edges = useMemo(() => groupEdges(dfa), [dfa])
  const markerId = `arrow-${useId().replace(/:/g, '')}`

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const interactionRef = useRef<Interaction | null>(null)

  const [size, setSize] = useState({ w: 0, h: 0 })
  const [positions, setPositions] = useState<Record<StateId, Point>>({})
  const [transform, setTransform] = useState<Transform>({ scale: 1, x: 0, y: 0 })
  const [selected, setSelected] = useState<Set<StateId>>(new Set())
  const [hoveredNode, setHoveredNode] = useState<StateId | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null)
  const [marquee, setMarquee] = useState<Rect | null>(null)
  const [mode, setMode] = useState<Interaction['mode'] | null>(null)
  const [spaceHeld, setSpaceHeld] = useState(false)

  const posOf = useCallback(
    (state: StateId): Point => {
      const override = positions[state]
      if (override) return override
      const node = layout.byState[state]
      return node ? { x: node.x, y: node.y } : { x: 0, y: 0 }
    },
    [positions, layout],
  )

  /* Track container size so we can fit the view. */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect
      setSize({ w: rect.width, h: rect.height })
    })
    ro.observe(el)
    setSize({ w: el.clientWidth, h: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  const fitToNodes = useCallback(
    (nodes: StateId[]) => {
      if (!nodes.length || !size.w || !size.h) return
      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity
      for (const state of nodes) {
        const p = posOf(state)
        minX = Math.min(minX, p.x)
        minY = Math.min(minY, p.y)
        maxX = Math.max(maxX, p.x)
        maxY = Math.max(maxY, p.y)
      }
      const pad = 72
      const bw = Math.max(1, maxX - minX)
      const bh = Math.max(1, maxY - minY)
      const scale = clamp(
        Math.min((size.w - pad) / bw, (size.h - pad) / bh),
        MIN_SCALE,
        1.4,
      )
      setTransform({
        scale,
        x: (size.w - (minX + maxX) * scale) / 2,
        y: (size.h - (minY + maxY) * scale) / 2,
      })
    },
    [posOf, size.w, size.h],
  )

  const fitView = useCallback(() => {
    fitToNodes(layout.nodes.map((node) => node.state))
  }, [fitToNodes, layout])

  const zoomToSelection = useCallback(() => {
    if (selected.size) fitToNodes([...selected])
  }, [fitToNodes, selected])

  /* Reset node positions & selection whenever the shown DFA changes. */
  useEffect(() => {
    setPositions({})
    setSelected(new Set())
  }, [dfa])

  /* Fit once the layout and container are known. */
  useEffect(() => {
    if (!size.w || !size.h || !layout.nodes.length) return
    fitToNodes(layout.nodes.map((node) => node.state))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h, layout])

  const fitRef = useRef(fitView)
  fitRef.current = fitView
  const zoomSelRef = useRef(zoomToSelection)
  zoomSelRef.current = zoomToSelection

  /* Keyboard shortcuts: Space+drag pan, Shift+1 fit, Shift+2 zoom to selection. */
  useEffect(() => {
    const typing = (target: EventTarget | null) => {
      const el = target as HTMLElement | null
      if (!el) return false
      return (
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.tagName === 'SELECT' ||
        el.isContentEditable
      )
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (typing(event.target)) return
      if (event.code === 'Space') {
        event.preventDefault()
        setSpaceHeld(true)
      } else if (event.shiftKey && event.code === 'Digit1') {
        event.preventDefault()
        fitRef.current()
      } else if (event.shiftKey && event.code === 'Digit2') {
        event.preventDefault()
        zoomSelRef.current()
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') setSpaceHeld(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  /* Wheel: scroll pans, Ctrl/Cmd+scroll zooms at the cursor. */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = el.getBoundingClientRect()
      const px = event.clientX - rect.left
      const py = event.clientY - rect.top
      if (event.ctrlKey || event.metaKey) {
        setTransform((t) => {
          const factor = Math.exp(-event.deltaY * 0.002)
          const scale = clamp(t.scale * factor, MIN_SCALE, MAX_SCALE)
          const wx = (px - t.x) / t.scale
          const wy = (py - t.y) / t.scale
          return { scale, x: px - wx * scale, y: py - wy * scale }
        })
      } else {
        const dx = event.shiftKey && event.deltaX === 0 ? event.deltaY : event.deltaX
        const dy = event.shiftKey && event.deltaX === 0 ? 0 : event.deltaY
        setTransform((t) => ({ ...t, x: t.x - dx, y: t.y - dy }))
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const toWorld = useCallback(
    (clientX: number, clientY: number): Point => {
      const rect = svgRef.current?.getBoundingClientRect()
      const px = clientX - (rect?.left ?? 0)
      const py = clientY - (rect?.top ?? 0)
      return { x: (px - transform.x) / transform.scale, y: (py - transform.y) / transform.scale }
    },
    [transform.x, transform.y, transform.scale],
  )

  const endInteraction = useCallback((pointerId: number) => {
    interactionRef.current = null
    setMode(null)
    setMarquee(null)
    if (svgRef.current?.hasPointerCapture(pointerId)) {
      svgRef.current.releasePointerCapture(pointerId)
    }
  }, [])

  const handlePointerDown = (event: React.PointerEvent) => {
    if (event.button === 1 || spaceHeld) {
      event.preventDefault()
      svgRef.current?.setPointerCapture(event.pointerId)
      interactionRef.current = {
        mode: 'pan',
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        origX: transform.x,
        origY: transform.y,
      }
      setMode('pan')
      return
    }
    if (event.button !== 0) return
    if (event.target === svgRef.current) {
      svgRef.current?.setPointerCapture(event.pointerId)
      if (!event.shiftKey) setSelected(new Set())
      const world = toWorld(event.clientX, event.clientY)
      interactionRef.current = {
        mode: 'marquee',
        pointerId: event.pointerId,
        startWorld: world,
        additive: event.shiftKey,
      }
      setMarquee({ x1: world.x, y1: world.y, x2: world.x, y2: world.y })
      setMode('marquee')
    }
  }

  const handleNodePointerDown = (state: StateId) => (event: React.PointerEvent) => {
    if (event.button !== 0) return
    event.stopPropagation()
    svgRef.current?.setPointerCapture(event.pointerId)

    let next: Set<StateId>
    if (event.shiftKey) {
      next = new Set(selected)
      if (next.has(state)) next.delete(state)
      else next.add(state)
    } else {
      next = selected.has(state) ? new Set(selected) : new Set([state])
    }
    setSelected(next)

    const snapshot: Record<StateId, Point> = {}
    for (const s of dfa.states) snapshot[s] = posOf(s)
    interactionRef.current = {
      mode: 'node',
      pointerId: event.pointerId,
      startClient: { x: event.clientX, y: event.clientY },
      snapshot,
      states: [...next],
      moved: false,
    }
    setMode('node')
  }

  const handlePointerMove = (event: React.PointerEvent) => {
    const interaction = interactionRef.current
    if (!interaction) return
    if (interaction.mode === 'pan') {
      setTransform((t) => ({
        ...t,
        x: interaction.origX + (event.clientX - interaction.startX),
        y: interaction.origY + (event.clientY - interaction.startY),
      }))
    } else if (interaction.mode === 'marquee') {
      const world = toWorld(event.clientX, event.clientY)
      setMarquee(normalizeRect(interaction.startWorld, world))
    } else if (interaction.mode === 'node') {
      const dx = (event.clientX - interaction.startClient.x) / transform.scale
      const dy = (event.clientY - interaction.startClient.y) / transform.scale
      const next = { ...interaction.snapshot }
      for (const state of interaction.states) {
        const base = interaction.snapshot[state]
        if (base) next[state] = { x: base.x + dx, y: base.y + dy }
      }
      interaction.moved = true
      setPositions(next)
    }
  }

  const handlePointerUp = (event: React.PointerEvent) => {
    const interaction = interactionRef.current
    if (!interaction) return
    if (interaction.mode === 'marquee') {
      const world = toWorld(event.clientX, event.clientY)
      const rect = normalizeRect(interaction.startWorld, world)
      const hits = new Set(interaction.additive ? selected : [])
      for (const node of layout.nodes) {
        const p = posOf(node.state)
        if (p.x >= rect.x1 && p.x <= rect.x2 && p.y >= rect.y1 && p.y <= rect.y2) {
          hits.add(node.state)
        }
      }
      setSelected(hits)
    }
    endInteraction(interaction.pointerId)
  }

  const zoomBy = (factor: number) => {
    setTransform((t) => {
      const scale = clamp(t.scale * factor, MIN_SCALE, MAX_SCALE)
      const cx = size.w / 2
      const cy = size.h / 2
      const wx = (cx - t.x) / t.scale
      const wy = (cy - t.y) / t.scale
      return { scale, x: cx - wx * scale, y: cy - wy * scale }
    })
  }

  const radius = layout.radius
  const marqueeScreen = marquee
    ? {
        x: Math.min(marquee.x1, marquee.x2) * transform.scale + transform.x,
        y: Math.min(marquee.y1, marquee.y2) * transform.scale + transform.y,
        w: Math.abs(marquee.x2 - marquee.x1) * transform.scale,
        h: Math.abs(marquee.y2 - marquee.y1) * transform.scale,
      }
    : null

  /* Geometry of the transition taken by the current simulation step. */
  const takenGeometry = (() => {
    if (!takenEdge) return null
    const edge = edges.find((e) => e.from === takenEdge.from && e.to === takenEdge.to)
    if (!edge) return null
    const a = posOf(edge.from)
    const b = posOf(edge.to)
    return edge.from === edge.to ? selfLoopPath(a, radius) : curvedPath(a, b, radius, edge.curve)
  })()

  const cursorClass =
    mode === 'pan' ? 'canvas-cursor-panning' : spaceHeld ? 'canvas-cursor-pan' : ''

  return (
    <div
      ref={containerRef}
      className={`canvas-grid relative h-full w-full touch-none select-none overflow-hidden ${cursorClass}`}
      style={{
        backgroundSize: `${GRID * transform.scale}px ${GRID * transform.scale}px`,
        backgroundPosition: `${transform.x}px ${transform.y}px`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={(event) => {
        if (event.target === svgRef.current) fitView()
      }}
    >
      <svg ref={svgRef} className="absolute inset-0 h-full w-full" role="img" aria-label={ariaLabel}>
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
          </marker>
        </defs>

        <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
          {edges.map((edge) => {
            const a = posOf(edge.from)
            const b = posOf(edge.to)
            const key = `${edge.from}\u0000${edge.to}`
            const highlighted =
              hoveredEdge === key ||
              hoveredNode === edge.from ||
              hoveredNode === edge.to ||
              selected.has(edge.from) ||
              selected.has(edge.to) ||
              (takenEdge?.from === edge.from && takenEdge?.to === edge.to)
            const color = highlighted ? ACCENT : EDGE_COLOR
            const geometry =
              edge.from === edge.to ? selfLoopPath(a, radius) : curvedPath(a, b, radius, edge.curve)
            return (
              <g key={key}>
                <path
                  d={geometry.path}
                  fill="none"
                  stroke={color}
                  strokeWidth={highlighted ? 2.4 : 1.7}
                  markerEnd={`url(#${markerId})`}
                  style={{ color }}
                />
                <path
                  d={geometry.path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={14}
                  style={{ cursor: 'default' }}
                  onPointerEnter={() => setHoveredEdge(key)}
                  onPointerLeave={() =>
                    setHoveredEdge((current) => (current === key ? null : current))
                  }
                />
                <text
                  x={geometry.label.x}
                  y={geometry.label.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={11}
                  className="mono"
                  fill={highlighted ? ACCENT : EDGE_LABEL_COLOR}
                  stroke={EDGE_HALO_COLOR}
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  {edge.symbols.join(',')}
                </text>
              </g>
            )
          })}

          {layout.nodes.map((node) => {
            const p = posOf(node.state)
            const color = colorForState?.(node.state) ?? NEUTRAL_COLOR
            const isSelected = selected.has(node.state)
            const isHovered = hoveredNode === node.state
            const isActive = activeState === node.state
            const split = highlightStates?.has(node.state) ?? false
            const accepting = dfa.accepting.includes(node.state)
            const badge = badgeForState?.(node.state)
            const fontSize = node.state.length > 6 ? 9 : node.state.length > 3 ? 11 : 13
            const stroke = isActive || isSelected || split ? ACCENT : isHovered ? '#6b6b6b' : color.stroke
            const strokeWidth = isActive || split ? 3 : isSelected ? 2.6 : 2

            return (
              <g
                key={node.state}
                className="canvas-node-hit"
                onPointerDown={handleNodePointerDown(node.state)}
                onPointerEnter={() => setHoveredNode(node.state)}
                onPointerLeave={() =>
                  setHoveredNode((current) => (current === node.state ? null : current))
                }
              >
                {isActive && (
                  <circle cx={p.x} cy={p.y} r={radius + 7} fill="none" stroke={ACCENT} strokeWidth={2} opacity={0.35} />
                )}
                {dfa.start === node.state && node.reachable && (
                  <line
                    x1={p.x - radius - 34}
                    y1={p.y}
                    x2={p.x - radius - 4}
                    y2={p.y}
                    stroke={EDGE_COLOR}
                    strokeWidth={1.6}
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={radius}
                  style={{ fill: color.fill, stroke }}
                  strokeWidth={strokeWidth}
                  strokeDasharray={node.reachable ? undefined : '5 4'}
                />
                {(accepting || isSelected) && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={radius - 5}
                    fill={isSelected && !accepting ? 'rgba(136,117,255,0.14)' : 'none'}
                    style={{ stroke: accepting ? stroke : ACCENT }}
                    strokeWidth={1.5}
                    strokeDasharray={node.reachable ? undefined : '4 3'}
                  />
                )}
                <text
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={fontSize}
                  className="mono"
                  style={{ fill: color.text }}
                >
                  {node.state}
                </text>
                {badge && (
                  <g>
                    <circle
                      cx={p.x + radius * 0.82}
                      cy={p.y - radius * 0.82}
                      r={9}
                      fill="#1c1c1c"
                      style={{ stroke: color.stroke }}
                      strokeWidth={1.5}
                    />
                    <text
                      x={p.x + radius * 0.82}
                      y={p.y - radius * 0.82}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={10}
                      style={{ fill: color.stroke }}
                    >
                      {badge}
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* Transient per-step cue: the keyed elements remount (and thus replay)
              whenever `pulseKey` changes, so repeated edges still show motion. */}
          {pulseKey !== undefined && takenGeometry && (
            <path
              key={`sim-edge-${pulseKey}`}
              className="sim-edge-flow"
              d={takenGeometry.path}
              pathLength={1}
              fill="none"
              stroke={ACCENT}
              strokeWidth={3}
              strokeLinecap="round"
            />
          )}
          {pulseKey !== undefined && activeState && (
            <circle
              key={`sim-node-${pulseKey}`}
              className="sim-node-pulse"
              cx={posOf(activeState).x}
              cy={posOf(activeState).y}
              r={radius + 4}
              fill="none"
              stroke={ACCENT}
              strokeWidth={2}
            />
          )}
        </g>

        {marqueeScreen && (
          <rect
            x={marqueeScreen.x}
            y={marqueeScreen.y}
            width={marqueeScreen.w}
            height={marqueeScreen.h}
            fill="rgba(136,117,255,0.14)"
            stroke={ACCENT}
            strokeWidth={1}
          />
        )}
      </svg>

      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-lg border border-line bg-surface-2/90 p-1 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.2)}
          aria-label="Zoom out"
          className="grid h-7 w-7 place-items-center rounded-md text-ink-muted transition hover:bg-elevated hover:text-ink"
        >
          <MinusIcon className="h-4 w-4" />
        </button>
        <span className="mono w-11 text-center text-[11px] tabular-nums text-ink-muted">
          {Math.round(transform.scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomBy(1.2)}
          aria-label="Zoom in"
          className="grid h-7 w-7 place-items-center rounded-md text-ink-muted transition hover:bg-elevated hover:text-ink"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
        <span className="mx-0.5 h-5 w-px bg-line" />
        <button
          type="button"
          onClick={fitView}
          aria-label="Zoom to fit"
          title="Zoom to fit (Shift+1)"
          className="grid h-7 w-7 place-items-center rounded-md text-ink-muted transition hover:bg-elevated hover:text-ink"
        >
          <MaximizeIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setPositions({})
            setSelected(new Set())
          }}
          aria-label="Reset layout"
          title="Reset layout"
          className="grid h-7 w-7 place-items-center rounded-md text-ink-muted transition hover:bg-elevated hover:text-ink"
        >
          <ResetIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
