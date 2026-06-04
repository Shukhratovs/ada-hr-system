export type Lang = 'uz' | 'ru'

const uz = {
  // Auth
  login: "Kirish",
  logout: "Chiqish",
  password: "Parol",
  loginButton: "Tizimga kirish",
  loginTitle: "HR Tizimi",
  loginSubtitle: "Kekin lavozimingiz bilan kiring",
  invalidCredentials: "Noto'g'ri login yoki parol",

  // Nav
  dashboard: "Bosh sahifa",
  employees: "Xodimlar",
  attendance: "Davomat",
  payroll: "Maosh",
  kiosk: "Kiosk",
  settings: "Sozlamalar",

  // Dashboard
  presentToday: "Hozir ishda",
  absentToday: "Ishda emas",
  totalEmployees: "Jami xodimlar",
  weeklyPayroll: "Haftalik maosh",
  recentCheckins: "So'nggi kirish-chiqishlar",
  noActivity: "Bugun hech qanday faoliyat yo'q",

  // Employees
  addEmployee: "Xodim qo'shish",
  editEmployee: "Xodimni tahrirlash",
  employeeName: "Ism familiya",
  role: "Lavozim",
  hourlyRate: "Soatlik ish haqi (so'm)",
  phone: "Telefon",
  enrollFace: "Yuzni ro'yxatdan o'tkazish",
  faceEnrolled: "Yuz ro'yxatdan o'tgan",
  faceNotEnrolled: "Yuz ro'yxatdan o'tmagan",
  active: "Faol",
  inactive: "Faol emas",
  save: "Saqlash",
  cancel: "Bekor qilish",
  delete: "O'chirish",
  confirm: "Tasdiqlash",
  deactivate: "Faolsizlantirish",
  activate: "Faollashtirish",
  noEmployees: "Xodimlar mavjud emas",
  director: "Direktor",
  hr: "HR",
  employee: "Xodim",

  // Work days
  mon: "Du",
  tue: "Se",
  wed: "Ch",
  thu: "Pa",
  fri: "Ju",
  sat: "Sh",
  sun: "Ya",

  // Attendance
  date: "Sana",
  checkIn: "Kirish",
  checkOut: "Chiqish",
  status: "Holat",
  hoursWorked: "Ishlangan soatlar",
  present: "Ishda",
  absent: "Ishda emas",
  allStatuses: "Barchasi",
  noAttendance: "Davomat ma'lumotlari yo'q",
  today: "Bugun",
  thisWeek: "Bu hafta",
  notCheckedOut: "Chiqmagan",

  // Payroll
  weekOf: "Hafta",
  totalHours: "Jami soatlar",
  grossPay: "Jami maosh",
  payrollStatus: "Holat",
  pending: "Kutilmoqda",
  approved: "Tasdiqlangan",
  paid: "To'langan",
  calculatePayroll: "Maoshni hisoblash",
  approvePayroll: "Tasdiqlash",
  markAsPaid: "To'langan deb belgilash",
  noPayroll: "Maosh ma'lumotlari yo'q",
  calculating: "Hisoblanmoqda...",
  payrollCalculated: "Maosh hisoblandi",

  // Kiosk
  kioskTitle: "Kirish / Chiqish",
  scanning: "Skanlanmoqda...",
  faceNotFound: "Yuz aniqlanmadi",
  checkedIn: "Kirish amalga oshirildi",
  checkedOut: "Chiqish amalga oshirildi",
  alreadyCheckedOut: "Bugun allaqachon chiqgansiz",
  lookAtCamera: "Kameraga qarang",
  welcome: "Xush kelibsiz",
  goodbye: "Ko'rishguncha",
  lateArrival: "Ishga kirdi",
  loadingModels: "Yuklanmoqda...",
  cameraError: "Kamera xatosi",

  // General
  loading: "Yuklanmoqda...",
  error: "Xato",
  success: "Muvaffaqiyatli",
  search: "Qidirish",
  noData: "Ma'lumot yo'q",
  actions: "Amallar",
  close: "Yopish",
  required: "Majburiy",
  soum: "so'm",
  hour: "soat",
  hours: "soat",
  perHour: "soat/so'm",
  name: "Ism",

  // Stats
  stats: "Xodimlar statistikasi",
  statsSubtitle: "Sana oralig'idagi ko'rsatkichlar",
  fromDate: "Dan",
  toDate: "Gacha",
  absentDays: "Kelmagan kunlar",
  totalEarnings: "Jami daromad",
  presentDays: "Kelgan kunlar",
  applyFilter: "Ko'rsatish",
  noStats: "Ma'lumot yo'q",
  workingDays: "Ish kunlari",
}

const ru = {
  // Auth
  login: "Войти",
  logout: "Выйти",
  password: "Пароль",
  loginButton: "Войти в систему",
  loginTitle: "HR Система",
  loginSubtitle: "Войдите с вашими данными",
  invalidCredentials: "Неверный логин или пароль",

  // Nav
  dashboard: "Главная",
  employees: "Сотрудники",
  attendance: "Посещаемость",
  payroll: "Зарплата",
  kiosk: "Киоск",
  settings: "Настройки",

  // Dashboard
  presentToday: "Сейчас на работе",
  absentToday: "Отсутствуют",
  totalEmployees: "Всего сотрудников",
  weeklyPayroll: "Еженедельная зарплата",
  recentCheckins: "Последние отметки",
  noActivity: "Сегодня нет активности",

  // Employees
  addEmployee: "Добавить сотрудника",
  editEmployee: "Редактировать сотрудника",
  employeeName: "Имя и фамилия",
  role: "Должность",
  hourlyRate: "Почасовая ставка (сум)",
  phone: "Телефон",
  enrollFace: "Зарегистрировать лицо",
  faceEnrolled: "Лицо зарегистрировано",
  faceNotEnrolled: "Лицо не зарегистрировано",
  active: "Активный",
  inactive: "Неактивный",
  save: "Сохранить",
  cancel: "Отмена",
  delete: "Удалить",
  confirm: "Подтвердить",
  deactivate: "Деактивировать",
  activate: "Активировать",
  noEmployees: "Сотрудники не найдены",
  director: "Директор",
  hr: "HR",
  employee: "Сотрудник",

  // Work days
  mon: "Пн",
  tue: "Вт",
  wed: "Ср",
  thu: "Чт",
  fri: "Пт",
  sat: "Сб",
  sun: "Вс",

  // Attendance
  date: "Дата",
  checkIn: "Приход",
  checkOut: "Уход",
  status: "Статус",
  hoursWorked: "Часов отработано",
  present: "На работе",
  absent: "Отсутствует",
  allStatuses: "Все",
  noAttendance: "Нет данных посещаемости",
  today: "Сегодня",
  thisWeek: "Эта неделя",
  notCheckedOut: "Не отметился",

  // Payroll
  weekOf: "Неделя",
  totalHours: "Всего часов",
  grossPay: "Итого зарплата",
  payrollStatus: "Статус",
  pending: "В ожидании",
  approved: "Одобрено",
  paid: "Выплачено",
  calculatePayroll: "Рассчитать зарплату",
  approvePayroll: "Одобрить",
  markAsPaid: "Отметить как выплаченное",
  noPayroll: "Нет данных о зарплате",
  calculating: "Рассчитывается...",
  payrollCalculated: "Зарплата рассчитана",

  // Kiosk
  kioskTitle: "Приход / Уход",
  scanning: "Сканирование...",
  faceNotFound: "Лицо не распознано",
  checkedIn: "Приход зафиксирован",
  checkedOut: "Уход зафиксирован",
  alreadyCheckedOut: "Вы уже отметили уход сегодня",
  lookAtCamera: "Смотрите в камеру",
  welcome: "Добро пожаловать",
  goodbye: "До свидания",
  lateArrival: "На работе",
  loadingModels: "Загрузка...",
  cameraError: "Ошибка камеры",

  // General
  loading: "Загрузка...",
  error: "Ошибка",
  success: "Успешно",
  search: "Поиск",
  noData: "Нет данных",
  actions: "Действия",
  close: "Закрыть",
  required: "Обязательно",
  soum: "сум",
  hour: "час",
  hours: "часов",
  perHour: "час/сум",
  name: "Имя",

  // Stats
  stats: "Статистика сотрудников",
  statsSubtitle: "Показатели за период",
  fromDate: "С",
  toDate: "По",
  absentDays: "Дней отсутствия",
  totalEarnings: "Общий заработок",
  presentDays: "Дней присутствия",
  applyFilter: "Показать",
  noStats: "Нет данных",
  workingDays: "Рабочих дней",
}

export type TranslationKey = keyof typeof uz

const translations = { uz, ru }

export function t(lang: Lang, key: TranslationKey): string {
  return translations[lang][key] ?? key
}

export { translations }
