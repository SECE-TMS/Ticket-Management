import api from './api'
import type { ApiSuccess, SystemSettings } from '../types'

export const settingService = {
  get: async (): Promise<SystemSettings> => {
    const res = await api.get<ApiSuccess<SystemSettings>>('/settings')
    return res.data.data
  },

  getPublic: async (): Promise<SystemSettings> => {
    const res = await api.get<ApiSuccess<SystemSettings>>('/settings/public')
    return res.data.data
  },

  update: async (data: Partial<SystemSettings>): Promise<SystemSettings> => {
    const res = await api.put<ApiSuccess<SystemSettings>>('/settings', data)
    return res.data.data
  },
}
