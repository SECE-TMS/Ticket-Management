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
        <div className="form-field">
          <label htmlFor="resolve-remarks" className="form-label">
            Resolution remarks
            <span className="ml-1 text-xs font-normal" style={{ color: 'var(--ink-muted)' }}>
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
            className="input-field"
            placeholder="Describe the work completed and any notes for the requester…"
          />
          <p className="mt-1 text-right text-xs" style={{ color: 'var(--ink-muted)' }}>
            {remarks.length} chars
          </p>
        </div>

        {/* File upload zone */}
        <div className="form-field">
          <p className="form-label mb-1">
            Proof attachment{' '}
            <span className="text-xs font-normal" style={{ color: 'var(--ink-muted)' }}>
              (optional)
            </span>
          </p>
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          >
            <Upload size={24} style={{ color: 'var(--primary-blue)', margin: '0 auto 0.5rem' }} />
            {file ? (
              <p className="text-sm font-medium" style={{ color: 'var(--primary-blue)' }}>
                {file.name}
              </p>
            ) : (
              <>
                <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                  Drop a photo or audio file here
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>
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
              className="mt-1 text-xs hover:underline"
              style={{ color: 'var(--danger)' }}
              onClick={() => setFile(null)}
            >
              Remove file
            </button>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
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
