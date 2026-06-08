'use client'

import { useState } from 'react'
import { useLang } from '@/components/LanguageProvider'
import { useAuth } from '@/components/AuthProvider'
import { formatMoney, formatHours } from '@/lib/utils'
import type { TranslationKey } from '@/lib/translations'
import { format, subDays } from 'date-fns'
import DateRangePicker from '@/components/DateRangePicker'

interface EmployeeStat {
  id: string
  name: string
  role: string
  hourlyRate: number
  presentDays: number
  absentDays: number
  totalHours: number
  totalEarnings: number
  totalAdvances: number
  debt: number
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

function RolePill({ role, t }: { role: string; t: (k: TranslationKey) => string }) {
  if (role === 'DIRECTOR') return <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-violet-50 text-violet-600">{t('director')}</span>
  if (role === 'HR') return <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-sky-50 text-sky-600">{t('hr')}</span>
  return <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-500">{t('employee')}</span>
}

export default function StatsPage() {
  const { t, lang } = useLang()
  const { user } = useAuth()

  const today = format(new Date(), 'yyyy-MM-dd')
  const monthStart = format(subDays(new Date(), 29), 'yyyy-MM-dd')

  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(today)
  const [stats, setStats] = useState<EmployeeStat[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  if (user?.role !== 'DIRECTOR') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400 text-sm">Access denied</p>
      </div>
    )
  }

  const load = async () => {
    if (!from || !to) return
    setLoading(true)
    try {
      const res = await fetch(`/api/stats?from=${from}&to=${to}`)
      const data = await res.json()
      setStats(data)
      setHasLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  const totalAbsent = stats?.reduce((s, e) => s + e.absentDays, 0) ?? 0
  const totalEarnings = stats?.reduce((s, e) => s + e.totalEarnings, 0) ?? 0
  const totalPresent = stats?.reduce((s, e) => s + e.presentDays, 0) ?? 0

  const dateRangeLabel = from && to
    ? `${format(new Date(from), 'dd.MM.yyyy')} – ${format(new Date(to), 'dd.MM.yyyy')}`
    : ''

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('stats')}</h1>
          <p className="text-slate-400 text-sm mt-0.5 font-medium">{t('statsSubtitle')}</p>
        </div>
      </div>

      {/* Date range filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-6">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          {lang === 'uz' ? 'Sana oralig\'ini tanlang' : 'Выберите период'}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <DateRangePicker
            from={from}
            to={to}
            onChange={(f, t) => { setFrom(f); setTo(t) }}
            maxDate={today}
            lang={lang}
          />
          <button
            onClick={load}
            disabled={loading || !from || !to}
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-amber-200 disabled:opacity-50 w-full sm:w-auto"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            )}
            {t('applyFilter')}
          </button>
        </div>
      </div>

      {/* Summary cards — only shown after first load */}
      {hasLoaded && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{totalPresent}</div>
            <div className="text-xs text-slate-500 font-medium mt-1.5">{t('presentDays')}</div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <div className="w-8 h-8 bg-red-100 text-red-500 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{totalAbsent}</div>
            <div className="text-xs text-slate-500 font-medium mt-1.5">{t('absentDays')}</div>
          </div>

          <div className="bg-slate-950 rounded-2xl shadow-sm border border-slate-800 p-4">
            <div className="w-8 h-8 bg-amber-500/15 text-amber-400 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-xl font-bold text-white tabular-nums leading-none">{formatMoney(totalEarnings)}</div>
            <div className="text-xs text-slate-500 font-medium mt-1.5">{lang === 'uz' ? 'Jami maosh' : 'Итого зарплата'}</div>
          </div>
        </div>
      )}

      {/* Table */}
      {hasLoaded && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Table header with date range */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
            <h2 className="text-sm font-semibold text-slate-800">
              {lang === 'uz' ? 'Xodimlar bo\'yicha' : 'По сотрудникам'}
            </h2>
            <span className="text-xs text-slate-400 font-medium tabular-nums">{dateRangeLabel}</span>
          </div>

          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('employeeName')}</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('role')}</th>
                <th className="px-4 py-3.5 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('presentDays')}</th>
                <th className="px-4 py-3.5 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('absentDays')}</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('totalHours')}</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{lang === 'uz' ? 'Jami maosh' : 'Итого зарплата'}</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{lang === 'uz' ? 'Avanslar' : 'Авансы'}</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{lang === 'uz' ? 'Qarzlar' : 'Долги'}</th>
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
              {!loading && stats?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center">
                    <div className="text-2xl mb-2">📊</div>
                    <p className="text-slate-400 text-sm">{t('noStats')}</p>
                  </td>
                </tr>
              )}
              {!loading && stats?.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors duration-100">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={emp.name} />
                      <div>
                        <div className="font-semibold text-slate-800">{emp.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5 tabular-nums">
                          {emp.hourlyRate.toLocaleString()} {t('soum')}/{t('hour')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <RolePill role={emp.role} t={t} />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold tabular-nums">
                      {emp.presentDays}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-bold tabular-nums ${
                      emp.absentDays > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'
                    }`}>
                      {emp.absentDays}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800 tabular-nums">
                    {formatHours(emp.totalHours, lang)}
                  </td>
                  <td className="px-4 py-3.5 font-bold text-slate-900 tabular-nums">
                    {formatMoney(emp.totalEarnings)}
                  </td>
                  <td className="px-4 py-3.5 tabular-nums">
                    {emp.totalAdvances > 0 ? (
                      <span className="font-bold text-rose-500">−{formatMoney(emp.totalAdvances)}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 tabular-nums">
                    {emp.debt > 0 ? (
                      <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                        {formatMoney(emp.debt)}
                        <span className="text-[10px] bg-rose-100 text-rose-500 px-1.5 py-0.5 rounded-full font-semibold">
                          {lang === 'uz' ? 'qarz' : 'долг'}
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Initial empty state */}
      {!hasLoaded && !loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center py-20">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-slate-700 text-sm font-semibold">
            {lang === 'uz' ? 'Sana oralig\'ini tanlang' : 'Выберите период'}
          </p>
          <p className="text-slate-400 text-xs mt-1">
            {lang === 'uz' ? 'va "Ko\'rsatish" tugmasini bosing' : 'и нажмите "Показать"'}
          </p>
        </div>
      )}
    </div>
  )
}
