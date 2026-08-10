import { useCallback, useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/common/Modal'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { PageHeader } from '../../components/common/KpiCard'
import { Badge } from '../../components/common/Badge'
import { departmentService } from '../../services/departmentService'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type { Department } from '../../types'
import { getId, getName } from '../../types'

interface DeptForm {
  name: string
  description: string
  complaintTypes: string
  slaHours: number
}

const emptyForm: DeptForm = {
  name: '',
  description: '',
  complaintTypes: '',
  slaHours: 48,
}

export function AdminDepartments() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [form, setForm] = useState<DeptForm>(emptyForm)
  const [chipInput, setChipInput] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setDepartments(await departmentService.listAll())
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load departments'))
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setChipInput('')
    setOpen(true)
  }

  const openEdit = (dept: Department) => {
    setEditing(dept)
    setForm({
      name: dept.name,
      description: dept.description || '',
      complaintTypes: (dept.complaintTypes || []).join(', '),
      slaHours: dept.slaHours || 48,
    })
    setChipInput('')
    setOpen(true)
  }

  const types = form.complaintTypes
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  const addChip = () => {
    const value = chipInput.trim()
    if (!value || types.includes(value)) return
    setForm((f) => ({
      ...f,
      complaintTypes: [...types, value].join(', '),
    }))
    setChipInput('')
  }

  const removeChip = (value: string) => {
    setForm((f) => ({
      ...f,
      complaintTypes: types.filter((t) => t !== value).join(', '),
    }))
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        complaintTypes: types,
        slaHours: Number(form.slaHours) || 48,
      }
      if (editing) {
        await departmentService.update(getId(editing), payload)
        toast.success('Department updated')
      } else {
        await departmentService.create(payload)
        toast.success('Department created')
      }
      setOpen(false)
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (dept: Department) => {
    try {
      await departmentService.updateStatus(getId(dept), !dept.isActive)
      toast.success(dept.isActive ? 'Department deactivated' : 'Department activated')
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Departments"
        description="Configure facilities teams, complaint types, and SLA hours."
        actions={
          <Button type="button" id="add-dept-btn" onClick={openCreate}>
            + Add Department
          </Button>
        }
      />

      <div className="panel overflow-x-auto">
        <table className="data-table" id="departments-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Complaint Types</th>
              <th>SLA</th>
              <th>Manager</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr key={getId(d)}>
                <td>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0"
                      style={{ background: 'var(--primary-blue-light)', color: 'var(--primary-blue)' }}
                    >
                      <Building2 size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>
                        {d.name}
                      </p>
                      {d.description && (
                        <p
                          className="max-w-xs truncate text-xs"
                          style={{ color: 'var(--ink-muted)' }}
                        >
                          {d.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex max-w-xs flex-wrap gap-1">
                    {(d.complaintTypes || []).slice(0, 3).map((t) => (
                      <span key={t} className="chip chip-gold text-xs">
                        {t}
                      </span>
                    ))}
                    {(d.complaintTypes || []).length > 3 && (
                      <span className="chip" style={{ fontSize: '0.7rem' }}>
                        +{d.complaintTypes.length - 3} more
                      </span>
                    )}
                    {!(d.complaintTypes || []).length && (
                      <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>—</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className="font-medium" style={{ color: 'var(--ink)' }}>
                    {d.slaHours}h
                  </span>
                </td>
                <td style={{ color: 'var(--ink-muted)' }}>{getName(d.manager, '—')}</td>
                <td>
                  <Badge className={d.isActive ? 'status-resolved' : 'status-closed'}>
                    {d.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => openEdit(d)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={d.isActive ? 'ghost' : 'primary'}
                      onClick={() => void toggleActive(d)}
                    >
                      {d.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!departments.length && (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><Building2 size={22} /></div>
                    <p className="empty-state-title">No departments yet</p>
                    <p className="empty-state-desc">Add your first department to get started.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Department' : 'Create Department'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="form-field">
            <label htmlFor="dept-name" className="form-label">Name</label>
            <input
              id="dept-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input-field"
              placeholder="Department name"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="dept-desc" className="form-label">Description</label>
            <textarea
              id="dept-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="input-field"
              placeholder="Brief description…"
            />
          </div>

          {/* Complaint types */}
          <div className="form-field">
            <p className="form-label mb-2">Complaint Types</p>
            {types.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {types.map((t) => (
                  <span key={t} className="chip chip-gold">
                    {t}
                    <button type="button" onClick={() => removeChip(t)} aria-label={`Remove ${t}`}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={chipInput}
                onChange={(e) => setChipInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addChip()
                  }
                }}
                placeholder="Type and press Enter or Add"
                className="input-field flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={addChip}>
                Add
              </Button>
            </div>
            <p className="mt-1 text-xs" style={{ color: 'var(--ink-muted)' }}>
              Or paste comma-separated values below.
            </p>
            <input
              value={form.complaintTypes}
              onChange={(e) => setForm((f) => ({ ...f, complaintTypes: e.target.value }))}
              className="input-field mt-2"
              placeholder="Leak, Clogged drain, Electrical fault, …"
            />
          </div>

          <div className="form-field">
            <label htmlFor="dept-sla" className="form-label">SLA Hours</label>
            <input
              id="dept-sla"
              type="number"
              min={1}
              max={720}
              value={form.slaHours}
              onChange={(e) => setForm((f) => ({ ...f, slaHours: Number(e.target.value) }))}
              className="input-field"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              loading={saving}
              onClick={() => void save()}
              disabled={!form.name.trim()}
            >
              {editing ? 'Save Changes' : 'Create Department'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
