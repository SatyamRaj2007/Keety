import { request } from './client'
import type { Customer, Pagination } from '../types'

export type CustomerInput = Pick<Customer, 'name'> & Partial<Pick<Customer, 'email' | 'phone' | 'externalId'>>

export interface CustomerQuery {
  page?: number
  limit?: number
  search?: string
}

export const customersApi = {
  list: (query: CustomerQuery = {}) => {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params.set(key, String(value))
    })
    return request<{ customers: Customer[]; pagination: Pagination }>(`/customers${params.size ? `?${params}` : ''}`)
  },
  create: async (input: CustomerInput) => (await request<{ customer: Customer }>('/customers', {
    method: 'POST', body: JSON.stringify(input),
  })).customer,
  update: async (id: string, input: Partial<CustomerInput>) => (await request<{ customer: Customer }>(`/customers/${id}`, {
    method: 'PATCH', body: JSON.stringify(input),
  })).customer,
  remove: async (id: string) => request<{ deleted: boolean }>(`/customers/${id}`, { method: 'DELETE' }),
}
