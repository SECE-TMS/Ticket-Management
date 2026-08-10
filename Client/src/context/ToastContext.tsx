import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '../lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ToastIcon = ({ type }: { type: ToastType }) => {
  const iconProps = { size: 15 }
  if (type === 'success') return <CheckCircle2 {...iconProps} />
  if (type === 'error')   return <XCircle {...iconProps} />
  return <Info {...iconProps} />
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      setItems((prev) => [...prev, { id, message, type }])
      window.setTimeout(() => remove(id), 4500)
    },
    [remove]
  )

  const value = useMemo(
    () => ({
      toast,
      success: (message: string) => toast(message, 'success'),
      error: (message: string) => toast(message, 'error'),
    }),
    [toast]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 bottom-4 z-100 flex w-[min(100%,22rem)] flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--white)] p-3.5 shadow-lg border-l-4 transition-all duration-300',
              item.type === 'success' && 'border-l-[var(--success)]',
              item.type === 'error' && 'border-l-[var(--danger)]',
              item.type === 'info' && 'border-l-[var(--primary-blue)]'
            )}
            role="alert"
          >
            <div
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                item.type === 'success' && 'bg-[var(--success-light)] text-[var(--success)]',
                item.type === 'error' && 'bg-[var(--danger-light)] text-[var(--danger)]',
                item.type === 'info' && 'bg-[var(--primary-blue-light)] text-[var(--primary-blue)]'
              )}
              aria-hidden
            >
              <ToastIcon type={item.type} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--ink)] leading-snug">
                {item.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="p-0.5 text-[var(--ink-muted)] hover:text-[var(--ink)] cursor-pointer"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
