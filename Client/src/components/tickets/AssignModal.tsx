import { useEffect, useState } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { PRIORITIES, formatLabel } from '../../lib/utils'
import type { TicketPriority, User } from '../../types'
import { getId } from '../../types'

interface AssignModalProps {
  open: boolean
  onClose: () => void
  employees: User[]
  expectedResolutionAt?: string | null
  loading?: boolean
  onSubmit: (payload: { assignedTo: string; priority: TicketPriority }) => Promise<void>
  initialPriority?: TicketPriority
}

export function AssignModal({
  open,
  onClose,
  employees,
  expectedResolutionAt,
  loading,
  onSubmit,
  initialPriority = 'medium',
}: AssignModalProps) {
  const [assignedTo, setAssignedTo] = useState('')
  const [priority, setPriority] = useState<TicketPriority>(initialPriority)

  useEffect(() => {
    if (open) {
      setAssignedTo('')
      setPriority(initialPriority)
    }
  }, [open, initialPriority])

  return (
    <Modal open={open} onClose={onClose} title="Assign Ticket" size="sm">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!assignedTo) return
          void onSubmit({ assignedTo, priority })
        }}
      >
        {/* Employee select */}
        <div className="form-field">
          <label htmlFor="assign-employee" className="form-label">
            Employee
          </label>
          <select
            id="assign-employee"
            required
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="input-field"
          >
            <option value="">Select employee…</option>
            {employees.map((emp) => (
              <option key={getId(emp)} value={getId(emp)}>
                {emp.name} · {emp.email}
              </option>
            ))}
          </select>
          {!employees.length && (
            <p className="form-error mt-1">
              No active employees in this department.
            </p>
          )}
        </div>

        {/* Priority */}
        <div className="form-field">
          <label htmlFor="assign-priority" className="form-label">
            Priority
          </label>
          <select
            id="assign-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            className="input-field"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {formatLabel(p)}
              </option>
            ))}
          </select>
        </div>

        {/* SLA info */}
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            background: 'var(--primary-blue-light)',
            border: '1px solid var(--primary-blue-muted)',
          }}
        >
          <p className="font-semibold" style={{ color: 'var(--primary-blue)' }}>
            Expected resolution
          </p>
          <p className="mt-0.5" style={{ color: 'var(--ink-muted)' }}>
            {expectedResolutionAt
              ? new Date(expectedResolutionAt).toLocaleString()
              : 'Based on department SLA after creation'}
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={!assignedTo}>
            Assign
          </Button>
        </div>
      </form>
    </Modal>
  )
}
