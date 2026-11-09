---
paths:
  - "src/**/api.ts"
  - "src/shared/api/**"
  - "src/shared/lookups/**"
---

# API qoidalari

- Barcha so'rovlar `api` (axios, `@/shared/api/client`) orqali. Token, `Accept-Language` va xatolarni interceptor qo'shadi.
- Endpoint va body eski paneldan olinadi: `/home/akbarinfo/Work/winpro/admin-winpro/src/services/<x>Service.js` va
  `src/layout/<x>/*.js`. Eski kodda qanday bo'lsa, shunday yuboring (masalan PUT body'dagi `id` — URL'dagi string).
- Jadval: `table: (body: TableBody, signal?) => api.post<TablePage<X>>('/v1/x/table', body, { signal }).then(r => r.data)`.
  Body faqat `buildTableBody()` orqali yig'iladi. Jami son — `recordsFiltered`.
- GET'larga `signal` uzating — React Query eskirgan so'rovni bekor qiladi.
- Xatolar `ApiError` bo'lib keladi: `status`, `message`, `fields`. 401/420/5xx'ni interceptor o'zi ko'rsatadi;
  sahifa faqat 4xx'ni (`isClientError`) forma ustida chiqaradi.
- Ma'lumotnoma (valyuta, birlik, mamlakat…) bir necha bo'limda kerak bo'lsa — `shared/lookups/<x>.ts`:
  `useX()` hook, `staleTime: 10 * 60_000`, query key `['x', 'list']`. Bitta bo'limda kerak bo'lsa — o'sha bo'lim `api.ts`da.
- Hech qachon `.env` faylni o'qimang; manzil `env.API_URL` orqali.
