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

  const inputClass =
    'h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20'

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Configure facilities teams, complaint types, and SLA hours."
        actions={
          <Button type="button" id="add-dept-btn" onClick={openCreate}>
            + Add Department
          </Button>
        }
      />

      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--white)] shadow-xs">
        <table className="w-full text-left text-sm border-collapse" id="departments-table">
          <thead>
            <tr className="bg-[var(--primary-blue)] text-white/90 text-xs font-bold uppercase tracking-wider">
              <th className="px-4 py-3 first:rounded-tl-xl">Department</th>
              <th className="px-4 py-3">Complaint Types</th>
              <th className="px-4 py-3">SLA</th>
              <th className="px-4 py-3">Manager</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 last:rounded-tr-xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {departments.map((d) => (
              <tr key={getId(d)} className="transition-colors hover:bg-[var(--primary-blue-light)]">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-blue-light)] text-[var(--primary-blue)]">
                      <Building2 size={16} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[var(--ink)]">
                        {d.name}
                      </p>
                      {d.description && (
                        <p className="max-w-xs truncate text-xs text-[var(--ink-muted)]">
                          {d.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex max-w-xs flex-wrap gap-1">
                    {(d.complaintTypes || []).slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-full bg-[var(--gold-light)] px-2.5 py-0.5 text-xs font-semibold text-[var(--gold-dark)]"
                      >
                        {t}
                      </span>
                    ))}
                    {(d.complaintTypes || []).length > 3 && (
                      <span className="inline-flex items-center rounded-full bg-[var(--primary-blue-light)] px-2 py-0.5 text-[11px] font-semibold text-[var(--primary-blue)]">
                        +{d.complaintTypes.length - 3} more
                      </span>
                    )}
                    {!(d.complaintTypes || []).length && (
                      <span className="text-xs text-[var(--ink-muted)]">—</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-semibold text-[var(--ink)]">
                    {d.slaHours}h
                  </span>
                </td>
                <td className="px-4 py-3.5 text-[var(--ink-muted)]">{getName(d.manager, '—')}</td>
                <td className="px-4 py-3.5">
                  <Badge
                    className={
                      d.isActive
                        ? 'bg-[var(--success-light)] text-[var(--success)]'
                        : 'bg-slate-100 text-slate-700'
                    }
                  >
                    {d.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3.5">
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
                <td colSpan={6} className="py-8 text-center text-sm text-[var(--ink-muted)]">
                  No departments found. Add your first department to get started.
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
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dept-name" className="text-sm font-semibold text-[var(--ink)]">Name</label>
            <input
              id="dept-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClass}
              placeholder="Department name"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="dept-desc" className="text-sm font-semibold text-[var(--ink)]">Description</label>
            <textarea
              id="dept-desc"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--white)] p-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
              placeholder="Brief description…"
            />
          </div>

          {/* Complaint types */}
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-semibold text-[var(--ink)]">Complaint Types</p>
            {types.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {types.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gold-light)] px-3 py-1 text-xs font-semibold text-[var(--gold-dark)]"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeChip(t)}
                      aria-label={`Remove ${t}`}
                      className="hover:text-black cursor-pointer"
                    >
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
                className={`flex-1 ${inputClass}`}
              />
              <Button type="button" variant="outline" size="sm" onClick={addChip}>
                Add
              </Button>
            </div>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              Or paste comma-separated values below.
            </p>
            <input
              value={form.complaintTypes}
              onChange={(e) => setForm((f) => ({ ...f, complaintTypes: e.target.value }))}
              className={`mt-1 ${inputClass}`}
              placeholder="Leak, Clogged drain, Electrical fault, …"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="dept-sla" className="text-sm font-semibold text-[var(--ink)]">SLA Hours</label>
            <input
              id="dept-sla"
              type="number"
              min={1}
              max={720}
              value={form.slaHours}
              onChange={(e) => setForm((f) => ({ ...f, slaHours: Number(e.target.value) }))}
              className={inputClass}
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
