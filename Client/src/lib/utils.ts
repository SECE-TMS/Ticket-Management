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

const DEFAULT_API_URL = import.meta.env.PROD
  ? 'https://ticket-management-1-yh5g.onrender.com/api/v1'
  : 'http://localhost:5000/api/v1'

export const BACKEND_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/api\/v1\/?$/, '')

export function getAttachmentUrl(url?: string | null): string {
  if (!url) return ''
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`
  return `${BACKEND_URL}${cleanPath}`
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
