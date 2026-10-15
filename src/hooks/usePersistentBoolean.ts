import { useCallback, useState } from 'react'

function readStored(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage?.getItem(key)
    if (raw === 'true') return true
    if (raw === 'false') return false
  } catch {
    /* storage unavailable — ignore */
  }
  return fallback
}

/** A boolean persisted in localStorage. Returns `[value, setValue, toggle]`. */
export function usePersistentBoolean(
  key: string,
  initial = false,
): [boolean, (value: boolean) => void, () => void] {
  const [value, setValueState] = useState(() => readStored(key, initial))

  const setValue = useCallback(
    (next: boolean) => {
      setValueState(next)
      if (typeof window !== 'undefined') {
        try {
          window.localStorage?.setItem(key, String(next))
        } catch {
          /* storage unavailable — ignore */
        }
      }
    },
    [key],
  )

  const toggle = useCallback(() => setValueState((v) => {
    const next = !v
    if (typeof window !== 'undefined') {
      try {
        window.localStorage?.setItem(key, String(next))
      } catch {
        /* storage unavailable — ignore */
      }
    }
    return next
  }), [key])

  return [value, setValue, toggle]
}
