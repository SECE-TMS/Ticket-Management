import { useEffect, useState } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { MediaAttachmentInput } from '../common/MediaAttachmentInput'

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
    <Modal open={open} onClose={onClose} title="Resolve Ticket" size="md">
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
            Resolution remarks{' '}
            <span className="text-xs font-normal text-[var(--ink-muted)]">
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
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--white)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
            placeholder="Describe the work completed and any notes for the requester…"
          />
          <p className="text-right text-xs text-[var(--ink-muted)]">
            {remarks.length} chars
          </p>
        </div>

        {/* Media Attachment with Live Camera, Mic & Preview */}
        <MediaAttachmentInput
          file={file}
          onChange={setFile}
          label="Proof attachment"
          hint="Photo proof or audio voice note (optional)"
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
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
