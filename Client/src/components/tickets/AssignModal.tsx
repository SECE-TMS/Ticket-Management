import { useEffect, useState } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { PRIORITIES, formatLabel } from '../../lib/utils'
import type { TicketPriority, User } from '../../types'
import { getId } from '../../types'
import { UserCheck, UserPlus } from 'lucide-react'

interface AssignModalProps {
  open: boolean
  onClose: () => void
  employees: User[]
  expectedResolutionAt?: string | null
  loading?: boolean
  isReassign?: boolean
  currentAssigneeName?: string
  onSubmit: (payload: { assignedTo: string; priority?: TicketPriority; message?: string }) => Promise<void>
  initialPriority?: TicketPriority
}

export function AssignModal({
  open,
  onClose,
  employees,
  expectedResolutionAt,
  loading,
  isReassign = false,
  currentAssigneeName,
  onSubmit,
  initialPriority = 'medium',
}: AssignModalProps) {
  const [assignedTo, setAssignedTo] = useState('')
  const [priority, setPriority] = useState<TicketPriority>(initialPriority)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (open) {
      setAssignedTo('')
      setPriority(initialPriority)
      setMessage('')
    }
  }, [open, initialPriority])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isReassign ? 'Reassign Ticket' : 'Assign Ticket'}
      size="sm"
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!assignedTo) return
          void onSubmit({ assignedTo, priority, message: message.trim() || undefined })
        }}
      >
        {/* Current Assignee Banner (if Reassigning) */}
        {isReassign && currentAssigneeName && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-xs text-indigo-950">
            <p className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">
              Current Assignee
            </p>
            <p className="font-bold text-sm text-indigo-900 mt-0.5">
              👤 {currentAssigneeName}
            </p>
          </div>
        )}

        {/* Employee select */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="assign-employee" className="text-sm font-semibold text-[var(--ink)]">
            {isReassign ? 'Select New Assignee' : 'Employee'}
          </label>
          <select
            id="assign-employee"
            required
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none cursor-pointer focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
          >
            <option value="">{isReassign ? 'Choose new technician…' : 'Select employee…'}</option>
            {employees.map((emp) => (
              <option key={getId(emp)} value={getId(emp)}>
                {emp.name} · {emp.email}
              </option>
            ))}
          </select>
          {!employees.length && (
            <p className="text-xs text-[var(--danger)] mt-1">
              No active employees in this department.
            </p>
          )}
        </div>

        {/* Priority (only on initial assign or when desired) */}
        {!isReassign && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="assign-priority" className="text-sm font-semibold text-[var(--ink)]">
              Priority
            </label>
            <select
              id="assign-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none cursor-pointer focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {formatLabel(p)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reassign Reason / Message */}
        {isReassign && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reassign-reason" className="text-sm font-semibold text-[var(--ink)]">
              Reassignment Note / Reason (Optional)
            </label>
            <input
              id="reassign-reason"
              type="text"
              placeholder="e.g. Workload distribution, shift handover..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
            />
          </div>
        )}

        {/* SLA info card */}
        {!isReassign && (
          <div className="rounded-xl border border-[var(--primary-blue-muted)] bg-[var(--primary-blue-light)] p-3.5 text-sm">
            <p className="font-bold text-[var(--primary-blue)]">
              Expected resolution
            </p>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
              {expectedResolutionAt
                ? new Date(expectedResolutionAt).toLocaleString()
                : 'Based on department SLA after creation'}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!assignedTo}
            className={isReassign ? 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold' : ''}
          >
            {isReassign ? (
              <span className="inline-flex items-center gap-1.5">
                <UserCheck size={14} />
                Confirm Reassign
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <UserPlus size={14} />
                Assign Ticket
              </span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
