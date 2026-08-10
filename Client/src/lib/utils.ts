import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (typeof err === 'object' && err !== null) {
    const axiosErr = err as {
      response?: { data?: { error?: { message?: string }; message?: string } }
      message?: string
    }
    return (
      axiosErr.response?.data?.error?.message ||
      axiosErr.response?.data?.message ||
      axiosErr.message ||
      fallback
    )
  }
  return fallback
}

export const STATUSES = [
  'new',
  'assigned',
  'accepted',
  'in_progress',
  'resolved',
  'closed',
  'reopened',
] as const

export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

export function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
