import api from './api'
import type { Pagination, Task, TaskPriority, TaskStats, TaskStatus } from '../types'

export interface TaskListParams {
  page?: number
  limit?: number
  status?: TaskStatus | ''
  priority?: TaskPriority | ''
  department?: string
  assignedTo?: string
  search?: string
  from?: string
  to?: string
}

export interface CreateTaskPayload {
  title: string
  description: string
  department: string
  assignedTo: string
  priority?: TaskPriority
  dueDate?: string | null
  relatedTicket?: string | null
  checklist?: Array<{ title: string; completed?: boolean }>
  notificationPreferences?: {
    inApp?: boolean
    email?: boolean
    sms?: boolean
  }
}

export interface UpdateTaskPayload {
  title?: string
  description?: string
  department?: string
  assignedTo?: string
  priority?: TaskPriority
  dueDate?: string | null
  relatedTicket?: string | null
  checklist?: Array<{ _id?: string; title: string; completed?: boolean }>
}

export const taskService = {
  async list(params: TaskListParams = {}) {
    const { data } = await api.get('/tasks', { params })
    return data.data as { items: Task[]; pagination: Pagination; stats: TaskStats }
  },

  async getById(id: string) {
    const { data } = await api.get(`/tasks/${id}`)
    return data.data as Task
  },

  async create(payload: CreateTaskPayload) {
    const { data } = await api.post('/tasks', payload)
    return data.data as Task
  },

  async update(id: string, payload: UpdateTaskPayload) {
    const { data } = await api.patch(`/tasks/${id}`, payload)
    return data.data as Task
  },

  async updateStatus(
    id: string,
    payload: { status: TaskStatus; completionRemarks?: string; cancelledReason?: string },
    proofFile?: File | null
  ) {
    const formData = new FormData()
    formData.append('status', payload.status)
    if (payload.completionRemarks) {
      formData.append('completionRemarks', payload.completionRemarks)
    }
    if (payload.cancelledReason) {
      formData.append('cancelledReason', payload.cancelledReason)
    }
    if (proofFile) {
      formData.append('proof', proofFile)
    }

    const { data } = await api.patch(`/tasks/${id}/status`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data as Task
  },

  async toggleChecklist(taskId: string, itemId: string, completed: boolean) {
    const { data } = await api.patch(`/tasks/${taskId}/checklist/${itemId}`, { completed })
    return data.data as Task
  },

  async delete(id: string) {
    const { data } = await api.delete(`/tasks/${id}`)
    return data.data as { success: boolean }
  },
}
