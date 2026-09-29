import { request } from './client'
import type { AIResponse, AILogEntry, Pagination } from '../types'

export type AIPeriod = 'daily' | 'weekly' | 'monthly'

export const aiApi = {
  ask: (question: string, period: AIPeriod = 'monthly') =>
    request<AIResponse>('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question, period }),
    }),

  growthStrategy: (goal: string, period: AIPeriod = 'monthly') =>
    request<AIResponse>('/ai/growth-strategy', {
      method: 'POST',
      body: JSON.stringify({ goal, period }),
    }),

  productAnalysis: (productId: string, question?: string, period: AIPeriod = 'monthly') =>
    request<AIResponse>('/ai/product-analysis', {
      method: 'POST',
      body: JSON.stringify({ productId, period, ...(question ? { question } : {}) }),
    }),

  summary: (period: AIPeriod = 'monthly') =>
    request<AIResponse>('/ai/summary', {
      method: 'POST',
      body: JSON.stringify({ period }),
    }),

  /** GET /ai/history — returns paginated AI request log for the active business */
  history: (params: { page?: number; limit?: number; status?: string; type?: string } = {}) => {
    const q = new URLSearchParams()
    if (params.page)   q.set('page',   String(params.page))
    if (params.limit)  q.set('limit',  String(params.limit))
    if (params.status) q.set('status', params.status)
    if (params.type)   q.set('type',   params.type)
    return request<{ logs: AILogEntry[]; pagination: Pagination }>(
      `/ai/history${q.size ? `?${q}` : ''}`
    )
  },
}
