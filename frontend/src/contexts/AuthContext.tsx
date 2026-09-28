import { useEffect, useState, type ReactNode } from 'react'
import { authApi } from '../api/auth.api'
import { businessApi, type BusinessInput } from '../api/business.api'
import { clearSession, getStoredBusinessId, saveBusinessId, saveToken } from '../api/client'
import { AuthContext, type AuthContextValue } from './auth-context'
import type { Business, User } from '../types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [activeBusinessId, setActiveBusinessId] = useState('')
  const [checkingSession, setCheckingSession] = useState(() => Boolean(localStorage.getItem('keety_token')))

  const reloadBusinesses = async (currentUser: User) => {
    const results = await Promise.allSettled(currentUser.businessIds.map((id) => businessApi.get(id)))
    const available = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : [])
    setBusinesses(available)
    const storedId = getStoredBusinessId()
    const selected = available.find((business) => business._id === storedId) || available[0]
    setActiveBusinessId(selected?._id || '')
    if (selected) saveBusinessId(selected._id)
    else localStorage.removeItem('keety_active_business')
  }

  useEffect(() => {
    const token = localStorage.getItem('keety_token')
    if (!token) return

    authApi.me()
      .then(async ({ user: currentUser }) => {
        setUser(currentUser)
        await reloadBusinesses(currentUser)
      })
      .catch(() => {
        clearSession()
        setUser(null)
      })
      .finally(() => setCheckingSession(false))
  }, [])

  const establishSession = async (result: { user: User; token: string }) => {
    saveToken(result.token)
    setUser(result.user)
    await reloadBusinesses(result.user)
  }

  const signIn = async (email: string, password: string) => {
    await establishSession(await authApi.login({ email, password }))
  }

  const signUp = async (name: string, email: string, password: string) => {
    await establishSession(await authApi.register({ name, email, password }))
  }

  const signOut = () => {
    clearSession()
    setUser(null)
    setBusinesses([])
    setActiveBusinessId('')
  }

  const selectBusiness = (id: string) => {
    saveBusinessId(id)
    setActiveBusinessId(id)
  }

  const createBusiness = async (input: BusinessInput) => {
    const business = await businessApi.create(input)
    setBusinesses((current) => [...current, business])
    setActiveBusinessId(business._id)
    saveBusinessId(business._id)
    setUser((current) => current ? { ...current, businessIds: [...current.businessIds, business._id] } : current)
    return business
  }

  const updateBusiness = async (input: Partial<BusinessInput>) => {
    if (!activeBusinessId) return
    const updated = await businessApi.update(activeBusinessId, input)
    setBusinesses((current) => current.map((business) => business._id === updated._id ? updated : business))
  }

  const activeBusiness = businesses.find((business) => business._id === activeBusinessId) || null
  const value: AuthContextValue = {
    user, businesses, activeBusiness, activeBusinessId, checkingSession,
    signIn, signUp, signOut, selectBusiness, createBusiness, updateBusiness,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}