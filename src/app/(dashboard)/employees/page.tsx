'use client'

import { useEffect, useState } from 'react'
import EmployeeModal from '@/components/EmployeeModal'
import FaceEnrollModal from '@/components/FaceEnrollModal'
import { useLang } from '@/components/LanguageProvider'
import { useAuth } from '@/components/AuthProvider'
import toast from 'react-hot-toast'

interface Employee {
  id: string
  name: string
  role: string
  hourlyRate: number
  phone: string
  active: boolean
  faceDescriptor: number[]
}

function Avatar({ name, active }: { name: string; active: boolean }) {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const colors = ['bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-pink-500']
  const color = active ? colors[name.charCodeAt(0) % colors.length] : 'bg-slate-200'
  return (
    <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
      {initials}
    </div>
  )
}

export default function EmployeesPage() {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [enrollFor, setEnrollFor] = useState<Employee | null>(null)
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<Employee | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = () =>
    fetch('/api/employees').then((r) => r.json()).then(setEmployees)

  useEffect(() => { load() }, [])

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  )

  const roleLabel = (role: string) => {
    if (role === 'DIRECTOR') return t('director')
    if (role === 'HR') return t('hr')
    return t('employee')
  }

  const rolePill = (role: string) => {
    if (role === 'DIRECTOR')
      return <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-violet-50 text-violet-600">{roleLabel('DIRECTOR')}</span>
    if (role === 'HR')
      return <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-sky-50 text-sky-600">{roleLabel('HR')}</span>
    return <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-500">{roleLabel('EMPLOYEE')}</span>
  }

  const deleteEmployee = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    const res = await fetch(`/api/employees/${deleteConfirm.id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) { toast.success(lang === 'uz' ? 'Xodim o\'chirildi' : 'Сотрудник удалён'); setDeleteConfirm(null); load() }
    else toast.error(t('error'))
  }

  const toggleActive = async (emp: Employee) => {
    const res = await fetch(`/api/employees/${emp.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...emp, active: !emp.active }),
    })
    if (res.ok) { toast.success(t('success')); load() }
    else toast.error(t('error'))
  }

  const activeCount = filtered.filter((e) => e.active).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('employees')}</h1>
          <p className="text-slate-400 text-sm mt-0.5 font-medium">
            {lang === 'uz' ? `${activeCount} faol xodim` : `${activeCount} активных сотрудников`}
          </p>
        </div>
        <button
          onClick={() => { setEditEmployee(null); setShowModal(true) }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 shadow-sm shadow-amber-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t('addEmployee')}
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-xs">
        <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-300 transition-all shadow-sm"
          placeholder={t('search') + '...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100">
              <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('employeeName')}</th>
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('role')}</th>
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('hourlyRate')}</th>
<th className="px-4 py-3.5 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {lang === 'uz' ? 'Yuz ID' : 'Face ID'}
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t('status')}</th>
              <th className="px-4 py-3.5 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-14 text-center">
                  <div className="text-2xl mb-2">👥</div>
                  <p className="text-slate-400 text-sm">{t('noEmployees')}</p>
                </td>
              </tr>
            )}
            {filtered.map((emp) => (
              <tr key={emp.id} className={`hover:bg-slate-50/60 transition-colors duration-100 ${!emp.active ? 'opacity-50' : ''}`}>
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={emp.name} active={emp.active} />
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{emp.name}</div>
                      {emp.phone && <div className="text-xs text-slate-400 mt-0.5">{emp.phone}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">{rolePill(emp.role)}</td>
                <td className="px-4 py-3.5 text-slate-700 font-semibold text-sm tabular-nums">
                  {emp.hourlyRate.toLocaleString()}
                  <span className="text-slate-400 font-normal text-xs ml-0.5">{t('soum')}</span>
                </td>
<td className="px-4 py-3.5 text-center">
                  {emp.faceDescriptor.length > 0 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-100 text-slate-400 rounded-full">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                    emp.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {emp.active ? t('active') : t('inactive')}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-0.5 justify-end">
                    <button
                      onClick={() => { setEditEmployee(emp); setShowModal(true) }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                      title={t('editEmployee')}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setEnrollFor(emp)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                      title={t('enrollFace')}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82V15a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                      </svg>
                    </button>
                    {user?.role === 'DIRECTOR' && (
                      <>
                        <button
                          onClick={() => toggleActive(emp)}
                          className={`p-1.5 rounded-lg transition-all ${
                            emp.active
                              ? 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={emp.active ? t('deactivate') : t('activate')}
                        >
                          {emp.active ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(emp)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title={lang === 'uz' ? 'O\'chirish' : 'Удалить'}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <EmployeeModal
          employee={editEmployee}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load() }}
        />
      )}
      {enrollFor && (
        <FaceEnrollModal
          employeeId={enrollFor.id}
          employeeName={enrollFor.name}
          onClose={() => setEnrollFor(null)}
          onEnrolled={() => { setEnrollFor(null); load() }}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              {lang === 'uz' ? 'Xodimni o\'chirish' : 'Удалить сотрудника'}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {lang === 'uz'
                ? `"${deleteConfirm.name}" xodimi va uning barcha ma'lumotlari o'chiriladi. Bu amalni qaytarib bo'lmaydi.`
                : `Сотрудник "${deleteConfirm.name}" и все его данные будут удалены. Это действие необратимо.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {lang === 'uz' ? 'Bekor qilish' : 'Отмена'}
              </button>
              <button
                onClick={deleteEmployee}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {lang === 'uz' ? 'O\'chirish' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
