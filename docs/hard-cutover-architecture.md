# Hard Cutover Architecture

This repo is now hard-cutover to:
- Frontend: React + Tailwind CSS + Framer Motion
- Gameplay runtime: PixiJS
- Backend: Cloudflare Worker + D1

No backward compatibility layer is implemented.

## Frontend
- Entry: `/Users/eric/Documents/Github/gacha/src/main.jsx`
- App shell: `/Users/eric/Documents/Github/gacha/src/App.jsx`
- Home page: `/Users/eric/Documents/Github/gacha/src/pages/HomePage.jsx`
- Gameplay page: `/Users/eric/Documents/Github/gacha/src/pages/GamePage.jsx`
- Pixi runtime: `/Users/eric/Documents/Github/gacha/src/game/createPixiGame.js`

## Backend
- Worker routes: `/Users/eric/Documents/Github/gacha/worker/index.js`
- D1 schema: `/Users/eric/Documents/Github/gacha/worker/schema.sql`

## API
- `GET /api/health`
- `GET /api/session`
- `GET /api/game-state`
- `POST /api/game-state`

## Auth model
- Cloudflare Access identity at edge (server-side).
- Frontend only calls session API; no custom login form or token issuance exists.

## Environment
- `VITE_API_BASE` (default `/api`)
- `VITE_ACCESS_LOGIN_URL` (default `/cdn-cgi/access/login`)
- `ALLOW_DEV_AUTH` Worker var for local dev only (`false` in production).
