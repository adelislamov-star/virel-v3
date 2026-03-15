# VIREL — MOBILE FIXES + FONT HIERARCHY
# Отдай этот файл Claude Code в новом чате
# Репо: https://github.com/adelislamov-star/virel-v3
# Branch: mobile-fixes

---

## ЗАДАЧА 0 — КРИТИЧЕСКАЯ. ДЕЛАТЬ ПЕРВОЙ.

### Горизонтальный overflow на мобильном

Сайт горизонтально скроллится на телефонах. Весь контент обрезан слева и справа. Кнопки, заголовки, отзывы — всё срезано. Сайт на мобильном СЛОМАН.

**Причина:** какой-то элемент шире viewport (100vw). Скорее всего Trust Bar, footer grid, или секция с десктопным padding которое не переключается на мобильное.

**Шаг 1 — немедленный фикс:**
```css
/* В globals.css или layout */
html, body {
  overflow-x: hidden;
  max-width: 100vw;
}
```

**Шаг 2 — найти источник:**
Временно добавь `* { outline: 1px solid red; }` и проверь на 390px ширины — какой элемент вылезает за viewport. Удали outline после фикса.

**Шаг 3 — типичные причины (проверить все):**
- Trust Bar — строка с 4 элементами может быть шире экрана, нужен `flex-wrap` на мобильном
- Footer — 3 колонки без mobile breakpoint
- Секции с `padding: 80px` которые не переключаются на `padding: 24px` на мобильном
- Booking form — duration чипы 7 в ряд
- Service tags — 27 тегов в длинных строках без ограничения
- Gallery — горизонтальный скролл может ломать layout

**Не переходи к остальным задачам пока горизонтальный скролл не убран.**

---

## ЗАДАЧА 1 — Цена на Hero главной

**Файл:** `src/app/page.tsx` — hero секция

«FROM £250 PER HOUR» сейчас слишком мелкий — визуально такой же как Trust Bar текст ниже. Это ценовой якорь, он должен быть вторым по важности после H1.

**Сделать:**
```
Было:  text-xs или text-sm, uppercase, tracking
Стало: text-lg md:text-xl (18-20px), font-semibold, gold color, uppercase, tracking
```

Цена должна быть заметно крупнее чем мелкий серый текст, но меньше чем H1.

---

## ЗАДАЧА 2 — Цена на Hero профиля

**Файл:** `src/app/companions/[slug]/page.tsx` — hero секция

«FROM £300/HOUR» сейчас того же размера что «29 · BRAZILIAN». А цена — главный конверсионный элемент. Она должна визуально выделяться.

**Сделать:**
```
Было:  тот же размер что «29 · BRAZILIAN»
Стало: text-xl md:text-2xl (20-24px), font-semibold, gold
```

Иерархия на профиле должна быть:
1. Имя (самый крупный) — ~48-64px
2. Цена (второй) — ~20-24px, золотой, жирный
3. Возраст/национальность (третий) — ~14px, серый

---

## ЗАДАЧА 3 — Цена на карточках Featured

**Файл:** `src/app/page.tsx` — featured cards

«From £300/hr» на карточках — на грани читаемости. Чуть увеличить.

**Сделать:**
```
Было:  text-xs (12px)
Стало: text-sm (14px), gold color, keep uppercase
```

---

## ЗАДАЧА 4 — Trust Bar на мобильном

**Файл:** `src/app/page.tsx` — trust bar секция

На мобильном 4 элемента в строку с разделителями не влезают — переносятся криво.

**Сделать:**
На мобильном (≤640px):
- Убрать точечные разделители (· и ◆)
- Показать 2 строки по 2 элемента, centered
- Или вертикальный стек: каждый элемент на своей строке

```tsx
{/* Mobile: 2x2 grid */}
<div className="sm:hidden grid grid-cols-2 gap-2 text-center text-xs uppercase tracking-widest text-[#808080]">
  <span>Personally Verified</span>
  <span>30-Minute Response</span>
  <span>Complete Discretion</span>
  <span>Est. 2024</span>
</div>

{/* Desktop: inline */}
<div className="hidden sm:flex items-center justify-center gap-4 ...">
  ...текущий вариант...
</div>
```

---

## ЗАДАЧА 5 — Featured карточки на мобильном

**Файл:** `src/app/page.tsx` — featured companions секция

Сейчас на мобильном 2 карточки в ряд + 1 сиротливо внизу. Не выглядит.

**Сделать:**
```
Было:  grid grid-cols-2 md:grid-cols-3
Стало: grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3
```

На телефоне (≤640px) — 1 карточка на всю ширину. Крупное фото, имя, цена. Скроллит вниз.

---

## ЗАДАЧА 6 — Service tags на профиле

**Файл:** `src/app/companions/[slug]/page.tsx` или компонент тегов

27 тегов в 6 строк — на мобильном это огромный блок текста. Клиент не будет читать 27 тегов.

**Сделать:**
- Показывать максимум 8 тегов
- Добавить кнопку «Show all services (+19)»
- По клику — развернуть все теги
- Использовать `useState` для toggle

```tsx
const [showAll, setShowAll] = useState(false);
const visibleTags = showAll ? allTags : allTags.slice(0, 8);

return (
  <div className="flex flex-wrap gap-2">
    {visibleTags.map(tag => (
      <Link key={tag.slug} href={`/services/${tag.slug}`} className="...">
        {tag.name}
      </Link>
    ))}
    {!showAll && allTags.length > 8 && (
      <button onClick={() => setShowAll(true)} className="px-3 py-1 border border-[#2A2A2A] text-xs uppercase tracking-wider text-[#808080]">
        +{allTags.length - 8} more
      </button>
    )}
  </div>
);
```

---

## ЗАДАЧА 7 — Duration чипы в форме букинга

**Файл:** `src/components/booking/BookingForm.tsx` или `src/components/profile/ProfileInteractive.tsx`

7 duration чипов (30 min / 45 min / 1 hour / 1.5 hours / 2 hours / Extra hour / Overnight) в одну строку — на мобильном они или обрезаются или становятся нечитаемо мелкими.

**Сделать:**
```
Было:  flex flex-wrap gap-2 (или grid с 7 колонками)
Стало: grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3
```

На мобильном — 2 чипа в ряд. Крупнее, удобнее нажимать пальцем (мин. 44px высоты для touch target).

---

## ЗАДАЧА 8 — Final CTA кнопки на мобильном

**Файл:** `src/app/page.tsx` — final CTA секция

Кнопки «BROWSE COMPANIONS» и «MESSAGE ON TELEGRAM» на мобильном обрезаются — не влезают в ширину.

**Сделать:**
```
Было:  flex flex-row gap-4
Стало: flex flex-col sm:flex-row gap-4
```

На мобильном — кнопки в стек (вертикально), каждая на полную ширину:
```tsx
<div className="flex flex-col sm:flex-row gap-4 justify-center">
  <Link className="w-full sm:w-auto text-center ...">BROWSE COMPANIONS</Link>
  <Link className="w-full sm:w-auto text-center ...">MESSAGE ON TELEGRAM</Link>
</div>
```

---

## ЗАДАЧА 9 — Footer на мобильном

**Файл:** `src/components/Footer.tsx`

Footer с 3 колонками (Companions / Information / Contact) на мобильном разваливается — текст обрезан, колонки налезают друг на друга, «bookings@virel.com» обрезается.

**Сделать:**
```
Было:  grid grid-cols-4 (или grid-cols-3)
Стало: grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8
```

На мобильном (≤640px):
- Каждая секция на полную ширину, стек вертикально
- Между секциями 32px gap
- Район-ссылки внутри Companions — в 2 колонки (`grid grid-cols-2`)
- Email — `break-all` или `text-sm` чтобы не обрезался
- Copyright строка внизу — `text-xs`, `text-center`, `flex-wrap`

---

## ЗАДАЧА 10 — Глобальная проверка на 390px

После всех фиксов — проверить ВСЕ страницы на ширине 390px:

- [ ] Главная: hero, trust bar, featured, social proof, final CTA, footer
- [ ] Каталог (/london-escorts): заголовок, фильтры, карточки
- [ ] Профиль (/companions/marzena): hero, gallery, bio, rates, tags, booking form, similar
- [ ] Services (/services): заголовок, категории, карточки

**Правило: ни один элемент не должен вызывать горизонтальный скролл.**

Проверить:
```css
/* Временно для дебага */
* { outline: 1px solid red; }
```

Если что-то выходит за пределы — найти и пофиксить.

---

## ПОРЯДОК ВЫПОЛНЕНИЯ

```
0. Горизонтальный overflow    ← ПЕРВЫМ, без этого мобильный сломан
1-3. Шрифты (цена на hero, профиле, карточках)
4. Trust Bar mobile
5. Featured cards mobile
6. Service tags collapse
7. Duration chips mobile
8. CTA buttons mobile
9. Footer mobile
10. Финальная проверка 390px
```

**Коммит в branch `mobile-fixes`, пуш, merge в main.**
