import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Toolbar } from './Toolbar'
import { AutomatonProvider } from '../context/AutomatonProvider'

function renderToolbar() {
  return render(
    <AutomatonProvider>
      <Toolbar />
    </AutomatonProvider>,
  )
}

const combobox = () => screen.getByRole('combobox', { name: /dfa library/i }) as HTMLSelectElement

describe('Toolbar DFA library', () => {
  it('lists samples and shows an empty Saved group', () => {
    renderToolbar()
    expect(screen.getByRole('group', { name: 'Samples' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Saved' })).toBeInTheDocument()
    expect(screen.getByText('No saved DFAs yet')).toBeInTheDocument()
    expect(combobox().value).toBe('sample:redundant')
  })

  it('saves the current DFA under a name', async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Save' }))
    const dialog = screen.getByRole('dialog', { name: /save dfa/i })
    await user.type(within(dialog).getByLabelText(/dfa name/i), 'My DFA')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('option', { name: 'My DFA' })).toBeInTheDocument()
    expect(combobox().value.startsWith('saved:')).toBe(true)
  })

  it('deletes a saved DFA and falls back to custom', async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Save' }))
    const dialog = screen.getByRole('dialog', { name: /save dfa/i })
    await user.type(within(dialog).getByLabelText(/dfa name/i), 'Temp')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.queryByRole('option', { name: 'Temp' })).not.toBeInTheDocument()
    expect(combobox().value).toBe('custom')
  })

  it('creates a new starter DFA', async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole('button', { name: 'New' }))
    expect(combobox().value).toBe('custom')
  })

  it('loads a DFA pasted as JSON', async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Paste JSON' }))
    const dialog = screen.getByRole('dialog', { name: /paste dfa json/i })
    fireEvent.change(within(dialog).getByLabelText(/dfa json/i), {
      target: {
        value:
          '{"states":["q0"],"alphabet":["a"],"start":"q0","accepting":["q0"],"transitions":{"q0":{"a":"q0"}}}',
      },
    })
    await user.click(within(dialog).getByRole('button', { name: 'Load' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(combobox().value).toBe('custom')
  })

  it('reports invalid pasted JSON', async () => {
    const user = userEvent.setup()
    renderToolbar()

    await user.click(screen.getByRole('button', { name: 'Paste JSON' }))
    const dialog = screen.getByRole('dialog', { name: /paste dfa json/i })
    fireEvent.change(within(dialog).getByLabelText(/dfa json/i), { target: { value: '{ not json' } })
    await user.click(within(dialog).getByRole('button', { name: 'Load' }))

    expect(within(dialog).getByRole('alert')).toHaveTextContent(/not valid JSON/i)
  })
})
