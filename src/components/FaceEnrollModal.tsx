'use client'

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useLang } from './LanguageProvider'

interface Props {
  employeeId: string
  employeeName: string
  onClose: () => void
  onEnrolled: () => void
}

export default function FaceEnrollModal({ employeeId, employeeName, onClose, onEnrolled }: Props) {
  const { t, lang } = useLang()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'capturing' | 'done'>('loading')
  const [faceapi, setFaceapi] = useState<typeof import('face-api.js') | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const fa = await import('face-api.js')
        await Promise.all([
          fa.nets.tinyFaceDetector.loadFromUri('/models'),
          fa.nets.faceLandmark68Net.loadFromUri('/models'),
          fa.nets.faceRecognitionNet.loadFromUri('/models'),
        ])
        if (cancelled) return
        setFaceapi(fa)
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setStatus('ready')
      } catch {
        toast.error(t('cameraError'))
      }
    }
    init()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const capture = async () => {
    if (!faceapi || !videoRef.current || status !== 'ready') return
    setStatus('capturing')
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        toast.error(t('faceNotFound'))
        setStatus('ready')
        return
      }

      const descriptor = Array.from(detection.descriptor)
      const res = await fetch(`/api/employees/${employeeId}/face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptor }),
      })

      if (res.status === 409) {
        const data = await res.json()
        toast.error(
          lang === 'uz'
            ? `Bu yuz "${data.employeeName}" uchun allaqachon ro'yxatdan o'tgan!`
            : `Это лицо уже зарегистрировано для "${data.employeeName}"!`,
          { duration: 5000 }
        )
        setStatus('ready')
        return
      }

      if (!res.ok) throw new Error()
      toast.success(t('faceEnrolled'))
      setStatus('done')
      streamRef.current?.getTracks().forEach((t) => t.stop())
      onEnrolled()
    } catch {
      toast.error(t('error'))
      setStatus('ready')
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{t('enrollFace')}</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">{employeeName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {/* Camera view */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 mb-4" style={{ aspectRatio: '4/3' }}>
            <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" muted playsInline />

            {/* Face frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-36 h-44 border-2 border-amber-400/50 rounded-full" />
            </div>

            {/* Corner brackets */}
            {status === 'ready' && (
              <>
                <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-amber-400/70 rounded-tl-md" />
                <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-amber-400/70 rounded-tr-md" />
                <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-amber-400/70 rounded-bl-md" />
                <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-amber-400/70 rounded-br-md" />
              </>
            )}

            {status === 'loading' && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3">
                <div className="w-7 h-7 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                <span className="text-slate-500 text-xs font-medium">{t('loadingModels')}</span>
              </div>
            )}

            {status === 'capturing' && (
              <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                <div className="w-7 h-7 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                <span className="text-white text-xs font-medium">{t('scanning')}</span>
              </div>
            )}

            {status === 'ready' && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                <span className="bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm font-medium">
                  {t('lookAtCamera')}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all"
            >
              {t('cancel')}
            </button>
            <button
              onClick={capture}
              disabled={status !== 'ready'}
              className="flex-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-all shadow-sm shadow-amber-200"
            >
              {status === 'capturing' ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('scanning')}
                </span>
              ) : t('enrollFace')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
