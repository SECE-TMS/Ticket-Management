import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const maxWidth = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  }[size]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--primary-blue-deeper)]/60 backdrop-blur-xs p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 h-full w-full cursor-default"
        aria-label="Close modal"
        onClick={onClose}
        tabIndex={-1}
      />

      {/* Modal box */}
      <div
        className={cn(
          'relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-[var(--white)] shadow-2xl sm:rounded-2xl',
          maxWidth,
          className
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-1 flex items-center justify-between bg-[var(--primary-blue)] px-6 py-4 rounded-t-2xl text-[var(--white)]">
          <h2 id="modal-title" className="text-base font-bold text-[var(--white)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-white/80 hover:bg-white/25 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
