# Cloudflare D1 Backend Setup (Hard Cutover)

## Stack
- Cloudflare Worker API (`/api/*`)
- Cloudflare D1 for persistent game state
- Cloudflare Access for identity (server-side)

## Files
- `/Users/eric/Documents/Github/gacha/worker/index.js`
- `/Users/eric/Documents/Github/gacha/worker/schema.sql`
- `/Users/eric/Documents/Github/gacha/wrangler.toml`

## Setup
1. Create DB
```bash
wrangler d1 create fleet-collection
```

2. Put returned `database_id` in `wrangler.toml`.

3. Apply schema
```bash
wrangler d1 execute fleet-collection --file worker/schema.sql
```

4. Run API
```bash
yarn api:dev
```

5. Frontend env
```bash
VITE_API_BASE=http://127.0.0.1:8787/api
```

6. Deploy API
```bash
yarn api:deploy
```

## Local development auth
For local development only, set Worker var:
```toml
[vars]
ALLOW_DEV_AUTH = "true"
```
Then send `x-dev-user-email` header for API tests if Access headers are absent.

## Routes
- `GET /api/health`
- `GET /api/session`
- `GET /api/game-state`
- `POST /api/game-state`
