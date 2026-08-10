import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
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

export function RaiseTicket() {
  const toast = useToast()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepts, setLoadingDepts] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [ticketCode, setTicketCode] = useState<string | null>(null)
  const [attachment, setAttachment] = useState<File | null>(null)

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
      toast.success('Ticket submitted successfully')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create ticket'))
    } finally {
      setSubmitting(false)
    }
  })

  if (loadingDepts) return <PageLoader />

  if (ticketCode) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <div className="panel p-6 text-center sm:p-8">
          <CheckCircle2 className="mx-auto text-accent" size={48} />
          <h1 className="mt-4 font-display text-2xl font-semibold text-navy">Ticket raised</h1>
          <p className="mt-2 text-sm text-slate-600">
            Save your ticket code to track progress later.
          </p>
          <p className="mt-6 rounded-lg bg-surface px-4 py-3 font-mono text-2xl font-semibold tracking-wide text-navy">
            {ticketCode}
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button type="button" onClick={() => setTicketCode(null)}>
              Raise another
            </Button>
            <Link to="/track-ticket" className="block w-full sm:inline-block sm:w-auto">
              <Button type="button" variant="outline" className="w-full">
                Track ticket
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-display text-3xl font-semibold text-navy">Raise a ticket</h1>
      <p className="mt-2 text-sm text-slate-600">
        Report a facility or maintenance issue. Fields marked required must be completed.
      </p>

      <form onSubmit={onSubmit} className="panel mt-6 space-y-4 p-5 sm:p-6">
        <Field label="Your name" error={errors.name?.message}>
          <input
            {...register('name')}
            className="input"
            placeholder="Full name"
            autoComplete="name"
          />
        </Field>

        <Field label="Department" error={errors.department?.message}>
          <select {...register('department')} className="input">
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={getId(d)} value={getId(d)}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Mobile (10 digits)" error={errors.mobile?.message}>
          <input
            {...register('mobile')}
            className="input"
            inputMode="numeric"
            maxLength={10}
            placeholder="9876543210"
          />
        </Field>

        <Field label="Complaint type" error={errors.complaintType?.message}>
          <select {...register('complaintType')} className="input" disabled={!selectedDept}>
            <option value="">Select type</option>
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
            rows={4}
            className="input"
            placeholder="What needs attention? Include location if helpful."
          />
        </Field>

        <Field label="Attachment (photo or audio)" error={undefined}>
          <input
            type="file"
            accept="image/*,audio/*"
            capture="environment"
            onChange={(e) => setAttachment(e.target.files?.[0] || null)}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent"
          />
        </Field>

        <Button type="submit" className="w-full" loading={submitting} size="lg">
          Submit ticket
        </Button>
      </form>

      <style>{`
        .input {
          width: 100%;
          height: 2.5rem;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          padding: 0 0.75rem;
          outline: none;
        }
        textarea.input {
          height: auto;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
        }
        .input:focus {
          border-color: #0d9488;
        }
      `}</style>
    </div>
  )
}

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
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}
