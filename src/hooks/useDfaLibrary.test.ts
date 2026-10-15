import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DFA_LIBRARY_KEY, useDfaLibrary } from './useDfaLibrary'
import { createStarterDfa } from '../lib/dfa'

describe('useDfaLibrary', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useDfaLibrary())
    expect(result.current.saved).toEqual([])
  })

  it('saves a DFA and persists it to localStorage', () => {
    const { result } = renderHook(() => useDfaLibrary())
    act(() => {
      result.current.save('Mine', createStarterDfa())
    })
    expect(result.current.saved).toHaveLength(1)
    expect(result.current.saved[0].name).toBe('Mine')

    const stored = JSON.parse(window.localStorage.getItem(DFA_LIBRARY_KEY) as string)
    expect(stored).toHaveLength(1)
    expect(stored[0].name).toBe('Mine')
  })

  it('restores saved DFAs on a fresh mount', () => {
    const first = renderHook(() => useDfaLibrary())
    act(() => {
      first.result.current.save('Persisted', createStarterDfa())
    })

    const second = renderHook(() => useDfaLibrary())
    expect(second.result.current.saved.map((entry) => entry.name)).toEqual(['Persisted'])
  })

  it('updates and removes a saved DFA', () => {
    const { result } = renderHook(() => useDfaLibrary())
    let id = ''
    act(() => {
      id = result.current.save('Mine', createStarterDfa()).id
    })

    const changed = createStarterDfa()
    changed.accepting = ['q0']
    act(() => result.current.update(id, changed))
    expect(result.current.saved[0].dfa.accepting).toEqual(['q0'])

    act(() => result.current.remove(id))
    expect(result.current.saved).toEqual([])
  })

  it('ignores malformed entries in storage', () => {
    window.localStorage.setItem(
      DFA_LIBRARY_KEY,
      JSON.stringify([{ id: 'x', name: 'bad' }, 'nope', { id: 'y', name: 'ok' }]),
    )
    const { result } = renderHook(() => useDfaLibrary())
    expect(result.current.saved).toEqual([])
  })
})
