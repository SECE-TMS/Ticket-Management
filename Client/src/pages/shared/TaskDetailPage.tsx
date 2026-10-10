import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import {
  ArrowLeft,
  CheckCircle2,
  CheckSquare,
  Clock,
  ExternalLink,
  History,
  MessageCircle,
  PlayCircle,
  Square,
  XCircle,
} from 'lucide-react'
import { taskService } from '../../services/taskService'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/common/Modal'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { PriorityBadge, StatusBadge } from '../../components/common/Badge'
import { TaskStatusModal } from '../../components/tasks/TaskStatusModal'
import { useToast } from '../../context/ToastContext'
import { useAppSelector } from '../../store/hooks'
import { getErrorMessage, getAttachmentUrl } from '../../lib/utils'
import type { Task, TaskStatus } from '../../types'
import { getId, getName } from '../../types'

interface TaskDetailPageProps {
  backTo: string
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-sm text-[var(--ink)]">
        {value}
      </dd>
    </div>
  )
}

export function TaskDetailPage({ backTo }: TaskDetailPageProps) {
  const { id } = useParams<{ id: string }>()
  const toast = useToast()
  const user = useAppSelector((s) => s.auth.user)
  const role = user?.role

  const [loading, setLoading] = useState(true)
  const [task, setTask] = useState<Task | null>(null)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [targetStatus, setTargetStatus] = useState<TaskStatus | null>(null)
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await taskService.getById(id)
      setTask(data)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load task details'))
    } finally {
      setLoading(false)
    }
  }, [id, toast])

  useEffect(() => {
    void load()
  }, [load])

  const handleToggleChecklist = async (itemId: string, currentStatus: boolean) => {
    if (!task) return
    try {
      const updated = await taskService.toggleChecklist(task._id, itemId, !currentStatus)
      setTask(updated)
      toast.success(!currentStatus ? 'Subtask completed!' : 'Subtask marked incomplete.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update subtask'))
    }
  }

  const handleOpenStatusModal = (status: TaskStatus) => {
    setTargetStatus(status)
    setStatusModalOpen(true)
  }

  const handleOpenWhatsApp = () => {
    if (!task) return
    const employeePhone = (task.assignedTo as any)?.phone || ''
    if (!employeePhone) {
      toast.error('No phone number registered for this employee.')
      return
    }

    const cleanPhone = employeePhone.replace(/\D/g, '').slice(-10)
    const clientOrigin = window.location.origin
    const taskUrl = `${clientOrigin}/employee/tasks/${task._id}`
    const msg = `*TMS Task Assignment Notice*\n\nHello *${getName(task.assignedTo)}*,\nRegarding task *${task.taskCode}*: ${task.title}\nPriority: ${task.priority.toUpperCase()}\nStatus: ${task.status.toUpperCase()}\n\n👉 *View & Work on Task:* ${taskUrl}`

    const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`
    window.open(waUrl, '_blank')
  }

  if (loading) return <PageLoader />
  if (!task) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-10 text-center shadow-xs">
        <p className="font-semibold text-[var(--ink)]">Task not found.</p>
        <Link
          to={backTo}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary-blue)] hover:underline"
        >
          <ArrowLeft size={14} /> Back to tasks
        </Link>
      </div>
    )
  }

  const currentUserId = getId(user)
  const assignedEmployeeId = getId(task.assignedTo)
  const isAssignedEmployee = Boolean(currentUserId && assignedEmployeeId && currentUserId === assignedEmployeeId)
  const isManagerOrAdmin = role === 'admin' || role === 'superadmin' || role === 'manager'
  const canStart = (isAssignedEmployee || isManagerOrAdmin) && task.status === 'pending'
  const canComplete = (isAssignedEmployee || isManagerOrAdmin) && (task.status === 'pending' || task.status === 'in_progress')
  const canCancel = isManagerOrAdmin && task.status !== 'completed' && task.status !== 'cancelled'

  const completedChecklistCount = task.checklist?.filter((c) => c.completed).length || 0
  const totalChecklistCount = task.checklist?.length || 0
  const checklistPercentage = totalChecklistCount > 0 ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0

  return (
    <div className="space-y-5">
      {/* Back link */}
      <Link
        to={backTo}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary-blue)] hover:underline"
      >
        <ArrowLeft size={15} />
        Back to tasks
      </Link>

      {/* Task Header Banner */}
      <div className="rounded-xl bg-[var(--primary-blue)] p-5 text-[var(--white)] shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/65">
              Assigned Work Task
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">
              {task.taskCode}: {task.title}
            </h1>
            <p className="mt-1 text-sm text-white/75">
              Department: {getName(task.department)} • Assigned To: {getName(task.assignedTo)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status as any} />
            <PriorityBadge priority={task.priority} />
            {isManagerOrAdmin && (task.assignedTo as any)?.phone && (
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <MessageCircle size={14} /> WhatsApp Assignee
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons Bar */}
      {(canStart || canComplete || canCancel) && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <p className="w-full text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] mb-1">
            Task Actions
          </p>

          {canStart && (
            <Button
              type="button"
              onClick={() => handleOpenStatusModal('in_progress')}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              <PlayCircle size={15} /> Start Working on Task
            </Button>
          )}

          {canComplete && (
            <Button
              type="button"
              onClick={() => handleOpenStatusModal('completed')}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
            >
              <CheckCircle2 size={15} /> Mark Task as Completed
            </Button>
          )}

          {canCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenStatusModal('cancelled')}
              className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50 font-bold"
            >
              <XCircle size={15} /> Cancel Task
            </Button>
          )}
        </div>
      )}

      {/* Main Grid: Details + Timeline */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Left Column (3 cols) */}
        <div className="space-y-5 lg:col-span-3">
          {/* Details Card */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs">
            <h2 className="text-base font-bold text-[var(--ink)] mb-4">Task Information</h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <Info label="Task Code" value={task.taskCode} />
              <Info label="Priority" value={task.priority.toUpperCase()} />
              <Info label="Assigned To" value={getName(task.assignedTo)} />
              <Info label="Assigned By" value={getName(task.assignedBy)} />
              <Info label="Department" value={getName(task.department)} />
              <Info
                label="Target Deadline"
                value={task.dueDate ? format(new Date(task.dueDate), 'dd MMM yyyy, HH:mm') : 'Standard SLA'}
              />
              <Info
                label="Assigned On"
                value={format(new Date(task.createdAt), 'dd MMM yyyy, HH:mm')}
              />
              {task.completedAt && (
                <Info
                  label="Completed On"
                  value={format(new Date(task.completedAt), 'dd MMM yyyy, HH:mm')}
                />
              )}
            </dl>

            {/* Detailed Instructions Callout */}
            <div className="mt-5 rounded-xl border border-blue-200/70 bg-blue-50/40 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary-blue)] mb-1.5">
                📋 Detailed Task Instructions
              </h3>
              <p className="text-sm leading-relaxed text-[var(--ink)] whitespace-pre-line">
                {task.description}
              </p>
            </div>
          </div>

          {/* Interactive Checklist Section */}
          {task.checklist && task.checklist.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
                  <CheckSquare size={17} className="text-[var(--primary-blue)]" />
                  Actionable Subtasks Checklist ({completedChecklistCount}/{totalChecklistCount})
                </h2>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-[var(--primary-blue)]">
                  {checklistPercentage}% Completed
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 mb-4">
                <div
                  className={`h-full transition-all duration-300 ${
                    checklistPercentage === 100 ? 'bg-emerald-500' : 'bg-[var(--primary-blue)]'
                  }`}
                  style={{ width: `${checklistPercentage}%` }}
                />
              </div>

              <ul className="space-y-2">
                {task.checklist.map((item, idx) => (
                  <li
                    key={item._id || idx}
                    onClick={() => item._id && handleToggleChecklist(item._id, item.completed)}
                    className={`flex items-start gap-3 rounded-xl border p-3.5 transition-all cursor-pointer select-none ${
                      item.completed
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    <button
                      type="button"
                      className="mt-0.5 shrink-0 text-[var(--primary-blue)] focus:outline-none"
                    >
                      {item.completed ? (
                        <CheckCircle2 size={20} className="text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Square size={20} className="text-slate-400 hover:text-[var(--primary-blue)]" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          item.completed
                            ? 'line-through text-emerald-950/70 font-semibold'
                            : 'text-[var(--ink)] font-semibold'
                        }`}
                      >
                        {item.title}
                      </p>
                      {item.completedAt && (
                        <p className="text-[11px] text-emerald-800/80 mt-0.5">
                          Completed on {format(new Date(item.completedAt), 'dd MMM, HH:mm')}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Completion Proof & Notes (if completed) */}
          {task.status === 'completed' && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900">
                  Task Completion Resolution &amp; Proof
                </h3>
              </div>

              {task.completionRemarks && (
                <div className="rounded-lg bg-white/90 border border-emerald-200 p-3.5">
                  <p className="text-xs font-bold text-emerald-900 uppercase mb-1">
                    Technician Resolution Remarks
                  </p>
                  <p className="text-sm text-[var(--ink)] leading-relaxed italic">
                    "{task.completionRemarks}"
                  </p>
                </div>
              )}

              {task.completionProof?.url && (
                <div>
                  <p className="text-xs font-bold text-emerald-900 uppercase mb-2">
                    Attached Resolution Proof Photo
                  </p>
                  <div
                    className="group relative cursor-pointer overflow-hidden rounded-xl border border-emerald-300 max-h-64 max-w-md bg-black/5"
                    onClick={() => setActiveImageModal(task.completionProof!.url)}
                  >
                    <img
                      src={getAttachmentUrl(task.completionProof.url)}
                      alt="Task Completion Proof"
                      className="h-full w-full object-cover transition-all duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-all group-hover:opacity-100">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold text-[var(--ink)] shadow-md">
                        <ExternalLink size={13} /> View Full Photo
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Past Task Completion History */}
          {task.completionHistory && task.completionHistory.length > 0 && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs">
              <h3 className="text-sm font-bold text-[var(--ink)] mb-3 flex items-center gap-2">
                <History size={16} className="text-indigo-600" />
                Past Completion Proofs History ({task.completionHistory.length})
              </h3>
              <div className="space-y-3 divide-y divide-[var(--border)]">
                {task.completionHistory.map((h, idx) => (
                  <div key={idx} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">
                        Revision #{task.completionHistory!.length - idx}
                      </span>
                      <span className="text-[var(--ink-muted)]">
                        {h.completedAt ? format(new Date(h.completedAt), 'dd MMM yyyy, HH:mm') : '—'}
                      </span>
                    </div>
                    {h.completionRemarks && (
                      <p className="text-xs text-[var(--ink)] italic bg-slate-50 p-2 rounded-lg border border-slate-200">
                        "{h.completionRemarks}"
                      </p>
                    )}
                    {h.completionProof?.url && (
                      <div
                        className="group relative cursor-pointer overflow-hidden rounded-lg border border-slate-200 max-h-36 max-w-xs bg-black/5"
                        onClick={() => setActiveImageModal(h.completionProof!.url)}
                      >
                        <img
                          src={getAttachmentUrl(h.completionProof.url)}
                          alt="Archived Task Proof"
                          className="h-full w-full object-cover transition-all group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-all group-hover:opacity-100">
                          <span className="inline-flex items-center gap-1 rounded bg-white/90 px-2 py-1 text-[11px] font-bold text-[var(--ink)]">
                            <ExternalLink size={11} /> View Photo
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cancelled Reason */}
          {task.status === 'cancelled' && task.cancelledReason && (
            <div className="rounded-xl border border-red-300 bg-red-50/80 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-red-900 font-bold text-xs uppercase mb-1">
                <XCircle size={16} className="text-red-600" /> Cancellation Reason
              </div>
              <p className="text-sm text-red-950 leading-relaxed">
                {task.cancelledReason}
              </p>
            </div>
          )}
        </div>

        {/* Right Column — Activity Timeline (2 cols) */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-xs lg:col-span-2">
          <h2 className="text-base font-bold text-[var(--ink)] mb-4 flex items-center gap-2">
            <Clock size={16} className="text-[var(--primary-blue)]" />
            Task Activity Log
          </h2>

          <ul className="relative space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border)]">
            {(task.activities || []).map((act, idx) => (
              <li key={act._id || idx} className="relative flex items-start gap-3 pl-7">
                <div className="absolute left-1.5 top-1 h-3.5 w-3.5 rounded-full border-2 border-[var(--white)] bg-[var(--primary-blue)] shadow-xs" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-[var(--ink)]">
                    {act.message || act.action}
                  </p>
                  <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">
                    {format(new Date(act.createdAt), 'dd MMM yyyy, HH:mm')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Task Status Transition Modal */}
      <TaskStatusModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        task={task}
        targetStatus={targetStatus}
        onSuccess={() => void load()}
      />

      {/* Image Zoom Modal */}
      {activeImageModal && (
        <Modal
          open={Boolean(activeImageModal)}
          onClose={() => setActiveImageModal(null)}
          title="Task Completion Proof"
          size="lg"
        >
          <div className="p-2">
            <img
              src={getAttachmentUrl(activeImageModal)}
              alt="Full Resolution Proof"
              className="max-h-[75vh] w-full rounded-lg object-contain"
            />
          </div>
        </Modal>
      )}
    </div>
  )
}
