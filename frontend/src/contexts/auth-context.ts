import { createContext } from 'react'
import type { BusinessInput } from '../api/business.api'
import type { Business, User } from '../types'

export interface AuthContextValue {
  user: User | null
  businesses: Business[]
  activeBusiness: Business | null
  activeBusinessId: string
  checkingSession: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => void
  selectBusiness: (id: string) => void
  createBusiness: (input: BusinessInput) => Promise<Business>
  updateBusiness: (input: Partial<BusinessInput>) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)