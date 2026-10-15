import { useCallback, useEffect, useMemo, useState } from 'react'
import type { StateId } from './types/dfa'
import { useAutomaton } from './context/automaton'
import { validateDfa } from './lib/dfa'
import { minimize } from './lib/minimize'
import { colorForBlock, NEUTRAL_COLOR, REMOVED_COLOR, type BlockColor } from './lib/palette'
import { usePlayback } from './hooks/usePlayback'
import { useMediaQuery } from './hooks/useMediaQuery'
import { usePersistentBoolean } from './hooks/usePersistentBoolean'
import { usePersistentWidth } from './hooks/usePersistentWidth'
import { TopBar } from './components/TopBar'
import { ResultDrawer } from './components/ResultDrawer'
import { Resizer } from './components/Resizer'
import { GraphPanel } from './components/GraphPanel'
import { Toolbar } from './components/Toolbar'
import { TransitionTable } from './components/TransitionTable'
import { PartitionFlow } from './components/PartitionFlow'
import { ValidationList } from './components/ValidationList'
import { LogoIcon } from './components/icons'

export default function App() {
  const { dfa } = useAutomaton()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [leftWidth, setLeftWidth, resetLeftWidth] = usePersistentWidth('panel.left', {
    default: 340,
    min: 240,
    max: 560,
  })
  const [rightWidth, setRightWidth, resetRightWidth] = usePersistentWidth('panel.right', {
    default: 400,
    min: 320,
    max: 760,
  })

  const [leftOpen, , toggleLeft] = usePersistentBoolean('panel.left.open', true)
  const [rightOpen, , toggleRight] = usePersistentBoolean('panel.right.open', true)

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
      if ((event.ctrlKey || event.metaKey) && event.code === 'KeyB') {
        event.preventDefault()
        if (event.shiftKey) toggleRight()
        else toggleLeft()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleLeft, toggleRight])

  const issues = useMemo(() => validateDfa(dfa), [dfa])
  const errors = issues.filter((i) => i.level === 'error')
  const valid = errors.length === 0

  const result = useMemo(() => (valid ? minimize(dfa) : null), [dfa, valid])
  const playback = usePlayback(result?.steps.length ?? 0, result)
  const activeStep = result ? result.steps[playback.index] : null

  const { colorMap, badgeMap } = useMemo(() => {
    const colors: Record<StateId, BlockColor> = {}
    const badges: Record<StateId, string> = {}
    activeStep?.partitions.forEach((block, index) => {
      for (const state of block) {
        colors[state] = colorForBlock(index)
        badges[state] = String(index + 1)
      }
    })
    return { colorMap: colors, badgeMap: badges }
  }, [activeStep])

  const colorForState = useCallback(
    (state: StateId) => colorMap[state] ?? (result ? REMOVED_COLOR : NEUTRAL_COLOR),
    [colorMap, result],
  )

  const highlightStates = useMemo(
    () => (activeStep?.splitBlock ? new Set(activeStep.splitBlock) : undefined),
    [activeStep],
  )

  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink lg:h-screen lg:flex-row lg:overflow-hidden">
      {leftOpen && (
        <aside
          className="flex w-full shrink-0 flex-col border-b border-line bg-surface-2 lg:border-b-0 lg:border-r"
          style={isDesktop ? { width: leftWidth } : undefined}
        >
          <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-white shadow-lg shadow-accent/25">
              <LogoIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-ink">DFA Minimization</h1>
              <p className="truncate text-xs text-ink-faint">Moore&apos;s partition refinement</p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Definition
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  valid ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${valid ? 'bg-success' : 'bg-danger'}`} />
                {valid ? 'Valid DFA' : `${errors.length} issue${errors.length === 1 ? '' : 's'}`}
              </span>
            </div>

            <div className="space-y-5">
              <Toolbar />
              <TransitionTable />
            </div>
          </div>
        </aside>
      )}

      {leftOpen && (
        <Resizer
          label="Resize definitions panel"
          value={leftWidth}
          min={240}
          max={560}
          defaultValue={340}
          onChange={setLeftWidth}
          onReset={resetLeftWidth}
        />
      )}

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar
          playback={playback}
          total={result?.steps.length ?? 0}
          canPlay={!!result}
          onOpenDrawer={() => setDrawerOpen(true)}
          leftOpen={leftOpen}
          rightOpen={rightOpen}
          onToggleLeft={toggleLeft}
          onToggleRight={toggleRight}
        />

        <div className="relative min-h-0 flex-1">
          <GraphPanel
            original={dfa}
            minimized={result?.minimized ?? null}
            colorForState={colorForState}
            badgeForState={(state) => badgeMap[state]}
            highlightStates={highlightStates}
          />
        </div>
      </section>

      {rightOpen && (
        <Resizer
          label="Resize animation panel"
          value={rightWidth}
          min={320}
          max={760}
          defaultValue={400}
          onChange={setRightWidth}
          onReset={resetRightWidth}
          invert
        />
      )}

      {rightOpen && (
        <aside
          className="flex w-full shrink-0 flex-col border-t border-line bg-surface-2 lg:border-t-0 lg:border-l"
          style={isDesktop ? { width: rightWidth } : undefined}
        >
          <div className="shrink-0 border-b border-line px-4 py-3.5">
            <h2 className="text-sm font-semibold text-ink">Partition refinement</h2>
            <p className="text-xs text-ink-faint">Blocks accumulate as states are split</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {result && activeStep ? (
              <PartitionFlow steps={result.steps} current={playback.index} dfa={dfa} />
            ) : (
              <ValidationList issues={issues} />
            )}
          </div>
        </aside>
      )}

      <ResultDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        original={dfa}
        minimized={result?.minimized ?? null}
      />
    </div>
  )
}
