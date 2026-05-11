import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface User {
  email: string
  role: 'Admin' | 'Customer'
  customerId?: number
}

interface AuthContextType {
  user: User | null
  login: (email: string) => void
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

  const login = (email: string) => {
    if (email === 'admin@test.com') {
      setUser({ email, role: 'Admin' })
    } else {
      setUser({ email, role: 'Customer', customerId: 1 })
    }
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
