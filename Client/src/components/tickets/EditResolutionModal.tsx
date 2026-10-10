import { useEffect, useState } from 'react'
import { Info, RefreshCw } from 'lucide-react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { MediaAttachmentInput } from '../common/MediaAttachmentInput'
import { getAttachmentUrl } from '../../lib/utils'
import type { Attachment } from '../../types'

interface EditResolutionModalProps {
  open: boolean
  onClose: () => void
  loading?: boolean
  initialRemarks?: string
  currentAttachment?: Attachment | null
  onSubmit: (payload: { remarks: string; file?: File | null }) => Promise<void>
}

export function EditResolutionModal({
  open,
  onClose,
  loading,
  initialRemarks = '',
  currentAttachment,
  onSubmit,
}: EditResolutionModalProps) {
  const [remarks, setRemarks] = useState('')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (open) {
      setRemarks(initialRemarks || '')
      setFile(null)
    }
  }, [open, initialRemarks])

  return (
    <Modal open={open} onClose={onClose} title="Update Work Completion Proof" size="md">
      <form
        className="space-y-4 pt-1"
        onSubmit={(e) => {
          e.preventDefault()
          void onSubmit({ remarks, file })
        }}
      >
        {/* Info notice about history preservation */}
        <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-900">
          <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Uploading a new image or updating remarks will save the new proof as the active resolution.
            <strong> Your previous uploaded image will remain safely archived in the history log and will not be lost.</strong>
          </p>
        </div>

        {/* Current Proof Snapshot if available */}
        {currentAttachment?.url && !file && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--ink)]">Current Active Proof:</span>
              <span className="text-[10px] font-semibold text-[var(--ink-muted)] uppercase">
                {currentAttachment.type}
              </span>
            </div>
            {currentAttachment.type === 'image' ? (
              <div className="relative h-32 w-full overflow-hidden rounded-lg border border-[var(--border)] bg-black/5">
                <img
                  src={getAttachmentUrl(currentAttachment.url)}
                  alt="Current Proof"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <audio controls src={getAttachmentUrl(currentAttachment.url)} className="w-full h-10" />
            )}
            <p className="text-[11px] text-[var(--ink-muted)] mt-1.5 flex items-center gap-1">
              <RefreshCw size={11} /> Select a new file or take a new photo below to replace this image.
            </p>
          </div>
        )}

        {/* Resolution Remarks */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="edit-resolve-remarks" className="text-sm font-semibold text-[var(--ink)]">
            Resolution remarks{' '}
            <span className="text-xs font-normal text-[var(--ink-muted)]">
              (required)
            </span>
          </label>
          <textarea
            id="edit-resolve-remarks"
            required
            minLength={3}
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--white)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
            placeholder="Describe the work completed or reason for updating proof…"
          />
        </div>

        {/* Media Attachment with Live Camera, Mic & Preview */}
        <MediaAttachmentInput
          file={file}
          onSingleChange={setFile}
          label="New / Replacement Proof Attachment"
          hint="Capture new photo or upload replacement file (leave empty to keep current photo)"
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!remarks.trim()}>
            Update &amp; Save Proof
          </Button>
        </div>
      </form>
    </Modal>
  )
}
