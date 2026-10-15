import { useEffect, useId, useState } from 'react'
import { CloseIcon } from './icons'

interface SaveDfaDialogProps {
  initialName?: string
  onSave: (name: string) => void
  onClose: () => void
}

export function SaveDfaDialog({ initialName = '', onSave, onClose }: SaveDfaDialogProps) {
  const [name, setName] = useState(initialName)
  const titleId = useId()
  const trimmed = name.trim()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

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
        className="relative w-full max-w-sm overflow-hidden rounded-xl border border-line bg-surface-2 shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 id={titleId} className="text-sm font-semibold text-ink">
            Save DFA
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint transition hover:bg-elevated hover:text-ink"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </header>

        <div className="p-4">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-faint">
            Name
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && trimmed) onSave(trimmed)
              }}
              aria-label="DFA name"
              placeholder="My DFA"
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
            />
          </label>
        </div>

        <footer className="flex justify-end gap-2 border-t border-line px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink-muted shadow-sm transition hover:border-line-strong hover:bg-elevated hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => trimmed && onSave(trimmed)}
            disabled={!trimmed}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save
          </button>
        </footer>
      </div>
    </div>
  )
}
