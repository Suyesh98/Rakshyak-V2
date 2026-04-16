import axios from 'axios'

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized'

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

const AUTH_EXCLUDED_401_PATHS = ['/auth/login', '/auth/register', '/auth/logout']

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || ''
    const shouldBypassGlobal401 = AUTH_EXCLUDED_401_PATHS.some((path) => requestUrl.includes(path))

    if (error.response?.status === 401 && !shouldBypassGlobal401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT))
    }
    return Promise.reject(error)
  }
)

export default api
