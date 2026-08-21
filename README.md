# Winter Walker

Walk the snow. Hold **O** left and **P** right.

Arcade Engage game. Same magic-link account as Field Rush and No Brakes.

```bash
npm install
npm run dev
```

Then open http://localhost:5175

## Deploy on Vercel

This is a Vite static site, same as Field Rush.

1. Import `jezjsa/winter-walker` in Vercel.
2. Framework: **Vite**. Build command `npm run build`, output `dist`.
3. Add environment variable **`VITE_CONVEX_URL`** (from the Convex dashboard, same deployment as Field Rush).
4. Deploy. The play URL is `https://winter-walker.vercel.app/`.
