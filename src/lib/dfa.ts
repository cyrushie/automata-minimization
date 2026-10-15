import type { DFA, StateId, Symbol, ValidationIssue } from '../types/dfa'

/** Build an empty transition function for the given states and alphabet. */
export function emptyTransitions(
  states: StateId[],
  alphabet: Symbol[],
  fill = '',
): Record<StateId, Record<Symbol, StateId>> {
  const t: Record<StateId, Record<Symbol, StateId>> = {}
  for (const s of states) {
    t[s] = {}
    for (const a of alphabet) t[s][a] = fill
  }
  return t
}

/** A blank starter automaton: two states, alphabet {a, b}, no accepting states. */
export function createStarterDfa(): DFA {
  const states = ['q0', 'q1']
  const alphabet = ['a', 'b']
  return {
    states,
    alphabet,
    start: 'q0',
    accepting: [],
    transitions: emptyTransitions(states, alphabet, ''),
  }
}

export function cloneDfa(dfa: DFA): DFA {
  const transitions: Record<StateId, Record<Symbol, StateId>> = {}
  for (const s of dfa.states) {
    transitions[s] = { ...(dfa.transitions[s] ?? {}) }
  }
  return {
    states: [...dfa.states],
    alphabet: [...dfa.alphabet],
    start: dfa.start,
    accepting: [...dfa.accepting],
    transitions,
  }
}

export function isAccepting(dfa: DFA, state: StateId): boolean {
  return dfa.accepting.includes(state)
}

const isBlank = (s: string | undefined) => s == null || s === ''

/** Report structural problems that prevent a valid minimization run. */
export function validateDfa(dfa: DFA): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (dfa.states.length === 0) {
    issues.push({ level: 'error', message: 'The automaton has no states.' })
  }
  const dupStates = duplicates(dfa.states)
  if (dupStates.length) {
    issues.push({
      level: 'error',
      message: `Duplicate state name(s): ${dupStates.join(', ')}`,
    })
  }
  const blankState = dfa.states.find((s) => isBlank(s))
  if (blankState !== undefined) {
    issues.push({ level: 'error', message: 'A state has an empty name.' })
  }

  if (dfa.alphabet.length === 0) {
    issues.push({ level: 'error', message: 'The alphabet is empty.' })
  }
  const dupSymbols = duplicates(dfa.alphabet)
  if (dupSymbols.length) {
    issues.push({
      level: 'error',
      message: `Duplicate symbol(s): ${dupSymbols.join(', ')}`,
    })
  }
  const blankSymbol = dfa.alphabet.find((s) => isBlank(s))
  if (blankSymbol !== undefined) {
    issues.push({ level: 'error', message: 'A symbol is empty.' })
  }

  if (!dfa.states.includes(dfa.start)) {
    issues.push({
      level: 'error',
      message: `Start state "${dfa.start}" is not one of the states.`,
    })
  }

  for (const a of dfa.accepting) {
    if (!dfa.states.includes(a)) {
      issues.push({
        level: 'error',
        message: `Accepting state "${a}" is not one of the states.`,
      })
    }
  }

  for (const s of dfa.states) {
    for (const a of dfa.alphabet) {
      const target = dfa.transitions[s]?.[a]
      if (isBlank(target)) {
        issues.push({
          level: 'error',
          message: `Missing transition: δ(${s}, ${a}) is undefined.`,
        })
      } else if (!dfa.states.includes(target)) {
        issues.push({
          level: 'error',
          message: `δ(${s}, ${a}) = "${target}" is not a declared state.`,
        })
      }
    }
  }

  return issues
}

/** True when some (state, symbol) pair has no defined transition. */
export function hasMissingTransitions(dfa: DFA): boolean {
  for (const s of dfa.states) {
    for (const a of dfa.alphabet) {
      if (isBlank(dfa.transitions[s]?.[a])) return true
    }
  }
  return false
}

/**
 * Return a copy of the DFA with a fresh dead/sink state used to fill in every
 * missing transition. Returns the input unchanged when already complete.
 */
export function withDeadState(dfa: DFA, name = '∅'): DFA {
  let missing = false
  for (const s of dfa.states) {
    for (const a of dfa.alphabet) {
      if (isBlank(dfa.transitions[s]?.[a])) missing = true
    }
  }
  if (!missing) return cloneDfa(dfa)

  let dead = name
  while (dfa.states.includes(dead)) dead = `${dead}'`

  const next = cloneDfa(dfa)
  next.states.push(dead)
  next.transitions[dead] = {}
  for (const a of next.alphabet) next.transitions[dead][a] = dead
  for (const s of next.states) {
    if (s === dead) continue
    for (const a of next.alphabet) {
      if (isBlank(next.transitions[s]?.[a])) next.transitions[s][a] = dead
    }
  }
  return next
}

export function duplicates(items: string[]): string[] {
  const seen = new Set<string>()
  const dup = new Set<string>()
  for (const it of items) {
    if (seen.has(it)) dup.add(it)
    seen.add(it)
  }
  return [...dup]
}

/** Deterministic-serialization-friendly object for export. */
export function dfaToSerializable(dfa: DFA) {
  return {
    states: dfa.states,
    alphabet: dfa.alphabet,
    start: dfa.start,
    accepting: dfa.accepting,
    transitions: dfa.transitions,
  }
}

export type DfaParseResult =
  | { ok: true; dfa: DFA }
  | { ok: false; error: string }

/**
 * Parse JSON produced by `dfaToSerializable` (or anything shape-compatible)
 * back into a DFA. Missing transitions are left blank so the usual
 * validation / "complete with dead state" flow applies.
 */
export function parseDfaJson(text: string): DfaParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'The file is not valid JSON.' }
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, error: 'Expected a JSON object describing a DFA.' }
  }
  const obj = data as Record<string, unknown>

  const states = stringArray(obj.states)
  if (states === null) {
    return { ok: false, error: '"states" must be a non-empty array of strings.' }
  }
  const alphabet = stringArray(obj.alphabet)
  if (alphabet === null) {
    return { ok: false, error: '"alphabet" must be a non-empty array of strings.' }
  }

  if (typeof obj.start !== 'string' || obj.start === '') {
    return { ok: false, error: '"start" must be a non-empty state name.' }
  }

  const accepting = obj.accepting === undefined ? [] : stringArray(obj.accepting, true)
  if (accepting === null) {
    return { ok: false, error: '"accepting" must be an array of strings.' }
  }

  const rawTransitions = obj.transitions
  if (
    rawTransitions !== undefined &&
    (typeof rawTransitions !== 'object' || rawTransitions === null || Array.isArray(rawTransitions))
  ) {
    return { ok: false, error: '"transitions" must be an object keyed by state.' }
  }
  const transitionsIn = (rawTransitions ?? {}) as Record<string, unknown>

  const transitions: DFA['transitions'] = {}
  for (const state of states) {
    const row = transitionsIn[state]
    transitions[state] = {}
    if (row !== undefined && (typeof row !== 'object' || row === null || Array.isArray(row))) {
      return { ok: false, error: `Transitions for state "${state}" must be an object.` }
    }
    const rowIn = (row ?? {}) as Record<string, unknown>
    for (const symbol of alphabet) {
      const target = rowIn[symbol]
      if (target === undefined || target === null || target === '') {
        transitions[state][symbol] = ''
      } else if (typeof target !== 'string') {
        return {
          ok: false,
          error: `Transition δ(${state}, ${symbol}) must be a string state name.`,
        }
      } else {
        transitions[state][symbol] = target
      }
    }
  }

  return {
    ok: true,
    dfa: { states, alphabet, start: obj.start, accepting, transitions },
  }
}

function stringArray(value: unknown, allowEmpty = false): string[] | null {
  if (!Array.isArray(value)) return null
  if (!allowEmpty && value.length === 0) return null
  if (!value.every((v) => typeof v === 'string')) return null
  return value as string[]
}

/** Simulate the DFA on an input sequence. Returns false on a missing transition. */
export function accepts(dfa: DFA, input: Symbol[]): boolean {
  let current = dfa.start
  for (const symbol of input) {
    const next = dfa.transitions[current]?.[symbol]
    if (next === undefined) return false
    current = next
  }
  return dfa.accepting.includes(current)
}
