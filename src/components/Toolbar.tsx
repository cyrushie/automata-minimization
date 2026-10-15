import { useRef, useState } from 'react'
import { useAutomaton } from '../context/automaton'
import { createStarterDfa, hasMissingTransitions, parseDfaJson } from '../lib/dfa'
import { SAMPLES } from '../lib/samples'
import { useDfaLibrary } from '../hooks/useDfaLibrary'
import { PasteJsonDialog } from './PasteJsonDialog'
import { SaveDfaDialog } from './SaveDfaDialog'

const buttonClass =
  'rounded-lg border border-line bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink-muted shadow-sm transition hover:border-line-strong hover:bg-elevated hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:bg-surface-1 disabled:hover:text-ink-muted'

const EMPTY_SAVED = 'saved:__none__'

export function Toolbar() {
  const { dfa, dispatch } = useAutomaton()
  const { saved, save, update, remove } = useDfaLibrary()
  const canComplete = hasMissingTransitions(dfa)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [selection, setSelection] = useState(`sample:${SAMPLES[0].id}`)
  const [saveOpen, setSaveOpen] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)

  const selectedSavedId = selection.startsWith('saved:')
    ? selection.slice('saved:'.length)
    : null

  const onSelect = (value: string) => {
    if (value.startsWith('sample:')) {
      const sample = SAMPLES.find((s) => s.id === value.slice('sample:'.length))
      if (sample) {
        dispatch({ type: 'setDfa', dfa: sample.dfa })
        setSelection(value)
      }
    } else if (value.startsWith('saved:')) {
      const entry = saved.find((s) => s.id === value.slice('saved:'.length))
      if (entry) {
        dispatch({ type: 'setDfa', dfa: entry.dfa })
        setSelection(value)
      }
    }
  }

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
      setSelection('custom')
    } catch {
      setImportError('Could not read the file.')
    }
  }

  const handleSave = () => {
    if (selectedSavedId) update(selectedSavedId, dfa)
    else setSaveOpen(true)
  }

  const handleSaveAs = (name: string) => {
    const entry = save(name, dfa)
    setSelection(`saved:${entry.id}`)
    setSaveOpen(false)
  }

  const handleDelete = () => {
    if (!selectedSavedId) return
    remove(selectedSavedId)
    setSelection('custom')
  }

  const handleNew = () => {
    dispatch({ type: 'setDfa', dfa: createStarterDfa() })
    setSelection('custom')
    setImportError(null)
  }

  return (
    <div className="flex flex-col gap-2.5">
      <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-faint">
        DFA library
        <select
          value={selection}
          onChange={(event) => onSelect(event.target.value)}
          aria-label="DFA library"
          className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink shadow-sm transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        >
          <option value="custom" disabled>
            Custom (unsaved)
          </option>
          <optgroup label="Saved">
            {saved.length === 0 ? (
              <option value={EMPTY_SAVED} disabled>
                No saved DFAs yet
              </option>
            ) : (
              saved.map((entry) => (
                <option key={entry.id} value={`saved:${entry.id}`}>
                  {entry.name}
                </option>
              ))
            )}
          </optgroup>
          <optgroup label="Samples">
            {SAMPLES.map((sample) => (
              <option key={sample.id} value={`sample:${sample.id}`}>
                {sample.name}
              </option>
            ))}
          </optgroup>
        </select>
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={handleSave} className={buttonClass}>
          Save
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={!selectedSavedId}
          className={`${buttonClass} hover:border-danger/50 hover:text-danger`}
        >
          Delete
        </button>
        <button type="button" onClick={handleNew} className={buttonClass}>
          New
        </button>
        <button type="button" onClick={() => setPasteOpen(true)} className={buttonClass}>
          Paste JSON
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={buttonClass}
          title="Load a DFA from a JSON file (same format as the export)"
        >
          Import JSON
        </button>
        <button
          type="button"
          disabled={!canComplete}
          onClick={() => dispatch({ type: 'completeWithDeadState' })}
          className={buttonClass}
          title="Add a dead/sink state to fill in every missing transition"
        >
          Complete with dead state
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        aria-label="Import DFA JSON file"
        onChange={onImportFile}
      />

      {importError && (
        <p role="alert" className="w-full text-xs text-danger">
          {importError}
        </p>
      )}

      {saveOpen && (
        <SaveDfaDialog onSave={handleSaveAs} onClose={() => setSaveOpen(false)} />
      )}

      {pasteOpen && (
        <PasteJsonDialog
          onLoad={(next) => {
            dispatch({ type: 'setDfa', dfa: next })
            setSelection('custom')
            setImportError(null)
            setPasteOpen(false)
          }}
          onClose={() => setPasteOpen(false)}
        />
      )}
    </div>
  )
}
