import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthContext } from '../contexts/auth-context'
import { SalesPage } from './SalesPage'
import type { Business, User } from '../types'

const businessId = '507f1f77bcf86cd799439011'
const user: User = {
  id: '507f1f77bcf86cd799439012',
  name: 'Synthetic Owner',
  email: 'owner@example.test',
  role: 'OWNER',
  businessIds: [businessId],
  createdAt: '2026-09-01T00:00:00.000Z',
}
const business: Business = {
  _id: businessId,
  ownerId: user.id,
  name: 'Synthetic Shop',
  businessType: 'CLOTHING',
  description: '',
  location: { address: '', city: '', state: '', country: '' },
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  logoUrl: '',
  settings: { lowStockThreshold: 5, aiEnabled: true, notificationsEnabled: false },
}
const products = [
  { _id: '507f1f77bcf86cd799439021', name: 'Canvas tote', price: 850 },
  { _id: '507f1f77bcf86cd799439022', name: 'Cotton pouch', price: 420 },
].map((product) => ({
  ...product,
  businessId,
  sku: '',
  category: '',
  description: '',
  costPrice: 0,
  unit: 'piece',
  status: 'ACTIVE' as const,
  metadata: {},
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
}))

const pageContextValue = {
  user,
  businesses: [business],
  activeBusiness: business,
  activeBusinessId: businessId,
  checkingSession: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  selectBusiness: vi.fn(),
  createBusiness: vi.fn(),
  updateBusiness: vi.fn(),
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('sales form contract', () => {
  it('submits distinct products with quantity and authenticated business scope', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = []
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      const url = String(input)
      requests.push({ url, init })
      const method = init?.method || 'GET'

      if (url.includes('/products?')) {
        return new Response(JSON.stringify({
          success: true,
          data: { products, pagination: { page: 1, limit: 100, total: products.length, pages: 1 } },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }

      if (url.includes('/sales') && method === 'POST') {
        return new Response(JSON.stringify({
          success: true,
          data: { sale: { _id: '507f1f77bcf86cd799439031', totalAmount: 1270 } },
        }), { status: 201, headers: { 'Content-Type': 'application/json' } })
      }

      return new Response(JSON.stringify({
        success: true,
        data: { sales: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    })
    vi.stubGlobal('fetch', fetchMock)
    localStorage.setItem('keety_token', 'synthetic-token')
    localStorage.setItem('keety_active_business', businessId)
    const interaction = userEvent.setup()

    render(<AuthContext.Provider value={pageContextValue}><SalesPage /></AuthContext.Provider>)
    await screen.findByRole('heading', { name: 'No sales recorded yet.' })
    await interaction.click(screen.getAllByRole('button', { name: 'Record sale' })[0])
    await interaction.click(screen.getByRole('button', { name: 'Add another product' }))
    await interaction.selectOptions(screen.getByLabelText('Product 2'), products[1]._id)
    const quantities = screen.getAllByRole('spinbutton', { name: 'Qty' })
    await interaction.clear(quantities[1])
    await interaction.type(quantities[1], '2')
    await interaction.clear(screen.getByRole('spinbutton', { name: 'Tax (INR)' }))
    await interaction.type(screen.getByRole('spinbutton', { name: 'Tax (INR)' }), '20')
    await interaction.click(screen.getByRole('button', { name: 'Complete sale' }))

    expect(await screen.findByText('Sale recorded. Your inventory and analytics have been refreshed.')).toBeInTheDocument()
    const saleRequest = requests.find(({ url, init }) => url.endsWith('/sales') && init?.method === 'POST')
    expect(saleRequest).toBeDefined()
    const headers = new Headers(saleRequest?.init?.headers)
    expect(headers.get('Authorization')).toBe('Bearer synthetic-token')
    expect(headers.get('x-business-id')).toBe(businessId)
    expect(JSON.parse(String(saleRequest?.init?.body))).toEqual({
      items: [
        { productId: products[0]._id, quantity: 1 },
        { productId: products[1]._id, quantity: 2 },
      ],
      discount: 0,
      tax: 20,
      paymentMethod: 'CASH',
    })
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
  })
})
