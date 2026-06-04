'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { useLang } from '@/components/LanguageProvider'
import Logo from '@/components/Logo'

export default function LoginPage() {
  const { t, lang, setLang } = useLang()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      })
      if (!res.ok) {
        toast.error(t('invalidCredentials'))
        return
      }
      window.location.href = '/dashboard'
    } catch {
      toast.error(t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.06)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(99,102,241,0.04)_0%,_transparent_60%)]" />

        <div className="relative flex items-center gap-3">
          <Logo size="md" />
          <div>
            <div className="text-white font-bold text-lg leading-tight tracking-tight">ADA Lazzatli Sifat</div>
            <div className="text-slate-500 text-xs mt-0.5">HR Management System</div>
          </div>
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-amber-400 text-xs font-semibold">
              {lang === 'uz' ? 'Faol tizim' : 'Система активна'}
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight">
            {lang === 'uz'
              ? "Xodimlarni\nboshqarish\nendi osonroq"
              : "Управление\nперсоналом\nстало проще"}
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
            {lang === 'uz'
              ? "Davomat, maosh va xodimlarni bir joyda boshqaring. Yuzni tanish orqali avtomatik kirish-chiqish."
              : "Управляйте посещаемостью, зарплатой и сотрудниками в одном месте."}
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-3">
          {[
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
              label: lang === 'uz' ? 'Xodimlar' : 'Сотрудники',
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              ),
              label: lang === 'uz' ? 'Davomat' : 'Посещаемость',
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              label: lang === 'uz' ? 'Maosh' : 'Зарплата',
            },
          ].map((item) => (
            <div key={item.label} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-2.5 backdrop-blur-sm">
              <div className="text-amber-400">{item.icon}</div>
              <div className="text-slate-400 text-xs font-medium">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <Logo size="sm" />
            <div>
              <div className="font-bold text-slate-900 text-sm">ADA Lazzatli Sifat</div>
              <div className="text-slate-400 text-xs">HR Management</div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('loginTitle')}</h2>
            <p className="text-slate-400 text-sm mt-1.5">{t('loginSubtitle')}</p>
          </div>

          {/* Access notice */}
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-3 mb-6">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              {lang === 'uz'
                ? 'Faqat Direktor va HR xodimlari kira oladi'
                : 'Только Директор и HR могут войти в систему'}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                {t('name')}
              </label>
              <input
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-300 transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={lang === 'uz' ? 'Ismingizni kiriting' : 'Введите имя'}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                {t('password')}
              </label>
              <input
                type="password"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-300 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-white py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 shadow-sm shadow-amber-200 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('loading')}
                </span>
              ) : t('loginButton')}
            </button>
          </form>

          {/* Lang toggle */}
          <div className="flex justify-center gap-1 mt-8 bg-slate-100 rounded-xl p-1">
            {(['uz', 'ru'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  lang === l
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
