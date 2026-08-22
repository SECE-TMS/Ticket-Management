import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Building2,
  // Check,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  GraduationCap,
  Headset,
  IdCard,
  Phone,
  Printer,
  QrCode,
  RefreshCw,
  Share2,
  ShieldCheck,
  User,
  UserCheck,
  Zap,
} from 'lucide-react'
import { departmentService } from '../../services/departmentService'
import { ticketService } from '../../services/ticketService'
import { otpService } from '../../services/otpService'
import { Button } from '../../components/common/Button'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { MediaAttachmentInput } from '../../components/common/MediaAttachmentInput'
import { ShareTicketModal } from '../../components/tickets/ShareTicketModal'
import { TicketReceiptModal } from '../../components/tickets/TicketReceiptModal'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type { Department, Ticket } from '../../types'
import { getId } from '../../types'

import { settingService } from '../../services/settingService'

const schema = z
  .object({
    userType: z.enum(['student', 'staff', 'guest']),
    rollNumber: z.string().optional(),
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Enter a valid email address').or(z.literal('')).optional(),
    department: z.string().min(1, 'Select a department'),
    mobile: z.string().optional(),
    complaintType: z.string().min(1, 'Select a complaint type'),
    description: z.string().min(5, 'Describe the issue (min 5 characters)'),
  })
  .refine(
    (data) => {
      if (data.userType === 'student' || data.userType === 'staff') {
        return !!data.rollNumber && data.rollNumber.trim().length >= 2
      }
      return true
    },
    {
      message: 'Roll Number / Staff ID is required',
      path: ['rollNumber'],
    }
  )

type FormValues = z.infer<typeof schema>

export function RaiseTicket() {
  const toast = useToast()
  const [searchParams] = useSearchParams()

  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepts, setLoadingDepts] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [ticketCode, setTicketCode] = useState<string | null>(null)
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null)
  const [attachments, setAttachments] = useState<File[]>([])
  const [copied, setCopied] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  // QR prefill banner state
  const [qrPrefillInfo, setQrPrefillInfo] = useState<{ location?: string; department?: string } | null>(null)

  // Mobile OTP Verification state
  const [otpSent, setOtpSent] = useState(false)
  const [otpSending, setOtpSending] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [otpValue, setOtpValue] = useState('')
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Email OTP Verification state
  const [emailOtpSent, setEmailOtpSent] = useState(false)
  const [emailOtpSending, setEmailOtpSending] = useState(false)
  const [emailSessionId, setEmailSessionId] = useState<string | null>(null)
  const [emailOtpValue, setEmailOtpValue] = useState('')
  const [emailOtpVerifying, setEmailOtpVerifying] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [emailCountdown, setEmailCountdown] = useState(0)

  // Settings state
  const [mobileMode, setMobileMode] = useState<'hidden' | 'optional' | 'required' | 'otp_required'>('otp_required')
  const [emailMode, setEmailMode] = useState<'hidden' | 'optional' | 'required' | 'otp_required'>('optional')

  useEffect(() => {
    settingService.getPublic().then((s) => {
      if (s) {
        const mMode = s.mobileMode || (s.smsOtpEnabled ? 'otp_required' : 'required')
        const eMode = s.emailMode || (s.requireRequesterEmail ? 'required' : 'optional')
        setMobileMode(mMode)
        setEmailMode(eMode)
        if (mMode !== 'otp_required') {
          setIsVerified(true)
        }
        if (eMode !== 'otp_required') {
          setIsEmailVerified(true)
        }
      }
    }).catch(() => { })
  }, [])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      userType: 'student',
      rollNumber: '',
      name: '',
      email: '',
      department: '',
      mobile: '',
      complaintType: '',
      description: '',
    },
  })

  const selectedUserType = watch('userType')
  const selectedDeptId = watch('department')
  const mobileValue = watch('mobile')
  const emailValue = watch('email')
  const descriptionValue = watch('description') || ''

  const selectedDept = useMemo(
    () => departments.find((d) => getId(d) === selectedDeptId),
    [departments, selectedDeptId]
  )

  // Countdown timer for Mobile OTP resend
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // Countdown timer for Email OTP resend
  useEffect(() => {
    if (emailCountdown <= 0) return
    const timer = setInterval(() => {
      setEmailCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [emailCountdown])

  // Reset mobile verification if mobile number changes
  useEffect(() => {
    if (isVerified || otpSent) {
      setIsVerified(false)
      setOtpSent(false)
      setSessionId(null)
      setOtpValue('')
    }
  }, [mobileValue])

  // Reset email verification if email address changes
  useEffect(() => {
    if (emailMode === 'otp_required') {
      if (isEmailVerified || emailOtpSent) {
        setIsEmailVerified(false)
        setEmailOtpSent(false)
        setEmailSessionId(null)
        setEmailOtpValue('')
      }
    }
  }, [emailValue])

  // Fetch departments & handle QR code query prefilling
  useEffect(() => {
    void (async () => {
      try {
        const data = await departmentService.listActive()
        setDepartments(data)

        // Parse query params for QR code prefill
        const deptParam =
          searchParams.get('department') || searchParams.get('dept') || searchParams.get('departmentId')
        const locationParam = searchParams.get('location') || searchParams.get('area')
        const complaintTypeParam = searchParams.get('complaintType') || searchParams.get('type')
        const descParam = searchParams.get('description') || searchParams.get('desc')

        let matchedDeptId = ''

        if (deptParam) {
          const lowerParam = deptParam.toLowerCase()
          const matched = data.find(
            (d) =>
              getId(d) === deptParam ||
              d.name.toLowerCase() === lowerParam ||
              d.name.toLowerCase().includes(lowerParam) ||
              lowerParam.includes(d.name.toLowerCase())
          )
          if (matched) {
            matchedDeptId = getId(matched)
            setValue('department', matchedDeptId, { shouldValidate: true })
          }
        }

        if (locationParam || deptParam) {
          setQrPrefillInfo({
            location: locationParam || undefined,
            department: deptParam || undefined,
          })
        }

        // Prefill description with location if present
        if (locationParam) {
          const locationPrefix = `[Location: ${locationParam}]`
          if (!descParam) {
            setValue('description', `${locationPrefix} Issue reported via location QR code. `)
          } else {
            setValue('description', `${locationPrefix} ${descParam}`)
          }
        } else if (descParam) {
          setValue('description', descParam)
        }

        // Auto-select complaint type if matched
        if (complaintTypeParam && matchedDeptId) {
          const targetDept = data.find((d) => getId(d) === matchedDeptId)
          if (targetDept?.complaintTypes) {
            const matchedType = targetDept.complaintTypes.find(
              (ct) => ct.toLowerCase() === complaintTypeParam.toLowerCase()
            )
            if (matchedType) {
              setValue('complaintType', matchedType, { shouldValidate: true })
            }
          }
        }
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to load departments'))
      } finally {
        setLoadingDepts(false)
      }
    })()
  }, [searchParams, setValue, toast])

  useEffect(() => {
    // Reset complaint type when user manually switches department
    // only if department doesn't match current complaintType
    if (selectedDept && !selectedDept.complaintTypes?.includes(watch('complaintType'))) {
      setValue('complaintType', '')
    }
  }, [selectedDeptId, selectedDept, setValue, watch])

  // OTP Send Handler
  const handleSendOtp = async () => {
    if (!mobileValue || !/^\d{10}$/.test(mobileValue)) {
      toast.error('Please enter a valid 10-digit mobile number first')
      return
    }

    setOtpSending(true)
    try {
      const res = await otpService.sendOtp(mobileValue)
      setSessionId(res.sessionId)
      setOtpSent(true)
      setCountdown(60)
      toast.success('OTP sent successfully to your mobile number!')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to send OTP via 2Factor'))
    } finally {
      setOtpSending(false)
    }
  }

  // OTP Verify Handler
  const handleVerifyOtp = async () => {
    if (!sessionId) {
      toast.error('Please request OTP first')
      return
    }
    if (!otpValue || otpValue.trim().length < 4) {
      toast.error('Please enter the OTP sent to your phone')
      return
    }

    setOtpVerifying(true)
    try {
      const res = await otpService.verifyOtp(sessionId, otpValue)
      if (res.verified) {
        setIsVerified(true)
        toast.success('Mobile number verified successfully!')
      } else {
        toast.error('Invalid OTP. Please try again.')
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'OTP verification failed'))
    } finally {
      setOtpVerifying(false)
    }
  }

  // Email OTP Send Handler
  const handleSendEmailOtp = async () => {
    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue.trim())) {
      toast.error('Please enter a valid email address first')
      return
    }

    setEmailOtpSending(true)
    try {
      const res = await otpService.sendEmailOtp(emailValue.trim())
      setEmailSessionId(res.sessionId)
      setEmailOtpSent(true)
      setEmailCountdown(60)
      toast.success('6-digit numeric OTP sent to your email address!')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to send Email OTP'))
    } finally {
      setEmailOtpSending(false)
    }
  }

  // Email OTP Verify Handler
  const handleVerifyEmailOtp = async () => {
    if (!emailSessionId) {
      toast.error('Please request Email OTP first')
      return
    }
    if (!emailOtpValue || emailOtpValue.trim().length !== 6) {
      toast.error('Please enter the 6-digit numeric OTP sent to your email')
      return
    }

    setEmailOtpVerifying(true)
    try {
      const res = await otpService.verifyEmailOtp(emailSessionId, emailOtpValue.trim())
      if (res.verified) {
        setIsEmailVerified(true)
        toast.success('Email address verified successfully!')
      } else {
        toast.error('Invalid Email OTP. Please try again.')
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Email OTP verification failed'))
    } finally {
      setEmailOtpVerifying(false)
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    if ((emailMode === 'required' || emailMode === 'otp_required') && (!values.email || !values.email.trim())) {
      toast.error('Email address is required')
      return
    }

    if (emailMode === 'otp_required' && !isEmailVerified) {
      toast.error('Please verify your email address with the 6-digit OTP before submitting')
      return
    }

    if (
      (mobileMode === 'required' || mobileMode === 'otp_required') &&
      (!values.mobile || !/^\d{10}$/.test(values.mobile))
    ) {
      toast.error('Valid 10-digit mobile number is required')
      return
    }

    if (mobileMode === 'otp_required' && !isVerified) {
      toast.error('Please verify your mobile number with OTP before submitting')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('userType', values.userType)
      if ((values.userType === 'student' || values.userType === 'staff') && values.rollNumber) {
        formData.append('rollNumber', values.rollNumber.trim())
      }
      formData.append('name', values.name)
      if (values.email) {
        formData.append('email', values.email.trim())
      }
      formData.append('department', values.department)
      if (values.mobile) {
        formData.append('mobile', values.mobile.trim())
      }
      formData.append('complaintType', values.complaintType)
      formData.append('description', values.description)
      if (attachments.length > 0) {
        attachments.forEach((file) => {
          formData.append('attachment', file)
        })
      }

      const ticket = await ticketService.create(formData)
      setCreatedTicket(ticket)
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
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-8 text-center shadow-lg animate-fade-in space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--success-light)] text-[var(--success)] shadow-inner">
            <CheckCircle2 size={48} />
          </div>

          <div>
            <h1 className="font-display text-3xl font-bold text-[var(--ink)]">
              Ticket Submitted!
            </h1>
            <p className="mt-1.5 text-sm text-[var(--ink-muted)]">
              Your maintenance request has been logged and queued for assignment. An email confirmation has been sent to your registered email address.
            </p>
          </div>

          {/* Reference Card */}
          <div className="rounded-2xl border border-[var(--primary-blue-muted)] bg-gradient-to-br from-[var(--primary-blue-light)] to-[var(--surface-2)] p-6 shadow-xs space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary-blue)]">
              Your Unique Ticket Reference
            </p>
            <p className="font-mono text-3xl font-bold tracking-widest text-[var(--primary-blue-deeper)]">
              {ticketCode}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopy}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs ${copied
                  ? 'border-[var(--success)] bg-[var(--success-light)] text-[var(--success)]'
                  : 'border-[var(--primary-blue)] bg-white text-[var(--primary-blue)] hover:bg-[var(--primary-blue-light)]'
                  }`}
              >
                <Copy size={14} />
                {copied ? 'Copied!' : 'Copy Code'}
              </button>

              {/* Share Action Button */}
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 cursor-pointer shadow-xs transition-colors"
              >
                <Share2 size={14} />
                Share Ticket
              </button>

              {/* Download / Print Receipt Button */}
              <button
                type="button"
                onClick={() => setShowReceiptModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer shadow-xs transition-colors"
              >
                <Printer size={14} />
                Download Receipt
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => {
                setTicketCode(null)
                setCreatedTicket(null)
                setAttachments([])
                setIsVerified(false)
                setOtpSent(false)
                setSessionId(null)
                setOtpValue('')
              }}
            >
              Raise Another Ticket
            </Button>
            <Link to={`/track-ticket?ticketCode=${encodeURIComponent(ticketCode)}&mobile=${encodeURIComponent(mobileValue || '')}`}>
              <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto">
                Track Status Now
              </Button>
            </Link>
          </div>
        </div>

        {/* Modals */}
        <ShareTicketModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          ticketCode={ticketCode}
          mobile={mobileValue || createdTicket?.requester?.mobile}
          departmentName={selectedDept?.name}
          complaintType={watch('complaintType')}
        />

        <TicketReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          ticket={createdTicket}
          ticketCode={ticketCode}
          mobile={mobileValue || createdTicket?.requester?.mobile}
          requesterName={watch('name') || createdTicket?.requester?.name}
          departmentName={selectedDept?.name}
          complaintType={watch('complaintType')}
          description={descriptionValue}
        />
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
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-[var(--gold)]/15 px-3.5 py-1 text-xs font-bold text-[var(--gold)]">
              <Headset size={13} />
              24/7 Campus Helpdesk
            </div>

            <h1 className="mt-4 font-display text-2xl font-bold text-[var(--white)] sm:text-3xl">
              Report an Issue
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-white/75 sm:text-sm">
              Fast, verified facility support for students, staff, and campus guests.
            </p>

            {/* Visual Step Guide */}
            <div className="mt-8 space-y-5">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-bold text-[var(--primary-blue-deeper)]">
                  1
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--white)]">Identify Yourself</p>
                  <p className="text-[11px] text-white/60">Role (Student/Staff/Guest) &amp; Name</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-bold text-[var(--primary-blue-deeper)]">
                  2
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--white)]">2Factor OTP Verification</p>
                  <p className="text-[11px] text-white/60">Verify 10-digit mobile via SMS OTP</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-bold text-[var(--primary-blue-deeper)]">
                  3
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--white)]">Department &amp; Issue</p>
                  <p className="text-[11px] text-white/60">Select target department &amp; category</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-bold text-[var(--primary-blue-deeper)]">
                  4
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--white)]">Details &amp; Proof</p>
                  <p className="text-[11px] text-white/60">Describe issue &amp; add photo/voice</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 space-y-3">
            <div className="flex items-center gap-2 text-xs text-white/80">
              <Zap size={14} className="text-[var(--gold)]" />
              <span>Instant routing to department staff</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/80">
              <ShieldCheck size={14} className="text-[var(--gold)]" />
              <span>2Factor SMS OTP verification protected</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/80">
              <Clock size={14} className="text-[var(--gold)]" />
              <span>Track resolution status in real-time</span>
            </div>
          </div>
        </div>

        {/* Right Column: High-End Form */}
        <div className="col-span-12 rounded-2xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-sm sm:p-8 lg:col-span-8">
          {/* QR Code Banner Notification */}
          {qrPrefillInfo && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--primary-blue)]/30 bg-[var(--primary-blue-light)] p-3.5 text-xs text-[var(--primary-blue-deeper)] animate-fade-in">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-blue)] text-white">
                <QrCode size={18} />
              </div>
              <div>
                <p className="font-bold">QR Location Detected</p>
                <p className="text-[11px] text-[var(--ink-muted)]">
                  {qrPrefillInfo.location ? `Scanned Location: "${qrPrefillInfo.location}". ` : ''}
                  Department and location details have been automatically prefilled for you.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6" id="raise-ticket-form">
            {/* Step 1: Role & Identity */}
            <div>
              <div className="mb-4 flex items-center gap-2 border-b border-[var(--border)] pb-2">
                <User size={18} className="text-[var(--primary-blue)]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
                  1. Your Identity &amp; Role
                </h2>
              </div>

              {/* Role Selection Radio Cards */}
              <div className="mb-4 flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--ink)]">
                  I am a <span className="text-[var(--danger)]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'student', label: 'Student', icon: GraduationCap },
                    { id: 'staff', label: 'Staff', icon: UserCheck },
                    { id: 'guest', label: 'Guest', icon: User },
                  ].map((role) => {
                    const IconComp = role.icon
                    const isSelected = selectedUserType === role.id
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          setValue('userType', role.id as 'student' | 'staff' | 'guest')
                          if (role.id === 'guest') {
                            clearErrors('rollNumber')
                          }
                        }}
                        className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3.5 text-center transition-all cursor-pointer ${isSelected
                          ? 'border-[var(--primary-blue)] bg-[var(--primary-blue-light)] text-[var(--primary-blue)] font-bold shadow-xs ring-2 ring-[var(--primary-blue)]/20'
                          : 'border-[var(--border)] bg-[var(--white)] text-[var(--ink-muted)] hover:border-[var(--primary-blue-muted)] hover:bg-[var(--surface)]'
                          }`}
                      >
                        <IconComp size={20} className={isSelected ? 'text-[var(--primary-blue)]' : 'text-[var(--ink-muted)]'} />
                        <span className="text-xs font-bold">{role.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="rt-name" className="text-xs font-bold text-[var(--ink)]">
                    Full Name <span className="text-[var(--danger)]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register('name')}
                      id="rt-name"
                      className={`h-11 w-full rounded-xl border bg-[var(--white)] px-3.5 text-sm text-[var(--ink)] outline-none transition-all focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 ${errors.name ? 'border-[var(--danger)]' : 'border-[var(--border)]'
                        }`}
                      placeholder="  Rahul "
                      autoComplete="name"
                    />
                  </div>
                  {errors.name && (
                    <span className="text-xs text-[var(--danger)]">{errors.name.message}</span>
                  )}
                </div>

                {/* Roll Number / Staff ID (Conditional for Student & Staff) */}
                {(selectedUserType === 'student' || selectedUserType === 'staff') && (
                  <div className="flex flex-col gap-1.5 animate-fade-in">
                    <label htmlFor="rt-roll" className="text-xs font-bold text-[var(--ink)]">
                      {selectedUserType === 'student' ? 'Student Roll Number' : 'Staff ID / Employee Code'}{' '}
                      <span className="text-[var(--danger)]">*</span>
                    </label>
                    <div className="relative">
                      <IdCard
                        size={15}
                        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--ink-muted)]"
                      />
                      <input
                        {...register('rollNumber')}
                        id="rt-roll"
                        className={`h-11 w-full rounded-xl border bg-[var(--white)] pl-10 pr-3.5 text-sm text-[var(--ink)] uppercase outline-none transition-all focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 ${errors.rollNumber ? 'border-[var(--danger)]' : 'border-[var(--border)]'
                          }`}
                        placeholder={selectedUserType === 'student' ? '  21CS045' : '  EMP-1042'}
                      />
                    </div>
                    {errors.rollNumber && (
                      <span className="text-xs text-[var(--danger)]">{errors.rollNumber.message}</span>
                    )}
                  </div>
                )}

                {/* Email Address (Conditional based on emailMode) */}
                {emailMode !== 'hidden' && (
                  <div className="flex flex-col gap-1.5 sm:col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="rt-email" className="text-xs font-bold text-[var(--ink)]">
                        Email Address{' '}
                        {emailMode === 'required' || emailMode === 'otp_required' ? (
                          <span className="text-[var(--danger)]">*</span>
                        ) : (
                          <span className="text-[var(--ink-muted)] font-normal">(Optional — to receive ticket status updates)</span>
                        )}
                      </label>
                      {emailMode === 'otp_required' && isEmailVerified && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--success-light)] px-3 py-0.5 text-xs font-bold text-[var(--success)] shadow-xs">
                          <CheckCircle2 size={13} />
                          Email Verified ✓
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="relative flex-1">
                        <input
                          {...register('email')}
                          id="rt-email"
                          type="email"
                          disabled={emailMode === 'otp_required' && isEmailVerified}
                          className={`h-11 w-full rounded-xl border bg-[var(--white)] px-3.5 text-sm text-[var(--ink)] outline-none transition-all focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 ${emailMode === 'otp_required' && isEmailVerified
                            ? 'border-[var(--success)] bg-[var(--success-light)]/40 font-semibold'
                            : errors.email
                              ? 'border-[var(--danger)]'
                              : 'border-[var(--border)]'
                            }`}
                          placeholder="your mail@sece.ac.in"
                          autoComplete="email"
                        />
                      </div>

                      {emailMode === 'otp_required' && !isEmailVerified && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          onClick={handleSendEmailOtp}
                          loading={emailOtpSending}
                          disabled={emailCountdown > 0 || !emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue.trim())}
                          className="w-full sm:w-auto font-bold h-11 shrink-0"
                        >
                          {emailOtpSent
                            ? emailCountdown > 0
                              ? `Resend in ${emailCountdown}s`
                              : 'Resend Email OTP'
                            : 'Send OTP to Email'}
                        </Button>
                      )}
                    </div>

                    {errors.email && (
                      <span className="text-xs text-[var(--danger)]">{errors.email.message}</span>
                    )}

                    {/* Email OTP 6-Digit Code Verification Input Box */}
                    {emailMode === 'otp_required' && emailOtpSent && !isEmailVerified && (
                      <div className="mt-3 rounded-2xl border border-[var(--primary-blue-muted)] bg-gradient-to-br from-[var(--primary-blue-light)] to-[var(--surface-2)] p-4 shadow-xs space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-wider text-[var(--primary-blue-deeper)]">
                            Enter 6-Digit Numeric Email OTP
                          </p>
                          <span className="text-[11px] text-[var(--ink-muted)] font-medium">
                            Sent to <strong>{emailValue}</strong>
                          </span>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={emailOtpValue}
                            onChange={(e) => setEmailOtpValue(e.target.value.replace(/\D/g, ''))}
                            placeholder="  583920"
                            className="h-11 flex-1 rounded-xl border border-[var(--border)] bg-white px-3.5 font-mono text-base font-bold text-[var(--ink)] tracking-widest outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 text-center sm:text-left"
                          />
                          <Button
                            type="button"
                            variant="primary"
                            size="md"
                            onClick={handleVerifyEmailOtp}
                            loading={emailOtpVerifying}
                            disabled={!emailOtpValue || emailOtpValue.trim().length !== 6}
                            className="w-full sm:w-auto font-bold h-11"
                          >
                            Verify Email OTP
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Mobile Number & OTP Verification (Conditional based on mobileMode) */}
            {mobileMode !== 'hidden' && (
              <div>
                <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <div className="flex items-center gap-2">
                    <Phone size={18} className="text-[var(--primary-blue)]" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
                      2. Mobile Contact {mobileMode === 'otp_required' ? '& OTP Verification' : ''}
                    </h2>
                  </div>
                  {mobileMode === 'otp_required' && isVerified && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--success-light)] px-3 py-1 text-xs font-bold text-[var(--success)] shadow-xs">
                      <CheckCircle2 size={13} />
                      Verified
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label htmlFor="rt-mobile" className="text-xs font-bold text-[var(--ink)]">
                        Mobile Number{' '}
                        {mobileMode === 'optional' ? (
                          <span className="text-[var(--ink-muted)] font-normal">(Optional)</span>
                        ) : (
                          <span className="text-[var(--danger)]">*</span>
                        )}
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
                          disabled={mobileMode === 'otp_required' && isVerified}
                          className={`h-11 w-full rounded-xl border bg-[var(--white)] pl-10 pr-3.5 text-sm text-[var(--ink)] outline-none transition-all focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 ${mobileMode === 'otp_required' && isVerified
                            ? 'border-[var(--success)] bg-[var(--success-light)]/40 font-semibold'
                            : errors.mobile
                              ? 'border-[var(--danger)]'
                              : 'border-[var(--border)]'
                            }`}
                          placeholder="10-digit mobile number"
                        />
                      </div>
                      {errors.mobile && (
                        <span className="text-xs text-[var(--danger)]">{errors.mobile.message}</span>
                      )}
                    </div>

                    {mobileMode === 'otp_required' && !isVerified && (
                      <div className="mt-1 sm:mt-6 sm:w-auto">
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          onClick={handleSendOtp}
                          loading={otpSending}
                          disabled={!mobileValue || mobileValue.length !== 10 || countdown > 0}
                          className="w-full sm:w-auto whitespace-nowrap h-11"
                        >
                          {countdown > 0 ? (
                            <span className="flex items-center gap-1.5">
                              <Clock size={14} /> Resend in {countdown}s
                            </span>
                          ) : otpSent ? (
                            <span className="flex items-center gap-1.5">
                              <RefreshCw size={14} /> Resend OTP
                            </span>
                          ) : (
                            'Send OTP via SMS'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* OTP Input Card (Shown after OTP is sent) */}
                  {otpSent && !isVerified && (
                    <div className="rounded-xl border border-[var(--primary-blue-muted)] bg-[var(--primary-blue-light)]/50 p-4 animate-fade-in space-y-3">
                      <div className="flex items-center justify-between">
                        <label htmlFor="rt-otp" className="text-xs font-bold text-[var(--primary-blue-deeper)]">
                          Enter 6-Digit SMS OTP sent to +91 {mobileValue}
                        </label>
                        <span className="text-[11px] text-[var(--ink-muted)]">2Factor Verification</span>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          id="rt-otp"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                          className="h-11 flex-1 rounded-xl border border-[var(--primary-blue)] bg-[var(--white)] px-4 font-mono text-lg font-bold tracking-widest text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--primary-blue)]/30"
                          placeholder="••••••"
                        />
                        <Button
                          type="button"
                          variant="primary"
                          size="md"
                          onClick={handleVerifyOtp}
                          loading={otpVerifying}
                          disabled={otpValue.length < 4}
                          className="h-11 shadow-sm"
                        >
                          Verify OTP
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Department & Category */}
            <div>
              <div className="mb-4 flex items-center gap-2 border-b border-[var(--border)] pb-2">
                <Building2 size={18} className="text-[var(--primary-blue)]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
                  3. Department &amp; Issue Category
                </h2>
              </div>

              {/* Department Dropdown Selector */}
              <div className="mb-4 flex flex-col gap-1.5">
                <label htmlFor="rt-department" className="text-xs font-bold text-[var(--ink)]">
                  Select Department <span className="text-[var(--danger)]">*</span>
                </label>
                <div className="relative">
                  <select
                    {...register('department')}
                    id="rt-department"
                    className={`h-11 w-full rounded-xl border bg-[var(--white)] px-3.5 text-sm text-[var(--ink)] outline-none cursor-pointer transition-all focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 ${errors.department ? 'border-[var(--danger)]' : 'border-[var(--border)]'
                      }`}
                  >
                    <option value="">Select target department…</option>
                    {departments.map((d) => (
                      <option key={getId(d)} value={getId(d)}>
                        {d.name}
                      </option>
                    ))}
                  </select>
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
                    className={`h-11 w-full rounded-xl border bg-[var(--white)] px-3.5 text-sm text-[var(--ink)] outline-none cursor-pointer transition-all focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 ${errors.complaintType ? 'border-[var(--danger)]' : 'border-[var(--border)]'
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

            {/* Step 4: Description & Proof Attachment */}
            <div>
              <div className="mb-4 flex items-center gap-2 border-b border-[var(--border)] pb-2">
                <FileText size={18} className="text-[var(--primary-blue)]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
                  4. Description &amp; Proof Attachment
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
                  className={`w-full rounded-xl border bg-[var(--white)] p-3.5 text-sm text-[var(--ink)] outline-none transition-all focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 ${errors.description ? 'border-[var(--danger)]' : 'border-[var(--border)]'
                    }`}
                  placeholder="Describe what needs attention, location, room number, or floor details…"
                />
                {errors.description && (
                  <span className="text-xs text-[var(--danger)]">{errors.description.message}</span>
                )}
              </div>

              {/* Media Attachment Component with Multi-file, Video, Camera & Mic Support */}
              <MediaAttachmentInput
                files={attachments}
                onChange={setAttachments}
                label="Media Attachments"
                hint="Upload photos, video clips, voice notes, or capture live camera/mic"
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
