export type Lang = "ru" | "kk" | "en";

export const LANG_LABELS: Record<Lang, string> = {
  ru: "Рус",
  kk: "Қаз",
  en: "Eng",
};

// Плоский словарь: ключ -> перевод на каждый язык.
// Не всё в приложении переведено дословно (часть подсказок/плейсхолдеров оставлена на русском
// как разумный дефолт для первых клиентов) — переводится весь основной интерфейс: навигация,
// кнопки, названия этапов, аналитика, профиль.
const dict: Record<string, Record<Lang, string>> = {
  "nav.inbox": { ru: "Входящие", kk: "Кіріс хабарлар", en: "Inbox" },
  "nav.board": { ru: "Доска заказов", kk: "Тапсырыстар тақтасы", en: "Order board" },
  "nav.analytics": { ru: "Аналитика", kk: "Аналитика", en: "Analytics" },
  "nav.newOrder": { ru: "Новый заказ", kk: "Жаңа тапсырыс", en: "New order" },
  "nav.logout": { ru: "Выйти", kk: "Шығу", en: "Log out" },
  "nav.profile": { ru: "Профиль", kk: "Профиль", en: "Profile" },
  "nav.settings": { ru: "Настройки материалов", kk: "Материал баптаулары", en: "Material settings" },

  "stage.new": { ru: "Заявка", kk: "Өтінім", en: "New" },
  "stage.measuring": { ru: "Замеры", kk: "Өлшеу", en: "Measuring" },
  "stage.approved": { ru: "Согласовано", kk: "Келісілді", en: "Approved" },
  "stage.production": { ru: "Производство", kk: "Өндіріс", en: "Production" },
  "stage.delivery": { ru: "Доставка", kk: "Жеткізу", en: "Delivery" },
  "stage.done": { ru: "Завершено", kk: "Аяқталды", en: "Done" },
  "stage.success": { ru: "Успешно", kk: "Сәтті", en: "Success" },
  "stage.failed": { ru: "Не успешно", kk: "Сәтсіз", en: "Failed" },
  "stage.overdue": { ru: "просрочен", kk: "мерзімі өтті", en: "overdue" },

  "modal.newOrder": { ru: "Новый заказ", kk: "Жаңа тапсырыс", en: "New order" },
  "modal.order": { ru: "Заказ", kk: "Тапсырыс", en: "Order" },
  "modal.client": { ru: "Клиент", kk: "Клиент", en: "Client" },
  "modal.phone": { ru: "Телефон", kk: "Телефон", en: "Phone" },
  "modal.address": { ru: "Адрес (замер / доставка)", kk: "Мекенжай (өлшеу / жеткізу)", en: "Address (measurement / delivery)" },
  "modal.product": { ru: "Изделие", kk: "Бұйым", en: "Product" },
  "modal.measurementDate": { ru: "Дата замера", kk: "Өлшеу күні", en: "Measurement date" },
  "modal.deliveryDate": { ru: "Дата доставки", kk: "Жеткізу күні", en: "Delivery date" },
  "modal.width": { ru: "Ширина, мм", kk: "Ені, мм", en: "Width, mm" },
  "modal.height": { ru: "Высота, мм", kk: "Биіктігі, мм", en: "Height, mm" },
  "modal.material": { ru: "Материал", kk: "Материал", en: "Material" },
  "modal.extras": { ru: "Фурнитура (петли, ручки, направляющие…)", kk: "Фурнитура (топсалар, тұтқалар…)", en: "Hardware (hinges, handles, rails…)" },
  "modal.addExtra": { ru: "добавить", kk: "қосу", en: "add" },
  "modal.extrasTotal": { ru: "Фурнитура", kk: "Фурнитура", en: "Hardware" },
  "modal.qty": { ru: "Кол-во", kk: "Саны", en: "Qty" },
  "modal.pricePerUnit": { ru: "Цена/шт", kk: "Бағасы/дана", en: "Price/unit" },
  "modal.comment": { ru: "Комментарий", kk: "Түсініктеме", en: "Comment" },
  "modal.commentPlaceholder": {
    ru: "Особые пожелания, детали замера, договорённости с клиентом…",
    kk: "Ерекше тілектер, өлшеу мәліметтері, клиентпен келісім…",
    en: "Special requests, measurement details, agreements with the client…",
  },
  "modal.total": { ru: "Смета итого", kk: "Жалпы смета", en: "Total estimate" },
  "modal.createOrder": { ru: "Создать заказ", kk: "Тапсырыс құру", en: "Create order" },
  "modal.saveChanges": { ru: "Сохранить изменения", kk: "Өзгерістерді сақтау", en: "Save changes" },
  "modal.delete": { ru: "Удалить", kk: "Жою", en: "Delete" },
  "modal.markFailed": {
    ru: "Клиент отказался — отметить как неуспешный",
    kk: "Клиент бас тартты — сәтсіз деп белгілеу",
    en: "Client declined — mark as failed",
  },

  "inbox.empty": {
    ru: "Новых обращений нет — все распределены по доске.",
    kk: "Жаңа өтініштер жоқ — барлығы тақтаға бөлінген.",
    en: "No new messages — everything has been moved to the board.",
  },
  "inbox.toOrder": { ru: "В заказ", kk: "Тапсырысқа", en: "To order" },

  "materials.title": { ru: "Материалы и цены", kk: "Материалдар мен бағалар", en: "Materials & prices" },
  "materials.note": {
    ru: "Цена за м² материала, наценка цеха уже учтена в смете.",
    kk: "Материалдың м² бағасы, цех үстемесі сметада ескерілген.",
    en: "Price per m² of material; workshop markup is already included in the estimate.",
  },

  "analytics.title": { ru: "Аналитика", kk: "Аналитика", en: "Analytics" },
  "analytics.subtitle": { ru: "Основная воронка", kk: "Негізгі воронка", en: "Main funnel" },
  "analytics.totalDeals": { ru: "Всего сделок", kk: "Барлық мәмілелер", en: "Total deals" },
  "analytics.active": { ru: "активных", kk: "белсенді", en: "active" },
  "analytics.totalRevenue": { ru: "Выручка (успешные)", kk: "Кіріс (сәтті)", en: "Revenue (successful)" },
  "analytics.conversion": { ru: "Конверсия", kk: "Конверсия", en: "Conversion" },
  "analytics.wonLost": { ru: "выиграно / проиграно", kk: "жеңді / ұтылды", en: "won / lost" },
  "analytics.avgCheck": { ru: "Средний чек", kk: "Орташа чек", en: "Average order" },
  "analytics.perDeal": { ru: "на успешную сделку", kk: "сәтті мәмілеге", en: "per successful deal" },
  "analytics.funnel": { ru: "Воронка заказов", kk: "Тапсырыстар воронкасы", en: "Order funnel" },
  "analytics.deals": { ru: "заказ(ов)", kk: "тапсырыс", en: "orders" },

  "profile.title": { ru: "Профиль", kk: "Профиль", en: "Profile" },
  "profile.subtitle": {
    ru: "Управляйте данными своей учётной записи",
    kk: "Есептік жазба деректерін басқарыңыз",
    en: "Manage your account details",
  },
  "profile.workspaceName": { ru: "Название цеха", kk: "Цех атауы", en: "Workshop name" },
  "profile.phone": { ru: "Телефон", kk: "Телефон", en: "Phone" },
  "profile.email": { ru: "Email", kk: "Email", en: "Email" },
  "profile.save": { ru: "Сохранить", kk: "Сақтау", en: "Save" },
  "profile.changePassword": { ru: "Смена пароля", kk: "Құпия сөзді ауыстыру", en: "Change password" },
  "profile.newPassword": { ru: "Новый пароль", kk: "Жаңа құпия сөз", en: "New password" },
  "profile.repeatPassword": { ru: "Повторите новый пароль", kk: "Жаңа құпия сөзді қайталаңыз", en: "Repeat new password" },
  "profile.minChars": { ru: "Минимум 6 символов", kk: "Кемінде 6 таңба", en: "Minimum 6 characters" },
  "profile.changePasswordBtn": { ru: "Сменить пароль", kk: "Құпия сөзді ауыстыру", en: "Change password" },
  "profile.back": { ru: "Назад", kk: "Артқа", en: "Back" },
  "profile.saved": { ru: "Сохранено", kk: "Сақталды", en: "Saved" },
  "profile.passwordChanged": { ru: "Пароль изменён", kk: "Құпия сөз өзгертілді", en: "Password changed" },
  "profile.passwordsDontMatch": { ru: "Пароли не совпадают", kk: "Құпия сөздер сәйкес келмейді", en: "Passwords don't match" },

  "login.signin": { ru: "Вход", kk: "Кіру", en: "Sign in" },
  "login.signup": { ru: "Регистрация", kk: "Тіркелу", en: "Sign up" },
  "login.workspaceName": { ru: "Название цеха", kk: "Цех атауы", en: "Workshop name" },
  "login.email": { ru: "Email", kk: "Email", en: "Email" },
  "login.password": { ru: "Пароль", kk: "Құпия сөз", en: "Password" },
  "login.enterBtn": { ru: "Войти", kk: "Кіру", en: "Log in" },
  "login.createBtn": { ru: "Создать цех", kk: "Цех құру", en: "Create workshop" },
  "login.wait": { ru: "Подождите…", kk: "Күте тұрыңыз…", en: "Please wait…" },
};

export function translate(lang: Lang, key: string): string {
  return dict[key]?.[lang] ?? dict[key]?.ru ?? key;
}
