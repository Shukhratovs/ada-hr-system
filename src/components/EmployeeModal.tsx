'use client'

import { useState, useEffect } from 'react'
import { useLang } from './LanguageProvider'
import toast from 'react-hot-toast'

interface Employee {
  id?: string
  name: string
  role: string
  hourlyRate: number | ''
  sundayRate?: number | null
  phone: string
  pin?: string | null
  active?: boolean
}

interface Props {
  employee?: Employee | null
  onClose: () => void
  onSaved: () => void
}

export default function EmployeeModal({ employee, onClose, onSaved }: Props) {
  const { t, lang } = useLang()

  const [form, setForm] = useState<Employee>({
    name: '',
    role: 'EMPLOYEE',
    hourlyRate: '',
    sundayRate: null,
    phone: '',
  })
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (employee) setForm({ ...form, ...employee })
  }, [employee])

  const submit = async () => {
    if (!form.name.trim()) return toast.error(t('required'))
    if (!form.hourlyRate || Number(form.hourlyRate) <= 0) {
      return toast.error(lang === 'uz' ? 'Soatlik ish haqini kiriting' : 'Введите почасовую ставку')
    }
    if ((form.role === 'HR' || form.role === 'DIRECTOR') && !employee?.id && !password) {
      return toast.error(
        lang === 'uz'
          ? 'HR va Direktor uchun parol kiritish shart'
          : 'Для HR и Директора пароль обязателен'
      )
    }
    setSaving(true)
    try {
      const body: Record<string, unknown> = { ...form }
      if (password) body.password = password
      if (pin) body.pin = pin

      const url = employee?.id ? `/api/employees/${employee.id}` : '/api/employees'
      const method = employee?.id ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error()
      toast.success(t('success'))
      onSaved()
    } catch {
      toast.error(t('error'))
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-300 transition-all'

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {employee?.id ? t('editEmployee') : t('addEmployee')}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {employee?.id
                ? (lang === 'uz' ? "Ma'lumotlarni yangilang" : 'Обновите данные')
                : (lang === 'uz' ? "Yangi xodim qo'shing" : 'Добавьте нового сотрудника')}
            </p>
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

        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              {t('employeeName')}
            </label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={lang === 'uz' ? 'Ism va familiya' : 'Имя и фамилия'}
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              {t('role')}
            </label>
            <select
              className={inputClass}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="EMPLOYEE">{t('employee')}</option>
              <option value="HR">{t('hr')}</option>
              <option value="DIRECTOR">{t('director')}</option>
            </select>
          </div>

          {/* Hourly rates: regular (Mon–Sat) + Sunday */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                {lang === 'uz' ? 'Oddiy kunlar (Du–Sha)' : 'Обычные дни (Пн–Сб)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={form.hourlyRate}
                  onChange={(e) => setForm({ ...form, hourlyRate: e.target.value === '' ? '' : Number(e.target.value) })}
                  placeholder="0"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium pointer-events-none">
                  {t('soum')}/{t('hour')}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                {lang === 'uz' ? 'Yakshanba' : 'Воскресенье'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={form.sundayRate ?? ''}
                  onChange={(e) => setForm({ ...form, sundayRate: e.target.value === '' ? null : Number(e.target.value) })}
                  placeholder={form.hourlyRate ? String(form.hourlyRate) : '0'}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-medium pointer-events-none">
                  {t('soum')}/{t('hour')}
                </span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 -mt-2">
            {lang === 'uz'
              ? "Yakshanba bo'sh qolsa, oddiy stavka qo'llanadi"
              : 'Если воскресенье пустое, применяется обычная ставка'}
          </p>

          {/* Phone */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              {t('phone')}
            </label>
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+998 90 000 00 00"
            />
          </div>

          {/* PIN — for kiosk check-in (EMPLOYEE role) */}
          {form.role === 'EMPLOYEE' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                {lang === 'uz' ? 'Kiosk PIN (4 raqam)' : 'PIN для киоска (4 цифры)'}
              </label>
              <input
                className={inputClass}
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder={employee?.pin ? '••••' : '1234'}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {lang === 'uz'
                  ? "Xodim kioskda shu PIN bilan kiradi. Bo'sh qoldiring — o'zgarmaydi."
                  : 'Сотрудник входит в киоск с этим PIN. Оставьте пустым — не изменится.'}
              </p>
            </div>
          )}

          {/* Password — required for HR/Director */}
          {(form.role === 'HR' || form.role === 'DIRECTOR') && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <label className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                  {t('password')}
                  {!employee?.id && <span className="text-red-500 ml-1">*</span>}
                  {employee?.id && (
                    <span className="text-amber-500 font-normal normal-case tracking-normal ml-1">
                      ({lang === 'uz' ? 'yangilash uchun' : 'для обновления'})
                    </span>
                  )}
                </label>
              </div>
              <p className="text-xs text-amber-600">
                {lang === 'uz'
                  ? "Bu xodim tizimga kirish uchun parol kerak bo'ladi"
                  : 'Этот сотрудник нуждается в пароле для входа в систему'}
              </p>
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={employee?.id ? '••••••••' : lang === 'uz' ? 'Parol kiriting' : 'Введите пароль'}
                required={!employee?.id}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all"
          >
            {t('cancel')}
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all shadow-sm shadow-amber-200"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('loading')}
              </span>
            ) : t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}
