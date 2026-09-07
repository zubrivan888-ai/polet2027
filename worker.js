export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return handleApi(request, env, url);

    const response = await env.ASSETS.fetch(request);
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      const type = response.headers.get('content-type') || '';
      if (type.includes('text/html')) {
        const html = await response.text();
        const patched = html.replace('</body>', `${clientSavePatch()}</body>`);
        const headers = new Headers(response.headers);
        headers.set('cache-control', 'no-store');
        return new Response(patched, { status: response.status, headers });
      }
    }
    return response;
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

function migrateAppData(payload) {
  if (!payload || typeof payload !== 'object') return { payload, changed:false };
  if (Number(payload.rosterVersion || 0) >= 2) return { payload, changed:false };
  const list = payload.classes?.['11В'];
  if (!Array.isArray(list)) return { payload, changed:false };

  let changed = false;
  const oldName = list.find(x => x?.name === 'Ан А');
  if (oldName) {
    oldName.name = 'Ан Александра';
    changed = true;
  }
  if (!list.some(x => x?.name === 'Матасов')) {
    list.push({name:'Матасов', guests:['гость','гость','гость'], paid:false});
    changed = true;
  }
  if (!list.some(x => x?.name === 'Юркова Мария')) {
    list.push({name:'Юркова Мария', guests:[], paid:false});
    changed = true;
  }
  payload.rosterVersion = 2;
  return { payload, changed:true || changed };
}

function clientSavePatch() {
  return `<script>
(function(){
  const originalLoadSharedData = loadSharedData;

  window.saveData = async function(){
    localStorage.setItem('polet2027data', JSON.stringify(data));
    if(!tg?.initData) throw new Error('Откройте приложение через Telegram для сохранения в общей базе.');
    let r;
    try{
      r = await fetch('/api/data', {
        method:'POST',
        headers:{'content-type':'application/json','x-telegram-init-data':tg.initData},
        body:JSON.stringify({classes:data,expenses:expenseNames,rosterVersion:2})
      });
    }catch(e){
      throw new Error('Нет соединения с общей базой.');
    }
    let j={};
    try{ j = await r.json(); }catch(e){}
    if(!r.ok || j.ok === false) throw new Error(j.error || ('Ошибка '+r.status));
    serverReady=true;
    return true;
  };

  window.saveEditor = async function(){
    const name=nameInput.value.trim();
    if(!name){alert('Введите ФИО');return}
    const c=classInput.value;
    const guests=[...document.querySelectorAll('#guestEditor input')].map(x=>x.value.trim()).filter(Boolean);
    const obj={name,guests,paid:paidInput.value==='true'};
    const backup=JSON.stringify(data);
    const btn=document.querySelector('.sheetactions .primary');
    const oldText=btn?.textContent || 'Сохранить';
    if(btn){btn.disabled=true;btn.textContent='Сохранение…'}

    if(editClass!==null){
      if(editClass===c) data[c][editIndex]=obj;
      else { data[editClass].splice(editIndex,1); data[c].push(obj); }
    } else data[c].push(obj);
    render();

    try{
      await window.saveData();
      if(btn) btn.textContent='✓ Сохранено';
      await new Promise(r=>setTimeout(r,350));
      closeEditor();
    }catch(e){
      data=JSON.parse(backup);
      localStorage.setItem('polet2027data',backup);
      render();
      alert('Не удалось сохранить в общей базе: '+(e?.message||e));
    }finally{
      if(btn){btn.disabled=false;btn.textContent=oldText}
    }
  };

  window.deleteCurrent = async function(){
    if(editClass===null || !confirm('Удалить участника?')) return;
    const backup=JSON.stringify(data);
    data[editClass].splice(editIndex,1);
    render();
    try{
      await window.saveData();
      closeEditor();
    }catch(e){
      data=JSON.parse(backup);
      localStorage.setItem('polet2027data',backup);
      render();
      alert('Не удалось удалить из общей базы: '+(e?.message||e));
    }
  };

  window.loadSharedData = async function(){
    try{
      const r=await fetch('/api/data',{cache:'no-store'});
      if(!r.ok)return;
      const j=await r.json();
      if(j?.data?.classes){
        data=j.data.classes;
        localStorage.setItem('polet2027data',JSON.stringify(data));
        serverReady=true;
        render();
      }
    }catch(e){}
  };
})();
</script>`;
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
    if (!row) return json({ok:true,data:null});
    let payload = JSON.parse(row.payload);
    const migrated = migrateAppData(payload);
    payload = migrated.payload;
    if (migrated.changed) {
      await env.DB.prepare(`UPDATE app_state SET payload=?, updated_at=datetime('now') WHERE id=1`).bind(JSON.stringify(payload)).run();
    }
    return json({ok:true,data:payload});
  }

  if (request.method === 'POST' && url.pathname === '/api/data') {
    const auth = await getAuth(request, env);
    if (!auth.admin) return json({ok:false,error:'UNAUTHORIZED'},401);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return json({ok:false,error:'BAD_DATA'},400);
    if (!body.rosterVersion) body.rosterVersion = 2;
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
