'use client'

import { useEffect, useState, useRef } from 'react'
import { useLang } from '@/components/LanguageProvider'
import { useAuth } from '@/components/AuthProvider'
import { formatMoney, formatHours } from '@/lib/utils'
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns'
import toast from 'react-hot-toast'

interface AdvanceRecord {
  id: string
  amount: string
  note: string | null
  date: string
}

interface PayrollRecord {
  id: string
  totalHours: number
  grossPay: string
  totalAdvances: string
  netPay: string
  weekStart: string
  weekEnd: string
  employee: { id: string; name: string; role: string; hourlyRate: number }
  advances: AdvanceRecord[]
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const colors = ['bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-pink-500']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`w-8 h-8 ${color} rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
      {initials}
    </div>
  )
}

interface AdvanceModalProps {
  employee: { id: string; name: string }
  weekDate: Date
  onClose: () => void
  onSaved: () => void
  lang: string
}

function AdvanceModal({ employee, weekDate, onClose, onSaved, lang }: AdvanceModalProps) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return
    setSaving(true)
    const res = await fetch('/api/advances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeId: employee.id,
        amount: Number(amount),
        note: note || null,
        date: weekDate.toISOString(),
      }),
    })
    if (res.ok) {
      onSaved()
      onClose()
    } else {
      toast.error(lang === 'uz' ? 'Xato' : 'Ошибка')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-base font-bold text-slate-900 mb-1">
          {lang === 'uz' ? 'Avans berish' : 'Выдать аванс'}
        </h2>
        <p className="text-sm text-slate-400 mb-5">{employee.name}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              {lang === 'uz' ? 'Summa (so\'m)' : 'Сумма (сум)'}
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              {lang === 'uz' ? 'Izoh (ixtiyoriy)' : 'Примечание (необязательно)'}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={lang === 'uz' ? 'Masalan: dori uchun' : 'Например: на лекарства'}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              {lang === 'uz' ? 'Bekor' : 'Отмена'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? '...' : (lang === 'uz' ? 'Saqlash' : 'Сохранить')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PayrollPage() {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const [weekDate, setWeekDate] = useState(new Date())
  const [records, setRecords] = useState<PayrollRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [advanceModal, setAdvanceModal] = useState<{ id: string; name: string } | null>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const calculatingRef = useRef(false)

  const weekStart = startOfWeek(weekDate, { weekStartsOn: 6 })
  const weekEnd = endOfWeek(weekDate, { weekStartsOn: 6 })
  const weekLabel = `${format(weekStart, 'dd.MM')} – ${format(weekEnd, 'dd.MM.yyyy')}`

  const load = () => {
    fetch(`/api/payroll?week=${weekDate.toISOString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRecords(data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setLoading(true)
    setRecords([])
    if (calculatingRef.current) return
    calculatingRef.current = true
    fetch('/api/payroll/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ week: weekDate.toISOString() }),
    }).finally(() => {
      calculatingRef.current = false
      load()
    })
  }, [weekDate])

  const deleteAdvance = async (advId: string) => {
    const res = await fetch(`/api/advances/${advId}`, { method: 'DELETE' })
    if (res.ok) {
      // Recalculate silently after deleting advance
      await fetch('/api/payroll/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week: weekDate.toISOString() }),
      })
      load()
    } else toast.error(t('error'))
  }

  const totalAdvances = records.reduce((sum, r) => sum + Number(r.totalAdvances), 0)
  const totalNet = records.reduce((sum, r) => sum + Number(r.netPay), 0)
  const totalHours = records.reduce((sum, r) => sum + r.totalHours, 0)

  const canEdit = user?.role === 'DIRECTOR' || user?.role === 'HR'

  return (
    <div>
      {advanceModal && (
        <AdvanceModal
          employee={advanceModal}
          weekDate={weekDate}
          onClose={() => setAdvanceModal(null)}
          onSaved={() => {
            // Recalculate silently after adding advance
            fetch('/api/payroll/calculate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ week: weekDate.toISOString() }),
            }).finally(load)
          }}
          lang={lang}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('payroll')}</h1>
          <p className="text-slate-400 text-sm mt-0.5 font-medium">{weekLabel}</p>
        </div>
        {/* Week nav */}
        <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setWeekDate(subWeeks(weekDate, 1))}
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors border-r border-slate-100"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-slate-700 px-4 min-w-36 text-center tabular-nums">{weekLabel}</span>
          <button
            onClick={() => setWeekDate(addWeeks(weekDate, 1))}
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors border-l border-slate-100"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {records.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {lang === 'uz' ? 'Xodimlar' : 'Сотрудников'}
            </p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{records.length}</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('totalHours')}</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{formatHours(totalHours, lang)}</p>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {lang === 'uz' ? 'Avanslar' : 'Авансы'}
            </p>
            <p className="text-xl font-bold text-rose-500 tabular-nums leading-none">{formatMoney(totalAdvances)}</p>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {lang === 'uz' ? 'Sof maosh' : 'Чистая зарплата'}
            </p>
            <p className="text-xl font-bold text-white tabular-nums leading-none">{formatMoney(totalNet)}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100">
              <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('employeeName')}</th>
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('hourlyRate')}</th>
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('totalHours')}</th>
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('grossPay')}</th>
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {lang === 'uz' ? 'Avans' : 'Аванс'}
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {lang === 'uz' ? 'Sof maosh' : 'К выплате'}
              </th>
              {canEdit && (
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('actions')}</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading && (
              <tr>
                <td colSpan={7} className="px-6 py-14 text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <div className="w-5 h-5 border-2 border-slate-200 border-t-amber-400 rounded-full animate-spin" />
                    <span className="text-sm">{t('loading')}</span>
                  </div>
                </td>
              </tr>
            )}
            {!loading && records.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-14 text-center">
                  <div className="text-2xl mb-2">💰</div>
                  <p className="text-slate-400 text-sm">{t('noPayroll')}</p>
                </td>
              </tr>
            )}
            {!loading && records.map((r) => (
              <>
                <tr
                  key={r.id}
                  className="hover:bg-slate-50/60 transition-colors duration-100 cursor-pointer"
                  onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.employee.name} />
                      <div>
                        <span className="font-semibold text-slate-800">{r.employee.name}</span>
                        {r.advances.length > 0 && (
                          <div className="text-[10px] font-bold text-rose-400 mt-0.5">
                            {r.advances.length} avans
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 tabular-nums text-sm">
                    {r.employee.hourlyRate.toLocaleString()}
                    <span className="text-slate-400 text-xs ml-0.5">{t('soum')}</span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800 tabular-nums">
                    {formatHours(r.totalHours, lang)}
                  </td>
                  <td className="px-4 py-3.5 tabular-nums text-sm">
                    {Number(r.totalAdvances) > 0
                      ? <span className="text-slate-400 line-through decoration-slate-300">{formatMoney(Number(r.grossPay))}</span>
                      : <span className="font-bold text-slate-900">{formatMoney(Number(r.grossPay))}</span>}
                  </td>
                  <td className="px-4 py-3.5 tabular-nums">
                    {Number(r.totalAdvances) > 0 ? (
                      <span className="font-semibold text-rose-500">−{formatMoney(Number(r.totalAdvances))}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-bold tabular-nums">
                    {Number(r.netPay) < 0 ? (
                      <span className="text-rose-600">
                        −{formatMoney(Math.abs(Number(r.netPay)))}
                        <span className="text-[10px] font-semibold ml-1 bg-rose-100 text-rose-500 px-1.5 py-0.5 rounded-full">
                          {lang === 'uz' ? 'qarz' : 'долг'}
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-900">{formatMoney(Number(r.netPay))}</span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); setAdvanceModal({ id: r.employee.id, name: r.employee.name }) }}
                        className="text-xs text-amber-500 hover:text-amber-700 font-semibold hover:underline transition-colors"
                      >
                        + {lang === 'uz' ? 'Avans' : 'Аванс'}
                      </button>
                    </td>
                  )}
                </tr>
                {expandedRow === r.id && r.advances.length > 0 && (
                  <tr key={`${r.id}-advances`} className="bg-rose-50/40">
                    <td colSpan={canEdit ? 7 : 6} className="px-6 py-3">
                      <div className="flex flex-wrap gap-2">
                        {r.advances.map((adv) => (
                          <div key={adv.id} className="flex items-center gap-2 bg-white border border-rose-100 rounded-xl px-3 py-1.5 text-xs">
                            <span className="font-bold text-rose-500">−{formatMoney(Number(adv.amount))}</span>
                            <span className="text-slate-400">{format(new Date(adv.date), 'dd.MM')}</span>
                            {adv.note && <span className="text-slate-500">{adv.note}</span>}
                            {canEdit && (
                              <button
                                onClick={() => deleteAdvance(adv.id)}
                                className="text-slate-300 hover:text-rose-400 transition-colors ml-1"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
