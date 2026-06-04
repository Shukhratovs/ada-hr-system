'use client'

import { useEffect, useState } from 'react'
import { useLang } from '@/components/LanguageProvider'
import toast from 'react-hot-toast'

interface ProfileData {
  id: string
  name: string
  role: string
  hourlyRate: number
  phone: string | null
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const colors = ['bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-pink-500']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`${color} w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0`}>
      {initials}
    </div>
  )
}

export default function ProfilePage() {
  const { t, lang } = useLang()
  const [profile, setProfile] = useState<ProfileData | null>(null)

  const [name, setName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingInfo, setSavingInfo] = useState(false)
  const [savingPass, setSavingPass] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        setProfile(data)
        setName(data.name)
      })
  }, [])

  const saveInfo = async () => {
    if (!name.trim()) return toast.error(t('required'))
    setSavingInfo(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error()
      toast.success(lang === 'uz' ? "Ma'lumotlar saqlandi" : 'Данные сохранены')
      setTimeout(() => window.location.reload(), 800)
    } catch {
      toast.error(t('error'))
    } finally {
      setSavingInfo(false)
    }
  }

  const savePassword = async () => {
    if (!currentPassword) return toast.error(lang === 'uz' ? 'Joriy parolni kiriting' : 'Введите текущий пароль')
    if (!newPassword) return toast.error(lang === 'uz' ? 'Yangi parol kiriting' : 'Введите новый пароль')
    if (newPassword.length < 6) return toast.error(lang === 'uz' ? "Parol kamida 6 ta belgidan iborat bo'lishi kerak" : 'Пароль должен быть не менее 6 символов')
    if (newPassword !== confirmPassword) return toast.error(lang === 'uz' ? 'Parollar mos kelmadi' : 'Пароли не совпадают')
    setSavingPass(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, currentPassword, newPassword }),
      })
      const data = await res.json()
      if (data.error === 'WRONG_PASSWORD') {
        toast.error(lang === 'uz' ? "Joriy parol noto'g'ri" : 'Неверный текущий пароль')
        return
      }
      if (!res.ok) throw new Error()
      toast.success(lang === 'uz' ? 'Parol yangilandi' : 'Пароль обновлён')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      toast.error(t('error'))
    } finally {
      setSavingPass(false)
    }
  }

  const roleLabel = (role: string) => {
    if (role === 'DIRECTOR') return t('director')
    if (role === 'HR') return t('hr')
    return t('employee')
  }

  const rolePillColor = (role: string) => {
    if (role === 'DIRECTOR') return 'bg-violet-50 text-violet-600'
    if (role === 'HR') return 'bg-sky-50 text-sky-600'
    return 'bg-slate-100 text-slate-500'
  }

  const inputClass = 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-300 transition-all'

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-amber-400 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {lang === 'uz' ? 'Mening profilim' : 'Мой профиль'}
        </h1>
        <p className="text-slate-400 text-sm mt-0.5 font-medium">
          {lang === 'uz' ? "Login ma'lumotlarini yangilang" : 'Обновите данные для входа'}
        </p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-50">
          <Avatar name={profile.name} />
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">{profile.name}</div>
            <span className={`inline-block mt-1.5 text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${rolePillColor(profile.role)}`}>
              {roleLabel(profile.role)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5 text-sm">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              {t('hourlyRate')}
            </p>
            <p className="text-slate-700 font-semibold tabular-nums">
              {profile.hourlyRate.toLocaleString()} {t('soum')}
            </p>
          </div>
          {profile.phone && (
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{t('phone')}</p>
              <p className="text-slate-700 font-semibold">{profile.phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit name */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
        <h2 className="text-sm font-bold text-slate-800 mb-0.5">
          {lang === 'uz' ? 'Ism (login)' : 'Имя (логин)'}
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          {lang === 'uz' ? 'Tizimga kirish uchun ishlatiladigan ism' : 'Имя, используемое для входа в систему'}
        </p>
        <div className="flex gap-3">
          <input
            className={`${inputClass} flex-1`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            onClick={saveInfo}
            disabled={savingInfo || name === profile.name}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-all whitespace-nowrap shadow-sm"
          >
            {savingInfo ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('loading')}
              </span>
            ) : t('save')}
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-sm font-bold text-slate-800 mb-0.5">
          {lang === 'uz' ? "Parolni o'zgartirish" : 'Изменить пароль'}
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          {lang === 'uz' ? 'Xavfsizlik uchun kuchli parol tanlang' : 'Выберите надёжный пароль для безопасности'}
        </p>
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              {lang === 'uz' ? 'Joriy parol' : 'Текущий пароль'}
            </label>
            <input type="password" className={inputClass} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              {lang === 'uz' ? 'Yangi parol' : 'Новый пароль'}
            </label>
            <input type="password" className={inputClass} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              {lang === 'uz' ? 'Yangi parolni tasdiqlang' : 'Подтвердите новый пароль'}
            </label>
            <input
              type="password"
              className={`${inputClass} ${confirmPassword && newPassword !== confirmPassword ? 'ring-2 ring-red-300 border-red-300 bg-red-50' : ''}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1.5 font-medium">
                {lang === 'uz' ? 'Parollar mos kelmadi' : 'Пароли не совпадают'}
              </p>
            )}
          </div>
          <div className="pt-1">
            <button
              onClick={savePassword}
              disabled={savingPass || !currentPassword || !newPassword || newPassword !== confirmPassword}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
            >
              {savingPass ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('loading')}
                </span>
              ) : (lang === 'uz' ? 'Parolni yangilash' : 'Обновить пароль')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
