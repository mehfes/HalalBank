import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface User {
  email: string
  role: 'Admin' | 'Customer'
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
    const role = email === 'admin@test.com' ? 'Admin' : 'Customer'
    setUser({ email, role })
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
