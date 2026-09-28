import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSession, request, saveBusinessId, saveToken } from './client'

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
})

describe('API client', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('attaches the bearer token and active business to a request', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ success: true, data: { ok: true } }))
    vi.stubGlobal('fetch', fetchMock)
    saveToken('synthetic-token')
    saveBusinessId('business-a')

    await expect(request<{ ok: boolean }>('/products')).resolves.toEqual({ ok: true })

    const [, init] = fetchMock.mock.calls[0]
    const headers = new Headers(init?.headers)
    expect(headers.get('Authorization')).toBe('Bearer synthetic-token')
    expect(headers.get('x-business-id')).toBe('business-a')
  })

  it('normalizes undocumented server failures without exposing internal details', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Mongo TLS alert and connection string details' },
    }, 500))
    vi.stubGlobal('fetch', fetchMock)

    await expect(request('/auth/login')).rejects.toMatchObject({
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'KEETY could not complete that request right now. Please try again in a moment.',
    })
  })

  it('clears both authentication and business selection on logout', () => {
    saveToken('synthetic-token')
    saveBusinessId('business-a')

    clearSession()

    expect(localStorage.getItem('keety_token')).toBeNull()
    expect(localStorage.getItem('keety_active_business')).toBeNull()
  })
})
