# Claude Code — Virel v3 Admin Design Refresh

**Проект:** `C:\Virel`
**Цель:** Обновить дизайн всех admin страниц — чистый минималистичный стиль. Аккуратные отступы, правильная типографика, мягкие переходы, консистентность.

> СТИЛЬ: Минимальный, как Linear/Notion. Тёмная тема. Никакого визуального шума. Чистые линии, правильные пропорции, приглушённые акценты.

> ВАЖНО: Не трогать логику, API, state machines. Только CSS/Tailwind классы, layout, типографику. Не ломать функциональность.

---

## ЗАДАЧА 1: GLOBAL DESIGN TOKENS

### Обновить `src/app/globals.css` или `tailwind.config.ts`

Убедись что в проекте есть единый набор design tokens. Если нет — добавь CSS переменные в globals.css:

```css
:root {
  /* Admin palette — muted dark */
  --admin-bg: #0a0a0b;
  --admin-surface: #111113;
  --admin-surface-hover: #18181b;
  --admin-border: #27272a;
  --admin-border-subtle: #1e1e21;
  --admin-text: #fafafa;
  --admin-text-secondary: #a1a1aa;
  --admin-text-muted: #71717a;
  --admin-accent: #f59e0b;
  --admin-accent-hover: #d97706;
  --admin-success: #22c55e;
  --admin-warning: #eab308;
  --admin-error: #ef4444;
  --admin-info: #3b82f6;
}
```

---

## ЗАДАЧА 2: SIDEBAR REDESIGN

### Файл: `src/app/admin/layout.tsx`

Переделать sidebar:

**Принципы:**
- Ширина sidebar: `w-60` (240px) — не шире
- Фон: `var(--admin-bg)` с тонкой правой границей `border-r border-zinc-800/50`
- Логотип сверху: "VIREL" — маленький, `text-sm font-semibold tracking-widest text-zinc-400 uppercase`
- Под логотипом: `text-[11px] text-zinc-600` — "Operations Platform"
- Группировка пунктов по секциям с заголовками секций: `text-[10px] uppercase tracking-wider text-zinc-600 mt-6 mb-2 px-3`

**Секции навигации:**

```
CORE
  Action Center
  Bookings
  Inquiries
  Models

OPERATIONS
  Reviews
  Incidents
  Fraud Monitor
  Applications
  Availability PRO

BUSINESS
  Pricing
  Membership
  Reports
  SEO Health

ANALYTICS
  Dashboard
  Owner Analytics
  Unit Economics

SYSTEM
  SLA Monitor
  Data Quality
  Settings
```

**Стиль каждого пункта меню:**
- `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150`
- Дефолт: `text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50`
- Активный (текущая страница): `text-white bg-zinc-800/70` — без яркого фона, просто чуть выделен
- Иконки: убрать emoji, заменить на простые символы или lucide-react иконки если доступны. Если lucide нет — использовать тонкие unicode символы или вообще без иконок (только текст)
- Между секциями: `h-px bg-zinc-800/30 my-2 mx-3` — тонкий разделитель

**Внизу sidebar:**
- Текущий пользователь: email маленьким текстом `text-xs text-zinc-600`
- Без аватара

**НЕ используй emoji** (⭐, ⚠️, 🛡️ и т.д.) — это выглядит непрофессионально. Либо иконки из lucide-react, либо просто текст.

---

## ЗАДАЧА 3: СТРАНИЦЫ — ОБЩИЙ LAYOUT

Каждая admin страница должна следовать одному шаблону:

```tsx
<div className="p-8 max-w-7xl mx-auto">
  {/* Page Header */}
  <div className="mb-8">
    <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">
      Page Title
    </h1>
    <p className="text-sm text-zinc-500 mt-1">
      Short description
    </p>
  </div>

  {/* Content */}
  ...
</div>
```

**Правила:**
- Заголовок: `text-2xl font-semibold` — не больше. Без emoji перед заголовком.
- Описание: `text-sm text-zinc-500` — одна строка
- Padding: `p-8` — щедрые отступы
- Max width: `max-w-7xl mx-auto` — не растягивать на весь экран
- Между секциями: `space-y-6` или `mt-8`

---

## ЗАДАЧА 4: КАРТОЧКИ МЕТРИК (Summary Cards)

Используются на Dashboard, Pricing, Fraud, SLA, Data Quality и других страницах.

**Обновить стиль на всех страницах:**

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5">
    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
      Metric Name
    </p>
    <p className="text-2xl font-semibold text-zinc-100 mt-2">
      1,234
    </p>
    {/* Optional: trend indicator */}
    <p className="text-xs text-emerald-500 mt-1">+12% vs last month</p>
  </div>
</div>
```

**Правила:**
- Фон: `bg-zinc-900/50` — полупрозрачный, еле заметный
- Граница: `border border-zinc-800/50` — тонкая, приглушённая
- Скругление: `rounded-xl`
- Название метрики: `text-xs uppercase tracking-wider text-zinc-500`
- Значение: `text-2xl font-semibold text-zinc-100`
- Цветные значения только если нужно привлечь внимание (error = `text-red-400`, success = `text-emerald-400`)
- Без теней, без градиентов

---

## ЗАДАЧА 5: ТАБЛИЦЫ

Унифицировать стиль таблиц на всех страницах (Reviews, Incidents, Fraud, SEO, Pricing, Membership, etc.):

```tsx
<div className="rounded-xl border border-zinc-800/50 overflow-hidden">
  <table className="w-full">
    <thead>
      <tr className="border-b border-zinc-800/50">
        <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Column
        </th>
      </tr>
    </thead>
    <tbody className="divide-y divide-zinc-800/30">
      <tr className="hover:bg-zinc-800/20 transition-colors duration-100">
        <td className="px-4 py-3 text-sm text-zinc-300">
          Value
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

**Правила:**
- Контейнер: `rounded-xl border border-zinc-800/50 overflow-hidden`
- Header: `text-xs uppercase tracking-wider text-zinc-500 font-medium` — без тёмного фона
- Row hover: `hover:bg-zinc-800/20 transition-colors duration-100` — мягкий
- Dividers: `divide-y divide-zinc-800/30` — еле видимые
- Text: `text-sm text-zinc-300`
- Без bold в ячейках (кроме имён)

---

## ЗАДАЧА 6: BADGES / STATUS TAGS

Унифицировать все Badge компоненты:

```tsx
// Стиль badge — приглушённые, не кричащие
const badgeStyles: Record<string, string> = {
  // Status
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  neutral: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

// Usage
<span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${badgeStyles.active}`}>
  Published
</span>
```

**Правила:**
- Размер: `text-xs` — маленькие
- Padding: `px-2 py-0.5`
- Border: тонкая, того же оттенка
- Фон: `{color}-500/10` — почти прозрачный
- Текст: `{color}-400` — приглушённый
- Скругление: `rounded-md`
- Без заглавных букв (не uppercase)

Привести ВСЕ badge'ы на ВСЕХ страницах к этому стилю:
- pending/draft → amber
- active/published/approved/confirmed/succeeded → emerald  
- cancelled/rejected/failed/blocked/error → red
- investigating/warning/flagged/monitoring → yellow
- in_progress/info → blue
- disputed/escalated → purple
- completed/resolved/closed → neutral (zinc)
- no_show/expired → neutral

---

## ЗАДАЧА 7: КНОПКИ

Унифицировать стиль кнопок:

**Primary (жёлтая, акцентная — Create, Submit, Calculate):**
```tsx
className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 text-sm font-medium transition-colors duration-150"
```

**Secondary (нейтральная — Cancel, Back, Filter):**
```tsx
className="px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-zinc-100 text-sm font-medium transition-colors duration-150"
```

**Danger (красная — Delete, Block, Reject):**
```tsx
className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium border border-red-500/20 transition-colors duration-150"
```

**Ghost (прозрачная — inline actions):**
```tsx
className="px-3 py-1.5 rounded-md hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 text-sm transition-colors duration-150"
```

---

## ЗАДАЧА 8: ФОРМЫ И INPUTS

```tsx
<input className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors duration-150" />

<select className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-600 transition-colors duration-150">

<textarea className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors duration-150 resize-none" />
```

**Labels:**
```tsx
<label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
```

---

## ЗАДАЧА 9: МОДАЛЬНЫЕ ОКНА

Если на страницах есть модальные окна (New Rule, New Incident, etc.):

```tsx
{/* Overlay */}
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />

{/* Modal */}
<div className="fixed inset-0 flex items-center justify-center z-50 p-4">
  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
    <h2 className="text-lg font-semibold text-zinc-100 mb-4">Title</h2>
    {/* Content */}
    <div className="flex justify-end gap-3 mt-6">
      <button className="...secondary">Cancel</button>
      <button className="...primary">Create</button>
    </div>
  </div>
</div>
```

---

## ЗАДАЧА 10: LOADING STATES

Каждая страница при загрузке должна показывать skeleton:

```tsx
{loading ? (
  <div className="space-y-4 animate-pulse">
    <div className="h-8 w-48 bg-zinc-800/50 rounded-lg" />
    <div className="grid grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-zinc-800/30 rounded-xl" />
      ))}
    </div>
    <div className="h-64 bg-zinc-800/30 rounded-xl" />
  </div>
) : (
  // actual content
)}
```

---

## ЗАДАЧА 11: TRANSITIONS

Добавить мягкие CSS transitions где их нет:

- Все hover эффекты: `transition-colors duration-150`
- Появление контента: `transition-opacity duration-200`
- Sidebar active state: `transition-all duration-150`

**НЕ** добавлять:
- Пружинные анимации
- Fade-in при загрузке страницы (over-animation)
- Bounce или shake эффекты

---

## ПОРЯДОК ВЫПОЛНЕНИЯ

1. globals.css — design tokens (Задача 1)
2. admin/layout.tsx — sidebar (Задача 2) — ЭТО САМОЕ ВАЖНОЕ
3. Пройтись по КАЖДОЙ admin странице и применить:
   - Page layout (Задача 3)
   - Summary cards (Задача 4)
   - Tables (Задача 5)
   - Badges (Задача 6)
   - Buttons (Задача 7)
   - Forms (Задача 8)
   - Modals (Задача 9)
   - Loading states (Задача 10)
   - Transitions (Задача 11)
4. `npm run build` — проверка

**Страницы для обновления (ВСЕ):**
- /admin/action-center
- /admin/bookings (+ booking detail pages)
- /admin/inquiries
- /admin/models (+ model detail/edit)
- /admin/applications
- /admin/availability
- /admin/reviews
- /admin/incidents
- /admin/fraud
- /admin/seo
- /admin/reports
- /admin/pricing
- /admin/membership
- /admin/sla
- /admin/data-governance
- /admin/dashboard
- /admin/analytics/owner
- /admin/analytics/unit-economics
- /admin/settings
- /admin/login

---

## ОГРАНИЧЕНИЯ

- **НЕ** трогать логику, API, state machines, data fetching
- **НЕ** трогать публичный фронтенд
- **НЕ** менять структуру файлов
- Только Tailwind классы — без кастомного CSS (кроме globals.css)
- Без внешних шрифтов (используй system font stack или то что уже подключено)
- Без emoji в навигации и заголовках
