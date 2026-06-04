import { format, startOfWeek, endOfWeek } from 'date-fns'

export function formatTime(date: Date | string | null): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'HH:mm')
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd.MM.yyyy')
}

export function formatMoney(amount: number | bigint): string {
  const num = typeof amount === 'bigint' ? Number(amount) : amount
  return new Intl.NumberFormat('uz-UZ').format(num) + " so'm"
}

export function getWeekBounds(date: Date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return { start, end }
}

export function formatHours(hours: number, lang: 'uz' | 'ru'): string {
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return lang === 'uz' ? `${m} daq` : `${m} мин`
  if (m === 0) return lang === 'uz' ? `${h} soat` : `${h} ч`
  return lang === 'uz' ? `${h} soat ${m} daq` : `${h} ч ${m} мин`
}

export function calcHoursWorked(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime()
  return Math.round((ms / 1000 / 60 / 60) * 100) / 100
}


export function dayName(day: number, lang: 'uz' | 'ru'): string {
  const uz = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh']
  const ru = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  return lang === 'uz' ? uz[day] : ru[day]
}
