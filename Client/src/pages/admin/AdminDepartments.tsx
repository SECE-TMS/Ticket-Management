import { useCallback, useEffect, useState } from 'react'
import { Building2, Layers, MapPin, Plus, Trash2, UserCheck } from 'lucide-react'
import { Button } from '../../components/common/Button'
import { Modal } from '../../components/common/Modal'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { PageHeader } from '../../components/common/KpiCard'
import { Badge } from '../../components/common/Badge'
import { Pagination } from '../../components/common/Pagination'
import { departmentService } from '../../services/departmentService'
import { userService } from '../../services/userService'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type { Block, Department, Floor, User } from '../../types'
import { getId, getName } from '../../types'

interface DeptForm {
  name: string
  description: string
  complaintTypes: string
  slaHours: number
  defaultAssignee: string
  locationEnabled: boolean
  blocks: Block[]
}

const emptyForm: DeptForm = {
  name: '',
  description: '',
  complaintTypes: '',
  slaHours: 48,
  defaultAssignee: '',
  locationEnabled: false,
  blocks: [],
}

export function AdminDepartments() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<User[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [form, setForm] = useState<DeptForm>(emptyForm)
  const [chipInput, setChipInput] = useState('')
  const [deleting, setDeleting] = useState<Department | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [depts, empList] = await Promise.all([
        departmentService.listAll(),
        userService.listAssignees().catch(() => []),
      ])
      setDepartments(depts)
      setEmployees(empList)
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
      defaultAssignee: dept.defaultAssignee ? getId(dept.defaultAssignee as any) : '',
      locationEnabled: Boolean(dept.locationEnabled),
      blocks: (dept.blocks || []).map((b) => ({
        _id: b._id,
        blockName: b.blockName,
        floors: (b.floors || []).map((fl) => ({
          _id: fl._id,
          floorName: fl.floorName,
          defaultAssignee: fl.defaultAssignee ? getId(fl.defaultAssignee as any) : null,
        })),
      })),
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

  // Block & Floor helpers
  const handleAddBlock = () => {
    setForm((f) => {
      const blockLetter = String.fromCharCode(65 + f.blocks.length)
      return {
        ...f,
        blocks: [
          ...f.blocks,
          {
            blockName: `Block ${blockLetter}`,
            floors: [
              { floorName: 'Ground Floor', defaultAssignee: null },
              { floorName: '1st Floor', defaultAssignee: null },
            ],
          },
        ],
      }
    })
  }

  const handleRemoveBlock = (blockIndex: number) => {
    setForm((f) => ({
      ...f,
      blocks: f.blocks.filter((_, idx) => idx !== blockIndex),
    }))
  }

  const handleUpdateBlockName = (blockIndex: number, name: string) => {
    setForm((f) => {
      const newBlocks = [...f.blocks]
      newBlocks[blockIndex] = { ...newBlocks[blockIndex], blockName: name }
      return { ...f, blocks: newBlocks }
    })
  }

  const handleAddFloor = (blockIndex: number) => {
    setForm((f) => {
      const newBlocks = [...f.blocks]
      const count = newBlocks[blockIndex].floors.length
      const suffix = count === 1 ? 'st' : count === 2 ? 'nd' : count === 3 ? 'rd' : 'th'
      const defaultName = count === 0 ? 'Ground Floor' : `${count}${suffix} Floor`
      newBlocks[blockIndex] = {
        ...newBlocks[blockIndex],
        floors: [
          ...newBlocks[blockIndex].floors,
          { floorName: defaultName, defaultAssignee: null },
        ],
      }
      return { ...f, blocks: newBlocks }
    })
  }

  const handleRemoveFloor = (blockIndex: number, floorIndex: number) => {
    setForm((f) => {
      const newBlocks = [...f.blocks]
      newBlocks[blockIndex] = {
        ...newBlocks[blockIndex],
        floors: newBlocks[blockIndex].floors.filter((_, idx) => idx !== floorIndex),
      }
      return { ...f, blocks: newBlocks }
    })
  }

  const handleUpdateFloor = (
    blockIndex: number,
    floorIndex: number,
    field: keyof Floor,
    val: any
  ) => {
    setForm((f) => {
      const newBlocks = [...f.blocks]
      const newFloors = [...newBlocks[blockIndex].floors]
      newFloors[floorIndex] = {
        ...newFloors[floorIndex],
        [field]: val,
      }
      newBlocks[blockIndex] = { ...newBlocks[blockIndex], floors: newFloors }
      return { ...f, blocks: newBlocks }
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      const cleanBlocks = form.locationEnabled
        ? form.blocks
            .filter((b) => b.blockName && b.blockName.trim().length > 0)
            .map((b) => ({
              ...(b._id ? { _id: b._id } : {}),
              blockName: b.blockName.trim(),
              floors: (b.floors || [])
                .filter((fl) => fl.floorName && fl.floorName.trim().length > 0)
                .map((fl) => ({
                  ...(fl._id ? { _id: fl._id } : {}),
                  floorName: fl.floorName.trim(),
                  defaultAssignee: fl.defaultAssignee || null,
                })),
            }))
        : []

      if (form.locationEnabled && cleanBlocks.length === 0) {
        toast.error('Please add at least one campus block, or disable the classification toggle')
        setSaving(false)
        return
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        complaintTypes: types,
        slaHours: Number(form.slaHours) || 48,
        defaultAssignee: form.defaultAssignee || null,
        locationEnabled: Boolean(form.locationEnabled),
        blocks: cleanBlocks,
      }

      if (editing) {
        await departmentService.update(getId(editing), payload)
        toast.success('Department updated successfully')
      } else {
        await departmentService.create(payload)
        toast.success('Department created successfully')
      }
      setOpen(false)
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  
  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await departmentService.remove(getId(deleting))
      toast.success('Department deleted successfully')
      setDeleting(null)
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete department'))
    } finally {
      setDeleteLoading(false)
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

  // Filter employees for department or show all employees
  const deptEmployees = editing
    ? employees.filter((emp) => {
        const empDepts = [
          emp.department ? getId(emp.department) : null,
          ...(emp.departments || []).map((d) => getId(d)),
        ].filter(Boolean)
        return empDepts.includes(getId(editing))
      })
    : employees

  return (
    <div>
      <PageHeader
        title="Departments"
        description="Configure facilities teams, default ticket assignees, campus blocks & floors, and SLA."
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
              <th className="px-4 py-3">Ticket Types</th>
              <th className="px-4 py-3">Default Assignee</th>
              <th className="px-4 py-3">Campus Locations</th>
              <th className="px-4 py-3">SLA</th>
              <th className="px-4 py-3">Manager</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 last:rounded-tr-xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {departments
              .slice((page - 1) * limit, page * limit)
              .map((d) => {
                const totalFloors = (d.blocks || []).reduce(
                  (acc, b) => acc + (b.floors?.length || 0),
                  0
                )
                return (
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
                        {(d.complaintTypes || []).slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center rounded-full bg-[var(--gold-light)] px-2 py-0.5 text-xs font-semibold text-[var(--gold-dark)]"
                          >
                            {t}
                          </span>
                        ))}
                        {(d.complaintTypes || []).length > 2 && (
                          <span className="inline-flex items-center rounded-full bg-[var(--primary-blue-light)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--primary-blue)]">
                            +{d.complaintTypes.length - 2} more
                          </span>
                        )}
                        {!(d.complaintTypes || []).length && (
                          <span className="text-xs text-[var(--ink-muted)]">—</span>
                        )}
                      </div>
                    </td>

                    {/* Default Assignee */}
                    <td className="px-4 py-3.5">
                      {d.defaultAssignee ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-xs font-semibold text-blue-900 shadow-2xs">
                          <UserCheck size={13} className="text-blue-600" />
                          {getName(d.defaultAssignee)}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--ink-muted)] italic">Unassigned (Manual)</span>
                      )}
                    </td>

                    {/* Locations */}
                    <td className="px-4 py-3.5">
                      {d.locationEnabled && (d.blocks || []).length > 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
                          <MapPin size={13} className="text-emerald-600" />
                          {d.blocks?.length} {d.blocks?.length === 1 ? 'Block' : 'Blocks'} · {totalFloors} {totalFloors === 1 ? 'Floor' : 'Floors'}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--ink-muted)]">Disabled</span>
                      )}
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
                            : 'bg-[var(--surface-2)] text-[var(--ink-muted)]'
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
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                          onClick={() => setDeleting(d)}
                        >
                          <Trash2 size={13} className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            {!departments.length && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sm text-[var(--ink-muted)]">
                  No departments found. Add your first department to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {departments.length > 0 && (
        <div className="mt-4">
          <Pagination
            page={page}
            pages={Math.max(1, Math.ceil(departments.length / limit))}
            total={departments.length}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(newLimit) => {
              setLimit(newLimit)
              setPage(1)
            }}
          />
        </div>
      )}

            {/* Delete confirmation modal */}
      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete Department"
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 leading-relaxed">
            <p className="font-bold text-sm mb-1 text-red-950 flex items-center gap-1.5">
              <Trash2 size={16} className="text-red-600" />
              Soft Delete Department
            </p>
            Are you sure you want to delete <strong className="font-semibold text-red-950">"{deleting?.name}"</strong>?
            <br /><br />
            This will soft-delete the department in the database, deactivating it and unassigning it from facilities. Note: Departments with open tickets cannot be deleted.
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleting(null)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              loading={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer"
              onClick={() => void handleDelete()}
            >
              Yes, Delete Department
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create/Edit modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? `Edit Department — ${editing.name}` : 'Create New Department'}
        size="xl"
      >
        <div className="space-y-6 max-h-[78vh] overflow-y-auto pr-1">
          {/* Basic Info Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="dept-name" className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                Department Name <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                id="dept-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputClass}
                placeholder="e.g. Electrical Maintenance, IT Support, Civil Facilities"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="dept-desc" className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                Description
              </label>
              <textarea
                id="dept-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--white)] p-3 text-sm text-[var(--ink)] outline-none transition-colors focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
                placeholder="Brief summary of responsibilities and scope…"
              />
            </div>

            {/* SLA Hours */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dept-sla" className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                SLA Deadline (Hours) <span className="text-[var(--danger)]">*</span>
              </label>
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

            {/* Default Assignee Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dept-default-assignee" className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                Default Ticket Assignee
              </label>
              <select
                id="dept-default-assignee"
                value={form.defaultAssignee}
                onChange={(e) => setForm((f) => ({ ...f, defaultAssignee: e.target.value }))}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">(None — Require manual assignment by manager)</option>
                {(deptEmployees.length > 0 ? deptEmployees : employees).map((emp) => (
                  <option key={getId(emp)} value={getId(emp)}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-[var(--ink-muted)]">
                Every new ticket logged for this department will be automatically assigned to this employee.
              </p>
            </div>
          </div>

          {/* Complaint types */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
              Ticket Categories / Complaint Types
            </p>
            {types.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {types.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gold-light)] px-3 py-1 text-xs font-semibold text-[var(--gold-dark)] shadow-2xs"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeChip(t)}
                      aria-label={`Remove ${t}`}
                      className="hover:text-black cursor-pointer font-bold ml-0.5"
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
            <p className="text-xs text-[var(--ink-muted)]">
              Or paste comma-separated values:
            </p>
            <input
              value={form.complaintTypes}
              onChange={(e) => setForm((f) => ({ ...f, complaintTypes: e.target.value }))}
              className={inputClass}
              placeholder="Leak, Clogged drain, Electrical fault, …"
            />
          </div>

          {/* Campus Block & Floor Classification Section */}
          <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-blue)] text-white shadow-xs">
                  <MapPin size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--ink)]">
                    Campus Block &amp; Floor Classification
                  </h4>
                  <p className="text-xs text-[var(--ink-muted)]">
                    Allow requesters to select specific campus blocks and floors for this department.
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.locationEnabled}
                  onChange={(e) => setForm((f) => ({ ...f, locationEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-blue)]"></div>
              </label>
            </div>

            {form.locationEnabled && (
              <div className="space-y-4 pt-2 border-t border-blue-200/60 animate-fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[var(--ink)]">
                    Configured Blocks &amp; Floor Assignments ({form.blocks.length})
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddBlock}
                    className="inline-flex items-center gap-1 text-xs border-blue-300 bg-white hover:bg-blue-50 text-[var(--primary-blue)]"
                  >
                    <Plus size={13} />
                    Add Block
                  </Button>
                </div>

                {form.blocks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-blue-300 bg-white/70 p-6 text-center">
                    <Layers size={28} className="mx-auto text-blue-400 mb-2" />
                    <p className="text-xs font-bold text-slate-700">No blocks configured yet</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                      Add blocks (e.g. Block A, Main Block, Mech Block) and floors to enable requester selection.
                    </p>
                    <Button type="button" size="sm" onClick={handleAddBlock}>
                      + Add First Block
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {form.blocks.map((block, bIdx) => (
                      <div
                        key={bIdx}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
                      >
                        {/* Block Header */}
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-xs font-bold text-blue-800">
                            {bIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={block.blockName}
                            onChange={(e) => handleUpdateBlockName(bIdx, e.target.value)}
                            placeholder="e.g. Block A, Mechanical Block"
                            className="h-9 flex-1 rounded-lg border border-slate-300 bg-white px-3 font-semibold text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddFloor(bIdx)}
                            className="text-xs shrink-0"
                          >
                            <Plus size={12} /> Add Floor
                          </Button>
                          <button
                            type="button"
                            onClick={() => handleRemoveBlock(bIdx)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete this block"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {/* Floors List */}
                        <div className="pl-8 space-y-2">
                          {block.floors.map((fl, fIdx) => (
                            <div
                              key={fIdx}
                              className="flex flex-col sm:flex-row items-start sm:items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/80 p-2 text-xs"
                            >
                              <div className="flex items-center gap-1.5 flex-1 w-full sm:w-auto">
                                <span className="text-[11px] font-bold text-slate-400 w-5">
                                  #{fIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={fl.floorName}
                                  onChange={(e) =>
                                    handleUpdateFloor(bIdx, fIdx, 'floorName', e.target.value)
                                  }
                                  placeholder="Floor name (e.g. 1st Floor)"
                                  className="h-8 flex-1 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                                />
                              </div>

                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <select
                                  value={fl.defaultAssignee ? getId(fl.defaultAssignee as any) : ''}
                                  onChange={(e) =>
                                    handleUpdateFloor(
                                      bIdx,
                                      fIdx,
                                      'defaultAssignee',
                                      e.target.value || null
                                    )
                                  }
                                  className="h-8 flex-1 sm:w-48 rounded-md border border-slate-300 bg-white px-2 text-[11px] text-slate-700 outline-none cursor-pointer focus:border-blue-500"
                                >
                                  <option value="">
                                    (Inherit dept default assignee)
                                  </option>
                                  {(deptEmployees.length > 0 ? deptEmployees : employees).map((emp) => (
                                    <option key={getId(emp)} value={getId(emp)}>
                                      👤 {emp.name}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFloor(bIdx, fIdx)}
                                  className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer p-1"
                                  title="Delete floor"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}

                          {block.floors.length === 0 && (
                            <p className="text-[11px] text-slate-400 italic">
                              No floors added yet. Click &quot;Add Floor&quot; to configure floors.
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
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
