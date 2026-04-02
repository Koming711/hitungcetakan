// Authentication utility functions

export interface User {
  id?: string
  username: string
  password?: string
  name?: string
  namaLengkap?: string
  nomorHP?: string
  email?: string
  role?: string
  isDemo?: boolean
  demoUntil?: string
  popupMessage?: string
  validUntil?: string
  createdAt?: string
  [key: string]: unknown
}

// Check if we're in a restricted environment (like iframe/preview)
function isRestrictedEnvironment(): boolean {
  if (typeof window === 'undefined') return true
  // Check if we're in an iframe
  try {
    if (window.self !== window.top) {
      return true
    }
  } catch (e) {
    // Cross-origin iframe access denied
    return true
  }
  // Check if localStorage is accessible
  try {
    localStorage.setItem('__test__', 'test')
    localStorage.removeItem('__test__')
    return false
  } catch (e) {
    return true
  }
}

export function getAuthUser(): User | null {
  if (typeof window === 'undefined') return null
  
  // In restricted environments, return a mock user for demo purposes
  if (isRestrictedEnvironment()) {
    return {
      username: 'admin',
      password: 'admin123',
      name: 'Demo User',
      role: 'admin'
    }
  }
  
  const authData = localStorage.getItem('auth')
  if (!authData) return null
  try {
    return JSON.parse(authData)
  } catch {
    return null
  }
}

export function setAuthUser(user: User): void {
  if (typeof window === 'undefined') return
  if (isRestrictedEnvironment()) return
  localStorage.setItem('auth', JSON.stringify(user))
}

export function clearAuthUser(): void {
  if (typeof window === 'undefined') return
  if (isRestrictedEnvironment()) return
  localStorage.removeItem('auth')
}

export function isAuthenticated(): boolean {
  return getAuthUser() !== null
}

export function login(username: string, password: string): boolean {
  // In restricted environment, just accept any credentials
  if (isRestrictedEnvironment()) {
    setAuthUser({ username, password, name: 'Demo User', role: 'admin' })
    return true
  }

  const users = getUsers()
  const user = users.find(u => u.username === username && u.password === password)
  
  // Allow default admin login
  if (!user && username === 'admin' && password === 'admin123') {
    setAuthUser({ username: 'admin', password: 'admin123', name: 'Administrator', role: 'admin' })
    return true
  }
  
  if (user) {
    setAuthUser(user)
    return true
  }
  
  return false
}

export function logout(): void {
  clearAuthUser()
}

export function getUsers(): User[] {
  if (typeof window === 'undefined') return []
  if (isRestrictedEnvironment()) return []
  
  const usersData = localStorage.getItem('users')
  if (!usersData) return []
  try {
    return JSON.parse(usersData)
  } catch {
    return []
  }
}

export function register(username: string, password: string, name?: string): boolean {
  if (isRestrictedEnvironment()) {
    return false
  }

  const users = getUsers()
  
  if (users.find(u => u.username === username)) {
    return false
  }
  
  users.push({ username, password, name, role: 'user' })
  localStorage.setItem('users', JSON.stringify(users))
  return true
}
