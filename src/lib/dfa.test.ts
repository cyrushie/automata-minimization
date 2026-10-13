import { describe, expect, it } from 'vitest'
import { dfaToSerializable, parseDfaJson } from './dfa'
import { SAMPLES } from './samples'

describe('parseDfaJson', () => {
  it('round-trips a sample through export and import', () => {
    for (const sample of SAMPLES) {
      const json = JSON.stringify(dfaToSerializable(sample.dfa))
      const result = parseDfaJson(json)
      expect(result.ok, sample.name).toBe(true)
      if (result.ok) expect(result.dfa).toEqual(sample.dfa)
    }
  })

  it('rejects invalid JSON', () => {
    const result = parseDfaJson('{ not json')
    expect(result).toEqual({ ok: false, error: 'The file is not valid JSON.' })
  })

  it('rejects non-object JSON', () => {
    expect(parseDfaJson('[1,2]').ok).toBe(false)
    expect(parseDfaJson('null').ok).toBe(false)
    expect(parseDfaJson('"hi"').ok).toBe(false)
  })

  it('rejects missing or malformed fields', () => {
    expect(parseDfaJson('{}').ok).toBe(false)
    expect(parseDfaJson('{"states":[],"alphabet":["a"],"start":"q0"}').ok).toBe(false)
    expect(
      parseDfaJson('{"states":["q0"],"alphabet":[],"start":"q0"}').ok,
    ).toBe(false)
    expect(
      parseDfaJson('{"states":["q0"],"alphabet":["a"],"start":42}').ok,
    ).toBe(false)
    expect(
      parseDfaJson('{"states":["q0"],"alphabet":["a"],"start":"q0","accepting":"q0"}')
        .ok,
    ).toBe(false)
    expect(
      parseDfaJson(
        '{"states":["q0"],"alphabet":["a"],"start":"q0","transitions":[]}',
      ).ok,
    ).toBe(false)
    expect(
      parseDfaJson(
        '{"states":["q0"],"alphabet":["a"],"start":"q0","transitions":{"q0":{"a":1}}}',
      ).ok,
    ).toBe(false)
  })

  it('fills missing transitions with blanks and defaults accepting to []', () => {
    const result = parseDfaJson(
      '{"states":["q0","q1"],"alphabet":["a"],"start":"q0","transitions":{"q0":{"a":"q1"}}}',
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.dfa.accepting).toEqual([])
    expect(result.dfa.transitions.q1.a).toBe('')
  })
})
