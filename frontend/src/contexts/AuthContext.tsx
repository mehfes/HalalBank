import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from '../services/api'

interface User {
  email: string
  role: 'Admin' | 'Customer'
  customerId?: number
  firstName?: string
  lastName?: string
  token?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (idToken: string) => Promise<void>
  register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('halalbank_user')
    return stored ? JSON.parse(stored) : null
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem('halalbank_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('halalbank_user')
    }
  }, [user])

  const login = async (email: string, password: string) => {
    const result = await api.auth.login({ email, password })
    setUser({
      email: result.email,
      role: result.role as 'Admin' | 'Customer',
      customerId: result.id,
      firstName: result.firstName,
      lastName: result.lastName,
      token: result.token,
    })
  }

  const loginWithGoogle = async (idToken: string) => {
    const result = await api.auth.googleLogin({ idToken })
    setUser({
      email: result.email,
      role: result.role as 'Admin' | 'Customer',
      customerId: result.id,
      firstName: result.firstName,
      lastName: result.lastName,
      token: result.token,
    })
  }

  const register = async (firstName: string, lastName: string, email: string, password: string) => {
    const result = await api.auth.register({ firstName, lastName, email, password })
    setUser({
      email: result.email,
      role: result.role as 'Admin' | 'Customer',
      customerId: result.id,
      firstName: result.firstName,
      lastName: result.lastName,
      token: result.token,
    })
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
