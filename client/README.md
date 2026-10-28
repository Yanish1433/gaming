# Arena Nepal: client

Vite + React 19 + React Router 7 + Tailwind CSS 4 + `motion`, with three.js via `@react-three/fiber` for the 3D pieces.

```bash
npm install
npm run dev     # http://localhost:5173, proxies /api and /uploads to http://localhost:5000
npm run build
```

## Game images

Every game has original SVG art (poster, map vignettes, round emblem) that works with no image files at all.
You can layer images on top by dropping files into `public/games/<slug>/` (`pubg`, `freefire`, `efootball`, `fcmobile`):

| File | Used for | Notes |
|---|---|---|
| `icon.png` / `icon.webp` / `icon.jpg` | Round game badge on game cards, the hub hero, the navbar game switcher, challenge/match cards and the ladder header | Small square image (around 240–320 px). The explicit path is set as `icon` in `src/lib/games.js`; when `icon` is `null` the first `icon.*` that loads is used, otherwise the SVG emblem. |
| `hero.webp` / `hero.jpg` | Behind the hub poster art, in duotone (greyscale multiplied by the game's accent colour) | Optional. Use a large image (1200 px or wider). |

**Only drop official press-kit images here with permission from the rights holder.** Game names, logos and key art
belong to their publishers (Krafton, Garena, Konami, EA). The icons currently in `public/games/` were supplied by the
project owner, who is responsible for having the rights to use them.

## 3D

- `src/components/three/Stage3D.jsx` decides whether 3D runs at all. It is skipped for `prefers-reduced-motion`,
  for `navigator.deviceMemory <= 2`, and when WebGL is unavailable; the SVG poster shows instead.
- `src/components/three/Scenes.jsx` (one lazily loaded chunk) holds the home airdrop and the four hub objects. They are
  built from primitives and hand-written geometry: no downloaded models.
- The canvas loads only when the stage scrolls near the viewport, stops rendering while offscreen, and caps the
  device pixel ratio at 1.5.
