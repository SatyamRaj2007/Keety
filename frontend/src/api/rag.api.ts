import { request } from './client'
import type { BusinessDocument, Pagination } from '../types'

export const ragApi = {
  ingest: (input: {
    name: string
    text: string
    sourceType: BusinessDocument['sourceType']
    description?: string
    originalFileName?: string
  }) =>
    request<{ document: BusinessDocument }>('/rag/documents', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  list: (params: { page?: number; limit?: number; status?: string } = {}) => {
    const q = new URLSearchParams()
    if (params.page)   q.set('page',   String(params.page))
    if (params.limit)  q.set('limit',  String(params.limit))
    if (params.status) q.set('status', params.status)
    return request<{ documents: BusinessDocument[]; pagination: Pagination }>(
      `/rag/documents${q.size ? `?${q}` : ''}`
    )
  },

  get: async (id: string) =>
    (await request<{ document: BusinessDocument }>(`/rag/documents/${id}`)).document,

  update: async (id: string, input: { name?: string; description?: string }) =>
    (await request<{ document: BusinessDocument }>(`/rag/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    })).document,

  delete: (id: string) =>
    request<{ deleted: boolean; documentId: string }>(`/rag/documents/${id}`, {
      method: 'DELETE',
    }),
}
