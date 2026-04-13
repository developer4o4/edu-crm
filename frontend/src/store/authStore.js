import { create } from 'zustand'
import { authAPI } from '../utils/api'
import { studentsAPI } from '../utils/api'
const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  init: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      set({ isLoading: false })
      return
    }
    try {
      const { data } = await authAPI.me()
      set({ user: data, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.clear()
      set({ isLoading: false })
    }
  },

  login: async (credentials) => {
    const { data } = await authAPI.login(credentials)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    set({ user: data.user, isAuthenticated: true })
    return data
  },

  logout: async () => {
    const refresh = localStorage.getItem('refresh_token')
    try { await authAPI.logout(refresh) } catch { /* ignore */ }
    localStorage.clear()
    set({ user: null, isAuthenticated: false })
  },

  hasRole: (roles) => {
    const user = get().user
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  },
  myStudentProfile: async () => {
    const res = await studentsAPI.me()

    set({
      student: res.data
    })

    return res.data
  },
  isAdmin: () => get().hasRole(['admin', 'super_admin']),
  isSuperAdmin: () => get().hasRole('super_admin'),
  isTeacher: () => get().hasRole(['teacher', 'admin', 'super_admin']),
}))

export default useAuthStore
