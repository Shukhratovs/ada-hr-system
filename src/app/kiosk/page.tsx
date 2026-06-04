'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useLang } from '@/components/LanguageProvider'
import Logo from '@/components/Logo'

type KioskState =
  | 'loading'
  | 'ready'
  | 'scanning'
  | 'success_in'
  | 'success_out'
  | 'not_found'
  | 'camera_error'

interface FaceEmployee {
  id: string
  name: string
  faceDescriptor: number[]
}

interface Result {
  name: string
  action: string
  late?: boolean
  hours?: number
}

const EUCLIDEAN_THRESHOLD = 0.6
const SCAN_COOLDOWN_MS = 10000 // 10 seconds between scans per employee

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2
  return Math.sqrt(sum)
}

function playTone(type: 'in' | 'out') {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    if (type === 'in') {
      osc.frequency.setValueAtTime(523, ctx.currentTime)
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15)
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.3)
    } else {
      osc.frequency.setValueAtTime(784, ctx.currentTime)
      osc.frequency.setValueAtTime(523, ctx.currentTime + 0.25)
    }
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.6)
    setTimeout(() => ctx.close(), 1000)
  } catch { /* ignore if AudioContext not available */ }
}

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 0.95
  u.volume = 1
  window.speechSynthesis.speak(u)
}

export default function KioskPage() {
  const { t, lang } = useLang()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [kioskState, setKioskState] = useState<KioskState>('loading')
  const [result, setResult] = useState<Result | null>(null)
  const [clock, setClock] = useState(new Date())
  const [employees, setEmployees] = useState<FaceEmployee[]>([])
  const faceapiRef = useRef<typeof import('face-api.js') | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanningRef = useRef(false)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastScanMap = useRef<Map<string, number>>(new Map())

  // Clock
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Init face-api + camera
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
        faceapiRef.current = fa

        const data = await fetch('/api/attendance/checkin').then((r) => r.json())
        if (cancelled) return
        setEmployees(data)

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
        })
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        setKioskState('ready')
      } catch (e) {
        console.error(e)
        setKioskState('camera_error')
      }
    }

    init()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    }
  }, [])

  const scheduleReset = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    resetTimerRef.current = setTimeout(() => {
      setKioskState('ready')
      setResult(null)
      scanningRef.current = false
      fetch('/api/attendance/checkin').then((r) => r.json()).then(setEmployees)
    }, 4000)
  }, [])

  // Auto scan loop
  useEffect(() => {
    if (kioskState !== 'ready') return

    const fa = faceapiRef.current
    if (!fa || !videoRef.current) return

    let frameId: number

    const scan = async () => {
      if (scanningRef.current || kioskState !== 'ready') return

      const video = videoRef.current
      if (!video || video.readyState < 2) {
        frameId = requestAnimationFrame(scan)
        return
      }

      let detection
      try {
        detection = await fa
          .detectSingleFace(video, new fa.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor()
      } catch {
        detection = null
      }

      if (!detection) {
        frameId = requestAnimationFrame(scan)
        return
      }

      const canvas = canvasRef.current
      if (canvas) {
        const dims = fa.matchDimensions(canvas, video, true)
        fa.draw.drawDetections(canvas, fa.resizeResults(detection, dims))
      }

      const liveDescriptor = Array.from(detection.descriptor) as number[]
      let bestMatch: FaceEmployee | null = null
      let bestDist = Infinity

      for (const emp of employees) {
        if (!emp.faceDescriptor.length) continue
        const dist = euclideanDistance(liveDescriptor, emp.faceDescriptor)
        if (dist < bestDist) {
          bestDist = dist
          bestMatch = emp
        }
      }

      if (!bestMatch || bestDist > EUCLIDEAN_THRESHOLD) {
        frameId = requestAnimationFrame(scan)
        return
      }

      // Per-employee cooldown: ignore if scanned within SCAN_COOLDOWN_MS
      const lastScan = lastScanMap.current.get(bestMatch.id) ?? 0
      if (Date.now() - lastScan < SCAN_COOLDOWN_MS) {
        frameId = requestAnimationFrame(scan)
        return
      }

      scanningRef.current = true
      lastScanMap.current.set(bestMatch.id, Date.now())
      setKioskState('scanning')

      const res = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: bestMatch.id }),
      })
      const data = await res.json()

      if (data.action === 'checkin') {
        setResult({ name: data.employee.name, action: 'checkin', late: data.late })
        setKioskState('success_in')
        playTone('in')
        setTimeout(() => speak('Welcome'), 650)
      } else if (data.action === 'checkout') {
        setResult({ name: data.employee.name, action: 'checkout', hours: data.hours })
        setKioskState('success_out')
        playTone('out')
        setTimeout(() => speak('Goodbye'), 650)
      }

      scheduleReset()
      return
    }

    frameId = requestAnimationFrame(scan)
    return () => cancelAnimationFrame(frameId)
  }, [kioskState, employees, scheduleReset])

  const stateConfig = {
    loading:      { bg: 'from-slate-950 to-slate-900', text: t('loadingModels'), icon: '⏳', color: 'text-slate-400' },
    ready:        { bg: 'from-slate-950 to-slate-900', text: t('lookAtCamera'),  icon: '👁️', color: 'text-slate-400' },
    scanning:     { bg: 'from-slate-950 to-slate-900', text: t('scanning'),      icon: '🔍', color: 'text-amber-400' },
    success_in:   { bg: 'from-emerald-950 to-slate-950', text: t('checkedIn'),   icon: '✅', color: 'text-emerald-400' },
    success_out:  { bg: 'from-blue-950 to-slate-950',    text: t('checkedOut'),  icon: '👋', color: 'text-blue-400' },

    not_found:    { bg: 'from-red-950 to-slate-950',     text: t('faceNotFound'), icon: '❌', color: 'text-red-400' },
    camera_error: { bg: 'from-red-950 to-slate-950',     text: t('cameraError'),  icon: '📷', color: 'text-red-400' },
  }

  const cfg = stateConfig[kioskState]

  return (
    <div className={`fixed inset-0 bg-gradient-to-br ${cfg.bg} flex flex-col items-center justify-center transition-all duration-700`}>

      {/* Clock — top right */}
      <div className="absolute top-8 right-10 text-right">
        <div className="text-4xl font-bold text-white tabular-nums tracking-tight">
          {clock.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <div className="text-slate-500 text-sm mt-1 font-medium">
          {clock.toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Lang toggle — top left */}
      <div className="absolute top-8 left-10 flex gap-1 bg-slate-900/60 backdrop-blur-sm rounded-xl p-1 border border-slate-800/50">
        {(['uz', 'ru'] as const).map((l) => (
          <button
            key={l}
            onClick={() => {}}
            className="text-xs text-slate-500 px-3 py-1.5 rounded-lg font-semibold"
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Title — top center */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center">
        <div className="flex items-center gap-2.5 justify-center">
          <Logo size="sm" />
          <div className="text-amber-400 text-lg font-bold tracking-tight">ADA Lazzatli Sifat</div>
        </div>
        <div className="text-slate-600 text-sm mt-0.5 font-medium">{t('kioskTitle')}</div>
      </div>

      {/* Camera */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl" style={{ width: 420, height: 315 }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover scale-x-[-1]"
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full scale-x-[-1]"
        />

        {/* Corner brackets */}
        {kioskState === 'ready' && (
          <>
            <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-400/60 rounded-tl-lg" />
            <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-400/60 rounded-tr-lg" />
            <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-400/60 rounded-bl-lg" />
            <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-400/60 rounded-br-lg" />
          </>
        )}

        {/* State overlay */}
        {kioskState !== 'ready' && kioskState !== 'loading' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center">
            <div className="text-5xl mb-3">{cfg.icon}</div>
            <div className={`text-xl font-bold ${cfg.color}`}>{cfg.text}</div>
            {kioskState === 'success_in' && result?.name && (
              <div className="text-slate-300 mt-1.5 text-base font-medium">{result.name}</div>
            )}
            {kioskState === 'success_out' && result && (
              <div className="text-slate-300 mt-1.5 text-base font-medium">
                {result.name}
              </div>
            )}
          </div>
        )}

        {kioskState === 'loading' && (
          <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
              <div className="text-slate-500 text-sm font-medium">{t('loadingModels')}</div>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="mt-7 text-center min-h-10">
        {kioskState === 'ready' && (
          <p className="text-slate-600 text-sm font-medium animate-pulse">{t('lookAtCamera')}</p>
        )}
        {kioskState === 'success_in' && (
          <div className="text-emerald-400 font-bold text-xl">
            {t('welcome')}, {result?.name}!
          </div>
        )}
        {kioskState === 'success_out' && (
          <div className="text-blue-400 font-bold text-xl">
            {t('goodbye')}, {result?.name}!
          </div>
        )}
        {kioskState === 'scanning' && (
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm justify-center">
            <div className="w-3.5 h-3.5 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            {t('scanning')}
          </div>
        )}
      </div>

      {employees.length === 0 && kioskState === 'ready' && (
        <p className="absolute bottom-8 text-slate-700 text-xs font-medium">
          {lang === 'uz' ? "Ro'yxatdan o'tgan yuzlar yo'q" : 'Нет зарегистрированных лиц'}
        </p>
      )}
    </div>
  )
}
