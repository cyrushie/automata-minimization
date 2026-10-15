import { useCallback, useEffect, useState } from 'react'
import type { DFA } from '../types/dfa'
import { cloneDfa } from '../lib/dfa'

export interface SavedDfa {
  id: string
  name: string
  dfa: DFA
  savedAt: number
}

export const DFA_LIBRARY_KEY = 'dfa-library.v1'

function isDfa(value: unknown): value is DFA {
  if (typeof value !== 'object' || value === null) return false
  const d = value as Record<string, unknown>
  return (
    Array.isArray(d.states) &&
    Array.isArray(d.alphabet) &&
    typeof d.start === 'string' &&
    Array.isArray(d.accepting) &&
    typeof d.transitions === 'object' &&
    d.transitions !== null
  )
}

function readLibrary(key: string): SavedDfa[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage?.getItem(key)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (entry): entry is SavedDfa =>
          typeof entry === 'object' &&
          entry !== null &&
          typeof (entry as SavedDfa).id === 'string' &&
          typeof (entry as SavedDfa).name === 'string' &&
          isDfa((entry as SavedDfa).dfa),
      )
      .map((entry) => ({
        ...entry,
        savedAt: typeof entry.savedAt === 'number' ? entry.savedAt : 0,
      }))
  } catch {
    return []
  }
}

function makeId() {
  return `dfa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** localStorage-backed collection of user-saved DFAs. */
export function useDfaLibrary(key = DFA_LIBRARY_KEY) {
  const [saved, setSaved] = useState<SavedDfa[]>(() => readLibrary(key))

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage?.setItem(key, JSON.stringify(saved))
    } catch {
      /* storage unavailable — ignore */
    }
  }, [key, saved])

  const save = useCallback((name: string, dfa: DFA): SavedDfa => {
    const entry: SavedDfa = {
      id: makeId(),
      name: name.trim() || 'Untitled DFA',
      dfa: cloneDfa(dfa),
      savedAt: Date.now(),
    }
    setSaved((list) => [entry, ...list])
    return entry
  }, [])

  const update = useCallback((id: string, dfa: DFA) => {
    setSaved((list) =>
      list.map((entry) =>
        entry.id === id ? { ...entry, dfa: cloneDfa(dfa), savedAt: Date.now() } : entry,
      ),
    )
  }, [])

  const rename = useCallback((id: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setSaved((list) => list.map((entry) => (entry.id === id ? { ...entry, name: trimmed } : entry)))
  }, [])

  const remove = useCallback((id: string) => {
    setSaved((list) => list.filter((entry) => entry.id !== id))
  }, [])

  return { saved, save, update, rename, remove }
}
