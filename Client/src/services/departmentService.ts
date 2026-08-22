import api from './api'
import type { Department } from '../types'

export const departmentService = {
  async listActive() {
    const { data } = await api.get('/departments')
    return data.data as Department[]
  },

  async listAll() {
    const { data } = await api.get('/departments/all')
    return data.data as Department[]
  },

  async getById(id: string) {
    const { data } = await api.get(`/departments/${id}`)
    return data.data as Department
  },

  async create(payload: {
    name: string
    description?: string
    complaintTypes?: string[]
    slaHours?: number
    isActive?: boolean
    manager?: string | null
  }) {
    const { data } = await api.post('/departments', payload)
    return data.data as Department
  },

  async update(
    id: string,
    payload: Partial<{
      name: string
      description: string
      complaintTypes: string[]
      slaHours: number
      isActive: boolean
      manager: string | null
    }>
  ) {
    const { data } = await api.put(`/departments/${id}`, payload)
    return data.data as Department
  },

  async updateStatus(id: string, isActive: boolean) {
    const { data } = await api.patch(`/departments/${id}/status`, { isActive })
    return data.data as Department
  },

  async remove(id: string) {
    const { data } = await api.delete(`/departments/${id}`)
    return data
  },
}
