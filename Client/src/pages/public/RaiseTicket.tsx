import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  Headset,
  Phone,
  ShieldCheck,
  User,
  Zap,
} from 'lucide-react'
import { departmentService } from '../../services/departmentService'
import { ticketService } from '../../services/ticketService'
import { Button } from '../../components/common/Button'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { MediaAttachmentInput } from '../../components/common/MediaAttachmentInput'
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

  const descriptionValue = watch('description') || ''

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

  // ── Success State Screen ────────────────────────────────────────────────
  if (ticketCode) {
    const handleCopy = () => {
      void navigator.clipboard.writeText(ticketCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }

    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-8 text-center shadow-lg animate-fade-in">
          {/* Animated check badge */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--success-light)] text-[var(--success)] shadow-inner">
            <CheckCircle2 size={48} />
          </div>

          <h1 className="font-display text-3xl font-bold text-[var(--ink)]">
            Ticket Submitted!
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">
            Your maintenance request has been logged and queued for assignment.
          </p>

          {/* Ticket code card */}
          <div className="mt-6 rounded-2xl border border-[var(--primary-blue-muted)] bg-gradient-to-br from-[var(--primary-blue-light)] to-[var(--surface-2)] p-6 shadow-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary-blue)]">
              Your Unique Ticket Reference
            </p>
            <p className="mt-2 font-mono text-3xl font-bold tracking-widest text-[var(--primary-blue-deeper)]">
              {ticketCode}
            </p>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">
              Use this code to track progress without logging in.
            </p>
            <button
              type="button"
              onClick={handleCopy}
              className={`mt-4 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-xs ${
                copied
                  ? 'border-[var(--success)] bg-[var(--success-light)] text-[var(--success)]'
                  : 'border-[var(--primary-blue)] bg-[var(--white)] text-[var(--primary-blue)] hover:bg-[var(--primary-blue-light)]'
              }`}
            >
              <Copy size={14} />
              {copied ? 'Copied to Clipboard!' : 'Copy Ticket Code'}
            </button>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => {
                setTicketCode(null)
                setAttachment(null)
              }}
            >
              Raise Another Ticket
            </Button>
            <Link to="/track-ticket">
              <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto">
                Track Status Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Main Page Layout ───────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary-blue)] hover:underline"
      >
        <ArrowLeft size={16} />
        Back to Home
      </Link>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Visual Brand Card & Step Info (Desktop only) */}
        <div className="hidden lg:flex flex-col justify-between rounded-2xl bg-gradient-to-br from-[var(--primary-blue-deeper)] via-[var(--primary-blue)] to-[var(--primary-blue-dark)] p-6 text-[var(--white)] shadow-md sm:p-8 lg:col-span-4">
          <div>
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-[var(--gold)]/15 px-3.5 py-1 text-xs font-bold text-[var(--gold)]">
              <Headset size={13} />
              24/7 Facility Desk
            </div>

            <h1 className="mt-4 font-display text-2xl font-bold text-[var(--white)] sm:text-3xl">
              Report an Issue
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-white/75 sm:text-sm">
              Fast, tracked resolution for campus maintenance, plumbing, electrical, and facility requests.
            </p>

            {/* Visual Step Guide */}
            <div className="mt-8 space-y-5">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-bold text-[var(--primary-blue-deeper)]">
                  1
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--white)]">Contact Info</p>
                  <p className="text-[11px] text-white/60">Your name &amp; 10-digit mobile</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-bold text-[var(--primary-blue-deeper)]">
                  2
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--white)]">Category Selection</p>
                  <p className="text-[11px] text-white/60">Choose department &amp; complaint type</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-bold text-[var(--primary-blue-deeper)]">
                  3
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--white)]">Details &amp; Attachment</p>
                  <p className="text-[11px] text-white/60">Describe issue &amp; add optional photo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Guarantee Badges */}
          <div className="mt-10 border-t border-white/10 pt-6 space-y-3">
            <div className="flex items-center gap-2 text-xs text-white/80">
              <Zap size={14} className="text-[var(--gold)]" />
              <span>Instant assignment to department team</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/80">
              <Clock size={14} className="text-[var(--gold)]" />
              <span>Response within department SLA</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/80">
              <ShieldCheck size={14} className="text-[var(--gold)]" />
              <span>Track progress anytime using Ticket Code</span>
            </div>
          </div>
        </div>

        {/* Right Column: High-End Form */}
        <div className="col-span-12 rounded-2xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-sm sm:p-8 lg:col-span-8">
          <form onSubmit={onSubmit} className="space-y-6" id="raise-ticket-form">
            {/* Step 1: Requester Details */}
            <div>
              <div className="mb-4 flex items-center gap-2 border-b border-[var(--border)] pb-2">
                <User size={18} className="text-[var(--primary-blue)]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
                  1. Your Contact Information
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="rt-name" className="text-xs font-bold text-[var(--ink)]">
                    Full Name <span className="text-[var(--danger)]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register('name')}
                      id="rt-name"
                      className={`h-11 w-full rounded-xl border bg-[var(--white)] px-3.5 text-sm text-[var(--ink)] outline-none transition-all focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 ${
                        errors.name ? 'border-[var(--danger)]' : 'border-[var(--border)]'
                      }`}
                      placeholder="e.g. Rahul Sharma"
                      autoComplete="name"
                    />
                  </div>
                  {errors.name && (
                    <span className="text-xs text-[var(--danger)]">{errors.name.message}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="rt-mobile" className="text-xs font-bold text-[var(--ink)]">
                    Mobile Number <span className="text-[var(--danger)]">*</span>
                  </label>
                  <div className="relative">
                    <Phone
                      size={15}
                      className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--ink-muted)]"
                    />
                    <input
                      {...register('mobile')}
                      id="rt-mobile"
                      inputMode="numeric"
                      maxLength={10}
                      className={`h-11 w-full rounded-xl border bg-[var(--white)] pl-10 pr-3.5 text-sm text-[var(--ink)] outline-none transition-all focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 ${
                        errors.mobile ? 'border-[var(--danger)]' : 'border-[var(--border)]'
                      }`}
                      placeholder="10-digit mobile"
                    />
                  </div>
                  {errors.mobile && (
                    <span className="text-xs text-[var(--danger)]">{errors.mobile.message}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: Department & Category */}
            <div>
              <div className="mb-4 flex items-center gap-2 border-b border-[var(--border)] pb-2">
                <Building2 size={18} className="text-[var(--primary-blue)]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
                  2. Department &amp; Issue Category
                </h2>
              </div>

              {/* Department Cards Selector */}
              <div className="mb-4 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--ink)]">
                  Select Department <span className="text-[var(--danger)]">*</span>
                </label>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {departments.map((d) => {
                    const deptId = getId(d)
                    const isSelected = selectedDeptId === deptId
                    return (
                      <button
                        key={deptId}
                        type="button"
                        onClick={() => setValue('department', deptId, { shouldValidate: true })}
                        className={`flex items-center justify-between rounded-xl border p-3 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[var(--primary-blue)] bg-[var(--primary-blue-light)] text-[var(--primary-blue)] font-bold shadow-xs ring-2 ring-[var(--primary-blue)]/20'
                            : 'border-[var(--border)] bg-[var(--white)] text-[var(--ink)] hover:border-[var(--primary-blue-muted)] hover:bg-[var(--surface)]'
                        }`}
                      >
                        <span className="truncate text-xs font-semibold">{d.name}</span>
                        {isSelected && (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary-blue)] text-white">
                            <Check size={12} />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                {errors.department && (
                  <span className="text-xs text-[var(--danger)]">{errors.department.message}</span>
                )}
              </div>

              {/* Complaint Type Pills */}
              {selectedDept && (
                <div className="flex flex-col gap-1.5 animate-fade-in">
                  <label className="text-xs font-bold text-[var(--ink)]">
                    Complaint Type <span className="text-[var(--danger)]">*</span>
                  </label>
                  <select
                    {...register('complaintType')}
                    id="rt-complaint-type"
                    className={`h-11 w-full rounded-xl border bg-[var(--white)] px-3.5 text-sm text-[var(--ink)] outline-none cursor-pointer transition-all focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 ${
                      errors.complaintType ? 'border-[var(--danger)]' : 'border-[var(--border)]'
                    }`}
                  >
                    <option value="">Select complaint category…</option>
                    {(selectedDept.complaintTypes || []).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.complaintType && (
                    <span className="text-xs text-[var(--danger)]">
                      {errors.complaintType.message}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Step 3: Description & Drag/Drop Upload */}
            <div>
              <div className="mb-4 flex items-center gap-2 border-b border-[var(--border)] pb-2">
                <FileText size={18} className="text-[var(--primary-blue)]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
                  3. Description &amp; Proof Attachment
                </h2>
              </div>

              {/* Description Textarea */}
              <div className="flex flex-col gap-1.5 mb-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="rt-description" className="text-xs font-bold text-[var(--ink)]">
                    Issue Description <span className="text-[var(--danger)]">*</span>
                  </label>
                  <span className="text-[11px] text-[var(--ink-muted)]">
                    {descriptionValue.length} characters
                  </span>
                </div>
                <textarea
                  {...register('description')}
                  id="rt-description"
                  rows={4}
                  className={`w-full rounded-xl border bg-[var(--white)] p-3.5 text-sm text-[var(--ink)] outline-none transition-all focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 ${
                    errors.description ? 'border-[var(--danger)]' : 'border-[var(--border)]'
                  }`}
                  placeholder="Describe what needs attention, location, room number, or floor details…"
                />
                {errors.description && (
                  <span className="text-xs text-[var(--danger)]">{errors.description.message}</span>
                )}
              </div>

              {/* Media Attachment Component with Camera, Mic & Preview */}
              <MediaAttachmentInput
                file={attachment}
                onChange={setAttachment}
                label="Photo / Audio Attachment"
                hint="Take live camera photo, record mic voice note, or drop file"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                id="rt-submit"
                type="submit"
                variant="secondary"
                size="lg"
                className="w-full text-base font-bold shadow-md hover:scale-[1.01]"
                loading={submitting}
              >
                Submit Issue Ticket
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
