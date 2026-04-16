import { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const navigate = useNavigate()

  const register = async (formData) => {
    await api.post('/auth/register', formData)
    toast.success('Account created! Please log in.')
    navigate('/login')
  }

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials)
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    toast.success('Welcome to the Defense Surveillance System!')
    navigate('/loading')
  }

  const updateUser = async (updates) => {
    const { data } = await api.put('/auth/profile', updates)
    const updatedUser = { ...user, ...data }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setUser(updatedUser)
    return updatedUser
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      setUser(null)
      navigate('/login')
    }
  }

  return (
    <AuthContext.Provider value={{ user, register, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
