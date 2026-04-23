import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiClient } from '@/lib/api-client'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const response = await apiClient.get('/auth/me')
          setUser(response.data.data)
        } catch {
          localStorage.removeItem('auth_token')
          setToken(null)
        }
      }
      setIsLoading(false)
    }

    fetchUser()
  }, [token])

  const login = async (username: string, password: string) => {
    const response = await apiClient.post('/auth/login', { username, password })
    const { token: newToken, user: userData } = response.data.data
    localStorage.setItem('auth_token', newToken)
    setToken(newToken)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
