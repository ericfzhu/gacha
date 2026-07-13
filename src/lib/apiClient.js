const API_BASE = import.meta.env.VITE_API_BASE || '/api';
const LOCAL_MODE = import.meta.env.DEV && !import.meta.env.VITE_API_BASE;
const LOCAL_STATE_KEY = 'fleet_collection_state_v2';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(body?.error || `HTTP ${response.status}`);
  }

  return body;
}

export const apiClient = {
  session: () => LOCAL_MODE ? Promise.resolve({ local: true }) : request('/session', { method: 'GET' }),
  getGameState: () => {
    if (!LOCAL_MODE) return request('/game-state', { method: 'GET' });
    const saved = localStorage.getItem(LOCAL_STATE_KEY);
    return Promise.resolve({ state: saved ? JSON.parse(saved) : null });
  },
  saveGameState: (state) => {
    if (LOCAL_MODE) {
      localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state));
      return Promise.resolve({ ok: true, local: true });
    }
    return request('/game-state', { method: 'POST', body: JSON.stringify(state) });
  },
};
