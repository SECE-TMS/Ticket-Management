import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bell,
  Building2,
  Calendar,
  Check,
  CheckSquare,
  ChevronDown,
  Mail,
  MessageSquare,
  Plus,
  Search,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { userService } from '../../services/userService'
import { taskService, type CreateTaskPayload } from '../../services/taskService'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type { TaskPriority, User as UserType } from '../../types'
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
}: CreateTaskModalProps) {
  const toast = useToast()

  const [loading, setLoading] = useState(false)
  const [loadingAssignees, setLoadingAssignees] = useState(false)
  const [assignees, setAssignees] = useState<UserType[]>([])
  const [selectedAssignee, setSelectedAssignee] = useState<UserType | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')

  // Checklist
  const [checklistItems, setChecklistItems] = useState<string[]>([])
  const [newChecklistInput, setNewChecklistInput] = useState('')

  // Notification toggles
  const [notifyInApp, setNotifyInApp] = useState(true)
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [notifySms, setNotifySms] = useState(true)

  // Load assignees (Managers & Employees, excluding Admins)
  useEffect(() => {
    if (!open) return

    setLoadingAssignees(true)
    void userService
      .listAssignees()
      .then((users) => {
        setAssignees(users)
      })
      .catch((err) => {
        toast.error(getErrorMessage(err, 'Failed to load assignees'))
      })
      .finally(() => {
        setLoadingAssignees(false)
      })
  }, [open, toast])

  // Click outside listener for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  // Filtered assignees based on search
  const filteredAssignees = useMemo(() => {
    if (!searchQuery.trim()) return assignees
    const q = searchQuery.toLowerCase().trim()
    return assignees.filter((u) => {
      const name = (u.name || '').toLowerCase()
      const email = (u.email || '').toLowerCase()
      const phone = (u.phone || '').toLowerCase()
      const rollNumber = (u.rollNumber || '').toLowerCase()
      const deptName = typeof u.department === 'object' && u.department ? (u.department.name || '').toLowerCase() : ''
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        rollNumber.includes(q) ||
        deptName.includes(q)
      )
    })
  }, [assignees, searchQuery])

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
    if (!selectedAssignee) {
      toast.error('Please select an assignee (Manager or Employee) for this task.')
      return
    }
    if (!description.trim()) {
      toast.error('Please provide task instructions or description.')
      return
    }

    const assigneeId = selectedAssignee._id || selectedAssignee.id
    const deptId = getId(selectedAssignee.department)

    setLoading(true)
    try {
      const payload: CreateTaskPayload = {
        title: title.trim(),
        description: description.trim(),
        department: deptId || undefined,
        assignedTo: assigneeId,
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
      toast.success(`Task created and assigned to ${selectedAssignee.name}!`)
      onSuccess()
      onClose()

      // Reset form
      setTitle('')
      setDescription('')
      setSelectedAssignee(null)
      setSearchQuery('')
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
      title="Create & Assign Specific Task"
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

        {/* Assignee Selection (Searchable User Picker without mandatory department filter) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <UserCheck size={14} className="text-[var(--primary-blue)]" />
              Assign To (Manager / Employee) *
            </span>
            {loadingAssignees && <span className="text-[10px] text-[var(--primary-blue)] font-semibold">Loading users...</span>}
          </label>

          {selectedAssignee ? (
            /* Selected Assignee Card */
            <div className="flex items-center justify-between rounded-xl border border-[var(--primary-blue)]/30 bg-[var(--primary-blue)]/5 p-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary-blue)] text-sm font-bold text-white shadow-xs">
                  {selectedAssignee.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[var(--ink)]">{selectedAssignee.name}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        selectedAssignee.role === 'manager'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {selectedAssignee.role}
                    </span>
                    {selectedAssignee.department && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200">
                        <Building2 size={10} />
                        {typeof selectedAssignee.department === 'object'
                          ? selectedAssignee.department.name
                          : 'Assigned Dept'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                    {selectedAssignee.email}
                    {selectedAssignee.phone ? ` • ${selectedAssignee.phone}` : ''}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedAssignee(null)
                  setSearchQuery('')
                  setDropdownOpen(true)
                }}
                className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1 text-xs font-semibold text-[var(--ink)] hover:bg-slate-50 hover:text-red-600 transition-colors flex items-center gap-1 cursor-pointer"
                title="Change Assignee"
              >
                <X size={13} /> Change
              </button>
            </div>
          ) : (
            /* Assignee Search Input & Dropdown */
            <div className="relative" ref={dropdownRef}>
              <div
                className="flex h-10 w-full items-center rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm focus-within:border-[var(--primary-blue)] focus-within:ring-2 focus-within:ring-[var(--primary-blue)]/20 cursor-text"
                onClick={() => setDropdownOpen(true)}
              >
                <Search size={15} className="mr-2 text-[var(--ink-muted)] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setDropdownOpen(true)
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="Search user by name, email, roll number, or department..."
                  className="w-full bg-transparent text-sm text-[var(--ink)] outline-none"
                />
                <ChevronDown size={15} className="ml-2 text-[var(--ink-muted)] shrink-0" />
              </div>

              {dropdownOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--white)] p-1.5 shadow-xl">
                  {filteredAssignees.length === 0 ? (
                    <div className="p-3 text-center text-xs text-[var(--ink-muted)]">
                      {loadingAssignees ? 'Loading users...' : 'No matching active managers or employees found.'}
                    </div>
                  ) : (
                    filteredAssignees.map((user) => {
                      const deptName =
                        typeof user.department === 'object' && user.department
                          ? user.department.name
                          : ''
                      return (
                        <div
                          key={user._id || user.id}
                          onClick={() => {
                            setSelectedAssignee(user)
                            setDropdownOpen(false)
                            setSearchQuery('')
                          }}
                          className="flex items-center justify-between rounded-lg p-2.5 hover:bg-[var(--surface-2)] cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-xs font-bold text-[var(--ink)]">
                              {user.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-[var(--ink)]">{user.name}</span>
                                <span
                                  className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                                    user.role === 'manager'
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {user.role}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-[var(--ink-muted)]">
                                <span>{user.email}</span>
                                {deptName && <span>• {deptName}</span>}
                              </div>
                            </div>
                          </div>
                          <Check size={14} className="text-transparent" />
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          )}
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
