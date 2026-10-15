import { useAutomaton } from '../context/automaton'
import type { StateId } from '../types/dfa'
import { CommitInput } from './CommitInput'
import { SymbolEditor } from './SymbolEditor'

export function TransitionTable() {
  const { dfa, dispatch } = useAutomaton()

  return (
    <div>
      <SymbolEditor />

      <div className="-mx-4 overflow-x-auto px-4">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-ink-faint">
              <th className="border-b border-line px-2 py-2">State</th>
              <th className="border-b border-line px-2 py-2 text-center">Start</th>
              <th className="border-b border-line px-2 py-2 text-center">Accept</th>
              {dfa.alphabet.map((symbol) => (
                <th key={symbol} className="mono border-b border-line px-2 py-2 text-center">
                  {symbol}
                </th>
              ))}
              <th className="border-b border-line px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {dfa.states.map((state) => (
              <tr key={state} className="group transition hover:bg-elevated/60">
                <td className="border-b border-line/70 px-1 py-1">
                  <CommitInput
                    value={state}
                    ariaLabel={`State name ${state}`}
                    onCommit={(to) => dispatch({ type: 'renameState', from: state, to })}
                    className="mono w-24 rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-ink transition hover:border-line focus:border-accent focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25"
                  />
                </td>
                <td className="border-b border-line/70 px-2 py-1 text-center">
                  <input
                    type="radio"
                    name="start-state"
                    aria-label={`Set ${state} as start`}
                    checked={dfa.start === state}
                    onChange={() => dispatch({ type: 'setStart', state })}
                    className="accent-[#8875ff]"
                  />
                </td>
                <td className="border-b border-line/70 px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    aria-label={`Toggle accept for ${state}`}
                    checked={dfa.accepting.includes(state)}
                    onChange={() => dispatch({ type: 'toggleAccept', state })}
                    className="accent-[#44cf6e]"
                  />
                </td>
                {dfa.alphabet.map((symbol) => {
                  const target = dfa.transitions[state]?.[symbol] ?? ''
                  const invalid = target !== '' && !dfa.states.includes(target)
                  return (
                    <td key={symbol} className="border-b border-line/70 px-1 py-1 text-center">
                      <select
                        value={target}
                        aria-label={`Transition from ${state} on ${symbol}`}
                        onChange={(event) =>
                          dispatch({
                            type: 'setTransition',
                            state,
                            symbol,
                            target: event.target.value,
                          })
                        }
                        className={`mono w-20 rounded-lg border px-1.5 py-1 text-sm transition focus:outline-none focus:ring-2 ${
                          target === ''
                            ? 'border-danger/50 bg-danger/10 text-danger focus:ring-danger/25'
                            : invalid
                              ? 'border-warning/50 bg-warning/10 text-warning focus:ring-warning/25'
                              : 'border-line bg-surface text-ink focus:border-accent focus:ring-accent/25'
                        }`}
                      >
                        <option value="">—</option>
                        {dfa.states.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                        {invalid && <option value={target}>{target}?</option>}
                      </select>
                    </td>
                  )
                })}
                <td className="border-b border-line/70 px-1 py-1 text-center">
                  <button
                    type="button"
                    aria-label={`Remove state ${state}`}
                    disabled={dfa.states.length <= 1}
                    onClick={() => dispatch({ type: 'removeState', state: state as StateId })}
                    className="rounded px-1.5 text-ink-faint opacity-0 transition group-hover:opacity-100 hover:text-danger disabled:opacity-20"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={() => dispatch({ type: 'addState' })}
        className="mt-3 rounded-lg border border-dashed border-line-strong px-3 py-1.5 text-sm text-ink-muted transition hover:border-accent hover:text-accent"
      >
        + state
      </button>
    </div>
  )
}
