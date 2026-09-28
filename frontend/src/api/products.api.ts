import { request } from './client'
import type { Pagination, Product } from '../types'

export type ProductInput = Pick<Product, 'name' | 'price'> & Partial<Pick<Product, 'sku' | 'category' | 'description' | 'costPrice' | 'unit' | 'status' | 'metadata'>>

export interface ProductQuery {
  page?: number
  limit?: number
  search?: string
  category?: string
  status?: Product['status']
}

export const productsApi = {
  list: (query: ProductQuery = {}) => {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, String(value))
    })
    return request<{ products: Product[]; pagination: Pagination }>(`/products${params.size ? `?${params}` : ''}`)
  },
  create: async (input: ProductInput) => (await request<{ product: Product }>('/products', {
    method: 'POST', body: JSON.stringify(input),
  })).product,
  update: async (id: string, input: Partial<ProductInput>) => (await request<{ product: Product }>(`/products/${id}`, {
    method: 'PATCH', body: JSON.stringify(input),
  })).product,
}