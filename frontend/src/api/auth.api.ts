import { request } from './client'
import type { User } from '../types'

export interface Credentials {
  email: string
  password: string
}

export interface Registration extends Credentials {
  name: string
}

export interface AuthResult {
  user: User
  token: string
}

export const authApi = {
  login: (credentials: Credentials) => request<AuthResult>('/auth/login', {
    method: 'POST', body: JSON.stringify(credentials),
  }),
  register: (input: Registration) => request<AuthResult>('/auth/register', {
    method: 'POST', body: JSON.stringify(input),
  }),
  me: () => request<{ user: User }>('/auth/me'),
}