import { useEffect, useState } from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { PRIORITIES, formatLabel, getErrorMessage } from '../../lib/utils'
import { departmentService } from '../../services/departmentService'
import { ticketService, type UpdateTicketPayload } from '../../services/ticketService'
import { useToast } from '../../context/ToastContext'
import type { Department, Ticket, TicketPriority } from '../../types'
import { getId } from '../../types'
import { Building2, FileText, User as UserIcon } from 'lucide-react'

interface EditTicketModalProps {
  open: boolean
  onClose: () => void
  ticket: Ticket
  onSuccess: () => Promise<void> | void
}

export function EditTicketModal({
  open,
  onClose,
  ticket,
  onSuccess,
}: EditTicketModalProps) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepts, setLoadingDepts] = useState(false)

  // Form states
  const [departmentId, setDepartmentId] = useState('')
  const [complaintType, setComplaintType] = useState('')
  const [isCustomType, setIsCustomType] = useState(false)
  const [customComplaintType, setCustomComplaintType] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('medium')

  // Requester states
  const [requesterName, setRequesterName] = useState('')
  const [requesterMobile, setRequesterMobile] = useState('')
  const [requesterEmail, setRequesterEmail] = useState('')
  const [requesterUserType, setRequesterUserType] = useState<'student' | 'staff' | 'guest'>('guest')
  const [requesterRollNumber, setRequesterRollNumber] = useState('')

  // Load departments when opening
  useEffect(() => {
    if (!open) return

    setLoadingDepts(true)
    const fetchDepts = async () => {
      try {
        let depts: Department[] = []
        try {
          depts = await departmentService.listAll()
        } catch {
          depts = await departmentService.listActive()
        }
        setDepartments(depts)
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to fetch departments'))
      } finally {
        setLoadingDepts(false)
      }
    }

    void fetchDepts()
  }, [open, toast])

  // Initialize form values from ticket
  useEffect(() => {
    if (open && ticket) {
      const currentDeptId = getId(ticket.department) || ''
      setDepartmentId(currentDeptId)
      setTitle(ticket.title || '')
      setDescription(ticket.description || '')
      setPriority(ticket.priority || 'medium')

      setRequesterName(ticket.requester?.name || '')
      setRequesterMobile(ticket.requester?.mobile || '')
      setRequesterEmail(ticket.requester?.email || '')
      setRequesterUserType(ticket.requester?.userType || 'guest')
      setRequesterRollNumber(ticket.requester?.rollNumber || '')

      setComplaintType(ticket.complaintType || '')
      setIsCustomType(false)
      setCustomComplaintType('')
    }
  }, [open, ticket])

  // Get active selected department object
  const selectedDepartment = departments.find((d) => d._id === departmentId)
  const availableComplaintTypes = selectedDepartment?.complaintTypes || []

  // Check if current complaint type is custom
  useEffect(() => {
    if (departmentId && availableComplaintTypes.length > 0) {
      const exists = availableComplaintTypes.some(
        (t) => t.toLowerCase() === (ticket.complaintType || '').toLowerCase()
      )
      if (!exists && ticket.complaintType && !isCustomType) {
        setIsCustomType(true)
        setCustomComplaintType(ticket.complaintType)
      }
    }
  }, [departmentId, availableComplaintTypes, ticket.complaintType, isCustomType])

  const handleDepartmentChange = (newDeptId: string) => {
    setDepartmentId(newDeptId)
    const dept = departments.find((d) => d._id === newDeptId)
    if (dept && dept.complaintTypes && dept.complaintTypes.length > 0) {
      setComplaintType(dept.complaintTypes[0])
      setIsCustomType(false)
      setCustomComplaintType('')
    } else {
      setComplaintType('')
      setIsCustomType(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const finalComplaintType = (isCustomType ? customComplaintType : complaintType).trim()
    if (!departmentId) {
      toast.error('Please select a department')
      return
    }
    if (!finalComplaintType) {
      toast.error('Please specify a complaint type')
      return
    }
    if (!description.trim() || description.trim().length < 5) {
      toast.error('Description must be at least 5 characters')
      return
    }

    setLoading(true)
    try {
      const payload: UpdateTicketPayload = {
        department: departmentId,
        complaintType: finalComplaintType,
        title: title.trim(),
        description: description.trim(),
        priority,
        requester: {
          name: requesterName.trim(),
          mobile: requesterMobile.trim(),
          email: requesterEmail.trim() || undefined,
          userType: requesterUserType,
          rollNumber: requesterRollNumber.trim() || undefined,
        },
      }

      await ticketService.update(ticket._id, payload)
      toast.success('Ticket details updated successfully!')
      onClose()
      await onSuccess()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update ticket'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Ticket" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Admin note banner */}
        {/* <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900"> */}
            {/* <ShieldAlert size={18} className="text-[var(--primary-blue)] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Administrator Privilege</p>
              <p className="mt-0.5 text-blue-800">
                Modifying ticket details will update the ticket record and be permanently logged in the audit activity timeline.
              </p>
            </div> */}
        {/* </div> */}

        {/* Section 1: Classification */}
        <div>
          <div className="flex items-center gap-2 mb-3 pb-1 border-b border-[var(--border)]">
            <Building2 size={16} className="text-[var(--primary-blue)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
              Department &amp; Classification
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Department */}
            <div>
              <label
                htmlFor="edit-department"
                className="block text-xs font-bold text-[var(--ink)] mb-1.5"
              >
                Department <span className="text-[var(--danger)]">*</span>
              </label>
              <select
                id="edit-department"
                required
                value={departmentId}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                disabled={loadingDepts}
                className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none cursor-pointer focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
              >
                <option value="">Select department…</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label
                htmlFor="edit-priority"
                className="block text-xs font-bold text-[var(--ink)] mb-1.5"
              >
                Priority <span className="text-[var(--danger)]">*</span>
              </label>
              <select
                id="edit-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none cursor-pointer focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {formatLabel(p)} Priority
                  </option>
                ))}
              </select>
            </div>

            {/* Complaint Type */}
            <div className="sm:col-span-2">
              <label
                htmlFor="edit-complaint-type"
                className="block text-xs font-bold text-[var(--ink)] mb-1.5"
              >
                Complaint Type <span className="text-[var(--danger)]">*</span>
              </label>

              {!isCustomType && availableComplaintTypes.length > 0 ? (
                <div className="flex gap-2">
                  <select
                    id="edit-complaint-type"
                    value={complaintType}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomType(true)
                        setCustomComplaintType('')
                      } else {
                        setComplaintType(e.target.value)
                      }
                    }}
                    className="h-10 flex-1 rounded-xl border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none cursor-pointer focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
                  >
                    {availableComplaintTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                    <option value="__custom__">+ Enter Custom Complaint Type</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      id="edit-custom-complaint-type"
                      type="text"
                      required
                      placeholder="Enter complaint type…"
                      value={customComplaintType}
                      onChange={(e) => setCustomComplaintType(e.target.value)}
                      className="h-10 flex-1 rounded-xl border border-[var(--border)] bg-[var(--white)] px-3.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
                    />
                    {availableComplaintTypes.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsCustomType(false)
                          if (availableComplaintTypes.length > 0) {
                            setComplaintType(availableComplaintTypes[0])
                          }
                        }}
                      >
                        Choose from list
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Ticket Content */}
        <div>
          <div className="flex items-center gap-2 mb-3 pb-1 border-b border-[var(--border)]">
            <FileText size={16} className="text-[var(--primary-blue)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
              Ticket Details &amp; Content
            </h3>
          </div>

          <div className="space-y-4">
            {/* Ticket Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="edit-title"
                  className="text-xs font-bold text-[var(--ink)]"
                >
                  Ticket Title <span className="text-[var(--danger)]">*</span>
                </label>
                <span className="text-[11px] text-[var(--ink-muted)]">
                  {title.length}/100 chars
                </span>
              </div>
              <input
                id="edit-title"
                type="text"
                maxLength={100}
                placeholder="Brief summary of the issue..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--white)] px-3.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="edit-description"
                className="block text-xs font-bold text-[var(--ink)] mb-1.5"
              >
                Description <span className="text-[var(--danger)]">*</span>
              </label>
              <textarea
                id="edit-description"
                required
                rows={4}
                placeholder="Detailed description of the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--white)] p-3.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Requester Information */}
        <div>
          <div className="flex items-center gap-2 mb-3 pb-1 border-b border-[var(--border)]">
            <UserIcon size={16} className="text-[var(--primary-blue)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
              Requester Information
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="edit-req-name"
                className="block text-xs font-bold text-[var(--ink)] mb-1"
              >
                Name <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                id="edit-req-name"
                type="text"
                required
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--white)] px-3 text-xs sm:text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
              />
            </div>

            <div>
              <label
                htmlFor="edit-req-mobile"
                className="block text-xs font-bold text-[var(--ink)] mb-1"
              >
                Mobile <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                id="edit-req-mobile"
                type="text"
                required
                value={requesterMobile}
                onChange={(e) => setRequesterMobile(e.target.value)}
                className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--white)] px-3 text-xs sm:text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
              />
            </div>

            <div>
              <label
                htmlFor="edit-req-email"
                className="block text-xs font-bold text-[var(--ink)] mb-1"
              >
                Email Address
              </label>
              <input
                id="edit-req-email"
                type="email"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--white)] px-3 text-xs sm:text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
              />
            </div>

            <div>
              <label
                htmlFor="edit-req-usertype"
                className="block text-xs font-bold text-[var(--ink)] mb-1"
              >
                User Category &amp; Role
              </label>
              <select
                id="edit-req-usertype"
                value={requesterUserType}
                onChange={(e) =>
                  setRequesterUserType(e.target.value as 'student' | 'staff' | 'guest')
                }
                className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--white)] px-3 text-xs sm:text-sm text-[var(--ink)] outline-none cursor-pointer focus:border-[var(--primary-blue)]"
              >
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="guest">Guest / Visitor</option>
              </select>
            </div>

            {requesterUserType === 'student' && (
              <div className="sm:col-span-2">
                <label
                  htmlFor="edit-req-rollnumber"
                  className="block text-xs font-bold text-[var(--ink)] mb-1"
                >
                  Roll Number
                </label>
                <input
                  id="edit-req-rollnumber"
                  type="text"
                  placeholder="e.g. 21CS001"
                  value={requesterRollNumber}
                  onChange={(e) => setRequesterRollNumber(e.target.value)}
                  className="h-9 w-full rounded-xl border border-[var(--border)] bg-[var(--white)] px-3 text-xs sm:text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="bg-[var(--primary-blue)] text-white">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}
