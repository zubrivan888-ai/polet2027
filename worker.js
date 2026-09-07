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

  const jumpStyle=document.createElement('style');
  jumpStyle.textContent='.classJump{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 10px}.classJump button{border:0;border-radius:14px;padding:11px 8px;background:#e8f2fb;color:#28678f;font-size:15px;font-weight:700}.classJump button:active{transform:scale(.96);background:#d9ebf8}.shareReportBtn{width:100%;border:0;border-radius:14px;padding:12px 14px;margin:0 0 14px;background:#f9fcfe;color:#28678f;font-size:15px;font-weight:700;box-shadow:0 4px 14px #22334a0a}.reportModal{position:fixed;inset:0;background:#0b16266e;display:none;align-items:flex-end;justify-content:center;z-index:140}.reportModal.open{display:flex}.reportSheet{width:min(560px,100%);background:#f2f7fa;border-radius:26px 26px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom));max-height:88vh;overflow:auto}.reportSheet h3{font-size:22px;margin:2px 0 12px}.reportPreview{white-space:pre-wrap;background:#fff;border-radius:16px;padding:14px;font-size:14px;line-height:1.45;margin-bottom:12px;color:#31465c}.shareGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.shareGrid button{border:0;border-radius:14px;padding:13px 10px;background:#e8f2fb;color:#245f86;font-size:14px;font-weight:700}.shareGrid button:active{transform:scale(.97)}.reportClose{width:100%;border:0;border-radius:14px;padding:12px;margin-top:10px;background:#fff;color:#5d6c7b;font-size:14px}';
  document.head.appendChild(jumpStyle);
  const participantsPage=document.getElementById('participants');
  const participantsTitle=participantsPage?.querySelector('h2');
  if(participantsTitle && !document.getElementById('classJump')){
    participantsTitle.insertAdjacentHTML('afterend','<div id="classJump" class="classJump"><button onclick="jumpParticipantClass(\'11А\')">11А</button><button onclick="jumpParticipantClass(\'11Б\')">11Б</button><button onclick="jumpParticipantClass(\'11В\')">11В</button></div><button id="shareReportBtn" class="shareReportBtn" onclick="openReportShare()">↗ Поделиться кратким отчётом</button>');
  }
  if(!document.getElementById('reportModal')){
    document.body.insertAdjacentHTML('beforeend','<div id="reportModal" class="reportModal" onclick="if(event.target===this)closeReportShare()"><div class="reportSheet"><h3>Краткий отчёт</h3><div id="reportPreview" class="reportPreview"></div><div class="shareGrid"><button onclick="shareClassReport(\'email\')">✉️ Почта</button><button onclick="shareClassReport(\'telegram\')">✈️ Telegram</button><button onclick="shareClassReport(\'whatsapp\')">💬 WhatsApp</button><button onclick="shareClassReport(\'copy\')">📋 Копировать</button></div><button class="reportClose" onclick="closeReportShare()">Закрыть</button></div></div>');
  }
  window.jumpParticipantClass=function(c){
    const target=[...document.querySelectorAll('#people .classTitle')].find(x=>x.textContent.trim().startsWith(c));
    if(target) target.scrollIntoView({behavior:'smooth',block:'start'});
  };

  window.buildClassReport=function(){
    const lines=['Выпускной 2027 — краткий отчёт',''];
    let allStudents=0,allGuests=0,allPaid=0;
    for(const c of ['11А','11Б','11В']){
      const list=data[c]||[];
      const students=list.length;
      const guests=list.reduce((s,x)=>s+(Array.isArray(x.guests)?x.guests.length:0),0);
      const paid=list.filter(x=>x.paid).length;
      const unpaid=students-paid;
      allStudents+=students; allGuests+=guests; allPaid+=paid;
      lines.push(c+': выпускников '+students+', сопровождающих '+guests+', всего '+(students+guests));
      lines.push('Оплата: '+paid+' оплачено, '+unpaid+' не оплачено');
      lines.push('');
    }
    lines.push('ИТОГО: выпускников '+allStudents+', сопровождающих '+allGuests+', всего '+(allStudents+allGuests));
    lines.push('Оплата: '+allPaid+' оплачено, '+(allStudents-allPaid)+' не оплачено');
    return lines.join('\n');
  };
  window.openReportShare=function(){
    reportPreview.textContent=window.buildClassReport();
    reportModal.classList.add('open');
  };
  window.closeReportShare=function(){reportModal.classList.remove('open')};
  window.shareClassReport=async function(type){
    const text=window.buildClassReport();
    const subject='Выпускной 2027 — краткий отчёт по классам';
    if(type==='email'){
      location.href='mailto:?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(text);
      return;
    }
    if(type==='telegram'){
      window.open('https://t.me/share/url?url=&text='+encodeURIComponent(text),'_blank');
      return;
    }
    if(type==='whatsapp'){
      window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');
      return;
    }
    if(type==='copy'){
      try{
        await navigator.clipboard.writeText(text);
      }catch(e){
        const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
      }
      const btn=[...document.querySelectorAll('.shareGrid button')].find(x=>x.textContent.includes('Копировать'));
      if(btn){const old=btn.textContent;btn.textContent='✓ Скопировано';setTimeout(()=>btn.textContent=old,1200)}
    }
  };

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
