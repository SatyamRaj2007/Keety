const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
const TOKEN_KEY = 'keety_token'
const BUSINESS_KEY = 'keety_active_business'

export class ApiError extends Error {
  status: number
  code: string

  constructor(message: string, status: number, code = 'REQUEST_FAILED') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(BUSINESS_KEY)
}

export function getStoredBusinessId() {
  return localStorage.getItem(BUSINESS_KEY)
}

export function saveBusinessId(id: string) {
  localStorage.setItem(BUSINESS_KEY, id)
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY)
  const businessId = getStoredBusinessId()
  const headers = new Headers(init.headers)

  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (businessId) headers.set('x-business-id', businessId)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError('Unable to reach KEETY. Check your connection and try again.', 0, 'NETWORK_ERROR')
  }

  const payload = await response.json().catch(() => null) as {
    success?: boolean
    data?: T
    error?: { code?: string; message?: string }
  } | null

  if (!response.ok || !payload?.success) {
    const safeServerMessage = response.status >= 500 && payload?.error?.code !== 'AI_SERVICE_UNAVAILABLE'
      ? 'KEETY could not complete that request right now. Please try again in a moment.'
      : payload?.error?.message || 'Something went wrong. Please try again.'
    throw new ApiError(
      safeServerMessage,
      response.status,
      payload?.error?.code,
    )
  }

  return payload.data as T
}

export const apiBaseUrl = API_BASE_URL