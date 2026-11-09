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
```

Ishni tugatgandan keyin `npm run typecheck && npm run lint` o'tishi shart.
Prettier `src/` dagi faylni har tahrirdan keyin avtomatik formatlaydi (`.claude/settings.json` hook).

## Stek

React 19, TypeScript 7, Vite 8, Tailwind v4, React Router (`createBrowserRouter`), TanStack Query,
axios, Zustand, react-hook-form + zod, i18next, sonner (toast), lucide-react (ikonkalar), clsx.

## Arxitektura

```
src/
├── app/        ilovani yig'adi: providers, router, layout, styles
├── shared/     umumiy poydevor: api, ui, hooks, lib, config, store, i18n — bo'limlarni bilmaydi
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
- **Jadval holati** (page, size, sort, search, filtrlar) URL'da saqlanadi (`useTableParams`), localStorage'da emas.
- **Formalar**: react-hook-form + zod schema. Xato maydon ostida chiqadi.
- **Toast** `sonner`dan: `toast.success(t('action.saved'))`. Sozlama faqat `AppProviders`da.
- **Env** faqat `@/shared/config/env` orqali o'qiladi. `.env*` fayllar gitga tushmaydi (`.env.example` bundan mustasno).
- **Matnlar** i18n kalitlari orqali (ru, uz, en). Interfeysning asosiy tili rus.
  `shared/i18n/locales/legacy/*.json` — eski paneldan o'zgarishsiz ko'chirilgan (`sidebar_menu_currency` kabi tekis kalitlar),
  ularni o'zgartirmang. Yangi matnlar `shared/i18n/locales/{ru,uz,en}.json`ga bo'lim bo'yicha (`auth.login_title`) uchala tilda yoziladi.
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
| `api.ts` | Endpointlar, `shared/api/client` orqali |
| `schema.ts` | zod forma qoidalari |
| `XListPage.tsx` | Ro'yxat: DataTable + Pagination |
| `XFormDialog.tsx` | Modal forma (katta formada `XFormPage.tsx`) |
| `routes.tsx` | Marshrutlar → `app/router/router.tsx` va `nav.ts`ga qo'shiladi |
| `locales/{ru,uz,en}/x.json` | Tarjimalar, uchala tilda |

Namuna bo'lim — **Курсы валют** (`features/exchange`). Yangi bo'lim shundan nusxa olinadi.

## Nomlash

| Nima | Qoida | Misol |
|---|---|---|
| Komponent, sahifa | PascalCase.tsx | `ExchangeListPage.tsx` |
| Hook | camelCase, `use…` | `useServerTable.ts` |
| Schema va tip | `xxxSchema`, `XxxInput` | `exchangeSchema`, `ExchangeInput` |
| Konstanta | UPPER_SNAKE | `PRODUCT_GROUPS` |
| Tarjima kaliti | bo'lim.qism.kalit | `exchange.form.rate` |

## Backend bilan ishlash

- Ro'yxatlar `POST .../table` ga DataTables formatidagi body bilan so'raladi: uni faqat `buildTableBody()` yig'adi.
- Xato statuslari: `401` → logout va login sahifasi; `420` → backend ogohlantirishi (sariq toast);
  `400/422` → maydon xatolari; `5xx` va tarmoq → qizil toast.
- Fayl va rasm URL'lari `fileUrl(kind, id)` orqali: `/v1/file/{kind}/{id}`.

## Ko'chirish tartibi

1. Skelet: layout, router, auth, session store — ✅ kod tayyor, real backend bilan login tekshirilishi kerak
2. Umumiy qatlam — **keyingi bosqich**: api client, DataTable, Pagination, Combobox, FormField, useServerTable, useConfirmDelete, useEntityForm, lookups
3. Namuna bo'lim: Курсы валют
4. Oddiy CRUD bo'limlar: valyuta, mamlakat, birlik, seriya, tekstura, ta'minotchi…
5. Mahsulot moduli: avval profil, keyin qolgan 3 guruh config orqali
6. Murakkab bo'limlar: Akfa integratsiyasi, profil tizimlari, shablonlar, tarjimalar

Bu ro'yxatdagi bosqich tugaganda yangilanadi.

## Claude sozlamalari: keyin qo'shiladiganlar

Tegishli bosqichga yetganda foydalanuvchiga eslatilsin.

| Qachon | Nima |
|---|---|
| 2-bosqich | `.claude/rules/`: `ui-components.md`, `api.md`, `features.md` — real misollar bilan |
| 3-bosqich (Курсы валют tayyor) | `.claude/skills/new-feature` — namuna bo'limdan yangi CRUD bo'lim yaratadi |
| GitHub repo yaratilganda | `.mcp.json` (GitHub MCP) |
| 4-bosqich o'rtasi (~10–15 feature) | graphify — `graphify-out/` gitga tushmaydi |
| 4–5-bosqichlar | `.claude/agents/architecture-reviewer.md` |
| Testlar (Vitest) qo'shilganda | `.claude/rules/testing.md` |

Shaxsiy sozlamalar `.claude/settings.local.json` va `CLAUDE.local.md`da saqlanadi, ular gitga tushmaydi.
