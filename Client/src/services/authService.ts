import api from './api'
import type { User } from '../types'

export interface LoginResponse {
  accessToken: string
  user: User
}

export const authService = {
  async login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password })
    return data.data as LoginResponse
  },

  async me() {
    const { data } = await api.get('/auth/me')
    return data.data as User
  },

  async logout() {
    await api.post('/auth/logout')
  },

  async refresh() {
    const { data } = await api.post('/auth/refresh')
    return data.data as { accessToken: string }
  },
}
