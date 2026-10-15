import { useEffect, useState } from 'react'
import type { DFA, StateId } from '../types/dfa'
import { colorForBlock, type BlockColor } from '../lib/palette'
import { useSimulator } from '../hooks/useSimulator'
import { InteractiveGraph, type SimEdge } from './InteractiveGraph'
import { InputSimulator } from './InputSimulator'

type View = 'original' | 'minimized'

interface GraphPanelProps {
  original: DFA
  minimized: DFA | null
  colorForState?: (state: StateId) => BlockColor
  badgeForState?: (state: StateId) => string | undefined
  highlightStates?: Set<StateId>
}

export function GraphPanel({
  original,
  minimized,
  colorForState,
  badgeForState,
  highlightStates,
}: GraphPanelProps) {
  const [view, setView] = useState<View>('original')

  useEffect(() => {
    if (!minimized && view === 'minimized') setView('original')
  }, [minimized, view])

  const activeDfa = view === 'minimized' && minimized ? minimized : original

  const activeColor = (state: StateId): BlockColor => {
    if (view === 'minimized' && minimized) {
      return colorForBlock(Math.max(0, minimized.states.indexOf(state)))
    }
    return colorForState?.(state) ?? colorForBlock(0)
  }

  const activeBadge = (state: StateId): string | undefined => {
    if (view === 'minimized' && minimized) {
      return String(minimized.states.indexOf(state) + 1)
    }
    return badgeForState?.(state)
  }

  const simulator = useSimulator(activeDfa)

  const tabClass = (active: boolean) =>
    `rounded-md px-3 py-1 text-xs font-medium transition ${
      active ? 'bg-accent text-white shadow-sm' : 'text-ink-muted hover:bg-elevated hover:text-ink'
    }`

  return (
    <div className="relative h-full w-full">
      <InteractiveGraph
        dfa={activeDfa}
        ariaLabel={view === 'minimized' ? 'Minimized state diagram' : 'Original state diagram'}
        colorForState={activeColor}
        badgeForState={activeBadge}
        highlightStates={view === 'original' ? highlightStates : undefined}
        activeState={simulator.activeState}
        takenEdge={simulator.takenStep ? (simulator.takenStep as SimEdge) : undefined}
        pulseKey={simulator.cursor}
      />

      <div className="absolute left-3 top-3 flex items-center gap-0.5 rounded-lg border border-line bg-surface-2/90 p-0.5 shadow-lg backdrop-blur">
        <button type="button" onClick={() => setView('original')} className={tabClass(view === 'original')}>
          Original
        </button>
        <button
          type="button"
          onClick={() => setView('minimized')}
          disabled={!minimized}
          className={`${tabClass(view === 'minimized')} disabled:cursor-not-allowed disabled:opacity-30`}
          title={minimized ? undefined : 'Fix the automaton to minimize'}
        >
          Minimized
        </button>
      </div>

      <span className="pointer-events-none absolute bottom-3 left-3 hidden text-[11px] text-ink-faint lg:block">
        Space+drag pan · Ctrl+scroll zoom · Shift+1 fit
      </span>

      <div className="pointer-events-none absolute bottom-3 left-1/2 w-[min(620px,92%)] -translate-x-1/2">
        <InputSimulator dfa={activeDfa} simulator={simulator} />
      </div>
    </div>
  )
}
