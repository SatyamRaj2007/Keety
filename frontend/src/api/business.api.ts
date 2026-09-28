import { request } from './client'
import type { Business, BusinessType } from '../types'

export interface BusinessInput {
  name: string
  businessType: BusinessType
  currency: string
  timezone: string
  description?: string
}

export const businessApi = {
  get: async (id: string) => (await request<{ business: Business }>(`/business/${id}`)).business,
  create: async (input: BusinessInput) => (await request<{ business: Business }>('/business', {
    method: 'POST', body: JSON.stringify(input),
  })).business,
  update: async (id: string, input: Partial<BusinessInput>) => (await request<{ business: Business }>(`/business/${id}`, {
    method: 'PATCH', body: JSON.stringify(input),
  })).business,
}