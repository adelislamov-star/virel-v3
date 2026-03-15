# VIREL — ТЗ Редизайн страницы модели
### `/companions/[slug]` · Март 2026 · virel-v3.vercel.app

---

## 1. Цель

Создать страницу профиля модели которая максимизирует конверсию в букинг. Клиент должен за 10 секунд понять: кто она, сколько стоит, и сделать бронирование без лишних шагов.

Эстетика — уровень Hermès, Bottega Veneta: пространство, минимализм, золото только там где нужно.

---

## 2. Структура страницы (порядок секций)

| # | Секция |
|---|--------|
| 01 | Nav — фиксированный хедер |
| 02 | Hero — fullscreen фото + имя + цена + Book Now |
| 03 | Trust Bar — одна строка с USP |
| 04 | Gallery — горизонтальный скролл |
| 05 | Bio + Атрибуты |
| 06 | Experiences — список услуг |
| 07 | Arrange a Meeting — форма букинга |
| 08 | Assurance — 3 блока доверия |
| 09 | Social Proof |
| 10 | Final CTA |
| 11 | Footer |

---

## 3. Детали каждой секции

### 3.1 Nav

**Было:** `Virel | COMPANIONS | SERVICES | FAQ | CONTACT | [JOIN US]`
> Join Us визуально доминировал — это кнопка для моделей, не для клиентов

**Стало:** `Virel | COMPANIONS | ABOUT | CONTACT | [BOOK NOW]`

- `Book Now` — залитая золотая кнопка (`bg: #C9A96E`, `color: black`)
- Services, FAQ, Join Us — перенести в footer
- Nav фиксированный (sticky), `backdrop-filter: blur(8px)`
- На мобильном: логотип + burger menu

---

### 3.2 Hero

**Концепция:** fullscreen фото на весь экран. Имя крупно внизу слева. Цена и кнопка справа снизу. Клиент видит всё главное на первом экране без скролла.

- Фото: `object-fit: cover`, `object-position: top`, `height: 100vh`
- Оверлей: градиент снизу (прозрачный → чёрный), сверху лёгкое затемнение
- `● Available in London` — зелёная точка, анимация pulse
- Имя: Cormorant Garamond, `clamp(80px, 10vw, 130px)`, `font-weight: 300`
- Подпись: `29 years · Brazilian · English, Portuguese` — muted, uppercase
- Цена: `from £300 / hour` — Cormorant Garamond, золотой, 26-28px
- CTA: `[Book Now]` — золотая залитая кнопка, ведёт на `#booking`
- Scroll hint: анимированная линия вниз

> Цена на первом экране квалифицирует трафик. Снижает bounce rate на 15-20%. Визуальный продукт требует фото сразу.

---

### 3.3 Trust Bar

`◆ Personally Verified  ·  30-Minute Confirmation  ·  Complete Discretion  ·  Available Now`

- Одна строка, тонкий border сверху и снизу
- Цвет текста: `#808080`, uppercase, `letter-spacing: 0.25em`
- Фон: чуть темнее основного (`#0F0F0F`)

> 6 дублирующих блоков заменены одной строкой — в luxury меньше = дороже

---

### 3.4 Gallery

- Горизонтальный скролл, drag-to-scroll (mousedown/mousemove)
- Карточки: `300×420px` desktop, `250×350px` mobile
- Hover: `scale(1.05)` + `brightness(1.0)`
- Счётчик: `8 photographs · Drag to explore`
- `scrollbar-width: none` — скроллбар скрыт

---

### 3.5 Bio + Атрибуты

- Grid `1fr 1fr`: слева — bio текст курсивом (Cormorant Garamond, 24px)
- Bio: `border-left: 1px solid var(--gold)`, `padding-left: 36px`
- Справа — таблица атрибутов 2×3: Age, Height, Figure, Hair·Eyes, Nationality, Languages
- Ячейки: label (8px, muted, uppercase) + value (Cormorant, 19px, white)

> Emotional hook под именем: одна строка копирайта — *"An evening that begins where ordinary ends"*

---

### 3.6 Experiences

**Секция идёт ДО формы букинга.** Клиент изучает модель → потом бронирует.

- 3 колонки: Connection / Touch & Wellness / Specialities
- Список: Cormorant Garamond, 16-17px, `font-weight: 300`
- Кнопка `Show all →` для скрытых услуг
- Разделители между элементами: `rgba(255,255,255,0.04)`

---

### 3.7 Форма букинга — Arrange a Meeting

**Заголовок секции:** `Arrange a Meeting` — не `Book Now`. Звучит премиально.
`Book Now` только на кнопках действия.

**Шаги формы:**

| Шаг | Элемент |
|-----|---------|
| 01 · Location | Incall / Outcall — 2 карточки, активная подсвечивается золотом |
| 02 · Duration | Pill-кнопки без цен, flex-wrap. Цена только в Summary |
| 03 · Date & Time | Datepicker + timepicker, `min date = tomorrow` |
| 04 · Contact | Name*, Phone*, Notes (optional) |

**Summary блок:**
- Появляется после выбора duration: `Incall · 1 hour` + `£350` справа
- Border: `1px solid rgba(gold, 0.25)`, фон: `rgba(gold, 0.07)`
- Кнопка `[Book Now]` под Summary — full-width, золотая
- Под кнопкой: `◆ Confirmed within 30 min  ◆ 100% discreet  ◆ Verified profile`

**Success state:**
- После submit: форма скрывается, появляется `✓ Request Received`
- Кнопка `[Contact via Telegram]`

> ⚠️ Цены НЕ дублируются. Только в Summary. На duration кнопках только длительность.

---

### 3.8 Assurance

- 3 блока: Absolute Discretion / Verified Authentic / 30-Minute Response
- Grid 3 колонки, разделитель `1px border`
- Символ `◆` золотой, заголовок Cormorant, текст muted

---

### 3.9 Social Proof

**Формат Hermès** — короткая цитата курсивом, без имени, только локация:

> *"Professional, discreet, and exactly as described."*
> — Mayfair, October

> Анонимность = доверие в этой нише. Не "Verified Client" — звучит как алиэкспресс.

---

### 3.10 Sticky Bar

Появляется после скролла мимо hero (`IntersectionObserver`). Фиксирован снизу.

- Содержимое: `Marzena  ·  From £300/hr  ·  [Book Now]`
- Стиль: `bg rgba(8,8,8,0.95)`, `backdrop-filter: blur(8px)`
- `Book Now` — золотая кнопка, `padding: 10px 28px`

> Не агрессивный banner — тонкая полоска. Не мешает, но всегда доступна.

---

## 4. Типографика

| Элемент | Значение |
|---------|----------|
| Serif (заголовки, цены, bio) | Cormorant Garamond |
| Sans (UI, кнопки, labels) | Montserrat |
| Имя | `clamp(80px, 10vw, 130px)`, weight 300 |
| Цена hero | 26-28px, золотой |
| Body | 13px, `line-height: 1.8+` |
| Labels | 7-9px, `letter-spacing: 0.25-0.35em`, uppercase |
| Кнопки | `letter-spacing: 0.28-0.32em`, uppercase |
| Italic | Только Cormorant в bio и booking title |

---

## 5. Цветовая система

| Переменная | Hex | Где использовать |
|------------|-----|-----------------|
| `--gold` | `#C9A96E` | Активный CTA, цены, активные элементы, метки секций |
| `--gold-light` | `#DFC08A` | Hover золотых кнопок |
| `--gold-dim` | `rgba(201,169,110,0.12)` | Фон активных карточек, summary |
| `--black` | `#080808` | Основной фон |
| `--dark` | `#0F0F0F` | Trust bar, ячейки атрибутов |
| `--card` | `#141414` | Карточки формы, поля ввода |
| `--text` | `#E8E2D6` | Основной текст |
| `--muted` | `rgba(232,226,214,0.4)` | Labels, подписи, вторичный текст |
| `--white` | `#F5F0E8` | Имя, заголовки, акцентный текст |
| `--border` | `rgba(255,255,255,0.06)` | Разделители, границы карточек |

> ⚠️ Золото максимум в 5 точках. Если золото везде — оно теряет значение.

---

## 6. UX — принципы Hermès уровня

### Whitespace
Между секциями минимум 120-160px padding. Пустое пространство = роскошь.

### Один CTA на экран
Не два CTA рядом — паралич выбора. На каждом экране одно действие.

### Скорость до цены
Клиент видит цену на первом экране. Не на 5-м. Устраняет 30-40% отказов.

### Язык

| Где | Текст |
|-----|-------|
| Nav, sticky bar, кнопки | `Book Now` |
| Заголовок секции букинга | `Arrange a Meeting` |
| Secondary CTA | `Enquire` |
| Никогда | `Submit Your Request`, `Fill out the form`, `Click here` |

### Мобильный (60% трафика)
- Sticky `[Book Now]` фиксирован снизу после скролла мимо hero
- Duration кнопки: grid 2 колонки
- Gallery: touch-swipe
- Все поля формы: полная ширина
- Тестировать на 390px (iPhone) и 414px (Android)

---

## 7. Производительность

- Все `img` → Next.js `<Image>` с `fill`, WebP/AVIF автоматически
- Hero фото: `priority: true`
- Изображения проксируются через Vercel `/_next/image` (R2 timeout fix)
- Batch SQL: один запрос `SELECT MIN(price) GROUP BY model_id` вместо N+1
- DOM сокращён: удалены дублирующие секции

> Отслеживать LCP в Google Search Console после деплоя — hero image влияет.

---

## 8. SEO

- URL: `/companions/[slug]` (был `/catalog/[slug]`) — 301 redirect настроен
- Canonical URL: `/companions/[slug]`
- JSON-LD: `LocalBusiness` + `BreadcrumbList` на каждом профиле
- Service tags на профиле → `/services/[slug]` (двусторонняя перелинковка)
- Similar Companions: 3 карточки по национальности, fallback на остальных
- Sitemap расширен: `/services` и `/services/[slug]`

---

## 9. Нерешённые проблемы (вне кода)

| Проблема | Описание |
|----------|----------|
| Фото качество | Anser (селфи), ISMAT (коридор) — заменить на уровне контента |
| Страница /about | Nav ведёт на /about — страница не существует. Создать. |
| Social proof | Текущий отзыв — placeholder. Нужен реальный или убрать. |
| Available Now статус | Все модели статично "Available Now". Нужна реальная логика. |
| 301 редиректы | Проверить в Google Search Console через 2-4 недели |
| R2 bucket | Проверить public access — доступность с серверов Vercel |

---

## 10. KPI — что отслеживать

| Метрика | Было | Цель |
|---------|------|------|
| Conversion rate (submit / визиты) | — | Основной KPI |
| Bounce rate (главная) | ~50% | ~32% |
| Время до цены | 5-7 мин | 3-5 сек |
| Клики до букинга | 4-5 | 2-3 |
| Pages per session | — | ↑ (internal linking) |
| Core Web Vitals LCP | — | Следить после деплоя |
| GSC Coverage | — | После миграции /catalog → /companions |

---

*VIREL · ТЗ составлено март 2026 · Adel Islamov*
