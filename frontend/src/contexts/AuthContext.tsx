import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'

export type UserRole = 'patient' | 'admin' | 'staff'

interface User {
  id: string
  email: string
  name: string
  role: UserRole
  patient_id?: number
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  isStaff: boolean
  isPatient: boolean
  login: (email: string, password: string, role?: UserRole) => Promise<void>
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
      // Return default values instead of throwing to prevent blank screen
      return {
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isStaff: false,
        isPatient: false,
        login: async () => {},
        register: async () => {},
        logout: () => {},
        loading: false,
      }
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        // Ensure role is set, default to patient if not
        if (!parsedUser.role) {
          // Try to determine role from email
          if (parsedUser.email) {
            if (parsedUser.email.includes('admin@') || parsedUser.email.includes('admin')) {
              parsedUser.role = 'admin'
            } else if (parsedUser.email.includes('staff@') || parsedUser.email.includes('staff')) {
              parsedUser.role = 'staff'
            } else {
              parsedUser.role = 'patient'
            }
            // Update localStorage with role
            localStorage.setItem('user', JSON.stringify(parsedUser))
          } else {
            parsedUser.role = 'patient'
          }
        }
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string, role?: UserRole) => {
    try {
      // For now, we'll use a simple mock authentication
      // In production, this should call your backend auth endpoint
      const response = await axios.post('/api/auth/login', { email, password, role })
      const { token, user: userData } = response.data
      // Ensure role is set in userData - use provided role if not in response
      if (!userData.role && role) {
        userData.role = role
      }
      // If still no role, determine from email
      if (!userData.role) {
        if (email.includes('admin@') || email.includes('admin')) {
          userData.role = 'admin'
        } else if (email.includes('staff@') || email.includes('staff')) {
          userData.role = 'staff'
        } else {
          userData.role = 'patient'
        }
      }
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
    } catch (error: any) {
      // Mock login for demo - remove in production
      if (email && password) {
        // Determine role from email or use provided role
        let userRole: UserRole = role || 'patient'
        if (email.includes('admin@') || email.includes('admin')) {
          userRole = 'admin'
        } else if (email.includes('staff@') || email.includes('staff')) {
          userRole = 'staff'
        }
        
        const mockUser = { 
          id: '1', 
          email, 
          name: email.split('@')[0],
          role: userRole
        }
        localStorage.setItem('token', 'mock-token')
        localStorage.setItem('user', JSON.stringify(mockUser))
        setUser(mockUser)
      } else {
        throw new Error(error.response?.data?.detail || 'Login failed')
      }
    }
  }

  const register = async (email: string, password: string, name: string, role: UserRole, additionalData?: any) => {
    try {
      const registerData = { email, password, name, role, ...(additionalData || {}) }
      const response = await axios.post('/api/auth/register', registerData)
      const { token, user: userData } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
    } catch (error: any) {
      // If API fails, still create mock user for demo
      const mockUser = { 
        id: '1', 
        email, 
        name, 
        role,
        patient_id: role === 'patient' ? 1 : undefined
      }
      localStorage.setItem('token', 'mock-token')
      localStorage.setItem('user', JSON.stringify(mockUser))
      setUser(mockUser)
      throw error // Re-throw to show error message
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isStaff: user?.role === 'staff' || user?.role === 'admin',
        isPatient: user?.role === 'patient',
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

