import { useState } from 'react'
import { Camera, CheckCircle2, PlayCircle, XCircle } from 'lucide-react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { taskService } from '../../services/taskService'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type { Task, TaskStatus } from '../../types'

interface TaskStatusModalProps {
  open: boolean
  onClose: () => void
  task: Task | null
  targetStatus: TaskStatus | null
  onSuccess: () => void
}

export function TaskStatusModal({
  open,
  onClose,
  task,
  targetStatus,
  onSuccess,
}: TaskStatusModalProps) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [completionRemarks, setCompletionRemarks] = useState('')
  const [cancelledReason, setCancelledReason] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)

  if (!task || !targetStatus) return null

  const isComplete = targetStatus === 'completed'
  const isStart = targetStatus === 'in_progress'
  const isCancel = targetStatus === 'cancelled'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setProofFile(file)
    if (file && file.type.startsWith('image/')) {
      setProofPreview(URL.createObjectURL(file))
    } else {
      setProofPreview(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await taskService.updateStatus(
        task._id,
        {
          status: targetStatus,
          completionRemarks: completionRemarks.trim() || undefined,
          cancelledReason: cancelledReason.trim() || undefined,
        },
        proofFile
      )
      toast.success(
        isComplete
          ? 'Task marked as completed successfully!'
          : isStart
            ? 'Task started — marked in progress.'
            : 'Task cancelled.'
      )
      onSuccess()
      onClose()

      // Reset
      setCompletionRemarks('')
      setCancelledReason('')
      setProofFile(null)
      setProofPreview(null)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update task status'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isComplete
          ? 'Complete Task'
          : isStart
            ? 'Start Task'
            : 'Cancel Task'
      }
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {isStart && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-sm text-[var(--ink)] flex items-start gap-3">
            <PlayCircle size={24} className="text-[var(--primary-blue)] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[var(--primary-blue)]">Begin Working on Task</p>
              <p className="text-xs text-[var(--ink-muted)] mt-1 leading-relaxed">
                This will transition the task to <strong>In Progress</strong> and notify the assigner that work is underway.
              </p>
            </div>
          </div>
        )}

        {isComplete && (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-[var(--ink)] flex items-start gap-3">
              <CheckCircle2 size={24} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900">Task Completion Proof &amp; Remarks</p>
                <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                  Record resolution notes and optionally upload a completion photo proof.
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="completion-remarks" className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                Completion Notes / Summary (Optional)
              </label>
              <textarea
                id="completion-remarks"
                rows={3}
                value={completionRemarks}
                onChange={(e) => setCompletionRemarks(e.target.value)}
                placeholder="Describe how the task was carried out or key results..."
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--white)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                Upload Proof Attachment (Photo/Document)
              </label>
              <div className="flex flex-col gap-2">
                <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4 text-center cursor-pointer hover:bg-[var(--surface-2)] transition-colors">
                  <Camera size={20} className="text-[var(--primary-blue)] mb-1" />
                  <span className="text-xs font-bold text-[var(--ink)]">
                    {proofFile ? proofFile.name : 'Click to capture or attach proof photo'}
                  </span>
                  <span className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                    JPG, PNG, PDF up to 15MB
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {proofPreview && (
                  <div className="relative overflow-hidden rounded-lg border border-[var(--border)] max-h-40">
                    <img
                      src={proofPreview}
                      alt="Proof preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {isCancel && (
          <div className="space-y-4">
            <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 text-sm text-[var(--ink)] flex items-start gap-3">
              <XCircle size={24} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-900">Cancel Task</p>
                <p className="text-xs text-red-800 mt-0.5 leading-relaxed">
                  Provide a reason why this task is being cancelled.
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="cancel-reason" className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                Cancellation Reason *
              </label>
              <textarea
                id="cancel-reason"
                required
                rows={3}
                value={cancelledReason}
                onChange={(e) => setCancelledReason(e.target.value)}
                placeholder="Reason for cancellation..."
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--white)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Back
          </Button>
          <Button
            type="submit"
            loading={loading}
            className={
              isComplete
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : isCancel
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : ''
            }
          >
            {isComplete ? 'Confirm Completion' : isStart ? 'Start Task' : 'Confirm Cancel'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
