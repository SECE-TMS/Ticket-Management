import api from './api'
import type { Pagination, Role, User } from '../types'

export interface UserListParams {
  page?: number
  limit?: number
  role?: Role | ''
  department?: string
  isActive?: string
  search?: string
}

export const userService = {
  async list(params: UserListParams = {}) {
    const { data } = await api.get('/users', { params })
    return data.data as { items: User[]; pagination: Pagination }
  },

  async listByDepartment(deptId: string) {
    const { data } = await api.get(`/users/department/${deptId}`)
    return data.data as User[]
  },

  async create(payload: {
    name: string
    email: string
    password: string
    role: 'manager' | 'employee'
    department: string
    phone?: string
    rollNumber?: string
  }) {
    const { data } = await api.post('/users', payload)
    return data.data as User
  },

  async createEmployee(payload: {
    name: string
    email: string
    password: string
    phone?: string
    rollNumber?: string
  }) {
    const { data } = await api.post('/users/employee', payload)
    return data.data as User
  },

  async update(
    id: string,
    payload: Partial<{
      name: string
      phone: string
      rollNumber: string
      department: string | null
      role: 'manager' | 'employee'
    }>
  ) {
    const { data } = await api.put(`/users/${id}`, payload)
    return data.data as User
  },

  async updateStatus(id: string, isActive: boolean) {
    const { data } = await api.patch(`/users/${id}/status`, { isActive })
    return data.data as User
  },

  async remove(id: string) {
    const { data } = await api.delete(`/users/${id}`)
    return data
  },
}
