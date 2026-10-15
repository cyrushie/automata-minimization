import { useEffect, useId, useState } from 'react'
import type { DFA } from '../types/dfa'
import { parseDfaJson } from '../lib/dfa'
import { CloseIcon } from './icons'

interface PasteJsonDialogProps {
  onLoad: (dfa: DFA) => void
  onClose: () => void
}

const TEMPLATE = `{
  "states": ["q0", "q1"],
  "alphabet": ["a", "b"],
  "start": "q0",
  "accepting": ["q1"],
  "transitions": {
    "q0": { "a": "q1", "b": "q0" },
    "q1": { "a": "q1", "b": "q0" }
  }
}`

export function PasteJsonDialog({ onLoad, onClose }: PasteJsonDialogProps) {
  const [text, setText] = useState(TEMPLATE)
  const [error, setError] = useState<string | null>(null)
  const titleId = useId()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const submit = () => {
    const result = parseDfaJson(text)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onLoad(result.dfa)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-xl border border-line bg-surface-2 shadow-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
          <div>
            <h2 id={titleId} className="text-sm font-semibold text-ink">
              Paste DFA JSON
            </h2>
            <p className="text-xs text-ink-faint">Edit the template or paste your own JSON</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint transition hover:bg-elevated hover:text-ink"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <textarea
            autoFocus
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              if (error) setError(null)
            }}
            aria-label="DFA JSON"
            spellCheck={false}
            className="mono h-64 w-full resize-none rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink placeholder:text-ink-faint/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
          {error && (
            <p role="alert" className="mt-2 text-xs text-danger">
              {error}
            </p>
          )}
        </div>

        <footer className="flex shrink-0 justify-end gap-2 border-t border-line px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink-muted shadow-sm transition hover:border-line-strong hover:bg-elevated hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={text.trim().length === 0}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            Load
          </button>
        </footer>
      </div>
    </div>
  )
}
