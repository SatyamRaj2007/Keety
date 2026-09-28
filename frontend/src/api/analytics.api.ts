import { request } from './client'
import type { Analytics } from '../types'

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly'

export const analyticsApi = {
  get: (period: AnalyticsPeriod = 'monthly') => request<Analytics>(`/analytics?period=${period}`),
}