# DFA Minimization

An interactive UI that minimizes a **Deterministic Finite Automaton** using
**Moore's partition-refinement** algorithm, with a step-by-step animation, an
Obsidian-style canvas graph, and input-string simulation.

## Features

- **DFA library** — a dropdown listing **your saved DFAs** (stored in
  `localStorage`) above the built-in **samples**. Start a blank automaton with
  **New**, save the current one with **Save**, delete saved entries inline, or
  bring one in via **Paste JSON** / **Import JSON** (file).
- **Transition table editor** — add/remove states and alphabet symbols, edit
  names, mark the start state, toggle accepting states, and set every
  transition with dropdowns.
- **Validation** — missing or invalid transitions are flagged inline; you can
  complete a partial automaton with one click via a dead/sink state.
- **Interactive graph** — an Obsidian-canvas-style graph of the DFA. Drag nodes
  to rearrange, hover or click nodes/edges to highlight them, marquee-select a
  group of states, and pan/zoom freely:
  - scroll to pan, `Ctrl`/`Cmd` + scroll to zoom at the cursor; `Space`+drag or
    middle-mouse to pan
  - `Shift`+drag on the canvas marquee-selects; `Shift`+drag on a node toggles
    its selection
  - **Original | Minimized** toggle switches the canvas between the input DFA
    and the minimal DFA; the minimized view recolors nodes by block.
- **Input simulation** — type a string and step or auto-play it through the
  DFA. Each step pulses the transition just taken and the destination state
  (so repeated self-loops stay visible), and a symbol strip highlights the
  position in the input. The verdict (accepted / rejected / unknown symbol) is
  shown live. Multi-character symbols are matched greedily, and a run halts at
  the first missing transition.
- **Unreachable-state removal** — the preprocessing step is shown explicitly.
- **Step-by-step refinement** — play, pause, scrub, or step through each round.
  Every round shows the current partition blocks, the transition "signature"
  that caused each split, and a plain-English explanation. The block being
  split is highlighted on the graph.
- **Resizable panels** — drag the dividers to resize the definitions and
  animation panels; widths are remembered in `localStorage` (double-click a
  divider to reset).
- **Result export** — open the drawer to see the minimal DFA as a table and a
  color-coded diagram, and copy or download it as JSON.

## Keyboard shortcuts

Shortcuts are ignored while typing in an input/textarea/select.

| Shortcut                    | Action                                        |
| --------------------------- | --------------------------------------------- |
| `Space` + drag              | Pan the graph                                 |
| Middle-mouse drag           | Pan the graph                                 |
| `Scroll`                    | Pan vertically                                |
| `Shift` + `Scroll`          | Pan horizontally                              |
| `Ctrl`/`Cmd` + `Scroll`     | Zoom at the cursor                            |
| Double-click empty canvas   | Zoom to fit                                   |
| `Shift` + `1`               | Zoom to fit                                   |
| `Shift` + `2`               | Zoom to the selected states                   |
| `Shift` + drag empty canvas | Marquee-select multiple states                |
| `Shift` + click/drag a node | Add to / remove from the selection            |
| `←` / `→` (on a divider)    | Resize the panel by 16px                      |
| `Ctrl`/`Cmd` + `B`          | Toggle the definitions panel                  |
| `Ctrl`/`Cmd` + `Shift` + `B`| Toggle the animation panel                    |
| `Shift` + `←` / `→`         | Resize the panel by 48px                      |
| Double-click a divider      | Reset that panel to its default width         |

## The algorithm

1. **Remove unreachable states** — BFS from the start state.
2. **Initial partition** — split reachable states into accepting and
   non-accepting groups.
3. **Refine** — repeat until stable: within each block, group states by the
   tuple of *block indices* their transitions lead to for each symbol. A block
   splits when two states reach different blocks on some symbol.
4. **Build the quotient DFA** — one state per final block; the start state is
   the block containing the original start; a block is accepting if it contains
   an accepting state.

The implementation returns an ordered list of snapshots (one per phase/round),
which is exactly what the UI animates.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and produce a production build in dist/
npm run preview  # preview the production build
npm test         # run the Vitest unit tests
npm run lint     # run ESLint
```

## Project layout

```
src/
  components/         UI components
    InteractiveGraph.tsx    Obsidian-style canvas (pan/zoom, drag, marquee)
    InputSimulator.tsx      Input-string simulation bar
    GraphPanel.tsx          Graph + Original/Minimized toggle + simulator
    Resizer.tsx             Draggable panel divider
    SaveDfaDialog.tsx       Name prompt when saving a DFA
    PasteJsonDialog.tsx     Paste-JSON import dialog
    PartitionFlow.tsx       Animated partition-refinement rows
    TopBar/StepControls.tsx Playback controls
    TransitionTable.tsx     Table editor
    ResultPanel/Drawer.tsx  Result + JSON export
  context/            Automaton state (useReducer) and provider
  hooks/
    usePlayback.ts          Partition animation playback
    useSimulator.ts         Input simulation playback
    useDfaLibrary.ts        localStorage-backed saved-DFA library
    usePersistentWidth.ts   localStorage-backed panel widths
    useMediaQuery.ts        Desktop breakpoint detection
  lib/
    dfa.ts            DFA helpers: validate, clone, dead state
    reachable.ts      Reachable-state computation and removal
    minimize.ts       Moore's partition refinement -> steps + minimal DFA
    simulate.ts       Tokenize + run a string through the DFA
    layout.ts         SVG node layout (columns by BFS depth)
    edgeGeometry.ts   Curved edges, grouped labels, self-loops
    palette.ts        Colours for partition blocks (dark theme)
    samples.ts        Bundled example automata
    *.test.ts         Unit tests
  types/dfa.ts        Shared TypeScript types
  App.tsx             Top-level wiring
```

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Vitest + Testing Library ·
ESLint · hand-rolled SVG (no graph library).
