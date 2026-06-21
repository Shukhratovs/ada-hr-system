'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useLang } from '@/components/LanguageProvider'
import Logo from '@/components/Logo'

type KioskState = 'idle' | 'confirming' | 'submitting' | 'success_in' | 'success_out' | 'error' | 'error_mismatch'

interface Result {
  name: string
  action: 'checkin' | 'checkout'
  hours?: number
}

function playTone(type: 'in' | 'out' | 'error') {
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
    } else if (type === 'out') {
      osc.frequency.setValueAtTime(784, ctx.currentTime)
      osc.frequency.setValueAtTime(523, ctx.currentTime + 0.25)
    } else {
      osc.frequency.setValueAtTime(300, ctx.currentTime)
      osc.frequency.setValueAtTime(250, ctx.currentTime + 0.2)
    }
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.6)
    setTimeout(() => ctx.close(), 1000)
  } catch { /* ignore */ }
}

function speak(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  u.rate = 0.95
  window.speechSynthesis.speak(u)
}

export default function KioskPage() {
  const { lang } = useLang()
  const [pin, setPin] = useState('')
  const [firstPin, setFirstPin] = useState('')
  const [state, setState] = useState<KioskState>('idle')
  const [result, setResult] = useState<Result | null>(null)
  const [clock, setClock] = useState(new Date())
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const reset = useCallback(() => {
    setPin('')
    setFirstPin('')
    setState('idle')
    setResult(null)
  }, [])

  const scheduleReset = useCallback((ms = 3500) => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    resetTimerRef.current = setTimeout(reset, ms)
  }, [reset])

  const submitPin = useCallback(async (confirmedPin: string) => {
    setState('submitting')
    try {
      const res = await fetch('/api/attendance/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: confirmedPin }),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        playTone('error')
        setState('error')
        scheduleReset()
        return
      }

      if (data.action === 'checkin') {
        setResult({ name: data.employee.name, action: 'checkin' })
        setState('success_in')
        playTone('in')
        setTimeout(() => speak('Welcome'), 650)
      } else {
        setResult({ name: data.employee.name, action: 'checkout', hours: data.hours })
        setState('success_out')
        playTone('out')
        setTimeout(() => speak('Goodbye'), 650)
      }
      scheduleReset(4000)
    } catch {
      playTone('error')
      setState('error')
      scheduleReset()
    }
  }, [scheduleReset])

  const pressKey = useCallback((key: string) => {
    if (state === 'submitting' || state === 'success_in' || state === 'success_out') return

    // Allow del/input during idle, confirming, error_mismatch (after restart)
    if (state !== 'idle' && state !== 'confirming') return

    if (key === 'del') {
      setPin((p) => p.slice(0, -1))
      return
    }

    setPin((prev) => {
      const next = prev + key
      if (next.length === 4) {
        if (state === 'idle') {
          // First PIN entered — move to confirm
          setTimeout(() => {
            setFirstPin(next)
            setPin('')
            setState('confirming')
          }, 80)
        } else if (state === 'confirming') {
          // Second PIN entered — compare
          setTimeout(() => {
            if (next === firstPin) {
              submitPin(next)
            } else {
              playTone('error')
              setState('error_mismatch')
              scheduleReset(3500)
            }
          }, 80)
        }
      }
      return next
    })
  }, [state, firstPin, submitPin, scheduleReset])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') pressKey(e.key)
      else if (e.key === 'Backspace') pressKey('del')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [pressKey])

  const bgClass =
    state === 'success_in'      ? 'from-emerald-950 to-slate-950' :
    state === 'success_out'     ? 'from-blue-950 to-slate-950' :
    state === 'error'           ? 'from-red-950 to-slate-950' :
    state === 'error_mismatch'  ? 'from-orange-950 to-slate-950' :
    state === 'confirming'      ? 'from-amber-950 to-slate-950' :
                                  'from-slate-950 to-slate-900'

  const isInputActive = state === 'idle' || state === 'confirming'
  const keys = ['1','2','3','4','5','6','7','8','9','del','0','']

  return (
    <div className={`fixed inset-0 bg-gradient-to-br ${bgClass} flex flex-col items-center justify-center transition-all duration-500 select-none`}>

      {/* Top bar */}
      <div className="absolute top-8 left-0 right-0 flex items-center justify-between px-10">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" />
          <div className="text-amber-400 text-base font-bold tracking-tight">ADA Lazzatli Sifat</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white tabular-nums tracking-tight">
            {clock.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-slate-500 text-xs mt-0.5 font-medium">
            {clock.toLocaleDateString(lang === 'uz' ? 'uz-UZ' : 'ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>

      {/* PIN input states */}
      {isInputActive && (
        <div className="flex flex-col items-center gap-8">
          {/* Label */}
          <div className="text-center space-y-1">
            {state === 'idle' ? (
              <p className="text-slate-300 text-base font-semibold">
                {lang === 'uz' ? 'PIN kodingizni kiriting' : 'Введите ваш PIN код'}
              </p>
            ) : (
              <>
                <p className="text-amber-400 text-base font-semibold">
                  {lang === 'uz' ? 'PIN kodni tasdiqlash uchun qaytadan kiriting' : 'Введите PIN повторно для подтверждения'}
                </p>
              </>
            )}
          </div>

          {/* PIN dots */}
          <div className="flex items-center gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-full border-2 transition-all duration-150 ${
                  i < pin.length
                    ? (state === 'confirming' ? 'bg-amber-400 border-amber-400 scale-110' : 'bg-white border-white scale-110')
                    : 'bg-transparent border-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3">
            {keys.map((key, idx) => {
              if (key === '') return <div key={idx} />
              if (key === 'del') return (
                <button
                  key="del"
                  onPointerDown={(e) => { e.preventDefault(); pressKey('del') }}
                  className="w-20 h-20 rounded-2xl bg-slate-800/60 active:bg-slate-600/60 text-slate-400 flex items-center justify-center transition-all touch-manipulation"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                  </svg>
                </button>
              )
              return (
                <button
                  key={key}
                  onPointerDown={(e) => { e.preventDefault(); pressKey(key) }}
                  className="w-20 h-20 rounded-2xl bg-slate-800/60 active:bg-amber-500/30 active:scale-95 text-white text-2xl font-semibold transition-all duration-100 border border-slate-700/40 touch-manipulation"
                >
                  {key}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Submitting */}
      {state === 'submitting' && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">
            {lang === 'uz' ? 'Tekshirilmoqda...' : 'Проверка...'}
          </p>
        </div>
      )}

      {/* Success check-in */}
      {state === 'success_in' && result && (
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-emerald-400 text-2xl font-bold">{lang === 'uz' ? 'Xush kelibsiz!' : 'Добро пожаловать!'}</div>
            <div className="text-white text-xl font-semibold mt-1">{result.name}</div>
            <div className="text-slate-400 text-sm mt-1">{lang === 'uz' ? 'Kirish qayd etildi' : 'Вход отмечен'}</div>
          </div>
        </div>
      )}

      {/* Success check-out */}
      {state === 'success_out' && result && (
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <div>
            <div className="text-blue-400 text-2xl font-bold">{lang === 'uz' ? 'Xayr!' : 'До свидания!'}</div>
            <div className="text-white text-xl font-semibold mt-1">{result.name}</div>
            {result.hours !== undefined && (
              <div className="text-slate-400 text-sm mt-1">
                {lang === 'uz' ? `${Math.floor(result.hours * 60)} daqiqa ishlandi` : `Отработано ${Math.floor(result.hours * 60)} минут`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wrong PIN */}
      {state === 'error' && (
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-red-400 text-2xl font-bold">{lang === 'uz' ? "PIN noto'g'ri" : 'Неверный PIN'}</div>
            <div className="text-slate-400 text-sm mt-1">{lang === 'uz' ? 'Qaytadan urinib ko\'ring' : 'Попробуйте снова'}</div>
          </div>
        </div>
      )}

      {/* Mismatch */}
      {state === 'error_mismatch' && (
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <div className="text-orange-400 text-2xl font-bold">
              {lang === 'uz' ? "PIN kodni ikki xil kiritdingiz" : 'PIN коды не совпадают'}
            </div>
            <div className="text-slate-400 text-sm mt-1">
              {lang === 'uz' ? 'Qaytadan boshlang' : 'Начните заново'}
            </div>
          </div>
        </div>
      )}

      {/* Bottom hint */}
      {state === 'idle' && (
        <p className="absolute bottom-8 text-slate-700 text-xs font-medium">
          HR tizimi — ADA Lazzatli Sifat
        </p>
      )}
    </div>
  )
}
