function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'Content-Type,Authorization,CF-Access-Jwt-Assertion',
    },
  });
}

function getIdentity(request, env) {
  const email = request.headers.get('cf-access-authenticated-user-email');
  const sub = request.headers.get('cf-access-authenticated-user-id') || request.headers.get('cf-access-sub');

  if (email) {
    return { email, sub: sub || email };
  }

  if (env.ALLOW_DEV_AUTH === 'true') {
    const devEmail = request.headers.get('x-dev-user-email') || 'dev@local.test';
    const devSub = request.headers.get('x-dev-user-id') || devEmail;
    return { email: devEmail, sub: devSub };
  }

  return null;
}

async function ensureUser(env, identity) {
  const existing = await env.DB
    .prepare('SELECT id, username, email, access_sub FROM users WHERE access_sub = ?1 OR email = ?2 LIMIT 1')
    .bind(identity.sub, identity.email)
    .first();

  const username = identity.email.split('@')[0].slice(0, 24) || 'commander';

  if (existing) {
    await env.DB
      .prepare('UPDATE users SET username = ?1, email = ?2, access_sub = ?3, last_login_at = datetime(\'now\') WHERE id = ?4')
      .bind(username, identity.email, identity.sub, existing.id)
      .run();

    return { id: existing.id, username, email: identity.email, accessSub: identity.sub };
  }

  const id = crypto.randomUUID();
  await env.DB
    .prepare(
      `INSERT INTO users (id, username, email, access_sub, created_at, last_login_at)
       VALUES (?1, ?2, ?3, ?4, datetime('now'), datetime('now'))`
    )
    .bind(id, username, identity.email, identity.sub)
    .run();

  return { id, username, email: identity.email, accessSub: identity.sub };
}

async function getGameState(env, userId) {
  const row = await env.DB
    .prepare('SELECT state_json FROM game_state WHERE user_id = ?1 LIMIT 1')
    .bind(userId)
    .first();

  if (!row?.state_json) {
    return {
      resources: {
        fuel: 1000,
        ammo: 1000,
        steel: 1000,
        bauxite: 1000,
      },
    };
  }

  try {
    return JSON.parse(row.state_json);
  } catch {
    return {
      resources: {
        fuel: 1000,
        ammo: 1000,
        steel: 1000,
        bauxite: 1000,
      },
    };
  }
}

async function saveGameState(env, userId, state) {
  const stateJson = JSON.stringify(state);

  await env.DB
    .prepare(
      `INSERT INTO game_state (user_id, state_json, updated_at)
       VALUES (?1, ?2, datetime('now'))
       ON CONFLICT(user_id)
       DO UPDATE SET state_json = excluded.state_json, updated_at = datetime('now')`
    )
    .bind(userId, stateJson)
    .run();
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return json({ ok: true });
    }

    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/api/health') {
      const db = await env.DB.prepare('SELECT 1 AS ok').first();
      return json({ ok: true, db: Boolean(db?.ok) });
    }

    if (!url.pathname.startsWith('/api/')) {
      return json({ error: 'Not found' }, 404);
    }

    const identity = getIdentity(request, env);
    if (!identity) {
      return json({ error: 'Authentication required' }, 401);
    }

    const user = await ensureUser(env, identity);

    if (request.method === 'GET' && url.pathname === '/api/session') {
      return json({ user });
    }

    if (request.method === 'GET' && url.pathname === '/api/game-state') {
      const state = await getGameState(env, user.id);
      return json({ state });
    }

    if (request.method === 'POST' && url.pathname === '/api/game-state') {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: 'Invalid JSON body' }, 400);
      }

      if (!body || typeof body !== 'object') {
        return json({ error: 'Invalid state payload' }, 400);
      }

      await saveGameState(env, user.id, body);
      return json({ ok: true });
    }

    return json({ error: 'Not found' }, 404);
  },
};
