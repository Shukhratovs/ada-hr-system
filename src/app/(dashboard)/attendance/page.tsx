'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLang } from '@/components/LanguageProvider'
import { useAuth } from '@/components/AuthProvider'
import { formatTime, formatHours } from '@/lib/utils'
import toast from 'react-hot-toast'

interface AttendanceRecord {
  id: string
  date: string
  checkIn: string | null
  checkOut: string | null
  status: string
  hoursWorked: number | null
  employee: { id: string; name: string; role: string }
}

interface RawSession {
  id: string
  checkIn: string | null
  checkOut: string | null
  hoursWorked: number | null
  status: string
  employee: { id: string; name: string; role: string }
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

function SessionHistoryModal({
  employee,
  date,
  lang,
  onClose,
}: {
  employee: { id: string; name: string }
  date: string
  lang: 'uz' | 'ru'
  onClose: () => void
}) {
  const [sessions, setSessions] = useState<RawSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/attendance?date=${date}&employeeId=${employee.id}`)
      .then((r) => r.json())
      .then(setSessions)
      .finally(() => setLoading(false))
  }, [employee.id, date])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <div className="font-bold text-slate-900 text-base">{employee.name}</div>
            <div className="text-xs text-slate-400 mt-0.5">{date} — {lang === 'uz' ? 'Kirish-chiqish tarixi' : 'История входов-выходов'}</div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
              <div className="w-4 h-4 border-2 border-slate-200 border-t-amber-400 rounded-full animate-spin" />
              <span className="text-sm">{lang === 'uz' ? 'Yuklanmoqda...' : 'Загрузка...'}</span>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              {lang === 'uz' ? 'Bugun ma\'lumot yo\'q' : 'Нет данных за этот день'}
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                  <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 flex items-center gap-2 text-sm">
                    <span className="font-semibold text-slate-800 tabular-nums">{s.checkIn ? formatTime(s.checkIn) : '—'}</span>
                    <svg className="w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    <span className={`font-semibold tabular-nums ${s.checkOut ? 'text-slate-800' : 'text-slate-400'}`}>
                      {s.checkOut ? formatTime(s.checkOut) : (lang === 'uz' ? 'Ishda' : 'На работе')}
                    </span>
                  </div>
                  {s.hoursWorked != null ? (
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full tabular-nums">
                      {formatHours(s.hoursWorked, lang)}
                    </span>
                  ) : !s.checkOut ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ) : null}
                </div>
              ))}
              {sessions.length > 1 && (
                <div className="flex items-center justify-between pt-2 px-1 text-xs text-slate-500 font-medium">
                  <span>{lang === 'uz' ? `${sessions.length} ta seans` : `${sessions.length} сеанса`}</span>
                  <span className="font-bold text-slate-700">
                    {formatHours(sessions.reduce((sum, s) => sum + (s.hoursWorked ?? 0), 0), lang)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ManualEntryModal({ onClose, onSaved, defaultDate, lang }: {
  onClose: () => void
  onSaved: () => void
  defaultDate: string
  lang: string
}) {
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([])
  const [employeeId, setEmployeeId] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [checkIn, setCheckIn] = useState('09:00')
  const [checkOut, setCheckOut] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/employees').then(r => r.json()).then(setEmployees)
  }, [])

  // When employee or date changes, pre-fill checkIn from existing kiosk record if available
  useEffect(() => {
    if (!employeeId || !date) { setCheckIn('09:00'); setCheckOut(''); return }
    fetch(`/api/attendance?date=${date}&employeeId=${employeeId}`)
      .then(r => r.json())
      .then((sessions: Array<{ checkIn: string | null; checkOut: string | null }>) => {
        if (!sessions.length) { setCheckIn('09:00'); setCheckOut(''); return }
        // Find last open session (no checkout) — that's the one we likely want to add checkout for
        const openSession = [...sessions].reverse().find(s => s.checkIn && !s.checkOut)
        if (openSession?.checkIn) {
          const t = new Date(openSession.checkIn)
          setCheckIn(t.getHours().toString().padStart(2, '0') + ':' + t.getMinutes().toString().padStart(2, '0'))
          setCheckOut('')
        } else {
          setCheckIn('09:00')
          setCheckOut('')
        }
      })
  }, [employeeId, date])

  const submit = async () => {
    if (!employeeId || !date || !checkIn) return
    setSaving(true)
    // Convert local time to UTC ISO — browser knows the user's timezone
    const checkInISO = new Date(date + 'T' + checkIn).toISOString()
    const checkOutISO = checkOut ? new Date(date + 'T' + checkOut).toISOString() : null
    const res = await fetch('/api/attendance/manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, date, checkInISO, checkOutISO }),
    })
    setSaving(false)
    if (res.ok) { toast.success(lang === 'uz' ? 'Qo\'shildi' : 'Добавлено'); onSaved(); onClose() }
    else toast.error(lang === 'uz' ? 'Xato' : 'Ошибка')
  }

  const inputClass = 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-300 transition-all'

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{lang === 'uz' ? 'Qo\'lda kirish qo\'shish' : 'Добавить вручную'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{lang === 'uz' ? 'Unutilgan kirish uchun' : 'Для забытой отметки'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{lang === 'uz' ? 'Xodim' : 'Сотрудник'}</label>
            <select className={inputClass} value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
              <option value="">{lang === 'uz' ? 'Tanlang...' : 'Выберите...'}</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{lang === 'uz' ? 'Sana' : 'Дата'}</label>
            <input type="date" className={inputClass} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{lang === 'uz' ? 'Kirish vaqti' : 'Время входа'}</label>
              <input type="time" className={inputClass} value={checkIn} onChange={e => setCheckIn(e.target.value)} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{lang === 'uz' ? 'Chiqish vaqti' : 'Время выхода'}</label>
              <input type="time" className={inputClass} value={checkOut} onChange={e => setCheckOut(e.target.value)} placeholder={lang === 'uz' ? 'Ixtiyoriy' : 'Необязательно'} />
            </div>
          </div>
        </div>
        <div className="flex gap-2.5 px-6 pb-6">
          <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all">
            {lang === 'uz' ? 'Bekor' : 'Отмена'}
          </button>
          <button onClick={submit} disabled={saving || !employeeId || !date || !checkIn} className="flex-1 bg-amber-500 hover:bg-amber-400 text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all">
            {saving ? '...' : (lang === 'uz' ? 'Saqlash' : 'Сохранить')}
          </button>
        </div>
      </div>
    </div>
  )
}

function AttendancePageInner() {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [filter, setFilter] = useState(() => searchParams.get('filter') ?? 'ALL')
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'checkIn' | 'checkOut' | 'hoursWorked'>('checkIn')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null)
  const [showManualEntry, setShowManualEntry] = useState(false)

  const toggleSort = (col: 'checkIn' | 'checkOut' | 'hoursWorked') => {
    if (sortBy === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  useEffect(() => {
    setLoading(true)
    fetch(`/api/attendance?date=${date}`)
      .then((r) => r.json())
      .then(setRecords)
      .finally(() => setLoading(false))
  }, [date])

  const isAtWork = (r: AttendanceRecord) => (r.status === 'PRESENT' || r.status === 'LATE') && !r.checkOut

  const filtered = records
    .filter((r) =>
      filter === 'ALL' ||
      (filter === 'PRESENT' ? isAtWork(r) : !isAtWork(r))
    )
    .sort((a, b) => {
      // Always push no-checkin rows to the bottom
      if (!a.checkIn && !b.checkIn) return a.employee.name.localeCompare(b.employee.name)
      if (!a.checkIn) return 1
      if (!b.checkIn) return -1

      const dir = sortDir === 'asc' ? 1 : -1
      if (sortBy === 'checkIn') {
        return (new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime()) * dir
      }
      if (sortBy === 'checkOut') {
        if (!a.checkOut && !b.checkOut) return 0
        if (!a.checkOut) return 1
        if (!b.checkOut) return -1
        return (new Date(a.checkOut).getTime() - new Date(b.checkOut).getTime()) * dir
      }
      if (sortBy === 'hoursWorked') {
        return ((a.hoursWorked ?? 0) - (b.hoursWorked ?? 0)) * dir
      }
      return 0
    })

  const counts = {
    all: records.length,
    present: records.filter(isAtWork).length,
    absent: records.filter((r) => !isAtWork(r)).length,
  }

  const statusBadge = (status: string, checkOut: string | null) => {
    const atWork = (status === 'PRESENT' || status === 'LATE') && !checkOut
    if (atWork)
      return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{t('present')}</span>
    return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-500"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />{t('absent')}</span>
  }

  const filters = [
    { key: 'ALL', label: t('allStatuses'), count: counts.all },
    { key: 'PRESENT', label: t('present'), count: counts.present },
    { key: 'ABSENT', label: t('absent'), count: counts.absent },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('attendance')}</h1>
          <p className="text-slate-400 text-sm mt-0.5 font-medium">
            {lang === 'uz' ? `${records.length} ta xodim` : `${records.length} сотрудников`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(user?.role === 'DIRECTOR' || user?.role === 'HR') && (
            <button
              onClick={() => setShowManualEntry(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {lang === 'uz' ? 'Qo\'lda qo\'shish' : 'Добавить вручную'}
            </button>
          )}
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input
              type="date"
              className="pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-300 transition-all shadow-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
              filter === f.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 shadow-sm'
            }`}
          >
            {f.label}
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold tabular-nums ${
              filter === f.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100">
              <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('employeeName')}</th>
              {(['checkIn', 'checkOut', 'hoursWorked'] as const).map((col) => (
                <th key={col} className="px-4 py-3.5 text-left">
                  <button
                    onClick={() => toggleSort(col)}
                    className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider transition-colors hover:text-slate-700 group"
                    style={{ color: sortBy === col ? '#0f172a' : undefined }}
                  >
                    <span className={sortBy === col ? 'text-slate-800' : 'text-slate-400'}>
                      {col === 'checkIn' ? t('checkIn') : col === 'checkOut' ? t('checkOut') : t('hoursWorked')}
                    </span>
                    <span className={`flex flex-col gap-px ${sortBy === col ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'}`}>
                      <svg className={`w-2.5 h-2.5 ${sortBy === col && sortDir === 'asc' ? 'text-slate-800' : 'text-slate-400'}`} viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L10 6H0L5 0Z"/></svg>
                      <svg className={`w-2.5 h-2.5 ${sortBy === col && sortDir === 'desc' ? 'text-slate-800' : 'text-slate-400'}`} viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10L5 6Z"/></svg>
                    </span>
                  </button>
                </th>
              ))}
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('status')}</th>
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{lang === 'uz' ? 'Tarix' : 'История'}</th>
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
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-14 text-center">
                  <div className="text-2xl mb-2">📅</div>
                  <p className="text-slate-400 text-sm">{t('noAttendance')}</p>
                </td>
              </tr>
            )}
            {!loading && filtered.map((r) => {
              const noRecord = r.status === 'ABSENT' && !r.checkIn
              return (
                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors duration-100">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.employee.name} />
                      <span className={`font-semibold text-sm ${noRecord ? 'text-slate-400' : 'text-slate-800'}`}>{r.employee.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {r.checkIn ? (
                      <span className="font-semibold text-slate-800 tabular-nums">{formatTime(r.checkIn)}</span>
                    ) : (
                      <span className="text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                        {lang === 'uz' ? 'Kelmagan' : 'Не пришёл'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {r.checkOut ? (
                      <span className="font-semibold text-slate-800 tabular-nums">{formatTime(r.checkOut)}</span>
                    ) : noRecord ? (
                      <span className="text-slate-300">—</span>
                    ) : (
                      <span className="text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                        {t('notCheckedOut')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {r.hoursWorked != null ? (
                      <span className="font-semibold text-slate-800 tabular-nums">
                        {formatHours(r.hoursWorked, lang)}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">{statusBadge(r.status, r.checkOut)}</td>
                  <td className="px-4 py-3.5">
                    {!noRecord ? (
                      <button
                        onClick={() => setSelectedEmployee({ id: r.employee.id, name: r.employee.name })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-600 text-slate-600 text-xs font-semibold transition-all border border-transparent hover:border-amber-200"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {lang === 'uz' ? 'Tarix' : 'История'}
                      </button>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>

      {selectedEmployee && (
        <SessionHistoryModal
          employee={selectedEmployee}
          date={date}
          lang={lang as 'uz' | 'ru'}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
      {showManualEntry && (
        <ManualEntryModal
          defaultDate={date}
          lang={lang}
          onClose={() => setShowManualEntry(false)}
          onSaved={() => {
            setShowManualEntry(false)
            fetch(`/api/attendance?date=${date}`).then(r => r.json()).then(setRecords)
          }}
        />
      )}
    </div>
  )
}

export default function AttendancePage() {
  return (
    <Suspense>
      <AttendancePageInner />
    </Suspense>
  )
}
