import { useCallback, useEffect, useState } from 'react'
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
    <div>
      <PageHeader
        title="Departments"
        description="Configure facilities teams, complaint types, and SLA hours."
        actions={
          <Button type="button" onClick={openCreate}>
            Add department
          </Button>
        }
      />

      <div className="panel overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-xs tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Complaint types</th>
              <th className="px-4 py-3">SLA</th>
              <th className="px-4 py-3">Manager</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((d) => (
              <tr key={getId(d)} className="border-b border-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-navy">{d.name}</p>
                  <p className="max-w-xs truncate text-xs text-slate-500">{d.description}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex max-w-xs flex-wrap gap-1">
                    {(d.complaintTypes || []).slice(0, 4).map((t) => (
                      <Badge key={t} className="bg-slate-100 text-slate-700">
                        {t}
                      </Badge>
                    ))}
                    {(d.complaintTypes || []).length > 4 && (
                      <Badge className="bg-slate-100 text-slate-500">
                        +{d.complaintTypes.length - 4}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">{d.slaHours}h</td>
                <td className="px-4 py-3">{getName(d.manager, '—')}</td>
                <td className="px-4 py-3">
                  <Badge className={d.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}>
                    {d.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => openEdit(d)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={d.isActive ? 'ghost' : 'secondary'}
                      onClick={() => void toggleActive(d)}
                    >
                      {d.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit department' : 'Create department'}
        size="lg"
      >
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-accent"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-accent"
            />
          </label>
          <div className="text-sm">
            <span className="mb-1 block text-slate-600">Complaint types</span>
            <div className="mb-2 flex flex-wrap gap-1">
              {types.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => removeChip(t)}
                  className="rounded-md bg-teal-50 px-2 py-1 text-xs text-accent hover:bg-teal-100"
                >
                  {t} ×
                </button>
              ))}
            </div>
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
                placeholder="Type and press Enter"
                className="h-10 flex-1 rounded-lg border border-slate-200 px-3 outline-none focus:border-accent"
              />
              <Button type="button" variant="outline" onClick={addChip}>
                Add
              </Button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Or paste comma-separated values below.</p>
            <input
              value={form.complaintTypes}
              onChange={(e) => setForm((f) => ({ ...f, complaintTypes: e.target.value }))}
              className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-accent"
              placeholder="Leak, Clogged drain, …"
            />
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">SLA hours</span>
            <input
              type="number"
              min={1}
              max={720}
              value={form.slaHours}
              onChange={(e) => setForm((f) => ({ ...f, slaHours: Number(e.target.value) }))}
              className="h-10 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-accent"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" loading={saving} onClick={() => void save()} disabled={!form.name.trim()}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
