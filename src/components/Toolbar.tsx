import { useRef, useState } from 'react'
import { useAutomaton } from '../context/automaton'
import { hasMissingTransitions, parseDfaJson } from '../lib/dfa'
import { SAMPLES } from '../lib/samples'

export function Toolbar() {
  const { dfa, dispatch } = useAutomaton()
  const canComplete = hasMissingTransitions(dfa)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)

  const onImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const result = parseDfaJson(text)
      if (!result.ok) {
        setImportError(result.error)
        return
      }
      setImportError(null)
      dispatch({ type: 'setDfa', dfa: result.dfa })
    } catch {
      setImportError('Could not read the file.')
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-faint">
        Load a sample
        <select
          className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          defaultValue={SAMPLES[0].id}
          onChange={(event) => {
            const sample = SAMPLES.find((s) => s.id === event.target.value)
            if (sample) dispatch({ type: 'setDfa', dfa: sample.dfa })
          }}
        >
          {SAMPLES.map((sample) => (
            <option key={sample.id} value={sample.id}>
              {sample.name}
            </option>
          ))}
        </select>
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-label="Import DFA JSON file"
        onChange={onImportFile}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="rounded-lg border border-line bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink-muted shadow-sm transition hover:border-line-strong hover:bg-elevated hover:text-ink"
        title="Load a DFA from a JSON file (same format as the export)"
      >
        Import JSON
      </button>

      <button
        type="button"
        disabled={!canComplete}
        onClick={() => dispatch({ type: 'completeWithDeadState' })}
        className="rounded-lg border border-line bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink-muted shadow-sm transition hover:border-line-strong hover:bg-elevated hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface-1"
        title="Add a dead/sink state to fill in every missing transition"
      >
        Complete with dead state
      </button>

      {importError && (
        <p role="alert" className="w-full text-xs text-danger">
          {importError}
        </p>
      )}
    </div>
  )
}
