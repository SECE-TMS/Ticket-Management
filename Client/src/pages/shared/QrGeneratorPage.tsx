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
  Palette,
  Check,
  Upload,
  Image as ImageIcon,
  Plus,
  Trash2,
} from 'lucide-react'
import { departmentService } from '../../services/departmentService'
import { Button } from '../../components/common/Button'
import { PageLoader } from '../../components/common/LoadingSpinner'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../lib/utils'
import type { Department } from '../../types'
import { getId } from '../../types'

import sriEshwarLogo from '../../assets/Sri Eshwar.png'
import isaiiLogo from '../../assets/isaii.jpg'
// import qrCenterLogo from '../../assets/logo_remove-removebg-preview.png'

/** Standard Card (4" x 6" 300DPI) dimensions */
const POSTCARD_W = 1200
const POSTCARD_H = 1800
const POSTCARD_PRINT_WIDTH_MM = 101.6
const POSTCARD_PRINT_HEIGHT_MM = 152.4

const DEFAULT_FOOTER = 'POWERED BY ISAII TECHNOLOGIES PRIVATE LIMITED'

export interface ThemePreset {
  id: string
  name: string
  colors: [string, string, ...string[]]
  cssGradient: string
  textColor: string
  accentColor: string
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'navy_gold',
    name: 'Institutional Navy & Gold',
    colors: ['#163A6B', '#235EAA', '#0F172A'],
    cssGradient: 'linear-gradient(170deg, #163A6B 0%, #235EAA 60%, #0F172A 100%)',
    textColor: '#FFFFFF',
    accentColor: '#F9C301',
  },
  {
    id: 'instagram',
    name: 'Instagram Sunset',
    colors: ['#FA7E1E', '#D62976', '#962FBF'],
    cssGradient: 'linear-gradient(170deg, #FA7E1E 0%, #D62976 50%, #962FBF 100%)',
    textColor: '#FFFFFF',
    accentColor: '#FFFFFF',
  },
  {
    id: 'magenta',
    name: 'Neon Magenta',
    colors: ['#FF007F', '#7B2FF7', '#380036'],
    cssGradient: 'linear-gradient(170deg, #FF007F 0%, #7B2FF7 60%, #380036 100%)',
    textColor: '#FFFFFF',
    accentColor: '#FFFFFF',
  },
  {
    id: 'sunset',
    name: 'Coral Warmth',
    colors: ['#FF512F', '#DD2476'],
    cssGradient: 'linear-gradient(170deg, #FF512F 0%, #DD2476 100%)',
    textColor: '#FFFFFF',
    accentColor: '#FFFFFF',
  },
  {
    id: 'ocean',
    name: 'Deep Ocean',
    colors: ['#0093E9', '#80D0C7'],
    cssGradient: 'linear-gradient(170deg, #0093E9 0%, #80D0C7 100%)',
    textColor: '#FFFFFF',
    accentColor: '#FFFFFF',
  },
  {
    id: 'emerald',
    name: 'Emerald Glow',
    colors: ['#059669', '#10B981', '#064E3B'],
    cssGradient: 'linear-gradient(170deg, #059669 0%, #10B981 50%, #064E3B 100%)',
    textColor: '#FFFFFF',
    accentColor: '#FEF08A',
  },
  {
    id: 'dark',
    name: 'Cyber Night',
    colors: ['#1E1B4B', '#312E81', '#0F172A'],
    cssGradient: 'linear-gradient(170deg, #1E1B4B 0%, #312E81 50%, #0F172A 100%)',
    textColor: '#FFFFFF',
    accentColor: '#38BDF8',
  },
]

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

function knockoutBlackBackground(img: HTMLImageElement): HTMLCanvasElement {
  const rawCanvas = document.createElement('canvas')
  const width = img.naturalWidth || img.width
  const height = img.naturalHeight || img.height
  rawCanvas.width = width
  rawCanvas.height = height
  const ctx = rawCanvas.getContext('2d')
  if (!ctx) return rawCanvas

  ctx.drawImage(img, 0, 0)
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  let minX = width
  let maxX = 0
  let minY = height
  let maxY = 0
  let hasPixels = false

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const isNearBlack = max < 28
      const isNeutralDark = max < 42 && max - min < 10

      if (isNearBlack || isNeutralDark) {
        data[idx + 3] = 0
      } else if (data[idx + 3] > 10) {
        hasPixels = true
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)

  if (!hasPixels || minX > maxX || minY > maxY) {
    return rawCanvas
  }

  const cropW = maxX - minX + 1
  const cropH = maxY - minY + 1
  const trimmedCanvas = document.createElement('canvas')
  trimmedCanvas.width = cropW
  trimmedCanvas.height = cropH
  const trimmedCtx = trimmedCanvas.getContext('2d')
  if (!trimmedCtx) return rawCanvas

  trimmedCtx.drawImage(rawCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH)
  return trimmedCanvas
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function drawContainedImage(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  x: number,
  y: number,
  boxW: number,
  boxH: number
) {
  const sw = 'width' in source ? Number(source.width) : 1
  const sh = 'height' in source ? Number(source.height) : 1
  const aspect = sw / Math.max(sh, 1)
  let drawW = boxW
  let drawH = boxW / aspect
  if (drawH > boxH) {
    drawH = boxH
    drawW = boxH * aspect
  }
  const dx = x + (boxW - drawW) / 2
  const dy = y + (boxH - drawH) / 2
  ctx.drawImage(source, dx, dy, drawW, drawH)
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number = 3
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, maxLines)
}

const generateCleanQrDataUrl = async (text: string, centerLogoSrc?: string): Promise<string> => {
  const canvasSize = 1200
  const canvas = document.createElement('canvas')
  canvas.width = canvasSize
  canvas.height = canvasSize
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  await QRCode.toCanvas(canvas, text, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: canvasSize,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  })

  if (centerLogoSrc) {
    try {
      const rawLogo = await loadImage(centerLogoSrc)
      const logoCanvas = knockoutBlackBackground(rawLogo)
      const padW = Math.round(canvasSize * 0.26)
      const padH = Math.round(canvasSize * 0.26)
      const padX = (canvasSize - padW) / 2
      const padY = (canvasSize - padH) / 2
      const radius = Math.round(padH * 0.3)

      roundRect(ctx, padX, padY, padW, padH, radius)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 4
      ctx.stroke()

      const innerW = padW * 0.82
      const innerH = padH * 0.82
      drawContainedImage(
        ctx,
        logoCanvas,
        (canvasSize - innerW) / 2,
        (canvasSize - innerH) / 2,
        innerW,
        innerH
      )
    } catch (err) {
      console.error('Error overlaying QR center logo:', err)
    }
  }

  return canvas.toDataURL('image/png')
}

async function composePosterPng(opts: {
  theme: ThemePreset
  qrSrc: string
  topText: string
  scriptText: string
  businessName: string
  locationName: string
  customNote: string
  footerText: string
  collegeSrc: string
  secondarySrc: string | null
}): Promise<string> {
  await document.fonts.ready.catch(() => { })

  const W = POSTCARD_W
  const H = POSTCARD_H

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return opts.qrSrc

  const collegeImg = await loadImage(opts.collegeSrc)
  const secondaryImg = opts.secondarySrc ? await loadImage(opts.secondarySrc) : null
  const qrImg = await loadImage(opts.qrSrc)

  // Gradient Background
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  const colors = opts.theme.colors
  if (colors.length === 2) {
    grad.addColorStop(0, colors[0])
    grad.addColorStop(1, colors[1])
  } else {
    grad.addColorStop(0, colors[0])
    grad.addColorStop(0.5, colors[1])
    grad.addColorStop(1, colors[2] || colors[1])
  }

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  let currentY = 115

  // Top Tracking Header Label (Larger & Bold)
  ctx.fillStyle = opts.theme.textColor
  ctx.font = '900 34px Inter, sans-serif'
  ctx.fillText((opts.topText || 'SCAN TO REPORT').toUpperCase(), W / 2, currentY)
  currentY += 75

  // Cursive Subheader Typography (Prominent & Elegant)
  ctx.font = '400 96px Satisfy, Pacifico, cursive'
  ctx.fillStyle = opts.theme.accentColor || '#FFFFFF'
  ctx.fillText(opts.scriptText || 'Campus Maintenance Desk', W / 2, currentY)
  currentY += 175

  // Broad & Beautiful Logo Container Box (Dashed Outer Outline)
  const boxW = 720
  const boxH = 260
  const boxX = (W - boxW) / 2
  const boxY = currentY - boxH / 2

  ctx.save()
  ctx.setLineDash([18, 14])
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)'
  ctx.lineWidth = 4
  roundRect(ctx, boxX, boxY, boxW, boxH, 48)
  ctx.stroke()
  ctx.restore()

  // Inner White Card filled nicely inside Dashed Box
  const innerPad = 16
  const innerX = boxX + innerPad
  const innerY = boxY + innerPad
  const innerW = boxW - innerPad * 2
  const innerH = boxH - innerPad * 2

  roundRect(ctx, innerX, innerY, innerW, innerH, 36)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()

  if (secondaryImg) {
    // Dual Logos side-by-side: College Main Logo (left) + Secondary Logo (right)
    const colW = (innerW - 40) / 2
    drawContainedImage(ctx, collegeImg, innerX + 16, innerY + 16, colW, innerH - 32)

    // Divider Line
    ctx.strokeStyle = '#E2E8F0'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(innerX + colW + 20, innerY + 24)
    ctx.lineTo(innerX + colW + 20, innerY + innerH - 24)
    ctx.stroke()

    drawContainedImage(ctx, secondaryImg, innerX + colW + 24, innerY + 16, colW, innerH - 32)
  } else {
    // Single Main College Logo (Fits container in both size & perfectly centered)
    drawContainedImage(ctx, collegeImg, innerX + 24, innerY + 12, innerW - 48, innerH - 24)
  }

  currentY += boxH / 2 + 65

  // Campus / Organization Title Name (Bold & Large)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '900 46px Inter, sans-serif'
  ctx.fillText(opts.businessName || 'Sri Eshwar College of Engineering', W / 2, currentY)
  currentY += 70

  // Location Pill Badge
  const locText = (opts.locationName || 'CAMPUS AREA').toUpperCase()
  ctx.font = '900 26px Inter, sans-serif'
  const locW = Math.min(W - 100, Math.max(ctx.measureText(locText).width + 90, 320))
  const locH = 60
  const locX = (W - locW) / 2
  const locY = currentY - locH / 2

  ctx.fillStyle = opts.theme.accentColor || '#F9C301'
  roundRect(ctx, locX, locY, locW, locH, 30)
  ctx.fill()

  ctx.fillStyle = '#0F172A'
  ctx.fillText(`📍 ${locText}`, W / 2, currentY)
  currentY += locH / 2 + 55

  // Central Pure White QR Box Container
  const qrBoxW = 730
  const qrBoxH = 730
  const qrBoxX = (W - qrBoxW) / 2
  const qrBoxY = currentY

  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.32)'
  ctx.shadowBlur = 36
  ctx.shadowOffsetY = 16
  ctx.fillStyle = '#FFFFFF'
  roundRect(ctx, qrBoxX, qrBoxY, qrBoxW, qrBoxH, 44)
  ctx.fill()
  ctx.restore()

  const qrInnerSize = 650
  const qrInnerX = (W - qrInnerSize) / 2
  const qrInnerY = qrBoxY + (qrBoxH - qrInnerSize) / 2
  ctx.drawImage(qrImg, qrInnerX, qrInnerY, qrInnerSize, qrInnerSize)
  currentY += qrBoxH + 60

  // Scan Subtext Note (Readable & Balanced)
  const note = opts.customNote || 'Scan with your mobile camera to report issue & verify via OTP.'
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '700 26px Inter, sans-serif'
  const lines = wrapText(ctx, note, W - 140, 2)
  lines.forEach((line) => {
    ctx.fillText(line, W / 2, currentY)
    currentY += 34
  })

  // Footer Line
  ctx.font = '900 22px Inter, sans-serif'
  ctx.fillStyle = opts.theme.accentColor || '#FFFFFF'
  const footerStr = (opts.footerText || DEFAULT_FOOTER).toUpperCase()
  ctx.fillText(footerStr, W / 2, H - 70)

  return canvas.toDataURL('image/png')
}

function printPng(dataUrl: string) {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument
  if (!doc) return

  doc.open()
  doc.write(`<!DOCTYPE html>
<html>
  <head>
    <style>
      @page { size: A4 portrait; margin: 0; }
      html, body {
        margin: 0;
        padding: 0;
        width: 210mm;
        height: 297mm;
        background: #fff;
      }
      body {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .sheet {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4mm;
      }
      .hint {
        font: 11px Arial, sans-serif;
        font-weight: bold;
        color: #64748b;
        letter-spacing: 0.05em;
      }
      .postcard {
        width: ${POSTCARD_PRINT_WIDTH_MM}mm;
        height: ${POSTCARD_PRINT_HEIGHT_MM}mm;
        display: block;
        page-break-inside: avoid;
        break-inside: avoid;
        outline: 0.5mm dashed #94a3b8;
        outline-offset: 3mm;
        object-fit: contain;
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="hint">CUT ALONG DASHED BORDER &nbsp;·&nbsp; STANDARD POSTCARD SIZE 4" × 6" (${POSTCARD_PRINT_WIDTH_MM} × ${POSTCARD_PRINT_HEIGHT_MM} mm)</div>
      <img id="poster" class="postcard" src="${dataUrl}" alt="Campus QR Code Poster" />
    </div>
  </body>
</html>`)
  doc.close()

  const img = doc.getElementById('poster') as HTMLImageElement | null
  const runPrint = () => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => {
      iframe.remove()
    }, 1000)
  }

  if (img?.complete) {
    runPrint()
  } else if (img) {
    img.onload = runPrint
  } else {
    runPrint()
  }
}

export function QrGeneratorPage() {
  const toast = useToast()
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<'download' | 'print' | null>(null)
  const [sriEshwarClean, setSriEshwarClean] = useState(sriEshwarLogo)

  // Configuration States
  const [selectedTheme, setSelectedTheme] = useState<ThemePreset>(THEME_PRESETS[0])

  const [topText, setTopText] = useState('SCAN TO REPORT')
  const [scriptText, setScriptText] = useState('Campus Maintenance Desk')
  const [businessName, setBusinessName] = useState('Sri Eshwar College of Engineering')

  const [selectedDeptId, setSelectedDeptId] = useState('')
  const [locationName, setLocationName] = useState('Water Tank Area')
  const [complaintType, setComplaintType] = useState('')
  const [customNote, setCustomNote] = useState('Scan with your mobile camera to report issue & verify via OTP.')
  const [footerText, setFooterText] = useState('POWERED BY ISAII TECHNOLOGIES PRIVATE LIMITED')

  // Logo States (College Logo is Compulsory Fixed Main Logo; Secondary Logo is Optional / Default Empty)
  const [secondaryLogoSrc, setSecondaryLogoSrc] = useState<string | null>(null)

  const collegeLogoSrc = sriEshwarClean

  const [qrDataUrl, setQrDataUrl] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const selectedDept = departments.find((d) => getId(d) === selectedDeptId)
  const exportLock = useRef(false)

  useEffect(() => {
    let isMounted = true
    void (async () => {
      try {
        const img = await loadImage(sriEshwarLogo)
        const cleaned = knockoutBlackBackground(img).toDataURL('image/png')
        if (isMounted) setSriEshwarClean(cleaned)
      } catch {
        if (isMounted) setSriEshwarClean(sriEshwarLogo)
      }
    })()
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        const data = await departmentService.listActive()
        setDepartments(data)
        if (data.length > 0) {
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

  useEffect(() => {
    let isMounted = true
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
        const dataUrl = await generateCleanQrDataUrl(generatedUrl)
        if (isMounted) {
          setQrDataUrl(dataUrl)
        }
      } catch (err) {
        console.error('Error generating QR code:', err)
      }
    })()

    return () => {
      isMounted = false
    }
  }, [selectedDept, locationName, complaintType])

  const handleSecondaryLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setSecondaryLogoSrc(reader.result as string)
      toast.success('Secondary Logo added!')
    }
    reader.readAsDataURL(file)
  }

  const handleCopyLink = () => {
    void navigator.clipboard.writeText(targetUrl)
    setCopied(true)
    toast.success('QR Code URL copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const buildPoster = async () => {
    if (!qrDataUrl) throw new Error('QR is not ready')
    return composePosterPng({
      theme: selectedTheme,
      qrSrc: qrDataUrl,
      topText,
      scriptText,
      businessName,
      locationName,
      customNote,
      footerText,
      collegeSrc: collegeLogoSrc,
      secondarySrc: secondaryLogoSrc,
    })
  }

  const handleDownload = async () => {
    if (exportLock.current) return
    exportLock.current = true
    setExporting('download')
    try {
      const dataUrl = await buildPoster()
      const link = document.createElement('a')
      const filename = `Campus_Maintenance_QR_${(locationName || 'Poster').replace(/\s+/g, '_')}.png`
      link.download = filename
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`Downloaded ${filename}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to download the poster. Please try again.')
    } finally {
      exportLock.current = false
      setExporting(null)
    }
  }

  const handlePrint = async () => {
    if (exportLock.current) return
    exportLock.current = true
    setExporting('print')
    try {
      const dataUrl = await buildPoster()
      printPng(dataUrl)
    } catch (err) {
      console.error(err)
      toast.error('Failed to prepare the poster for print.')
    } finally {
      exportLock.current = false
      setExporting(null)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="mx-auto max-w-7xl pb-12">
      {/* Navigation Header */}
      <Link
        to="/admin/dashboard"
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary-blue)] hover:underline"
      >
        <ArrowLeft size={14} />
        Back to Admin Dashboard
      </Link>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display flex items-center gap-2.5 text-2xl font-bold text-[var(--ink)] sm:text-3xl">
            <QrIcon className="text-[var(--primary-blue)]" size={30} />
            Campus Maintenance QR Poster Generator
          </h1>
          {/* <p className="mt-1 text-sm text-[var(--ink-muted)]">
            Generate and print official high-resolution 4" × 6" campus maintenance QR code posters for facility areas.
          </p> */}
        </div>
      </div>

      {/* Facility Quick Presets */}
      {/* <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--white)] p-4 shadow-sm">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
          <Sparkles size={14} className="text-[var(--gold)]" /> Campus Facility Quick Presets
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
              className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-left transition-all hover:border-[var(--primary-blue)] hover:bg-[var(--primary-blue-light)] hover:text-[var(--primary-blue)]"
            >
              <span className="text-xs font-bold">{preset.label}</span>
              <Zap size={13} className="text-[var(--primary-blue)]" />
            </button>
          ))}
        </div>
      </div> */}

      {/* Main Grid Workspace */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Left Form Controls */}
        <div className="space-y-6 lg:col-span-6">
          {/* Theme Selector */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-sm">
            <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
              <Palette size={16} className="text-[var(--primary-blue)]" />
              Poster Color Gradient Theme
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
              {THEME_PRESETS.map((theme) => {
                const active = selectedTheme.id === theme.id
                return (
                  <button
                    key={theme.id}
                    type="button"
                    title={theme.name}
                    onClick={() => setSelectedTheme(theme)}
                    className={`group relative flex h-14 flex-col items-center justify-center rounded-xl border transition-all ${active ? 'border-2 border-[var(--primary-blue)] ring-2 ring-[var(--primary-blue)]/20' : 'border-transparent'
                      }`}
                    style={{ background: theme.cssGradient }}
                  >
                    {active && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-black shadow">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                    )}
                    <span className="sr-only">{theme.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Design Header & Logo Customizer */}
          <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-sm">
            <h2 className="flex items-center gap-2 border-b border-[var(--border)] pb-2 text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
              <Sparkles size={16} className="text-[var(--primary-blue)]" />
              Poster Header & Branding Customization
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[var(--ink)]">Top Header Text</label>
                <input
                  type="text"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                  placeholder="  SCAN TO REPORT"
                  className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--white)] px-3 text-xs text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[var(--ink)]">Cursive Subtitle</label>
                <input
                  type="text"
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="  Campus Maintenance Desk"
                  className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--white)] px-3 text-xs text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[var(--ink)]">Institution / College Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="  Sri Eshwar College of Engineering"
                className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--white)] px-3 text-xs text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
              />
            </div>

            {/* Logo Customizer Section */}
            <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink)]">
                  <ImageIcon size={14} className="text-[var(--primary-blue)]" />
                  Header Logos Customization
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* College / Primary Logo (Main - Compulsory Fixed) */}
                {/* <div className="flex flex-col justify-between gap-1.5 rounded-lg border border-[var(--border)] bg-white p-2.5">
                  <div>
                    <span className="text-[11px] font-bold text-[var(--ink)] flex items-center gap-1">
                      College / Primary Logo <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">(Main)</span>
                    </span>
                    <p className="text-[10px] text-[var(--ink-muted)]">Fixed institutional main logo</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-20 items-center justify-center rounded border border-slate-200 bg-slate-50 p-1">
                      <img src={collegeLogoSrc} alt="College Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                    <span className="text-[11px] font-medium text-[var(--ink-muted)] italic">Fixed Main Logo</span>
                  </div>
                </div> */}

                {/* Secondary Logo (Optional - Default Empty) */}
                <div className="flex flex-col justify-between gap-1.5 rounded-lg border border-[var(--border)] bg-white p-2.5">
                  <div>
                    <span className="text-[11px] font-bold text-[var(--ink)]">Secondary Logo (Optional)</span>
                    <p className="text-[10px] text-[var(--ink-muted)]">Dual logo alongside main logo</p>
                  </div>

                  {secondaryLogoSrc ? (
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-14 items-center justify-center rounded border border-slate-200 bg-slate-50 p-1">
                        <img src={secondaryLogoSrc} alt="Secondary Logo" className="max-h-full max-w-full object-contain" />
                      </div>
                      <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[var(--ink)] hover:bg-slate-50">
                        <Upload size={12} />
                        <span>Change</span>
                        <input type="file" accept="image/*" onChange={handleSecondaryLogoChange} className="hidden" />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setSecondaryLogoSrc(null)
                          toast.success('Secondary logo removed')
                        }}
                        className="flex cursor-pointer items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] font-medium text-rose-600 hover:bg-rose-100"
                        title="Remove secondary logo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-dashed border-[var(--border)] bg-slate-50 px-2 py-1 text-[11px] font-semibold text-[var(--primary-blue)] hover:bg-blue-50">
                        <Upload size={12} />
                        <span>Upload Logo</span>
                        <input type="file" accept="image/*" onChange={handleSecondaryLogoChange} className="hidden" />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setSecondaryLogoSrc(isaiiLogo)
                          toast.success('Isaii AI logo added as secondary logo')
                        }}
                        className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Plus size={12} />
                        <span>Add Logo</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[var(--ink)]">Footer Attribution Text</label>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                placeholder="  POWERED BY ISAII TECHNOLOGIES PRIVATE LIMITED"
                className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--white)] px-3 text-xs text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
              />
            </div>
          </div>

          {/* QR Code Target Location Controls */}
          <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--white)] p-5 shadow-sm">
            <h2 className="flex items-center gap-2 border-b border-[var(--border)] pb-2 text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
              <Building2 size={16} className="text-[var(--primary-blue)]" />
              Configure Campus Location & Ticket Parameters
            </h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--ink)]">
                Facility / Area Name <span className="text-[var(--danger)]">*</span>
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
                  placeholder="  Water Tank Area, Block B Washroom..."
                  className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--white)] pl-10 pr-3.5 text-xs text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--ink)]">Target Department</label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => {
                    setSelectedDeptId(e.target.value)
                    setComplaintType('')
                  }}
                  className="h-10 w-full cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--white)] px-3 text-xs text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
                >
                  <option value="">Select target department...</option>
                  {departments.map((d) => (
                    <option key={getId(d)} value={getId(d)}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedDept && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[var(--ink)]">Default Category</label>
                  <select
                    value={complaintType}
                    onChange={(e) => setComplaintType(e.target.value)}
                    className="h-10 w-full cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--white)] px-3 text-xs text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
                  >
                    <option value="">Select category (optional)...</option>
                    {(selectedDept.complaintTypes || []).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--ink)]">Poster Subtext Note (Optional)</label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="  Scan with mobile camera to log issue & verify via OTP"
                className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--white)] px-3 text-xs text-[var(--ink)] outline-none focus:border-[var(--primary-blue)]"
              />
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)]">
                Generated Target QR Link
              </p>
              <p className="mt-1 break-all font-mono text-[11px] text-[var(--primary-blue)]">{targetUrl}</p>
            </div>
          </div>
        </div>

        {/* Right Live Preview & Action Panel */}
        <div className="flex flex-col items-center lg:col-span-6">
          <div className="sticky top-6 flex w-full flex-col items-center">
            <div className="mb-2 flex w-full max-w-[420px] items-center justify-between px-1 text-xs font-bold uppercase tracking-wider text-[var(--ink-muted)]">
              <span>Live Poster Preview</span>
              {/* <span className="rounded-full bg-slate-200 px-2.5 py-0.5 font-mono text-[10px]">
                Postcard 4"×6" (300 DPI)
              </span> */}
            </div>

            {/* Live Visual Card Preview Container */}
            <div
              className="relative w-full max-w-[420px] overflow-hidden rounded-[32px] text-center shadow-2xl transition-all duration-300"
              style={{ background: selectedTheme.cssGradient }}
            >
              <div className="flex flex-col items-center px-6 pt-9 pb-6 text-white">
                {/* Top Header Label */}
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white drop-shadow-sm">
                  {topText || 'SCAN TO REPORT'}
                </p>

                {/* Script Cursive Title */}
                <h2
                  className="mt-1.5 text-[42px] leading-tight font-normal drop-shadow-md"
                  style={{ fontFamily: "'Satisfy', cursive", color: selectedTheme.accentColor || '#FFFFFF' }}
                >
                  {scriptText || 'Campus Maintenance Desk'}
                </h2>

                {/* Broad & Beautiful Dashed Logo Container */}
                <div className="mt-5 flex h-28 w-[92%] max-w-[340px] items-center justify-center rounded-[32px] border-2 border-dashed border-white/95 p-2 shadow-lg">
                  <div className="flex h-full w-full items-center justify-between rounded-[24px] bg-white px-4 py-2 shadow-md">
                    {secondaryLogoSrc ? (
                      <>
                        <div className="flex h-full flex-1 items-center justify-center pr-2">
                          <img src={collegeLogoSrc} alt="College Logo" className="max-h-full max-w-full object-contain" />
                        </div>
                        <div className="h-10 w-[2px] bg-slate-200" />
                        <div className="flex h-full flex-1 items-center justify-center pl-2">
                          <img src={secondaryLogoSrc} alt="Secondary Logo" className="max-h-full max-w-full object-contain" />
                        </div>
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-1">
                        <img src={collegeLogoSrc} alt="College Main Logo" className="h-full w-full object-contain" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Business / College Name */}
                <h3 className="mt-5 text-xl font-black tracking-tight text-white drop-shadow-sm">
                  {businessName || 'Sri Eshwar College of Engineering'}
                </h3>

                {/* Location Badge Pill */}
                <div
                  className="mt-3.5 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black shadow-md"
                  style={{ backgroundColor: selectedTheme.accentColor || '#F9C301', color: '#0F172A' }}
                >
                  <MapPin size={13} />
                  <span>{(locationName || 'CAMPUS AREA').toUpperCase()}</span>
                </div>

                {/* Central White QR Code Box */}
                <div className="mt-5 w-full max-w-[285px] rounded-[28px] bg-white p-4 shadow-2xl">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Campus QR Code" className="h-auto w-full" />
                  ) : (
                    <div className="h-48 w-full animate-pulse rounded-2xl bg-gray-100" />
                  )}
                </div>

                {/* Scan Instructions Note */}
                <p className="mt-5 text-sm font-semibold leading-snug text-white/95 max-w-[310px] drop-shadow">
                  {customNote || 'Scan with your mobile camera to report issue & verify via OTP.'}
                </p>
              </div>

              {/* Editable Footer Bar */}
              <div
                className="px-4 py-3.5 text-xs font-black tracking-widest text-center uppercase"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.28)', color: selectedTheme.accentColor || '#FFFFFF' }}
              >
                {footerText || DEFAULT_FOOTER}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="mt-6 flex w-full max-w-[420px] flex-wrap justify-center gap-2.5">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => void handleDownload()}
                disabled={!qrDataUrl}
                loading={exporting === 'download'}
                className="flex-1 shadow-md"
              >
                <Download size={16} />
                {exporting === 'download' ? 'Generating PNG...' : 'Download'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => void handlePrint()}
                disabled={!qrDataUrl}
                loading={exporting === 'print'}
                className="flex-1"
              >
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
    </div>
  )
}
