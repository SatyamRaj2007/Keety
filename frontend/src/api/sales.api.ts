import { request } from './client'
import type { Pagination, Sale } from '../types'

export interface SaleInput {
  items: Array<{ productId: string; quantity: number }>
  discount?: number
  tax?: number
  paymentMethod?: Sale['paymentMethod']
}

export const salesApi = {
  list: (page = 1, limit = 20) => request<{ sales: Sale[]; pagination: Pagination }>(`/sales?page=${page}&limit=${limit}`),
  get: async (id: string) => (await request<{ sale: Sale }>(`/sales/${id}`)).sale,
  create: async (input: SaleInput) => (await request<{ sale: Sale }>('/sales', {
    method: 'POST', body: JSON.stringify(input),
  })).sale,
}