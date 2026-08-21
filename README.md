# Winter Walker

Walk the snow. Hold **O** left and **P** right.

Arcade Engage game. Same magic-link account as Field Rush and No Brakes.

```bash
npm install
npm run dev
```

Then open http://localhost:5175

| URL | |
| --- | --- |
| Play | https://winterwalker.arcadeengage.com/ |
| Hub | https://arcadeengage.com/ |

## Deploy on Vercel

1. Import `jezjsa/winter-walker` in Vercel.
2. Framework: **Vite**. Build `npm run build`, output `dist`.
3. Add environment variable **`VITE_CONVEX_URL`** (same Convex deployment as Field Rush).
4. Attach the domain **`winterwalker.arcadeengage.com`**.
5. At the DNS host, add `winterwalker` as a CNAME to `cname.vercel-dns.com`.
