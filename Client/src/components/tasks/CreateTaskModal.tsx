import { useEffect, useState } from 'react'
import { Bell, Calendar, CheckSquare, Mail, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { departmentService } from '../../services/departmentService'
import { userService } from '../../services/userService'
import { taskService, type CreateTaskPayload } from '../../services/taskService'
import { useToast } from '../../context/ToastContext'
import { useAppSelector } from '../../store/hooks'
import { getErrorMessage } from '../../lib/utils'
import type { Department, TaskPriority, User as UserType } from '../../types'
import { getId } from '../../types'

interface CreateTaskModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  defaultDepartmentId?: string
}

export function CreateTaskModal({
  open,
  onClose,
  onSuccess,
  defaultDepartmentId,
}: CreateTaskModalProps) {
  const toast = useToast()
  const currentUser = useAppSelector((s) => s.auth.user)
  const isManager = currentUser?.role === 'manager'

  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<UserType[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [assignedToId, setAssignedToId] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')

  // Checklist
  const [checklistItems, setChecklistItems] = useState<string[]>([])
  const [newChecklistInput, setNewChecklistInput] = useState('')

  // Notification toggles
  const [notifyInApp, setNotifyInApp] = useState(true)
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifySms, setNotifySms] = useState(true)

  // Load departments
  useEffect(() => {
    if (!open) return

    if (isManager) {
      const mgrDeptId = getId(currentUser?.department)
      if (mgrDeptId) {
        setDepartmentId(mgrDeptId)
      }
    } else {
      void departmentService.listAll().then((depts) => {
        setDepartments(depts)
        if (defaultDepartmentId) {
          setDepartmentId(defaultDepartmentId)
        } else if (depts.length > 0 && !departmentId) {
          setDepartmentId(depts[0]._id)
        }
      })
    }
  }, [open, isManager, currentUser, defaultDepartmentId])

  // Load employees when department changes
  useEffect(() => {
    if (!departmentId) {
      setEmployees([])
      setAssignedToId('')
      return
    }

    setLoadingEmployees(true)
    void userService
      .listByDepartment(departmentId)
      .then((emps) => {
        const activeEmps = emps.filter((e) => e.role === 'employee' && e.isActive)
        setEmployees(activeEmps)
        if (activeEmps.length > 0) {
          setAssignedToId(activeEmps[0]._id || activeEmps[0].id)
        } else {
          setAssignedToId('')
        }
      })
      .catch(() => {
        setEmployees([])
      })
      .finally(() => {
        setLoadingEmployees(false)
      })
  }, [departmentId])

  const handleAddChecklistItem = () => {
    const val = newChecklistInput.trim()
    if (!val) return
    setChecklistItems([...checklistItems, val])
    setNewChecklistInput('')
  }

  const handleRemoveChecklistItem = (idx: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Please enter a task title.')
      return
    }
    if (!description.trim()) {
      toast.error('Please provide task instructions or description.')
      return
    }
    if (!departmentId) {
      toast.error('Please select a department.')
      return
    }
    if (!assignedToId) {
      toast.error('Please select an employee to assign this task to.')
      return
    }

    setLoading(true)
    try {
      const payload: CreateTaskPayload = {
        title: title.trim(),
        description: description.trim(),
        department: departmentId,
        assignedTo: assignedToId,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        checklist: checklistItems.map((item) => ({ title: item, completed: false })),
        notificationPreferences: {
          inApp: notifyInApp,
          email: notifyEmail,
          sms: notifySms,
        },
      }

      await taskService.create(payload)
      toast.success('Task created, assigned and notifications dispatched!')
      onSuccess()
      onClose()

      // Reset form
      setTitle('')
      setDescription('')
      setPriority('medium')
      setDueDate('')
      setChecklistItems([])
      setNewChecklistInput('')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to assign task'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Specific Task"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Task Title */}
        <div>
          <label htmlFor="task-title" className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
            Task Title *
          </label>
          <input
            id="task-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Inspect and repair HVAC unit on 3rd floor Lab B"
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
          />
        </div>

        {/* Department & Employee Grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="task-dept" className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
              Department *
            </label>
            {isManager ? (
              <div className="flex h-10 items-center rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm font-semibold text-[var(--ink)]">
                {departments.find((d) => d._id === departmentId)?.name || 'Your Department'}
              </div>
            ) : (
              <select
                id="task-dept"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 cursor-pointer"
              >
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="task-employee" className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1 flex items-center justify-between">
              <span>Assign To Employee *</span>
              {loadingEmployees && <span className="text-[10px] text-[var(--primary-blue)]">Loading...</span>}
            </label>
            <select
              id="task-employee"
              required
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              disabled={loadingEmployees || employees.length === 0}
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              {employees.length === 0 ? (
                <option value="">No active employees found in department</option>
              ) : (
                employees.map((emp) => (
                  <option key={emp._id || emp.id} value={emp._id || emp.id}>
                    {emp.name} ({emp.email}{emp.phone ? ` • ${emp.phone}` : ''})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Priority & Due Date */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
              Priority Level
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => {
                const isSelected = priority === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`rounded-lg py-2 text-xs font-bold uppercase transition-all cursor-pointer ${
                      isSelected
                        ? p === 'urgent'
                          ? 'bg-red-600 text-white shadow-xs'
                          : p === 'high'
                            ? 'bg-orange-500 text-white shadow-xs'
                            : p === 'medium'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-emerald-600 text-white shadow-xs'
                        : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--ink-muted)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label htmlFor="task-due-date" className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1 flex items-center gap-1">
              <Calendar size={13} className="text-[var(--primary-blue)]" />
              Target Deadline (Optional)
            </label>
            <input
              id="task-due-date"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
            />
          </div>
        </div>

        {/* Detailed Instructions / Description */}
        <div>
          <label htmlFor="task-desc" className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
            Detailed Task Instructions *
          </label>
          <textarea
            id="task-desc"
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Specify step-by-step instructions, location details, safety requirements, or materials needed..."
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--white)] p-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
          />
        </div>

        {/* Checklist Subtasks Builder */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-1.5">
              <CheckSquare size={14} className="text-[var(--primary-blue)]" />
              Checklist / Subtasks (Optional)
            </label>
            <span className="text-[11px] text-[var(--ink-muted)] font-semibold">
              {checklistItems.length} items
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newChecklistInput}
              onChange={(e) => setNewChecklistInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddChecklistItem()
                }
              }}
              placeholder="Add actionable subtask item..."
              className="h-9 flex-1 rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-xs sm:text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddChecklistItem}
              className="gap-1 px-3 text-xs font-bold"
            >
              <Plus size={14} /> Add
            </Button>
          </div>

          {checklistItems.length > 0 && (
            <ul className="space-y-1.5 pt-1">
              {checklistItems.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-[var(--white)] border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--ink)] shadow-2xs"
                >
                  <span className="flex items-center gap-2">
                    <span className="font-bold text-[var(--primary-blue)]">#{idx + 1}</span>
                    <span>{item}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(idx)}
                    className="text-red-500 hover:text-red-700 p-1 cursor-pointer transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Real-time Notification Channels */}
        <div className="rounded-xl border border-blue-200/80 bg-blue-50/50 p-3.5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary-blue)] mb-2 flex items-center gap-1.5">
            <Bell size={14} /> Instant Notification Dispatch
          </p>
          <div className="grid gap-2 sm:grid-cols-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--ink)]">
              <input
                type="checkbox"
                checked={notifyInApp}
                onChange={(e) => setNotifyInApp(e.target.checked)}
                className="h-4 w-4 rounded text-[var(--primary-blue)] focus:ring-[var(--primary-blue)] cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Bell size={13} className="text-[var(--primary-blue)]" /> In-App Notification
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--ink)]">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                className="h-4 w-4 rounded text-[var(--primary-blue)] focus:ring-[var(--primary-blue)] cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <Mail size={13} className="text-[var(--primary-blue)]" /> Email Alert with Link
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--ink)]">
              <input
                type="checkbox"
                checked={notifySms}
                onChange={(e) => setNotifySms(e.target.checked)}
                className="h-4 w-4 rounded text-[var(--primary-blue)] focus:ring-[var(--primary-blue)] cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <MessageSquare size={13} className="text-emerald-600" /> SMS / WhatsApp
              </span>
            </label>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--border)]">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="gap-2">
            Assign Task &amp; Notify
          </Button>
        </div>
      </form>
    </Modal>
  )
}
