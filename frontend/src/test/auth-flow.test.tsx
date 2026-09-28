import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { AuthProvider } from '../contexts/AuthContext'

const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

function renderApp(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><AuthProvider><App /></AuthProvider></MemoryRouter>)
}

describe('authentication flow', () => {
  it('redirects protected pages to sign in without a session', async () => {
    renderApp('/app/products')

    expect(await screen.findByRole('heading', { name: 'Sign in to KEETY' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Products' })).not.toBeInTheDocument()
  })

  it('shows a human-readable API credential error on login failure', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect' },
    }, 401))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    renderApp('/login')

    await user.type(screen.getByRole('textbox', { name: 'Email address' }), 'owner@example.test')
    await user.type(screen.getByLabelText('Password', { selector: 'input' }), 'synthetic-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, init] = fetchMock.mock.calls[0]
    expect(JSON.parse(String(init?.body))).toEqual({ email: 'owner@example.test', password: 'synthetic-password' })
  })

  it('blocks malformed registration before making a network request', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
    renderApp('/register')

    fireEvent.change(screen.getByRole('textbox', { name: 'Your name' }), { target: { value: 'Synthetic Owner' } })
    fireEvent.change(screen.getByRole('textbox', { name: 'Email address' }), { target: { value: 'not-an-email' } })
    fireEvent.change(screen.getByLabelText('Password', { selector: 'input' }), { target: { value: 'short' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Email address' })).toBeInvalid())
    expect(fetchMock).not.toHaveBeenCalled()
  })
})