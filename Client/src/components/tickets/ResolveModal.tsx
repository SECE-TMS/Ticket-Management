import { useEffect, useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'

interface ResolveModalProps {
  open: boolean
  onClose: () => void
  loading?: boolean
  onSubmit: (payload: { remarks: string; file?: File | null }) => Promise<void>
}

export function ResolveModal({ open, onClose, loading, onSubmit }: ResolveModalProps) {
  const [remarks, setRemarks] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setRemarks('')
      setFile(null)
      setDragOver(false)
    }
  }, [open])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && (dropped.type.startsWith('image/') || dropped.type.startsWith('audio/'))) {
      setFile(dropped)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Resolve Ticket" size="sm">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void onSubmit({ remarks, file })
        }}
      >
        {/* Remarks */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="resolve-remarks" className="text-sm font-semibold text-[var(--ink)]">
            Resolution remarks
            <span className="ml-1 text-xs font-normal text-[var(--ink-muted)]">
              (required)
            </span>
          </label>
          <textarea
            id="resolve-remarks"
            required
            minLength={3}
            rows={4}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--white)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
            placeholder="Describe the work completed and any notes for the requester…"
          />
          <p className="text-right text-xs text-[var(--ink-muted)]">
            {remarks.length} chars
          </p>
        </div>

        {/* File upload zone */}
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold text-[var(--ink)]">
            Proof attachment{' '}
            <span className="text-xs font-normal text-[var(--ink-muted)]">
              (optional)
            </span>
          </p>
          <div
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
              dragOver
                ? 'border-[var(--primary-blue)] bg-[var(--primary-blue-light)]'
                : 'border-[var(--primary-blue-muted)] bg-[var(--white)] hover:border-[var(--primary-blue)] hover:bg-[var(--primary-blue-light)]/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          >
            <Upload size={24} className="mb-2 text-[var(--primary-blue)]" />
            {file ? (
              <p className="text-sm font-semibold text-[var(--primary-blue)]">
                {file.name}
              </p>
            ) : (
              <>
                <p className="text-sm font-semibold text-[var(--ink)]">
                  Drop a photo or audio file here
                </p>
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  or click to browse
                </p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*,audio/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          {file && (
            <button
              type="button"
              className="self-start text-xs font-semibold text-[var(--danger)] hover:underline cursor-pointer"
              onClick={() => setFile(null)}
            >
              Remove file
            </button>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!remarks.trim()}>
            Mark Resolved
          </Button>
        </div>
      </form>
    </Modal>
  )
}
