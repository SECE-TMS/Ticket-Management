import api from './api'
import type { NotificationItem, Pagination } from '../types'

export const notificationService = {
  async list(params: { page?: number; limit?: number } = {}) {
    const { data } = await api.get('/notifications', { params })
    return data.data as { items: NotificationItem[]; pagination: Pagination }
  },

  async markRead(id: string) {
    const { data } = await api.patch(`/notifications/${id}/read`)
    return data.data as NotificationItem
  },

  async markAllRead() {
    const { data } = await api.patch('/notifications/read-all')
    return data.data as { modified: number }
  },
}
