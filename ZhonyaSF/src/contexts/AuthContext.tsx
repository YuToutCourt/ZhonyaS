'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface User {
  id: number
  username: string
  email?: string
  created_at?: string
  last_login?: string
}

export interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (username: string, password: string, email?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
  syncAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Vérifier si l'utilisateur est connecté au chargement
  useEffect(() => {
    const checkAuth = async () => {
      // Attendre un peu pour s'assurer que le localStorage est disponible
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const storedToken = localStorage.getItem('access_token')
      
      if (storedToken) {
        setToken(storedToken)
        await fetchCurrentUser(storedToken)
      } else {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        // Token invalide, le supprimer
        localStorage.removeItem('access_token')
        setToken(null)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
      localStorage.removeItem('access_token')
      setToken(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setToken(data.access_token)
        setUser(data.user)
        localStorage.setItem('access_token', data.access_token)
        
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Erreur de connexion' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  }

  const register = async (username: string, password: string, email?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email }),
      })

      const data = await response.json()

      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Erreur lors de l\'inscription' }
      }
    } catch (error) {
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('access_token')
  }

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Erreur lors de l\'envoi de l\'email' }
      }
    } catch (error) {
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  }

  const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, new_password: newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Erreur lors de la réinitialisation' }
      }
    } catch (error) {
      return { success: false, error: 'Erreur de connexion au serveur' }
    }
  }

  const syncAuth = async (): Promise<void> => {
    const storedToken = localStorage.getItem('access_token')
    
    if (storedToken) {
      setToken(storedToken)
      await fetchCurrentUser(storedToken)
    } else {
      setToken(null)
      setUser(null)
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    syncAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
