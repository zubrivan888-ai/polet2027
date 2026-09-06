export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env, url);
    }
    return env.ASSETS.fetch(request);
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

async function handleApi(request, env, url) {
  if (!env.DB) return json({ ok:false, error:'DB_NOT_CONFIGURED' }, 503);

  if (request.method === 'GET' && url.pathname === '/api/data') {
    const row = await env.DB.prepare('SELECT payload FROM app_state WHERE id = 1').first();
    return json({ ok:true, data: row ? JSON.parse(row.payload) : null });
  }

  if (request.method === 'POST' && url.pathname === '/api/data') {
    if (!env.ADMIN_KEY) return json({ ok:false, error:'ADMIN_KEY_NOT_CONFIGURED' }, 503);
    const key = request.headers.get('x-admin-key') || '';
    if (key !== env.ADMIN_KEY) return json({ ok:false, error:'UNAUTHORIZED' }, 401);
    const body = await request.json();
    if (!body || typeof body !== 'object') return json({ ok:false, error:'BAD_DATA' }, 400);
    const payload = JSON.stringify(body);
    await env.DB.prepare(`INSERT INTO app_state (id,payload,updated_at) VALUES (1,?,datetime('now')) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at`).bind(payload).run();
    return json({ ok:true });
  }

  return json({ ok:false, error:'NOT_FOUND' }, 404);
}
