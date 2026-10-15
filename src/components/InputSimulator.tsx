import type { DFA } from '../types/dfa'
import type { Simulator } from '../hooks/useSimulator'
import { NextIcon, PauseIcon, PlayIcon, ResetIcon } from './icons'

interface InputSimulatorProps {
  dfa: DFA
  simulator: Simulator
}

export function InputSimulator({ dfa, simulator }: InputSimulatorProps) {
  const { input, setInput, cursor, total, atEnd, playing, toggle, step, reset, sim } = simulator
  const hasInput = input.trim().length > 0

  let verdict: { text: string; tone: 'success' | 'danger' | 'muted' } | null = null
  if (hasInput) {
    if (!atEnd) {
      verdict = { text: `${cursor}/${total}`, tone: 'muted' }
    } else if (sim.accepted) {
      verdict = { text: 'Accepted', tone: 'success' }
    } else if (sim.unknown.length) {
      verdict = { text: `Unknown symbol “${sim.unknown[0]}”`, tone: 'danger' }
    } else if (sim.halted) {
      verdict = { text: 'No transition — rejected', tone: 'danger' }
    } else {
      verdict = { text: 'Rejected', tone: 'danger' }
    }
  }

  const toneClass =
    verdict?.tone === 'success'
      ? 'bg-success/15 text-success'
      : verdict?.tone === 'danger'
        ? 'bg-danger/15 text-danger'
        : 'bg-elevated text-ink-muted'

  const buttonClass =
    'grid h-8 w-8 place-items-center rounded-md text-ink-muted transition hover:bg-elevated hover:text-ink disabled:cursor-not-allowed disabled:opacity-30'

  const tokens = sim.tokens
  const showTokens = hasInput && tokens.length > 0

  return (
    <div className="pointer-events-auto flex flex-col gap-1.5 rounded-xl border border-line bg-surface-2/95 p-1.5 shadow-xl backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="mono hidden shrink-0 pl-1.5 pr-0.5 text-[11px] text-ink-faint sm:inline">
          Σ={'{'}
          {dfa.alphabet.join(',')}
          {'}'}
        </span>

        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Test a string…"
          aria-label="Input string"
          spellCheck={false}
          className="mono min-w-0 flex-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        />

        <div className="flex shrink-0 items-center gap-0.5">
          <button type="button" onClick={reset} aria-label="Reset simulation" className={buttonClass}>
            <ResetIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={toggle}
            disabled={!hasInput}
            aria-label={playing ? 'Pause simulation' : 'Play simulation'}
            className={buttonClass}
          >
            {playing ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={step}
            disabled={!hasInput || atEnd}
            aria-label="Step simulation"
            className={buttonClass}
          >
            <NextIcon className="h-4 w-4" />
          </button>
        </div>

        {verdict && (
          <div className="w-full sm:w-auto">
            <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${toneClass}`}>
              {verdict.text}
            </span>
          </div>
        )}
      </div>

      {showTokens && (
        <div
          className="flex items-center gap-1 overflow-x-auto px-0.5 pb-0.5"
          aria-label="Input position"
        >
          <span className="mono shrink-0 pr-0.5 text-[11px] text-ink-faint" aria-hidden>
            ▸
          </span>
          {tokens.map((token, index) => {
            const consumed = index < cursor
            const activeToken = index === cursor - 1
            const stepResult = sim.steps[index]
            const failed = consumed && stepResult && !stepResult.ok
            return (
              <span
                key={`${index}-${token}`}
                className={`mono shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] leading-none transition ${
                  activeToken
                    ? 'border-accent bg-accent/20 text-accent'
                    : failed
                      ? 'border-danger/40 bg-danger/10 text-danger'
                      : consumed
                        ? 'border-line bg-surface text-ink-faint line-through decoration-ink-faint/60'
                        : 'border-line bg-surface text-ink-muted'
                }`}
              >
                {token}
              </span>
            )
          })}
          <span className="shrink-0 pl-0.5 text-[11px] text-ink-faint" aria-hidden>
            ▸
          </span>
        </div>
      )}
    </div>
  )
}
