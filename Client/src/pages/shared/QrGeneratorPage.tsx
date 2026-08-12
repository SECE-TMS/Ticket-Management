import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import QRCode from 'qrcode'
import {
  ArrowLeft,
  Building2,
  Copy,
  Download,
  MapPin,
  Printer,
  QrCode as QrIcon,
  Sparkles,
  Zap,
} from 'lucide-react'
import { departmentService } from '../../services/departmentService'
import { Button } from '../../components/common/Button'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type { Department } from '../../types'
import { getId } from '../../types'

export function QrGeneratorPage() {
  const toast = useToast()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [selectedDeptId, setSelectedDeptId] = useState('')
  const [locationName, setLocationName] = useState('Water Tank')
  const [complaintType, setComplaintType] = useState('')
  const [customNote, setCustomNote] = useState('')

  // QR Code Image State
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null)

  const selectedDept = departments.find((d) => getId(d) === selectedDeptId)

  // Fetch departments
  useEffect(() => {
    void (async () => {
      try {
        const data = await departmentService.listActive()
        setDepartments(data)
        if (data.length > 0) {
          // Preselect Plumbing or first department
          const plumbing = data.find((d) => d.name.toLowerCase().includes('plumb'))
          setSelectedDeptId(getId(plumbing || data[0]))
        }
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to load departments'))
      } finally {
        setLoading(false)
      }
    })()
  }, [toast])

  // Generate QR code whenever form parameters change
  useEffect(() => {
    void (async () => {
      const baseUrl = window.location.origin
      const params = new URLSearchParams()

      if (selectedDept) {
        params.set('department', selectedDept.name)
      }
      if (locationName.trim()) {
        params.set('location', locationName.trim())
      }
      if (complaintType.trim()) {
        params.set('complaintType', complaintType.trim())
      }

      const generatedUrl = `${baseUrl}/raise-ticket?${params.toString()}`
      setTargetUrl(generatedUrl)

      try {
        const url = await QRCode.toDataURL(generatedUrl, {
          width: 500,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        })
        setQrDataUrl(url)
      } catch (err) {
        console.error('Error generating QR code:', err)
      }
    })()
  }, [selectedDept, locationName, complaintType])

  // Presets
  const applyPreset = (preset: { deptName: string; location: string; complaint: string }) => {
    setLocationName(preset.location)
    setComplaintType(preset.complaint)
    const found = departments.find((d) => d.name.toLowerCase().includes(preset.deptName.toLowerCase()))
    if (found) {
      setSelectedDeptId(getId(found))
    }
  }

  // Copy Link Handler
  const handleCopyLink = () => {
    void navigator.clipboard.writeText(targetUrl)
    setCopied(true)
    toast.success('QR Code URL copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  // Download QR Badge Handler
  const handleDownload = () => {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.href = qrDataUrl
    const filename = `QR_${locationName.replace(/\s+/g, '_') || 'Campus'}.png`
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Downloaded ${filename}`)
  }

  // Print Poster Handler
  const handlePrint = () => {
    window.print()
  }

  if (loading) return <PageLoader />

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Print Stylesheet overlay for direct poster printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-qr-poster, #printable-qr-poster * {
            visibility: visible;
          }
          #printable-qr-poster {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            box-shadow: none !important;
            border: 2px solid #000 !important;
          }
        }
      `}</style>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/admin/dashboard"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary-blue)] hover:underline"
          >
            <ArrowLeft size={14} />
            Back to Admin Dashboard
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--ink)] flex items-center gap-2.5">
            <QrIcon className="text-[var(--primary-blue)]" size={28} />
            QR Code Generator for Campus Areas
          </h1>
          <p className="mt-1 text-xs text-[var(--ink-muted)] sm:text-sm">
            Generate printable QR code stickers for pasting on water tanks, hostels, labs, or campus facilities.
          </p>
        </div>
      </div>

      {/* Quick Location Presets */}
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--white)] p-4 shadow-xs">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-1.5">
          <Sparkles size={14} className="text-[var(--gold)]" /> Quick Location Presets
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: '💧 Water Tank', deptName: 'Plumbing', location: 'Water Tank Area', complaint: 'Water Leakage' },
            { label: '⚡ Substation', deptName: 'Electrical', location: 'Electrical Substation', complaint: 'Power Failure' },
            { label: '🏢 Hostel Block A', deptName: 'Maintenance', location: 'Hostel Block A', complaint: 'Door/Window Repair' },
            { label: '💻 Computer Lab 1', deptName: 'IT', location: 'Computer Lab 1', complaint: 'Network / Wi-Fi Issue' },
          ].map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(preset)}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left transition-all hover:border-[var(--primary-blue)] hover:bg-[var(--primary-blue-light)] hover:text-[var(--primary-blue)] cursor-pointer"
            >
              <span className="text-xs font-bold">{preset.label}</span>
              <Zap size={13} className="text-[var(--primary-blue)]" />
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Form Settings */}
        <div className="col-span-12 rounded-2xl border border-[var(--border)] bg-[var(--white)] p-6 shadow-sm lg:col-span-6 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)] border-b border-[var(--border)] pb-2 flex items-center gap-2">
            <Building2 size={16} className="text-[var(--primary-blue)]" />
            Configure QR Code Data
          </h2>

          {/* Location Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--ink)]">
              Location / Facility Name <span className="text-[var(--danger)]">*</span>
            </label>
            <div className="relative">
              <MapPin
                size={16}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--ink-muted)]"
              />
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Water Tank Area, Block B Washroom..."
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--white)] pl-10 pr-3.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
              />
            </div>
            <p className="text-[11px] text-[var(--ink-muted)]">
              Where this QR code sticker will be physically pasted.
            </p>
          </div>

          {/* Department Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--ink)]">Target Department</label>
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value)
                setComplaintType('')
              }}
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--white)] px-3.5 text-sm text-[var(--ink)] outline-none cursor-pointer focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
            >
              <option value="">Select target department...</option>
              {departments.map((d) => (
                <option key={getId(d)} value={getId(d)}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Complaint Type */}
          {selectedDept && (
            <div className="flex flex-col gap-1.5 animate-fade-in">
              <label className="text-xs font-bold text-[var(--ink)]">Default Complaint Category</label>
              <select
                value={complaintType}
                onChange={(e) => setComplaintType(e.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--white)] px-3.5 text-sm text-[var(--ink)] outline-none cursor-pointer focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
              >
                <option value="">Select default category (optional)...</option>
                {(selectedDept.complaintTypes || []).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--ink)]">Poster Banner Subtext (Optional)</label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Scan to report leaks, overflows, or pipe damage"
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--white)] px-3.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20"
            />
          </div>

          {/* Target URL Preview */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              Encoded URL Target
            </p>
            <p className="font-mono text-xs text-[var(--primary-blue)] break-all">{targetUrl}</p>
          </div>
        </div>

        {/* Right Column: Printable Poster Card Preview */}
        <div className="col-span-12 lg:col-span-6 flex flex-col items-center">
          {/* Printable Card Poster */}
          <div
            ref={cardRef}
            id="printable-qr-poster"
            className="w-full max-w-md rounded-2xl border-2 border-[var(--primary-blue)] bg-[var(--white)] p-6 text-center shadow-lg transition-all"
          >
            {/* Poster Header */}
            <div className="mb-4 border-b border-[var(--border)] pb-3">
              <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-blue)] text-white shadow-xs">
                <QrIcon size={24} />
              </div>
              <h3 className="font-display text-lg font-bold text-[var(--ink)] uppercase tracking-tight">
                Campus Maintenance Desk
              </h3>
              <p className="text-xs text-[var(--ink-muted)]">Instant Issue Reporting QR</p>
            </div>

            {/* Location Banner Badge */}
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--primary-blue)]/30 bg-[var(--primary-blue-light)] px-4 py-1.5 text-xs font-bold text-[var(--primary-blue-deeper)] shadow-xs">
              <MapPin size={14} className="text-[var(--primary-blue)]" />
              <span>{locationName || 'Campus Location'}</span>
            </div>

            {/* QR Code Image */}
            <div className="mx-auto my-3 flex justify-center p-3 rounded-2xl border border-[var(--border)] bg-white shadow-inner max-w-[240px]">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-full h-auto rounded-lg" />
              ) : (
                <div className="h-48 w-48 animate-pulse bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Subtext */}
            <p className="mt-2 text-xs font-bold text-[var(--ink)]">
              {customNote || 'Scan with your mobile camera to log issue & verify mobile via SMS OTP.'}
            </p>

            <div className="mt-4 pt-3 border-t border-dashed border-[var(--border)] text-[11px] text-[var(--ink-muted)] flex items-center justify-center gap-1.5">
              <Zap size={12} className="text-[var(--gold)]" />
              <span>Fast 24/7 Facility Response • Ticket Management System</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-wrap gap-3 justify-center w-full max-w-md">
            <Button type="button" variant="primary" size="md" onClick={handleDownload} className="flex-1">
              <Download size={16} />
              Download PNG
            </Button>
            <Button type="button" variant="outline" size="md" onClick={handlePrint} className="flex-1">
              <Printer size={16} />
              Print Poster
            </Button>
            <Button type="button" variant="secondary" size="md" onClick={handleCopyLink}>
              <Copy size={16} />
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
