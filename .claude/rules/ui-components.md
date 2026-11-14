---
paths:
  - "src/shared/ui/**"
  - "src/app/dev/**"
---

# shared/ui qoidalari

- Komponent fayli faqat komponent eksport qiladi (fast refresh). Sof funksiyalar `helpers.ts`da, testi `helpers.test.ts`da.
- Ranglar faqat token klasslari: `bg-surface`, `bg-surface-2`, `border-line`, `text-muted`, `text-faint`, `bg-primary`,
  `text-primary-strong`, `bg-danger-soft`… Hex va `bg-gray-*` kabi palitra klasslari yozilmaydi. Dark tema tokenlar orqali o'zi ishlaydi.
- Shrift faqat Inter (`font-sans`). `font-mono` ishlatilmaydi.
- `cursor-pointer` qo'lda yozilmaydi: `index.css`dagi global qoida barcha `button`, `[role=button]`, `select`, checkbox'ga beradi.
  Faqat button bo'lmagan bosiladigan element (jadval qatori, ro'yxat varianti) uchun qo'shiladi.
- Bir klass guruhida qarama-qarshi klasslar bo'lmasin (`bg-surface` + `bg-primary`): `cn()` ularni birlashtirmaydi,
  CSS tartibi yutadi. Holatga qarab `cond ? a : b` bilan tanlang.
- Ikonkali tugma — `IconButton` va majburiy `label` (u tooltip ham, ekran o'quvchi uchun nom ham).
- Matn i18n orqali (`common.*`, `pagination.*`).
- Props tipi: `ComponentProps<'button'> & {…}`; `ref` React 19'da oddiy prop.
- O'lchamlar: input/tugma balandligi `h-9` (sm `h-[30px]`, lg `h-[42px]`), radius `rounded-md` (8px) / `rounded-lg` (12px),
  dialog va kartochka ichki padding'i `px-4`.
- Yangi komponent → `index.ts`ga eksport va test.
- Ochiladigan ro'yxatlarda belgilangan/hover variant — `bg-primary-soft`, tanlangani — `text-primary-strong` + ✓.
  `bg-surface-2` oq fonda deyarli ko'rinmaydi, ro'yxatlar uchun ishlatilmaydi.
