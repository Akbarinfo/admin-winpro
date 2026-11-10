# WinPro Admin

Deraza biznesi uchun admin panel. Eski CRA/JS panel shu yerda React + TypeScript + Vite'ga qayta yozilmoqda.
Arxitektura taklifi va UI prototipi: https://claude.ai/artifact/RRYW1R5QDNpKv1kQm5pHp1

## Buyruqlar

```bash
npm run dev           # http://localhost:3000
npm run build         # tsc -b && vite build
npm run typecheck     # tsc -b
npm run lint          # oxlint (import chegaralari ham shu yerda tekshiriladi)
npm run format        # prettier --write src
npm run test          # vitest (watch)
npm run test:run      # vitest bir marta
```

Ishni tugatgandan keyin `npm run typecheck && npm run lint && npm run test:run` o'tishi shart.
Dev rejimda `/ui-kit` sahifasi hamma `shared/ui` komponentlarini ko'rsatadi (production'ga tushmaydi).
Prettier `src/` dagi faylni har tahrirdan keyin avtomatik formatlaydi (`.claude/settings.json` hook).

## Stek

React 19, TypeScript 7, Vite 8, Tailwind v4, React Router (`createBrowserRouter`), TanStack Query,
axios, Zustand, react-hook-form + zod, i18next, sonner (toast), lucide-react (ikonkalar), clsx.
Testlar: Vitest + Testing Library (jsdom).

## Arxitektura

```
src/
├── app/        ilovani yig'adi: providers, router, layout, styles
├── shared/     umumiy poydevor: api, ui, hooks, lib, config, store, i18n, lookups, translations — bo'limlarni bilmaydi
└── features/   biznes bo'limlar: exchange, product, akfa…
```

Import yo'nalishi (`.oxlintrc.json` tekshiradi):

- `app` → `features`, `shared`
- `features` → faqat `shared`. Boshqa feature'dan import qilinmaydi: umumiy kod `shared/`ga ko'chiriladi.
- `shared` → faqat `shared`

Feature ichida nisbiy import (`./api`), boshqa joyda `@/` alias (`@/shared/ui`).

## Qoidalar

- **Ranglar** faqat `src/app/styles/tokens.css` da. Komponentda Tailwind token klasslari ishlatiladi
  (`bg-surface`, `text-muted`, `border-line`, `bg-primary`). Hex rang va `bg-teal-500` kabi palitra klasslari yozilmaydi.
  Dark tema `<html class="dark">` orqali yoqiladi.
- **HTTP** faqat `shared/api/client.ts` (axios instance) orqali. Token, `Accept-Language` va xatolar interceptor'da.
  Komponent ichida `fetch`/`axios` chaqirilmaydi.
- **Server ma'lumotlari** TanStack Query'da. Zustand faqat client holati uchun (session, preferences).
  Server javobi Zustand'ga ko'chirilmaydi.
- **Jadval holati** (page, size, sort, search, filtrlar) URL'da saqlanadi (`useTableParams`, filtrlar — `useTableFilters`
  bilan bir xil prefiks ostida), localStorage'da emas.
- **Formalar**: react-hook-form + zod schema, `useEntityForm` orqali. Oddiy matn maydoni `form.register()` + `<Field>`,
  boshqariladigan maydon (Combobox, NumberInput) `<FormField>` orqali. Schema xabarlari i18n kalitlari (`validation.required`).
  Combobox/NumberInput bo'sh qiymati `null`: `requiredNumber()`, `positiveNumber()` (`shared/lib/zod.ts`) uni chiqishda `number`ga aylantiradi.
- **Toast** `sonner`dan: `toast.success(t('common.saved'))`. Sozlama faqat `AppProviders`da.
  Saqlash va o'chirish toast'larini `useEntityForm` va `useConfirmDelete` o'zi chiqaradi.
- **Query key**: har resursning bazaviy kaliti `api.ts`da (`exchangeKeys.all = ['exchange']`). Jadval, detail va
  invalidatsiya shu kalitdan boshlanadi.
- **Env** faqat `@/shared/config/env` orqali o'qiladi. `.env*` fayllar gitga tushmaydi (`.env.example` bundan mustasno).
- **Matnlar** i18n kalitlari orqali (ru, uz, en). Interfeysning asosiy tili rus.
  `shared/i18n/locales/legacy/*.json` — eski paneldan o'zgarishsiz ko'chirilgan (`sidebar_menu_currency` kabi tekis kalitlar),
  ularni o'zgartirmang. Umumiy yangi matnlar (`common.*`, `validation.*`) `shared/i18n/locales/{ru,uz,en}.json`da.
  Bo'lim matnlari `features/<nom>/locales/{ru,uz,en}.json`da, faqat `<nom>.*` kaliti ostida; `i18n.ts` ularni
  `registerTranslations()` bilan ulaydi. `locales.test.ts` uchala tilda kalitlar bir xilligini tekshiradi.
- **Menyu** `app/layout/nav.ts`da ma'lumot sifatida turadi. URL'lar eski panel bilan bir xil (xatcho'plar ishlashi uchun).
  Ko'chirilmagan bo'limlar `ComingSoonPage`ni ko'rsatadi. Bo'lim tayyor bo'lganda uning `routes.tsx` fayli
  `app/router/router.tsx`da placeholder'lardan oldin qo'shiladi.
- **Sessiya** (`token`, `user`) sessionStorage'da, til va tema esa localStorage'da saqlanadi.
- `console.log` qoldirilmaydi.

## Yangi bo'lim qo'shish

`src/features/<nom>/` ichida:

| Fayl | Vazifasi |
|---|---|
| `types.ts` | Backend obyekti tipi |
| `api.ts` | `xKeys` va endpointlar (`table`, `get`, `save`, `remove`), `shared/api/client` orqali |
| `schema.ts` | zod forma qoidalari, `XForm` (forma holati) va `XValues` (API'ga ketadigan) tiplari |
| `XListPage.tsx` | `useServerTable` + `DataTable` + `Pagination` + `useConfirmDelete`, oxirida `<Outlet />` |
| `XFormDialog.tsx` | `useEntityForm` + `Modal`. Katta formada `XFormPage.tsx` |
| `routes.tsx` | `/x` (ro'yxat) va bola marshrutlar `add`, `update/:id` — dialog ro'yxat ustida ochiladi. Sahifalar `lazy` (o'z chunk'i), komponentlar import qilinmaydi |
| `locales/{ru,uz,en}.json`, `i18n.ts` | Tarjimalar uchala tilda va ularni ulash |
| `index.ts` | `import './i18n'` va `xRoutes` eksporti |
| `x.test.tsx`, `schema.test.ts` | HTTP client mock qilingan integratsion test va schema testi |

Keyin `app/router/router.tsx`dagi `featureRoutes`ga qo'shiladi; `nav.ts`dagi yorliq `x.title`ga o'zgartiriladi.
Dialog yopilganda `navigate({ pathname: '/x', search })` — jadvalning URL parametrlari saqlanadi.

Namuna bo'lim — **Курсы валют** (`features/exchange`). Yangi bo'lim shundan nusxa olinadi.

## Nomlash

| Nima | Qoida | Misol |
|---|---|---|
| Komponent, sahifa | PascalCase.tsx | `ExchangeListPage.tsx` |
| Hook | camelCase, `use…` | `useServerTable.ts` |
| Schema va tip | `xxxSchema`, `XxxForm`, `XxxValues` | `exchangeSchema`, `ExchangeForm` |
| Konstanta | UPPER_SNAKE | `PRODUCT_GROUPS` |
| Tarjima kaliti | bo'lim.kalit | `exchange.rate` |
| Test | fayl yonida, `.test.ts(x)` | `tableParams.test.ts` |

## Backend bilan ishlash

- Ro'yxatlar `POST .../table` ga DataTables formatidagi body bilan so'raladi: uni faqat `buildTableBody()` yig'adi.
- Xato statuslari: `401` → logout va login sahifasi; `420` → backend ogohlantirishi (sariq toast);
  `400/422` → maydon xatolari; `5xx` va tarmoq → qizil toast.
- Saralash `order: [{ column, dir: 'ASC' | 'DESC' }]` — katta harflarda; default `id DESC` (eski panel kabi).
  `column` — eski paneldagi `headerTable[].name` bilan **aynan bir xil** bo'lishi kerak. Ba'zi sahifalarda bu
  maydon nomi emas, tarjima kaliti (exchange: `table.exchange.date`). Farq qilsa, ustunga `sortKey` beriladi.
- Ro'yxatning jami soni `recordsFiltered`dan olinadi.
- Fayl va rasm: `fileUrl(kind, id)` → `/v1/file/{kind}/{id}`. Rasm bilan saqlanadigan yozuvlar (supplier, texture, user)
  multipart: `multipartBody(data, image)` — «data» JSON blob + «image» fayl (yangi rasm bo'lmasa `"null"`, eski panel kabi).

## Ko'chirish tartibi

1. Skelet: layout, router, auth, session store — ✅ kod tayyor, real backend bilan login tekshirilishi kerak
2. Umumiy qatlam — ✅ DataTable, Pagination, Combobox, TreeSelect, Modal, FormField, NumberInput, useServerTable, useConfirmDelete,
   useEntityForm, lookups (valyutalar), testlar, `/ui-kit`. ImageUpload 4-, Excel (`Menu`, `ExcelUploadDialog`) 5-bosqichda.
3. Namuna bo'lim: Курсы валют — ✅ kod va testlar tayyor, real backend bilan tekshirilishi kerak
4. Oddiy CRUD bo'limlar — ✅ (`/new-feature <bo'lim>`): Валюты, Единицы, Серии, Виды материала, Языки,
   Поставщики, Услуги мастерской, Тарифные функции, Текстуры (+ соответствия; `/texturegroup` → `/textures`),
   Категория продаж (`TreeSelect` — profil tizimlari daraxti, `shared/lookups/profileSystems`).
   Страны (alohida forma sahifasi + kod provayderlari), Версии приложения, Пользователи, Mobile users.
   4-bosqich oddiy CRUD'lari tugadi. Qolgan oddiy ro'yxatlar (feedback, price-requests) 6-bosqich bilan birga.
5. Mahsulot moduli: avval profil, keyin qolgan 3 guruh config orqali (`features/product/groups.ts`).
   Профили ✅ (ro'yxat, filtrlar, forma + tarjimalar `shared/translations`, narxlar qator ichida, Excel).
   Keyin: Фурнитура, Уплотнители, Заполнения — `groups.ts`ga config + o'z forma maydonlari
6. Murakkab bo'limlar: Akfa integratsiyasi, profil tizimlari, shablonlar, tarjimalar

Bu ro'yxatdagi bosqich tugaganda yangilanadi.

## Kod grafi va arxitektura tekshiruvi

- **graphify**: `graphify-out/graph.json` — `src/`ning AST grafi (LLM'siz, bepul). Kod tuzilishi haqidagi savolda
  avval `graphify query "<savol>"`, `graphify path "A" "B"`, `graphify explain "X"`. Yangi bo'limdan keyin
  `/graphify src --update` bilan yangilanadi. `GRAPH_REPORT.md` — markaziy tugunlar va jamoalar.
- **architecture-reviewer** (`.claude/agents/`): katta o'zgarish yoki yangi bo'limdan keyin, commitdan oldin
  ishga tushiriladi — eski panelga moslik (endpoint, body), chegaralar, query key, i18n, testlar. Faqat o'qiydi.

## Claude sozlamalari: keyin qo'shiladiganlar

Tegishli bosqichga yetganda foydalanuvchiga eslatilsin.

| Qachon | Nima |
|---|---|
| ✅ 2-bosqich | `.claude/rules/`: `ui-components.md`, `api.md`, `features.md`, `testing.md` |
| ✅ 3-bosqich | `.claude/skills/new-feature` — eski paneldan CRUD bo'limni ko'chiradi (`/new-feature currency`) |
| GitHub repo yaratilganda | `.mcp.json` (GitHub MCP) |
| ✅ 4-bosqich oxiri | graphify (`src/` grafi) — `graphify-out/` gitga tushmaydi |
| ✅ 4-bosqich oxiri | `.claude/agents/architecture-reviewer.md` |

Shaxsiy sozlamalar `.claude/settings.local.json` va `CLAUDE.local.md`da saqlanadi, ular gitga tushmaydi.
