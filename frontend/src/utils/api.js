import axios from 'axios'

// Docker ichida frontend:3000, backend:8000 -> /api/v1 relative URL ishlatamiz
// Nginx yo'q bo'lganda to'g'ridan-to'g'ri backend URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Request interceptor: access token qo'shish
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor: 401 da token refresh
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error)
    else p.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        isRefreshing = false
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        })
        localStorage.setItem('access_token', data.access)
        api.defaults.headers.common.Authorization = `Bearer ${data.access}`
        processQueue(null, data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  me: () => api.get('/auth/me/'),
  changePassword: (data) => api.post('/auth/change-password/', data),
}

export const dashboardAPI = {
  stats: () => api.get('/dashboard/stats/'),
  activity: () => api.get('/dashboard/activity/'),
}

export const studentsAPI = {
  me: (params) => api.get('/students/me/', { params }),
  list: (params) => api.get('/students/', { params }),
  detail: (id) => api.get(`/students/${id}/`),
  create: (data) => api.post('/students/', data),
  update: (id, data) => api.patch(`/students/${id}/`, data),
  delete: (id) => api.delete(`/students/${id}/`),
  payments: (id) => api.get(`/students/${id}/payments/`),
  attendance: (id) => api.get(`/students/${id}/attendance/`),
  addToGroup: (id, data) => api.post(`/students/${id}/add_to_group/`, data),
  removeFromGroup: (id, data) => api.post(`/students/${id}/remove_from_group/`, data),
  teachers: (params) => api.get('/students/teachers/', { params }),
  createTeacher: (data) => api.post('/students/teachers/', data),
  updateTeacher: (id, data) => api.patch(`/students/teachers/${id}/`, data),
  deleteTeacher: (id) => api.delete(`/students/teachers/${id}/`),
}

export const groupsAPI = {
  list: (params) => api.get('/groups/', { params }),
  detail: (id) => api.get(`/groups/${id}/`),
  create: (data) => api.post('/groups/', data),
  update: (id, data) => api.patch(`/groups/${id}/`, data),
  delete: (id) => api.delete(`/groups/${id}/`),
  schedule: (id) => api.get(`/groups/${id}/schedule/`),
  sendSMS: (id, data) => api.post(`/groups/${id}/send_sms_to_all/`, data),
}

export const coursesAPI = {
  list: (params) => api.get('/courses/', { params }),
  create: (data) => api.post('/courses/', data),
  update: (id, data) => api.patch(`/courses/${id}/`, data),
}

export const paymentsAPI = {
  list: (params) => api.get('/payments/', { params }),
  detail: (id) => api.get(`/payments/${id}/`),
  create: (data) => api.post('/payments/', data),
  summary: () => api.get('/payments/summary/'),
  debtors: () => api.get('/payments/debtors/'),
  generatePaymeLink: (id) => api.post(`/payments/${id}/generate_payme_link/`),
}

export const attendanceAPI = {
  sessions: (params) => api.get('/attendance/sessions/', { params }),
  sessionDetail: (id) => api.get(`/attendance/sessions/${id}/`),
  createSession: (data) => api.post('/attendance/sessions/', data),
  bulkMark: (sessionId, data) => api.post(`/attendance/sessions/${sessionId}/bulk_mark/`, data),
  sessionStats: (id) => api.get(`/attendance/sessions/${id}/stats/`),
  today: () => api.get('/attendance/sessions/today/'),
}

export const smsAPI = {
  logs: (params) => api.get('/sms/logs/', { params }),
  send: (data) => api.post('/sms/send/', data),
}

export const reportsAPI = {
  payments: (params) => api.get('/reports/payments/', { params }),
  paymentsExcel: (params) =>
    api.get('/reports/payments/', { params: { ...params, export: 'excel' }, responseType: 'blob' }),
  attendance: (params) => api.get('/reports/attendance/', { params }),
  attendanceExcel: (params) =>
    api.get('/reports/attendance/', { params: { ...params, export: 'excel' }, responseType: 'blob' }),
  income: (params) => api.get('/reports/income/', { params }),
  incomeExcel: (params) =>
    api.get('/reports/income/', { params: { ...params, export: 'excel' }, responseType: 'blob' }),
}

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

export default api
