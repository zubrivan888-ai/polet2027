export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return handleApi(request, env, url);
    const response = await env.ASSETS.fetch(request);
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      const type = response.headers.get('content-type') || '';
      if (type.includes('text/html')) {
        let html = await response.text();
        html = html.replace('</head>', `<style>
body.telegram-app{padding-top:var(--tg-content-safe-top,0px)}
.countdown{margin:0 16px 14px;background:linear-gradient(135deg,#f9fcfe,#e3f1ff);border-radius:24px;padding:17px 14px 15px;text-align:center;box-shadow:0 5px 18px #22334a0c;position:relative;overflow:hidden}.countdownTitle{font-size:17px;font-weight:800;color:#183a63;margin-bottom:4px}.countdownDays{font-size:44px;line-height:1;font-weight:800;color:#1676d2}.countdownDaysLabel{font-size:12px;font-weight:700;color:#315c78;text-transform:uppercase;margin:3px 0 12px}.countdownTime{display:grid;grid-template-columns:repeat(3,1fr);max-width:310px;margin:auto}.countdownTime div{position:relative}.countdownTime div+div:before{content:'';position:absolute;left:0;top:3px;bottom:3px;width:1px;background:#b8cfe1}.countdownTime b{display:block;font-size:22px;color:#14233a}.countdownTime small{font-size:10px;color:#718397}.countdownDate{margin-top:11px;font-size:12px;font-weight:700;color:#28678f}.classStat b{white-space:nowrap}
</style></head>`);
        html = html.replace('<div class="classStat"><b>11А</b>','<div class="classStat"><b>11А класс</b>').replace('<div class="classStat"><b>11Б</b>','<div class="classStat"><b>11Б класс</b>').replace('<div class="classStat"><b>11В</b>','<div class="classStat"><b>11В класс</b>');
        html = html.replace('</div><div class="grid"><button class="card"', `</div><div class="countdown" id="graduationCountdown"><div class="countdownTitle">До выпускного осталось</div><div class="countdownDays" id="cdDays">0</div><div class="countdownDaysLabel">дней</div><div class="countdownTime"><div><b id="cdHours">00</b><small>часов</small></div><div><b id="cdMinutes">00</b><small>минут</small></div><div><b id="cdSeconds">00</b><small>секунд</small></div></div><div class="countdownDate">📅 26 июня 2027</div></div><div class="grid"><button class="card"`);
        html = html.replace('</body>', `<script>(function(){const target=new Date(2027,5,26,0,0,0);function tick(){let d=Math.max(0,target-new Date());const days=Math.floor(d/86400000);d%=86400000;const h=Math.floor(d/3600000);d%=3600000;const m=Math.floor(d/60000);const s=Math.floor((d%60000)/1000);const pad=n=>String(n).padStart(2,'0');const a=document.getElementById('cdDays'),b=document.getElementById('cdHours'),c=document.getElementById('cdMinutes'),e=document.getElementById('cdSeconds');if(a)a.textContent=days;if(b)b.textContent=pad(h);if(c)c.textContent=pad(m);if(e)e.textContent=pad(s)}tick();setInterval(tick,1000)})();</script></body>`);
        html = html.replace('function syncTelegramSafeArea(){}', `function syncTelegramSafeArea(){
  if(!tg?.initData)return;
  const apply=()=>{
    const contentTop=Number(tg?.contentSafeAreaInset?.top||0);
    const safeTop=Number(tg?.safeAreaInset?.top||0);
    const top=Math.max(contentTop,safeTop,0);
    document.documentElement.style.setProperty('--tg-content-safe-top',top+'px');
  };
  apply();
  tg?.onEvent?.('contentSafeAreaChanged',apply);
  tg?.onEvent?.('safeAreaChanged',apply);
  tg?.onEvent?.('viewportChanged',apply);
}`);
        html = html.replace("if(tg?.initData)document.body.classList.add('telegram-app');render();", "if(tg?.initData){document.body.classList.add('telegram-app');syncTelegramSafeArea()}render();");
        const headers = new Headers(response.headers);
        headers.set('cache-control','no-store');
        return new Response(html,{status:response.status,headers});
      }
    }
    return response;
  }
};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
function adminNames(env){const configured=String(env.ADMIN_USERNAMES||'').split(',').map(x=>x.trim().replace(/^@/,'').toLowerCase()).filter(Boolean);return new Set(['ehnea','kira_golmg­reyn'.replace('\u00adreyn','reyn'),'kira_golmg_reyn',...configured])}
function isAdminUser(user,env){const username=String(user?.username||'').toLowerCase();return !!username&&adminNames(env).has(username)}
function hex(bytes){return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function validateTelegramInitData(initData,botToken){if(!initData||!botToken)return null;const p=new URLSearchParams(initData);const receivedHash=p.get('hash');if(!receivedHash)return null;p.delete('hash');const check=[...p.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');const enc=new TextEncoder();const key1=await crypto.subtle.importKey('raw',enc.encode('WebAppData'),{name:'HMAC',hash:'SHA-256'},false,['sign']);const secret=await crypto.subtle.sign('HMAC',key1,enc.encode(botToken));const key2=await crypto.subtle.importKey('raw',secret,{name:'HMAC',hash:'SHA-256'},false,['sign']);const calc=hex(await crypto.subtle.sign('HMAC',key2,enc.encode(check)));if(calc!==receivedHash.toLowerCase())return null;const authDate=Number(p.get('auth_date')||0);if(!authDate||Math.abs(Date.now()/1000-authDate)>86400*7)return null;try{return JSON.parse(p.get('user')||'null')}catch{return null}}
async function getAuth(request,env){const key=request.headers.get('x-admin-key')||'';if(env.ADMIN_KEY&&key&&key===env.ADMIN_KEY)return{admin:true,user:null};const initData=request.headers.get('x-telegram-init-data')||'';const user=await validateTelegramInitData(initData,env.TELEGRAM_BOT_TOKEN);return{admin:isAdminUser(user,env),user}}
async function ensureSchema(db){if(!db)return;await db.prepare(`CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK (id = 1),payload TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT (datetime('now')))`).run();await db.prepare(`CREATE TABLE IF NOT EXISTS visitors (telegram_id INTEGER PRIMARY KEY,username TEXT,first_name TEXT,last_name TEXT,first_seen TEXT NOT NULL DEFAULT (datetime('now')),last_seen TEXT NOT NULL DEFAULT (datetime('now')),visits INTEGER NOT NULL DEFAULT 1)`).run()}
async function logVisitor(env,user){if(!env.DB||!user?.id)return;await ensureSchema(env.DB);await env.DB.prepare(`INSERT INTO visitors (telegram_id,username,first_name,last_name,first_seen,last_seen,visits) VALUES (?,?,?,?,datetime('now'),datetime('now'),1) ON CONFLICT(telegram_id) DO UPDATE SET username=excluded.username,first_name=excluded.first_name,last_name=excluded.last_name,visits=visitors.visits + CASE WHEN datetime(visitors.last_seen) <= datetime('now','-10 seconds') THEN 1 ELSE 0 END,last_seen=datetime('now')`).bind(user.id,user.username||null,user.first_name||null,user.last_name||null).run()}
function migrateAppData(payload){
  if(!payload||typeof payload!=='object')return{payload,changed:false};
  const version=Number(payload.rosterVersion||0);
  if(!payload.classes||typeof payload.classes!=='object')return{payload,changed:false};
  let changed=false;
  if(version<2){
    const list=payload.classes['11В'];
    if(Array.isArray(list)){
      const oldName=list.find(x=>x?.name==='Ан А');if(oldName){oldName.name='Ан Александра';changed=true}
      if(!list.some(x=>x?.name==='Матасов')){list.push({name:'Матасов',guests:['гость','гость','гость'],paid:false});changed=true}
      if(!list.some(x=>x?.name==='Юркова Мария')){list.push({name:'Юркова Мария',guests:[],paid:false});changed=true}
    }
  }
  if(version<3){
    const roster=[['Дурасова Валерия',0],['Скоробогатая Ника',0],['Шаталина Софья',1],['Лубнина Вероника',1],['Шевелева Эльвира',1],['Сорокина Ксения',1],['Эльгаров Каплан',2],['Петропавловская Софья',2],['Переяславский Владислав',2],['Суворова Вероника',2],['Матиев Умар',0],['Ташова Диана',0],['Хачатрян Давид',0],['Осипова Василина',0],['Черкезов Георгий',0],['Кумпан Виктория',1],['Иванова Анастасия',1],['Мукомол Елена',1]];
    if(!Array.isArray(payload.classes['11Б']))payload.classes['11Б']=[];
    const list=payload.classes['11Б'];
    for(const [name,count] of roster){if(!list.some(x=>x?.name===name)){list.push({name,guests:Array(count).fill('гость'),paid:false});changed=true}}
  }
  if(version<3){payload.rosterVersion=3;changed=true}
  return{payload,changed};
}
async function handleApi(request,env,url){
  if(request.method==='POST'&&url.pathname==='/api/session'){
    if(!env.DB)return json({ok:false,error:'DB_NOT_CONFIGURED'},503);if(!env.TELEGRAM_BOT_TOKEN)return json({ok:false,error:'BOT_TOKEN_NOT_CONFIGURED'},503);
    const body=await request.json().catch(()=>({}));const user=await validateTelegramInitData(body.initData||'',env.TELEGRAM_BOT_TOKEN);if(!user)return json({ok:false,error:'INVALID_TELEGRAM_SESSION'},401);await logVisitor(env,user);return json({ok:true,isAdmin:isAdminUser(user,env),user:{id:user.id,username:user.username||'',first_name:user.first_name||'',last_name:user.last_name||''}})
  }
  if(!env.DB)return json({ok:false,error:'DB_NOT_CONFIGURED'},503);await ensureSchema(env.DB);
  if(request.method==='GET'&&url.pathname==='/api/data'){
    const row=await env.DB.prepare('SELECT payload FROM app_state WHERE id = 1').first();if(!row)return json({ok:true,data:null});let payload=JSON.parse(row.payload);const migrated=migrateAppData(payload);payload=migrated.payload;if(migrated.changed)await env.DB.prepare(`UPDATE app_state SET payload=?, updated_at=datetime('now') WHERE id=1`).bind(JSON.stringify(payload)).run();return json({ok:true,data:payload})
  }
  if(request.method==='POST'&&url.pathname==='/api/data'){
    const auth=await getAuth(request,env);if(!auth.admin)return json({ok:false,error:'UNAUTHORIZED'},401);const body=await request.json().catch(()=>null);if(!body||typeof body!=='object')return json({ok:false,error:'BAD_DATA'},400);if(!body.rosterVersion||Number(body.rosterVersion)<3)body.rosterVersion=3;const payload=JSON.stringify(body);await env.DB.prepare(`INSERT INTO app_state (id,payload,updated_at) VALUES (1,?,datetime('now')) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at`).bind(payload).run();return json({ok:true})
  }
  if(request.method==='GET'&&url.pathname==='/api/visitors'){
    const auth=await getAuth(request,env);if(!auth.admin)return json({ok:false,error:'UNAUTHORIZED'},401);const rows=await env.DB.prepare(`SELECT telegram_id,username,first_name,last_name,first_seen,last_seen,visits AS open_count FROM visitors ORDER BY datetime(last_seen) DESC LIMIT 300`).all();return json({ok:true,visitors:rows.results||[]})
  }
  return json({ok:false,error:'NOT_FOUND'},404)
}