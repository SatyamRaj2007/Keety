import { request } from './client'
import type { AIResponse } from '../types'

export const aiApi = {
  ask: (question: string) =>
    request<AIResponse>('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),

  growthStrategy: (goal: string) =>
    request<AIResponse>('/ai/growth-strategy', {
      method: 'POST',
      body: JSON.stringify({ goal }),
    }),

  productAnalysis: (productId: string, question?: string) =>
    request<AIResponse>('/ai/product-analysis', {
      method: 'POST',
      body: JSON.stringify({ productId, ...(question ? { question } : {}) }),
    }),

  summary: (period: 'daily' | 'weekly' | 'monthly' = 'monthly') =>
    request<AIResponse>('/ai/summary', {
      method: 'POST',
      body: JSON.stringify({ period }),
    }),
}
