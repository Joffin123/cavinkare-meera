# Cavinkare Meera — pitch site

Social media pitch deck for Cavinkare Meera, built by Alttred Nexxus.

- Served at `https://pitch.alttrednexxus.com/cavinkare-meera_131026`
- The deck itself is static and lives in `public/deck/` (`index.html`, `deck.css`, `deck.js`, `assets/`).
- `next.config.ts` sets `basePath` to `/cavinkare-meera_131026`; the `pitch-alttred-nexxus` router project forwards that folder here.

```bash
npm install
npm run dev     # http://localhost:3000/cavinkare-meera_131026
npm run build
```
