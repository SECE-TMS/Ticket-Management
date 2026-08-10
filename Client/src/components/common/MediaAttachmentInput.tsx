import { useEffect, useRef, useState } from 'react'
import { Camera, Image as ImageIcon, Mic, RefreshCw, Square, Trash2, Upload, Volume2, X } from 'lucide-react'

interface MediaAttachmentInputProps {
  file: File | null
  onChange: (file: File | null) => void
  label?: string
  hint?: string
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatTimer(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function MediaAttachmentInput({
  file,
  onChange,
  label = 'Attachment',
  hint = 'Photo proof or voice note (optional)',
}: MediaAttachmentInputProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordSecs, setRecordSecs] = useState(0)

  // Live Camera Modal states
  const [cameraOpen, setCameraOpen] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [cameraError, setCameraError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)

  // Generate object URL for image/audio preview when file changes
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  // Manage Live Webcam Video Stream when Camera Modal is open
  useEffect(() => {
    if (!cameraOpen) {
      stopCameraStream()
      return
    }

    let isMounted = true
    const startCamera = async () => {
      setCameraError(null)
      try {
        stopCameraStream()
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        })
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        cameraStreamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err: any) {
        console.error('Camera access error:', err)
        setCameraError(
          'Could not access camera device. Please allow camera permissions or browse files.'
        )
      }
    }

    void startCamera()

    return () => {
      isMounted = false
      stopCameraStream()
    }
  }, [cameraOpen, facingMode])

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop())
      cameraStreamRef.current = null
    }
  }

  // Capture Photo Frame from Live Video Stream
  const capturePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current || document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const photoFile = new File([blob], `camera_snap_${Date.now()}.jpg`, {
              type: 'image/jpeg',
            })
            onChange(photoFile)
            setCameraOpen(false)
          }
        },
        'image/jpeg',
        0.92
      )
    }
  }

  // Timer loop for microphone recording
  useEffect(() => {
    if (recording) {
      setRecordSecs(0)
      timerRef.current = window.setInterval(() => {
        setRecordSecs((s) => s + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setRecordSecs(0)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [recording])

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && (dropped.type.startsWith('image/') || dropped.type.startsWith('audio/'))) {
      onChange(dropped)
    }
  }

  // Start Mic Recording using navigator.mediaDevices
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        const ext = recorder.mimeType.includes('mp4') ? 'm4a' : 'webm'
        const audioFile = new File([audioBlob], `voice_record_${Date.now()}.${ext}`, {
          type: audioBlob.type,
        })
        onChange(audioFile)
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setRecording(true)
    } catch {
      alert('Microphone permission denied or not supported on this device.')
    }
  }

  // Stop Mic Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  const isImage = file?.type.startsWith('image/')
  const isAudio = file?.type.startsWith('audio/')

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[var(--ink)]">
          {label} <span className="font-normal text-[var(--ink-muted)]">({hint})</span>
        </label>

        {file && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1 text-xs font-bold text-[var(--danger)] hover:underline cursor-pointer"
          >
            <Trash2 size={13} /> Remove
          </button>
        )}
      </div>

      {/* Hidden file input for File Browser */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*"
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0]
          if (picked) onChange(picked)
        }}
      />

      {/* Case 1: Mic Recording in Progress */}
      {recording ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-[var(--danger)] bg-[var(--danger-light)] p-6 text-center shadow-inner animate-pulse">
          <div className="flex items-center gap-2 text-[var(--danger)] font-bold text-sm">
            <span className="h-3 w-3 rounded-full bg-[var(--danger)] animate-ping" />
            Recording Voice Note... {formatTimer(recordSecs)}
          </div>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            Speak clearly into your microphone
          </p>
          <button
            type="button"
            onClick={stopRecording}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--danger)] px-5 py-2 text-xs font-bold text-[var(--white)] shadow-md hover:bg-red-700 cursor-pointer"
          >
            <Square size={14} /> Stop Recording
          </button>
        </div>
      ) : file && previewUrl ? (
        /* Case 2: File Selected -> Visual Preview Screen */
        <div className="overflow-hidden rounded-2xl border border-[var(--primary-blue-muted)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isImage ? (
                <ImageIcon size={18} className="text-[var(--primary-blue)]" />
              ) : (
                <Volume2 size={18} className="text-[var(--primary-blue)]" />
              )}
              <span className="truncate text-xs font-bold text-[var(--ink)]">
                {file.name}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[var(--ink-muted)]">
              {formatBytes(file.size)}
            </span>
          </div>

          {/* Visual Image Preview */}
          {isImage && (
            <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-black/5 max-h-56 flex items-center justify-center">
              <img
                src={previewUrl}
                alt="Selected attachment preview"
                className="max-h-56 w-full object-contain rounded-xl"
              />
            </div>
          )}

          {/* Visual Audio Player Preview */}
          {isAudio && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--white)] p-3">
              <audio controls src={previewUrl} className="w-full h-10" />
            </div>
          )}

          {/* Retake / Choose Different Action Bar */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 py-1.5 text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface-2)] cursor-pointer"
            >
              <Camera size={13} /> Retake Photo
            </button>
            <button
              type="button"
              onClick={startRecording}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 py-1.5 text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface-2)] cursor-pointer"
            >
              <Mic size={13} /> Record Mic
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 py-1.5 text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface-2)] cursor-pointer"
            >
              <Upload size={13} /> Browse File
            </button>
          </div>
        </div>
      ) : (
        /* Case 3: Empty State -> Pick, Record, or Camera Dropzone */
        <div
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
            dragOver
              ? 'border-[var(--primary-blue)] bg-[var(--primary-blue-light)]'
              : 'border-[var(--primary-blue-muted)] bg-[var(--white)] hover:border-[var(--primary-blue)]'
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <p className="text-xs font-bold text-[var(--ink)] mb-1">
            Upload or Capture Attachment
          </p>
          <p className="text-[11px] text-[var(--ink-muted)] mb-4 max-w-xs">
            Take a live webcam photo, record a voice note, or drop a file.
          </p>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary-blue)] px-4 py-2.5 text-xs font-bold text-[var(--white)] shadow-md hover:bg-[var(--primary-blue-dark)] cursor-pointer transition-all hover:scale-105"
            >
              <Camera size={16} /> Take Live Photo
            </button>

            <button
              type="button"
              onClick={startRecording}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--gold)] px-4 py-2.5 text-xs font-bold text-[var(--primary-blue-deeper)] shadow-md hover:bg-[var(--gold-dark)] cursor-pointer transition-all hover:scale-105"
            >
              <Mic size={16} /> Record Mic
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--white)] px-4 py-2.5 text-xs font-bold text-[var(--ink)] shadow-sm hover:bg-[var(--surface-2)] cursor-pointer"
            >
              <Upload size={16} /> Browse File
            </button>
          </div>
        </div>
      )}

      {/* ── LIVE WEBCAM CAMERA MODAL OVERLAY ────────────────────────────────────── */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-fade-in">
          <div className="relative flex w-full max-w-xl flex-col items-center rounded-3xl bg-[var(--white)] p-6 shadow-2xl">
            {/* Header */}
            <div className="mb-4 flex w-full items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2 font-bold text-base text-[var(--ink)]">
                <Camera size={18} className="text-[var(--primary-blue)]" />
                Live Camera Capture
              </div>
              <button
                type="button"
                onClick={() => setCameraOpen(false)}
                className="rounded-lg p-1 text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)] cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Live Video Viewport */}
            {cameraError ? (
              <div className="my-6 flex flex-col items-center justify-center rounded-2xl bg-[var(--danger-light)] p-8 text-center text-[var(--danger)]">
                <p className="text-sm font-bold">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setCameraOpen(false)
                    fileInputRef.current?.click()
                  }}
                  className="mt-4 rounded-xl bg-[var(--primary-blue)] px-4 py-2 text-xs font-bold text-[var(--white)] cursor-pointer"
                >
                  Browse Files Instead
                </button>
              </div>
            ) : (
              <div className="relative my-2 overflow-hidden rounded-2xl border-2 border-[var(--primary-blue-muted)] bg-black w-full max-h-[60vh] flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover max-h-[60vh] rounded-2xl"
                />

                {/* Camera Flip Option */}
                <button
                  type="button"
                  onClick={() =>
                    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
                  }
                  title="Flip camera"
                  className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs transition-all hover:scale-110 cursor-pointer"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            {/* Shutter Controls */}
            {!cameraError && (
              <div className="mt-4 flex items-center justify-center gap-4 w-full">
                <button
                  type="button"
                  onClick={() => setCameraOpen(false)}
                  className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-bold text-[var(--ink-muted)] hover:bg-[var(--surface)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary-blue)] px-7 py-3 text-sm font-bold text-[var(--white)] shadow-lg hover:scale-105 transition-all cursor-pointer"
                >
                  <Camera size={18} /> Capture Photo
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
