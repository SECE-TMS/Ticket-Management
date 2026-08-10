import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post(
      `${API_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    )
    const token = data?.data?.accessToken as string | undefined
    if (token) {
      localStorage.setItem('accessToken', token)
      return token
    }
  } catch {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
  }
  return null
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && original && !original._retry) {
      const isAuthRoute =
        original.url?.includes('/auth/login') || original.url?.includes('/auth/refresh')
      if (isAuthRoute) {
        return Promise.reject(error)
      }

      original._retry = true
      refreshing = refreshing ?? refreshAccessToken()
      const token = await refreshing
      refreshing = null

      if (token) {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      }

      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
