# VIREL V3 — ПОЛНОЕ ТЕХНИЧЕСКОЕ ЗАДАНИЕ НА РЕДИЗАЙН
# Для Claude Code / разработчика
# Стек: Next.js 14, TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL (Neon)
# Деплой: Vercel
# Репо: https://github.com/adelislamov-star/virel-v3

---

## КОНТЕКСТ

Virel — premium escort agency в Лондоне. Сайт virel-v3.vercel.app.
Проведён полный UX/UI аудит. Найдены критические проблемы с конверсией.
Ниже — конкретные задачи на изменение кода с приоритетами.

Все изменения должны:
- Не ломать текущий функционал (букинг, API, Prisma)
- Быть SEO-friendly (семантический HTML, meta-теги, structured data)
- Масштабироваться на 50-100+ моделей без переделки
- Работать на mobile (responsive first)

---

## ФАЗА 1 — КРИТИЧЕСКИЕ ПРАВКИ (делать первыми)

### 1.1 Добавить цену на карточки моделей

**Файл:** Компонент карточки модели (скорее всего `src/components/ModelCard.tsx` или аналог)

**Что сделать:**
- Добавить отображение `"From £XXX/hr"` под именем модели на каждой карточке
- Цена берётся из данных модели (минимальная цена из rates)
- Шрифт: sans-serif (Inter/system), 13px, uppercase, letter-spacing 0.05em, цвет gold (#C5A572)

**Пример:**
```tsx
<div className="mt-1">
  <span className="text-xs uppercase tracking-wider text-[#C5A572]">
    From £{model.minPrice}/hr
  </span>
</div>
```

**Если minPrice нет в модели данных** — добавить вычисляемое поле:
```ts
const minPrice = Math.min(...model.rates.map(r => r.price))
```

**Где применить:** Главная (Featured Companions), каталог (/london-escorts), страницы районов (/escorts-in/*)

### 1.2 Добавить цену в hero профиля модели

**Файл:** `src/app/catalog/[slug]/page.tsx` или аналогичный

**Что сделать:**
- В hero-секции профиля (первый экран) рядом с кнопкой "Arrange a Meeting" добавить:
```
FROM £XXX/HOUR
```
- Расположение: над или рядом с CTA-кнопкой, справа от имени
- Стиль: uppercase, letter-spacing, золотой цвет

### 1.3 Навигация — убрать «Join Us», добавить «Book Now»

**Файл:** `src/app/layout.tsx` или `src/components/Header.tsx` / `Navbar.tsx`

**Что сделать:**
```
БЫЛО:  Companions | Services | FAQ | Contact | [Join Us]
СТАЛО: Companions | About | Contact | [Book Now]
```

- Убрать `Join Us` из основной навигации (перенести ссылку в footer)
- Убрать `Services` из основной навигации (перенести в dropdown под Companions или в footer)
- Убрать `FAQ` из основной навигации (перенести в footer)
- Добавить `About` (ссылка на /about — страницу можно создать позже)
- Заменить `[Join Us]` на `[Book Now]` — золотая кнопка, ведёт на /contact или /london-escorts
- Стиль кнопки: bg-[#C5A572] text-black font-medium px-6 py-2

### 1.4 Форма букинга — datepicker вместо текстовых полей

**Файл:** Форма букинга на странице профиля модели

**Что сделать:**
- Поле DATE: заменить текстовый input `DD/MM/YYYY` на `<input type="date" />` или date picker компонент
- Поле TIME: заменить текстовый input `HH:MM` на `<select>` с опциями каждые 30 минут:
```tsx
<select>
  <option value="09:00">09:00</option>
  <option value="09:30">09:30</option>
  <option value="10:00">10:00</option>
  {/* ... до 03:00 */}
</select>
```
- Стилизовать под текущий дизайн (тёмный фон, светлый текст, border как у остальных полей)

### 1.5 Исправить форматирование цен

**Везде в проекте:**
- `£2 600` → `£2,600`
- `£1 200` → `£1,200`
- Использовать `toLocaleString('en-GB')` или утилиту форматирования:
```ts
function formatPrice(price: number): string {
  return `£${price.toLocaleString('en-GB')}`
}
```

---

## ФАЗА 2 — ГЛАВНАЯ СТРАНИЦА (пересборка)

### 2.1 Hero — добавить фотографию

**Файл:** `src/app/page.tsx` — hero секция

**Что сделать:**
- Заменить чёрный фон с декоративной grid-сеткой на split-layout или fullscreen фото
- Вариант A (split): фото лучшей модели 60% ширины слева, текст 40% справа
- Вариант B (overlay): fullscreen фото с текстом поверх (gradient overlay снизу)
- Фото брать из Featured модели (первая в списке) или захардкодить hero image

**Структура hero:**
```tsx
<section className="relative h-screen flex items-center">
  {/* Фото */}
  <div className="w-3/5 h-full relative">
    <Image src={heroModel.mainPhoto} alt="" fill className="object-cover" />
  </div>
  {/* Контент */}
  <div className="w-2/5 px-16 flex flex-col justify-center">
    <h1 className="font-cormorant text-5xl text-white">
      London's Finest Companions
    </h1>
    <p className="mt-4 text-[#C5A572] uppercase tracking-widest text-sm">
      From £300 per hour
    </p>
    <Link href="/london-escorts" className="mt-8 inline-block bg-[#C5A572] text-black px-8 py-3 uppercase tracking-wider text-sm">
      Explore Companions
    </Link>
  </div>
</section>
```

- **Mobile:** фото сверху (50vh), текст снизу, stacked layout
- **Убрать:** два CTA (был Browse + Private Enquiry) → оставить ОДИН

### 2.2 Убрать дублирующиеся USP

**Что сделать:**
- УДАЛИТЬ блок с тремя числами (100% Verified / 24/7 Available / 30min Confirmation)
- УДАЛИТЬ три USP-карточки (Fully Verified / Absolute Discretion / Curated Selection)
- ЗАМЕНИТЬ на одну Trust Bar строку:

```tsx
<div className="py-6 border-y border-[#1A1A1A] flex items-center justify-center gap-8 text-[#808080] text-xs uppercase tracking-widest">
  <span>◆ Personally Verified</span>
  <span>·</span>
  <span>30-Minute Response</span>
  <span>·</span>
  <span>Complete Discretion</span>
  <span>·</span>
  <span>Est. 2024</span>
</div>
```

### 2.3 Featured Companions — 3 вместо 6

**Что сделать:**
- Показывать 3 карточки вместо 6
- Каждая карточка: фото + имя + «From £XXX/hr» + статус доступности (● Available)
- Отступ между карточками: gap-6 (24px)
- Убрать «View Profile →» текст — вся карточка кликабельна

```tsx
// Ограничить выборку
const featured = models.slice(0, 3)
```

### 2.4 Убрать «How to Book»

**Что сделать:** Полностью удалить секцию «Simple Process / How to Book» (01/02/03).

### 2.5 Убрать «Escorts by District» из основного потока

**Что сделать:**
- Удалить секцию «London Coverage / Escorts by District» с главной страницы
- Ссылки районов СОХРАНИТЬ в footer (для SEO)

### 2.6 FAQ — убрать с главной

**Что сделать:**
- Удалить секцию FAQ с главной
- FAQ остаётся на /faq

### 2.7 Добавить Social Proof секцию

**Что сделать:** Заменить удалённые блоки одной компактной секцией:

```tsx
<section className="py-20 text-center">
  <p className="text-[#C5A572] uppercase tracking-widest text-xs mb-6">
    Trusted Agency
  </p>
  <p className="font-cormorant text-2xl text-white/80 italic max-w-xl mx-auto">
    "Professional, discreet, and exactly as described. 
    The finest companion service in London."
  </p>
  <p className="mt-4 text-[#606060] text-sm">
    — Verified Client, Mayfair
  </p>
</section>
```

### 2.8 Добавить Final CTA секцию

**Перед footer:**
```tsx
<section className="py-24 text-center">
  <h2 className="font-cormorant text-4xl text-white">
    Ready to make an arrangement?
  </h2>
  <p className="mt-4 text-[#808080] text-sm">
    Response within 30 minutes, guaranteed
  </p>
  <div className="mt-8 flex justify-center gap-4">
    <Link href="/london-escorts" className="bg-[#C5A572] text-black px-8 py-3 uppercase tracking-wider text-sm">
      Browse Companions
    </Link>
    <Link href="https://t.me/virel_bookings" className="border border-[#333] text-white px-8 py-3 uppercase tracking-wider text-sm">
      Message on Telegram
    </Link>
  </div>
</section>
```

### 2.9 Итоговая структура главной (порядок секций)

```
1. Header (sticky, transparent → solid on scroll)
2. Hero (фото + заголовок + «From £300» + один CTA)
3. Trust Bar (одна строка)
4. Featured Companions (3 карточки с ценами)
5. Social Proof (отзыв/статистика)
6. Final CTA (два CTA перед footer)
7. Footer (с SEO-ссылками районов, FAQ, Join Us)
```

Всё остальное — УДАЛИТЬ с главной.

---

## ФАЗА 3 — СТРАНИЦА ПРОФИЛЯ МОДЕЛИ

### 3.1 Цена в первом экране

**Текущая структура:** Hero-фото fullscreen → скролл → имя + параметры → «Arrange a Meeting» справа

**Новая структура первого экрана:**
```
┌──────────────────┬────────────────────┐
│                  │ Name               │
│  MAIN PHOTO      │ 29 · Brazilian     │
│  (60% width)     │ ─────────────      │
│                  │ FROM £300/HOUR     │
│                  │ ─────────────      │
│                  │ [Book Now]         │
│                  │ ● Available Now    │
│                  │ Confirmed in 30min │
└──────────────────┴────────────────────┘
```

- Фото: 60% ширины, object-cover, full height секции
- Инфо-блок: 40% ширины, vertically centered
- Цена: крупно, золотой цвет, uppercase
- Mobile: фото сверху (60vh), инфо под ним

### 3.2 Rates Table — заменить кнопки-чипы на таблицу

**Текущее:** Кнопки-чипы (30min £300 / 45min £330 / 1hr £350 / ...) в сетке

**Новое:** Чистая таблица с двумя колонками (Incall / Outcall):

```tsx
<div className="overflow-x-auto">
  <table className="w-full border-collapse">
    <thead>
      <tr className="border-b border-[#2A2A2A]">
        <th className="py-3 text-left text-xs uppercase tracking-wider text-[#808080]">Duration</th>
        <th className="py-3 text-right text-xs uppercase tracking-wider text-[#808080]">Incall</th>
        <th className="py-3 text-right text-xs uppercase tracking-wider text-[#808080]">Outcall</th>
      </tr>
    </thead>
    <tbody>
      {rates.map(rate => (
        <tr key={rate.duration} className="border-b border-[#1A1A1A]">
          <td className="py-4 text-white font-cormorant text-lg">{rate.label}</td>
          <td className="py-4 text-right text-[#C5A572]">£{formatPrice(rate.incall)}</td>
          <td className="py-4 text-right text-[#C5A572]">£{formatPrice(rate.outcall)}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Если Outcall цены нет в данных** — добавить колонку с «On request» или вычислить как Incall + 15-20%.

### 3.3 Теги услуг на профиле

**Что сделать:** Под bio-текстом добавить кликабельные теги услуг модели:

```tsx
<div className="flex flex-wrap gap-2 mt-6">
  {model.services.map(service => (
    <Link 
      key={service.slug} 
      href={`/services/${service.slug}`}
      className="px-3 py-1 border border-[#2A2A2A] text-xs uppercase tracking-wider text-[#808080] hover:border-[#C5A572] hover:text-[#C5A572] transition-colors"
    >
      {service.name}
    </Link>
  ))}
</div>
```

**SEO-эффект:** Двусторонняя перелинковка model↔service.

### 3.4 Блок «Similar Companions»

**Добавить в конец страницы профиля (перед footer):**

```tsx
<section className="py-20 border-t border-[#1A1A1A]">
  <h3 className="font-cormorant text-2xl text-white mb-8">You may also like</h3>
  <div className="grid grid-cols-3 gap-6">
    {similarModels.slice(0, 3).map(model => (
      <ModelCard key={model.slug} model={model} />
    ))}
  </div>
</section>
```

**Логика выбора similar:** Та же национальность, или тот же ценовой диапазон, или random из доступных. Исключить текущую модель.

### 3.5 Sticky bar — сделать менее агрессивным

**Текущее:** Золотая полноширинная плашка «ARRANGE A MEETING WITH MARZENA» всегда видна

**Новое:** Тонкая полоска внизу, появляется только после скролла мимо hero:

```tsx
<div className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}>
  <div className="bg-[#0A0A0A]/95 backdrop-blur border-t border-[#1A1A1A] px-6 py-3 flex items-center justify-between max-w-7xl mx-auto">
    <div>
      <span className="text-white font-cormorant text-lg">{model.name}</span>
      <span className="text-[#C5A572] text-sm ml-3">From £{model.minPrice}/hr</span>
    </div>
    <button className="bg-[#C5A572] text-black px-6 py-2 text-xs uppercase tracking-wider">
      Book Now
    </button>
  </div>
</div>
```

**Показывать:** только когда пользователь проскроллил hero (useIntersectionObserver)

### 3.6 Submit кнопка — цена в кнопке

**Текущее:** `SUBMIT YOUR REQUEST`
**Новое:** `Request Booking — £350` (цена динамическая, зависит от выбранной duration)

```tsx
<button className="w-full bg-[#C5A572] text-black py-4 uppercase tracking-wider text-sm font-medium">
  Request Booking — {selectedDuration ? formatPrice(selectedDuration.price) : 'Select Duration'}
</button>
```

---

## ФАЗА 4 — SEO-АРХИТЕКТУРА (миграция URL)

### 4.1 Переименование маршрутов

```
БЫЛО                          → СТАЛО
/catalog/[slug]                → /companions/[slug]
/escorts-in/[district]         → /companions/[district]  
/london-escorts                → /companions
```

**Next.js файловая структура:**
```
src/app/
  companions/
    page.tsx                    ← каталог (бывший /london-escorts)
    [slug]/
      page.tsx                  ← профиль модели (бывший /catalog/[slug])
    mayfair/
      page.tsx                  ← район (бывший /escorts-in/mayfair)
    kensington/
      page.tsx
    ...
```

### 4.2 301-редиректы

**Файл:** `next.config.js`

```js
module.exports = {
  async redirects() {
    return [
      {
        source: '/catalog/:slug',
        destination: '/companions/:slug',
        permanent: true, // 301
      },
      {
        source: '/escorts-in/:district',
        destination: '/companions/:district',
        permanent: true,
      },
      {
        source: '/london-escorts',
        destination: '/companions',
        permanent: true,
      },
    ]
  },
}
```

### 4.3 Связать Services ↔ Models

**На странице /services/[slug]:**
- Показать список моделей, которые предлагают эту услугу
- Карточки с ценами, кликабельные → ведут на /companions/[slug]

**На странице профиля модели:**
- Теги услуг (см. 3.3) → ведут на /services/[slug]

### 4.4 Structured Data (JSON-LD)

**На каждой странице профиля добавить:**
```tsx
<script type="application/ld+json">
{JSON.stringify({
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Virel",
  "description": "Premium companion agency in London",
  "url": "https://virel-v3.vercel.app",
  "areaServed": "London",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "London",
    "addressCountry": "GB"
  }
})}
</script>
```

**Breadcrumbs structured data:**
```tsx
<script type="application/ld+json">
{JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://virel-v3.vercel.app" },
    { "@type": "ListItem", "position": 2, "name": "Companions", "item": "https://virel-v3.vercel.app/companions" },
    { "@type": "ListItem", "position": 3, "name": model.name }
  ]
})}
</script>
```

---

## ФАЗА 5 — СТИЛЬ И ТИПОГРАФИКА

### 5.1 Типографика (глобальные правила)

```css
/* globals.css или tailwind config */

/* H1 — имена, главные заголовки */
/* Cormorant Garamond, 48-64px, REGULAR (не italic!) */
.heading-primary {
  @apply font-cormorant text-5xl font-normal text-white;
}

/* H2 — подзаголовки (единственное место для italic) */
.heading-secondary {
  @apply font-cormorant text-3xl italic text-white;
}

/* Body — описания, UI текст */
/* Inter или system sans-serif, 16px */
.body-text {
  @apply font-sans text-base text-[#A0A0A0];
}

/* Labels, цены, метки */
.label-text {
  @apply font-sans text-xs uppercase tracking-[0.05em];
}
```

**ПРАВИЛО: italic ТОЛЬКО для H2 и акцентных слов. Сейчас italic используется везде — убрать.**

### 5.2 Цвет — ограничить использование золотого

```
Золотой (#C5A572) → ТОЛЬКО:
  ✅ CTA-кнопки (bg)
  ✅ Цены (text)
  ✅ Активные состояния hover
  ❌ НЕ для заголовков секций (сейчас используется)
  ❌ НЕ для label-текстов типа «Available Now» 
  ❌ НЕ для декоративных элементов
  ❌ НЕ для sticky bar фона (заменить на тёмный)

Заголовки: #FAFAFA (белый)
Body текст: #A0A0A0 (серый)
Разделители: #1A1A1A
Фон: #0A0A0A
Вторичный фон: #111111
```

### 5.3 Отступы — жёсткая система

```
Между секциями: 120px (desktop), 80px (mobile)
  → py-[120px] lg:py-[80px] (или использовать CSS custom properties)

Padding контейнера: 80px (desktop), 24px (mobile)
  → px-20 lg:px-6

Gap карточек: 24px → gap-6

Карточки: фото edge-to-edge (p-0), текст под фото p-4
```

### 5.4 Убрать декоративную grid-сетку

В hero-секции есть фоновый паттерн из тонких линий (grid). Убрать — он выглядит как шаблон. Чистый #0A0A0A фон.

---

## ЧЕКЛИСТ ПОСЛЕ ВСЕХ ИЗМЕНЕНИЙ

- [ ] Цена видна на карточках моделей (главная, каталог, районы)
- [ ] Цена видна в hero профиля (первый экран)
- [ ] Цена в кнопке submit формы букинга
- [ ] Навигация: Companions | About | Contact | [Book Now]
- [ ] Join Us только в footer
- [ ] FAQ только на /faq и ссылка в footer
- [ ] Hero главной — с фото, один CTA
- [ ] Trust Bar — одна строка вместо 6 блоков
- [ ] Featured — 3 карточки вместо 6
- [ ] Удалён «How to Book»
- [ ] Удалён «Escorts by District» из основного потока (в footer)
- [ ] Удалён FAQ с главной
- [ ] Datepicker и time dropdown в форме букинга
- [ ] Цены форматируются через запятую (£2,600)
- [ ] Rates Table на профиле (Duration × Incall/Outcall)
- [ ] Теги услуг на профиле модели
- [ ] «Similar Companions» блок на профиле
- [ ] Sticky bar — тонкий, появляется после скролла
- [ ] 301-редиректы для /catalog/ → /companions/
- [ ] SEO structured data (JSON-LD)
- [ ] Italic только для H2, не для всего
- [ ] Золотой цвет только для CTA и цен
- [ ] Декоративная grid-сетка убрана из hero

---

## ПОРЯДОК ВЫПОЛНЕНИЯ

```
ПРИОРИТЕТ 1 (сразу):     1.1, 1.2, 1.3, 1.4, 1.5
ПРИОРИТЕТ 2 (эта неделя): 2.1-2.9, 3.5, 3.6
ПРИОРИТЕТ 3 (следующая):  3.1-3.4, 5.1-5.4
ПРИОРИТЕТ 4 (через 2 нед): 4.1-4.4
```
