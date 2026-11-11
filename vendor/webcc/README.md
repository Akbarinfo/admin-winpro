# webcc (vendored)

Oyna konstruktori (wikywin `webcc@1.16.14`). npm'dan o'rnatib bo'lmaydi, shuning uchun eski paneldagi
`node_modules/webcc/dist/webcc.min.js` shu yerga o'zgarishsiz ko'chirilgan va `package.json`da
`"webcc": "file:vendor/webcc"` bilan ulangan. Bundle o'zi to'liq (konva va boshqalar ichida).

`index.d.ts` — paketda tiplar yo'q edi; faqat admin panel ishlatadigan qismi yozilgan.
Yangi versiya kelsa: `dist/webcc.min.js`ni almashtiring, `version`ni yangilang, `npm install`.
