---
paths:
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
  - "src/test/**"
---

# Test qoidalari

- Vitest + Testing Library (jsdom). Ishga tushirish: `npm run test:run` yoki `npx vitest run <fayl>`.
- Test fayl tekshiriladigan fayl yonida: `X.tsx` → `X.test.tsx`.
- Sof funksiyalar uchun oddiy unit test. Komponent — foydalanuvchi ko'zi bilan: `getByRole`, `getByLabelText`, `userEvent`.
  `className` yoki ichki state'ni tekshirmang.
- Router/React Query kerak bo'lsa — `renderWithProviders(ui, { url, routes })` (`src/test/render.tsx`).
- Bo'lim integratsion testi (`features/x/x.test.tsx`): `vi.mock('@/shared/api/client')`, real `xApi` ishlaydi —
  shunda **endpoint va body** ham tekshiriladi. Kamida: ro'yxat, o'chirish, yaratish (body), tahrirlash (PUT), validatsiya.
- Matnlar ruscha (default til) bo'yicha qidiriladi: `getByRole('button', { name: 'Сохранить' })`.
- jsdom'da yo'q API'lar (`matchMedia`, `<dialog>.showModal`, `scrollIntoView`) `src/test/polyfills.ts`da.
- Test o'tmasa, avval kodni tekshiring — testni "yashil qilish" uchun kutilgan qiymatni o'zgartirmang.
  Istisno: test ma'lumoti noto'g'ri bo'lsa (masalan 1 ta yozuv bilan 2-sahifani tekshirish).
