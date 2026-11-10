---
paths:
  - "src/features/**"
---

# Feature (bo'lim) qoidalari

Namuna: `src/features/exchange`. Yangi bo'lim shu fayllar to'plamidan nusxa olinadi (`/new-feature` skill).

## Tuzilish

- `api.ts` — `xKeys = { all: ['x'] as const }` va `xApi = { table, get, save, remove }`. Faqat `@/shared/api/client`.
  `save(values, id?)`: id yo'q → POST, bor → PUT. URL va body eski panel bilan **aynan bir xil**.
- `schema.ts` — zod. `XForm = z.input`, `XValues = z.output`. Majburiy son/id: `requiredNumber()`, musbat: `positiveNumber()`,
  matn: `requiredText()` (`@/shared/lib/zod`). Xabarlar — i18n kalitlari.
- `XListPage.tsx` — `ListLayout` > `PageHeader` + `TableCard` (`TableToolbar` + `DataTable` + `Pagination`) + `{del.dialog}` + `<Outlet />`.
  Eski sahifada `<SearchInput/>` bo'lsa — `TableToolbar` ichida `<SearchInput value={table.search} onChange={table.onSearchChange} />`.
  Qidiruv bo'lsa `DataTable`ga `highlight={table.search}` ham beriladi; maxsus `render` ustunida `<Highlight text query />`.
  Eski `id: index + 1` ustuni → `{ key: 'number', render: (_, i) => table.rowNumber(i) }`. Yuklash xatosi: `error` + `onRetry` props.
  `/table` endpoint'i yo'q bo'lsa (masalan tillar) — `useQuery` + `DataTable`, `Pagination`siz (`features/languages`).
- `XFormDialog.tsx` — `useEntityForm` + `Modal onSubmit={submit}`. Yopish: `navigate({ pathname: '/x', search })`.
  `resolver` va `toForm` modul darajasida (har renderda yangilanmasin), `defaultValues` — `useState(() => …)`.
- `routes.tsx` — `/x` + bola `add`, `update/:id`. URL'lar eski panel bilan bir xil. Sahifalar `lazy`:
  `lazy: () => import('./XListPage').then((m) => ({ Component: m.XListPage }))` — sahifa komponenti to'g'ridan-to'g'ri
  import qilinmaydi (aks holda u asosiy bundle'ga tushadi). Tarjimalar `index.ts` orqali oldindan ulanadi (menyu nomlari uchun).
- `locales/{ru,uz,en}.json` — faqat `{ "x": { … } }`. `i18n.ts` → `registerTranslations`. `index.ts` → `import './i18n'`.

## Ustunlar

- `key` — backend obyektidagi maydon. Saralanadigan ustun: `sortable: true`.
- Eski paneldagi `headerTable[].name` maydon nomidan farq qilsa (masalan `table.exchange.date`), `sortKey` shu nomga teng.
  Eski panelda `sort: true` bo'lmagan ustunni saralanadigan qilmang — backend uni qabul qilmasligi mumkin.
- Sana — `formatDate`, son — `formatNumber`, `align: 'right'`, `tabular-nums`.

## Taqiqlar

- Boshqa feature'dan import qilmang (oxlint xato beradi). Umumiy narsa `shared/`ga.
- Komponentda `api`/`axios`/`fetch` chaqirmang — faqat `xApi` orqali, React Query ichida.
- Toast'ni qo'lda chiqarmang: saqlash/o'chirish toast'larini `useEntityForm`/`useConfirmDelete` chiqaradi.
- Matnni JSX'ga yozmang — `t('x.…')`.
