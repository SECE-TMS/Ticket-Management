import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Copy } from 'lucide-react'
import { departmentService } from '../../services/departmentService'
import { ticketService } from '../../services/ticketService'
import { Button } from '../../components/common/Button'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type { Department } from '../../types'
import { getId } from '../../types'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  department: z.string().min(1, 'Select a department'),
  mobile: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
  complaintType: z.string().min(1, 'Select a complaint type'),
  description: z.string().min(5, 'Describe the issue (min 5 characters)'),
})

type FormValues = z.infer<typeof schema>

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      {children}
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

export function RaiseTicket() {
  const toast = useToast()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepts, setLoadingDepts] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [ticketCode, setTicketCode] = useState<string | null>(null)
  const [attachment, setAttachment] = useState<File | null>(null)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      department: '',
      mobile: '',
      complaintType: '',
      description: '',
    },
  })

  const selectedDeptId = watch('department')
  const selectedDept = useMemo(
    () => departments.find((d) => getId(d) === selectedDeptId),
    [departments, selectedDeptId]
  )

  useEffect(() => {
    void (async () => {
      try {
        const data = await departmentService.listActive()
        setDepartments(data)
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to load departments'))
      } finally {
        setLoadingDepts(false)
      }
    })()
  }, [toast])

  useEffect(() => {
    setValue('complaintType', '')
  }, [selectedDeptId, setValue])

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('name', values.name)
      formData.append('department', values.department)
      formData.append('mobile', values.mobile)
      formData.append('complaintType', values.complaintType)
      formData.append('description', values.description)
      if (attachment) formData.append('attachment', attachment)

      const ticket = await ticketService.create(formData)
      setTicketCode(ticket.ticketCode)
      toast.success('Ticket submitted successfully!')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create ticket'))
    } finally {
      setSubmitting(false)
    }
  })

  if (loadingDepts) return <PageLoader />

  // ── Success state ──────────────────────────────────────────────────
  if (ticketCode) {
    const handleCopy = () => {
      void navigator.clipboard.writeText(ticketCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

    return (
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <div className="panel p-8 text-center animate-fade-in">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: 'var(--success-light)' }}
          >
            <CheckCircle2 size={36} style={{ color: 'var(--success)' }} />
          </div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--ink)' }}>
            Ticket raised!
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--ink-muted)' }}>
            Save your ticket code to track progress later. We'll assign it shortly.
          </p>

          {/* Ticket code card */}
          <div
            className="mt-6 rounded-xl px-6 py-5"
            style={{ background: 'var(--primary-blue-light)', border: '1.5px solid var(--primary-blue-muted)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--primary-blue)' }}>
              Your ticket code
            </p>
            <p className="mt-2 font-mono text-3xl font-bold tracking-widest" style={{ color: 'var(--primary-blue-deeper)' }}>
              {ticketCode}
            </p>
            <button
              type="button"
              onClick={handleCopy}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
              style={{
                background: copied ? 'var(--success-light)' : 'var(--white)',
                color: copied ? 'var(--success)' : 'var(--primary-blue)',
                border: '1px solid currentColor',
              }}
            >
              <Copy size={12} />
              {copied ? 'Copied!' : 'Copy code'}
            </button>
          </div>

          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button type="button" onClick={() => setTicketCode(null)}>
              Raise another
            </Button>
            <Link to="/track-ticket">
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Track ticket
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <h1 className="page-title">Raise a Ticket</h1>
        <p className="page-subtitle">
          Report a facility or maintenance issue. Your request will be assigned to the right team.
        </p>
      </div>

      <form onSubmit={onSubmit} className="panel space-y-5 p-6" id="raise-ticket-form">
        <Field label="Your full name" error={errors.name?.message}>
          <input
            {...register('name')}
            id="rt-name"
            className={`input-field ${errors.name ? 'input-error' : ''}`}
            placeholder="Full name"
            autoComplete="name"
          />
        </Field>

        <Field label="Department" error={errors.department?.message}>
          <select
            {...register('department')}
            id="rt-department"
            className={`input-field ${errors.department ? 'input-error' : ''}`}
          >
            <option value="">Select department…</option>
            {departments.map((d) => (
              <option key={getId(d)} value={getId(d)}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Mobile number (10 digits)" error={errors.mobile?.message}>
          <input
            {...register('mobile')}
            id="rt-mobile"
            className={`input-field ${errors.mobile ? 'input-error' : ''}`}
            inputMode="numeric"
            maxLength={10}
            placeholder="9876543210"
          />
        </Field>

        <Field label="Complaint type" error={errors.complaintType?.message}>
          <select
            {...register('complaintType')}
            id="rt-complaint-type"
            className={`input-field ${errors.complaintType ? 'input-error' : ''}`}
            disabled={!selectedDept}
          >
            <option value="">
              {selectedDept ? 'Select complaint type…' : 'Select a department first'}
            </option>
            {(selectedDept?.complaintTypes || []).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Description" error={errors.description?.message}>
          <textarea
            {...register('description')}
            id="rt-description"
            rows={4}
            className={`input-field ${errors.description ? 'input-error' : ''}`}
            placeholder="What needs attention? Include the location if helpful."
          />
        </Field>

        {/* File attachment */}
        <div className="form-field">
          <p className="form-label">
            Attachment{' '}
            <span className="text-xs font-normal" style={{ color: 'var(--ink-muted)' }}>
              (photo or audio, optional)
            </span>
          </p>
          <input
            id="rt-attachment"
            type="file"
            accept="image/*,audio/*"
            capture="environment"
            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
            className="block w-full text-sm"
            style={{ color: 'var(--ink-muted)' }}
          />
          {attachment && (
            <p className="mt-1 text-xs font-medium" style={{ color: 'var(--primary-blue)' }}>
              ✓ {attachment.name}
            </p>
          )}
        </div>

        <Button
          id="rt-submit"
          type="submit"
          className="w-full"
          loading={submitting}
          size="lg"
        >
          Submit Ticket
        </Button>
      </form>
    </div>
  )
}
