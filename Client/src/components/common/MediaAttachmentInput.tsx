import { useEffect, useRef, useState } from 'react'
import { Camera, Film, Image as ImageIcon, Mic, Plus, RefreshCw, Square, Trash2, Upload, Volume2, X } from 'lucide-react'

interface MediaAttachmentInputProps {
  files?: File[]
  onChange?: (files: File[]) => void
  file?: File | null
  onSingleChange?: (file: File | null) => void
  label?: string
  hint?: string
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatTimer(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function MediaAttachmentInput({
  files: propsFiles,
  onChange,
  file: propsSingleFile,
  onSingleChange,
  label = 'Media Attachments',
  hint = 'Upload images, videos, audio notes, or capture live photo/voice',
}: MediaAttachmentInputProps) {
  // Internal normalized file list
  const currentFiles: File[] = propsFiles
    ? propsFiles
    : propsSingleFile
    ? [propsSingleFile]
    : []

  const updateFiles = (newFiles: File[]) => {
    if (onChange) {
      onChange(newFiles)
    }
    if (onSingleChange) {
      onSingleChange(newFiles.length ? newFiles[0] : null)
    }
  }

  const addFiles = (incoming: File[]) => {
    const valid = incoming.filter(
      (f) =>
        f.type.startsWith('image/') ||
        f.type.startsWith('audio/') ||
        f.type.startsWith('video/')
    )
    updateFiles([...currentFiles, ...valid])
  }

  const removeFileAt = (index: number) => {
    const next = currentFiles.filter((_, i) => i !== index)
    updateFiles(next)
  }

  const clearAll = () => {
    updateFiles([])
  }

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

  // Object URLs for previewing files
  const [previewUrls, setPreviewUrls] = useState<{ url: string; type: 'image' | 'audio' | 'video'; name: string; size: number }[]>([])

  useEffect(() => {
    const urls = currentFiles.map((f) => {
      const type: 'image' | 'audio' | 'video' = f.type.startsWith('image/')
        ? 'image'
        : f.type.startsWith('video/')
        ? 'video'
        : 'audio'
      return {
        url: URL.createObjectURL(f),
        type,
        name: f.name,
        size: f.size,
      }
    })
    setPreviewUrls(urls)

    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u.url))
    }
  }, [currentFiles])

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
            addFiles([photoFile])
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
    const dropped = Array.from(e.dataTransfer.files)
    if (dropped.length) {
      addFiles(dropped)
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
        const audioFile = new File([audioBlob], `voice_note_${Date.now()}.${ext}`, {
          type: audioBlob.type,
        })
        addFiles([audioFile])
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

  const totalSize = currentFiles.reduce((acc, f) => acc + f.size, 0)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[var(--ink)]">
          {label} <span className="font-normal text-[var(--ink-muted)]">({hint})</span>
        </label>

        {currentFiles.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-xs font-bold text-[var(--danger)] hover:underline cursor-pointer"
          >
            <Trash2 size={13} /> Clear All ({currentFiles.length})
          </button>
        )}
      </div>

      {/* Hidden file input for File Browser */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,audio/*,video/*"
        className="hidden"
        onChange={(e) => {
          const picked = Array.from(e.target.files || [])
          if (picked.length) addFiles(picked)
          e.target.value = ''
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
      ) : (
        /* Dropzone / Action Header Bar */
        <div
          className={`flex flex-col gap-3 rounded-2xl border-2 border-dashed p-4 transition-all ${
            dragOver
              ? 'border-[var(--primary-blue)] bg-[var(--primary-blue-light)]'
              : 'border-[var(--primary-blue-muted)] bg-[var(--white)]'
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {/* Top Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--ink)]">
                {currentFiles.length === 0
                  ? 'Add Attachments'
                  : `Attached Files (${currentFiles.length} file${currentFiles.length > 1 ? 's' : ''}, ${formatBytes(totalSize)})`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary-blue-light)] px-3 py-1.5 text-xs font-bold text-[var(--primary-blue)] hover:bg-[var(--primary-blue)] hover:text-white transition-all cursor-pointer"
              >
                <Camera size={14} /> Take Photo
              </button>

              <button
                type="button"
                onClick={startRecording}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--gold-light)] px-3 py-1.5 text-xs font-bold text-[var(--gold-dark)] hover:bg-[var(--gold)] hover:text-[var(--primary-blue-deeper)] transition-all cursor-pointer"
              >
                <Mic size={14} /> Record Audio
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--white)] px-3 py-1.5 text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface-2)] shadow-xs cursor-pointer"
              >
                <Upload size={14} /> Browse Files (Photos, Videos, Audio)
              </button>
            </div>
          </div>

          {/* Render List of Attachment Cards */}
          {previewUrls.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {previewUrls.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 transition-all hover:border-[var(--primary-blue-muted)]"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.type === 'image' && (
                        <ImageIcon size={16} className="text-[var(--primary-blue)] shrink-0" />
                      )}
                      {item.type === 'audio' && (
                        <Volume2 size={16} className="text-[var(--gold-dark)] shrink-0" />
                      )}
                      {item.type === 'video' && (
                        <Film size={16} className="text-purple-600 shrink-0" />
                      )}
                      <span className="truncate text-xs font-bold text-[var(--ink)]">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-semibold text-[var(--ink-muted)]">
                        {formatBytes(item.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFileAt(idx)}
                        className="rounded-md p-1 text-[var(--ink-muted)] hover:bg-[var(--danger-light)] hover:text-[var(--danger)] transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Render Visual Preview */}
                  {item.type === 'image' && (
                    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-black/5 max-h-40 flex items-center justify-center">
                      <img
                        src={item.url}
                        alt={item.name}
                        className="max-h-40 w-full object-contain rounded-lg"
                      />
                    </div>
                  )}

                  {item.type === 'audio' && (
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--white)] p-2">
                      <audio controls src={item.url} className="w-full h-8" />
                    </div>
                  )}

                  {item.type === 'video' && (
                    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-black max-h-44 flex items-center justify-center">
                      <video
                        controls
                        src={item.url}
                        className="w-full max-h-44 rounded-lg object-contain"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[var(--ink-muted)]">
              Drag &amp; drop photos, video clips, or audio files here, or use the buttons above to record live.
            </div>
          )}
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
