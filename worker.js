export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return handleApi(request, env, url);
    return env.ASSETS.fetch(request);
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function adminNames(env) {
  const configured = String(env.ADMIN_USERNAMES || '')
    .split(',').map(x => x.trim().replace(/^@/, '').toLowerCase()).filter(Boolean);
  return new Set(['ehnea', 'kira_golmg­reyn'.replace('\u00adreyn','reyn'), 'kira_golmg­reyn', ...configured]);
}

function isAdminUser(user, env) {
  const username = String(user?.username || '').toLowerCase();
  return !!username && adminNames(env).has(username);
}

function hex(bytes) {
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function validateTelegramInitData(initData, botToken) {
  if (!initData || !botToken) return null;
  const p = new URLSearchParams(initData);
  const receivedHash = p.get('hash');
  if (!receivedHash) return null;
  p.delete('hash');
  const check = [...p.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${k}=${v}`).join('\n');
  const enc = new TextEncoder();
  const key1 = await crypto.subtle.importKey('raw', enc.encode('WebAppData'), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const secret = await crypto.subtle.sign('HMAC', key1, enc.encode(botToken));
  const key2 = await crypto.subtle.importKey('raw', secret, {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const calc = hex(await crypto.subtle.sign('HMAC', key2, enc.encode(check)));
  if (calc !== receivedHash.toLowerCase()) return null;
  const authDate = Number(p.get('auth_date') || 0);
  if (!authDate || Math.abs(Date.now()/1000 - authDate) > 86400 * 7) return null;
  try { return JSON.parse(p.get('user') || 'null'); } catch { return null; }
}

async function getAuth(request, env) {
  const key = request.headers.get('x-admin-key') || '';
  if (env.ADMIN_KEY && key && key === env.ADMIN_KEY) return { admin:true, user:null };
  const initData = request.headers.get('x-telegram-init-data') || '';
  const user = await validateTelegramInitData(initData, env.TELEGRAM_BOT_TOKEN);
  return { admin:isAdminUser(user, env), user };
}

async function ensureSchema(db) {
  if (!db) return;
  await db.prepare(`CREATE TABLE IF NOT EXISTS app_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS visitors (
    telegram_id INTEGER PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    first_seen TEXT NOT NULL DEFAULT (datetime('now')),
    last_seen TEXT NOT NULL DEFAULT (datetime('now')),
    visits INTEGER NOT NULL DEFAULT 1
  )`).run();
}

async function logVisitor(env, user) {
  if (!env.DB || !user?.id) return;
  await ensureSchema(env.DB);
  await env.DB.prepare(`
    INSERT INTO visitors
      (telegram_id, username, first_name, last_name, first_seen, last_seen, visits)
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), 1)
    ON CONFLICT(telegram_id) DO UPDATE SET
      username=excluded.username,
      first_name=excluded.first_name,
      last_name=excluded.last_name,
      visits=visitors.visits + CASE WHEN datetime(visitors.last_seen) <= datetime('now','-10 seconds') THEN 1 ELSE 0 END,
      last_seen=datetime('now')
  `).bind(
    user.id,
    user.username || null,
    user.first_name || null,
    user.last_name || null
  ).run();
}

async function handleApi(request, env, url) {
  if (request.method === 'POST' && url.pathname === '/api/session') {
    if (!env.DB) return json({ok:false,error:'DB_NOT_CONFIGURED'},503);
    if (!env.TELEGRAM_BOT_TOKEN) return json({ok:false,error:'BOT_TOKEN_NOT_CONFIGURED'},503);
    const body = await request.json().catch(() => ({}));
    const user = await validateTelegramInitData(body.initData || '', env.TELEGRAM_BOT_TOKEN);
    if (!user) return json({ok:false,error:'INVALID_TELEGRAM_SESSION'},401);
    await logVisitor(env, user);
    return json({ok:true,isAdmin:isAdminUser(user,env),user:{id:user.id,username:user.username||'',first_name:user.first_name||'',last_name:user.last_name||''}});
  }

  if (!env.DB) return json({ok:false,error:'DB_NOT_CONFIGURED'},503);
  await ensureSchema(env.DB);

  if (request.method === 'GET' && url.pathname === '/api/data') {
    const row = await env.DB.prepare('SELECT payload FROM app_state WHERE id = 1').first();
    return json({ok:true,data:row ? JSON.parse(row.payload) : null});
  }

  if (request.method === 'POST' && url.pathname === '/api/data') {
    const auth = await getAuth(request, env);
    if (!auth.admin) return json({ok:false,error:'UNAUTHORIZED'},401);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return json({ok:false,error:'BAD_DATA'},400);
    const payload = JSON.stringify(body);
    await env.DB.prepare(`INSERT INTO app_state (id,payload,updated_at) VALUES (1,?,datetime('now')) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at`).bind(payload).run();
    return json({ok:true});
  }

  if (request.method === 'GET' && url.pathname === '/api/visitors') {
    const auth = await getAuth(request, env);
    if (!auth.admin) return json({ok:false,error:'UNAUTHORIZED'},401);
    const rows = await env.DB.prepare(`SELECT telegram_id,username,first_name,last_name,first_seen,last_seen,visits AS open_count FROM visitors ORDER BY datetime(last_seen) DESC LIMIT 300`).all();
    return json({ok:true,visitors:rows.results || []});
  }

  return json({ok:false,error:'NOT_FOUND'},404);
}
