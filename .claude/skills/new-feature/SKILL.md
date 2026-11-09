---
name: new-feature
description: Port one CRUD section (list + add/edit form + delete) from the old admin panel into src/features/<name>, using features/exchange as the template. Use when the user asks to migrate/ko'chirish a section such as currency, country, units, series, suppliers, textures, users, or to add a new list page with a form.
argument-hint: "<section> — e.g. currency, units, series"
---

# Yangi bo'lim: eski paneldan ko'chirish

Namuna — `src/features/exchange` (hamma fayllarini o'qing). Eski panel (faqat o'qish uchun, unga tegilmaydi):
`/home/akbarinfo/Work/winpro/admin-winpro/src`. Uning `.env` fayllari o'qilmaydi.

## 1. Eski bo'limni o'rganing (kod yozishdan oldin)

| Nima | Qayerda |
|---|---|
| URL'lar | `routes/MainRoutes.js` va `pages/<X>.js` (`/`, `/add`, `/update/:id`) |
| Ro'yxat | `layout/<x>/<X>.js`: `headerTable` (ustunlar, `sort: true`), `bodyTable` (maydonlar), `/v1/<x>/table` body, filtrlar, qidiruv |
| Forma | `layout/<x>/Add<X>.js`: maydonlar, majburiylar, select'lar qaysi `/list` dan to'ladi, default qiymatlar |
| So'rovlar | `services/<x>Service.js`: create/update URL (POST/PUT), delete, get by id |
| Matnlar | `localization/{ru,uz,eng}/translation.json` — mavjud ruscha nomlarni qayta ishlating |

Foydalanuvchiga qisqa xulosa bering: ustunlar, forma maydonlari, endpointlar, g'alati joylar
(tarjima kaliti bo'yicha saralash, string id, eski koddagi xatolar). Noaniq joy bo'lsa — so'rang.

## 2. Fayllarni yarating — `src/features/<x>/`

`exchange`dan nusxa olib moslang (har birining qoidasi `.claude/rules/features.md`da):

1. `types.ts` — backend obyekti (eski koddagi `response.data` maydonlari).
2. `schema.ts` — forma maydonlari; `XForm`/`XValues`.
3. `api.ts` — `xKeys`, `xApi.table/get/save/remove`. Body eski bilan **aynan bir xil** (`id: id ?? null` va h.k.).
4. `locales/{ru,uz,en}.json` — `{ "x": { title, add, edit, empty, …maydonlar } }`, uchala tilda. `i18n.ts`, `index.ts`.
5. `XListPage.tsx` — ustunlar: eski `headerTable` tartibida; `sortable` faqat eski `sort: true` bo'lganlarga;
   `sortKey` = eski `headerTable[].name`, agar u maydon nomidan farq qilsa.
6. `XFormDialog.tsx` — kichik forma (≤ ~8 maydon) dialog; kattasi `XFormPage.tsx` (alohida sahifa) — oldin foydalanuvchidan so'rang.
   Select'lar — `Combobox`; manbasi bir necha bo'limda kerak bo'lsa `shared/lookups/<y>.ts`ga chiqaring.
7. `routes.tsx` — eski URL'lar bilan.

Umumiy komponent yetmasa — `shared/ui`ga qo'shing (`.claude/rules/ui-components.md`), bo'lim ichida yangi "umumiy" komponent yozmang.

## 3. Ulang

- `src/app/router/router.tsx` → `featureRoutes`ga `...xRoutes`.
- `src/app/layout/nav.ts` → yorliqni `'x.title'`ga almashtiring.

## 4. Testlar

- `schema.test.ts` — majburiy maydonlar, chegaralar.
- `x.test.tsx` — `exchange.test.tsx` kabi: mock HTTP client bilan ro'yxat (table body), o'chirish (DELETE URL),
  yaratish (POST body), tahrirlash (PUT body), validatsiya.

## 5. Tekshiring va topshiring

```bash
npm run typecheck && npm run lint && npm run test:run && npm run build
```

Hammasi o'tmaguncha "tayyor" demang. Keyin:
- `CLAUDE.md` → "Ko'chirish tartibi"da bo'limni belgilang.
- Foydalanuvchiga: nima ko'chirildi, eski paneldan nimasi farq qiladi, real backend bilan nimani tekshirish kerak.
- Commit faqat foydalanuvchi so'raganda; xabar o'zbekcha (`feat: <bo'lim> bo'limi`).
