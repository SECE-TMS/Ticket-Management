import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (open) {
      setRemarks('')
      setFile(null)
    }
  }, [open])

  return (
    <Modal open={open} onClose={onClose} title="Resolve ticket">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void onSubmit({ remarks, file })
        }}
      >
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Resolution remarks</span>
          <textarea
            required
            minLength={3}
            rows={4}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-accent"
            placeholder="Describe the work completed…"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Proof attachment (optional)</span>
          <input
            type="file"
            accept="image/*,audio/*"
            capture="environment"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent"
          />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Mark resolved
          </Button>
        </div>
      </form>
    </Modal>
  )
}
