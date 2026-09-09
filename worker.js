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
.hero img{filter:brightness(1.12) saturate(1.16) contrast(1.03)}
.countdown{margin:0 16px 14px;position:relative;overflow:hidden;border-radius:28px;aspect-ratio:1978/768;background:#edf5fa url('/countdown-final.png') center/100% 100% no-repeat;box-shadow:0 8px 24px #397fb318}
.countdownCounter{position:absolute;left:50%;top:58%;transform:translate(-50%,-50%);z-index:4;text-align:center;white-space:nowrap;line-height:1;pointer-events:none}
.countdownCounter b{display:block;font-family:Arial Black,Arial,sans-serif;font-size:44px;line-height:.9;font-weight:900;letter-spacing:-2px;color:#0757b7;-webkit-text-fill-color:#0757b7;-webkit-text-stroke:1.15px #e2a62d;text-shadow:0 -1px 0 #5eb6ff,1px 1px 0 #f7d56a,2px 2px 0 #d89b1e,3px 3px 0 #a9680a,0 5px 6px #153e6850}
.countdownCounter small{display:block;margin-top:4px;font-size:12px;line-height:1;font-weight:900;letter-spacing:.25px;color:#153f80;text-transform:lowercase;text-shadow:0 1px 0 #fff}
.classStat{position:relative;overflow:hidden}
.classStat b{white-space:nowrap}
.classStat strong{font-family:Arial Black,Arial,sans-serif;font-weight:900;line-height:1;text-shadow:0 2px 0 #ffffffc7,0 5px 8px currentColor;filter:saturate(1.08)}
.classStat small{display:inline-block;font-family:"Segoe Print","Comic Sans MS",cursive;font-size:11px!important;font-weight:800;letter-spacing:.1px;opacity:.9;transform:rotate(-2deg);position:relative;margin-top:7px}
.classStat small:after{content:"";display:block;width:72%;height:2px;border-radius:50%;background:currentColor;opacity:.35;margin:3px auto 0;transform:rotate(-4deg)}
.classStat strong:before,.classStat strong:after{content:"";display:inline-block;width:10px;height:3px;border-radius:5px;background:currentColor;opacity:.55;vertical-align:middle;margin:0 5px;transform:rotate(15deg)}
.classStat strong:before{transform:rotate(-15deg)}
@media(max-width:480px){.countdown{border-radius:22px}.countdownCounter{top:58%}.countdownCounter b{font-size:38px;-webkit-text-stroke:1px #e2a62d}.countdownCounter small{font-size:11px;margin-top:4px}.classStat strong:before,.classStat strong:after{width:7px;margin:0 3px}.classStat small{font-size:10px!important}}
</style></head>`);
        html = html.replace('<div class="classStat"><b>11А</b>','<div class="classStat"><b>11А класс</b>').replace('<div class="classStat"><b>11Б</b>','<div class="classStat"><b>11Б класс</b>').replace('<div class="classStat"><b>11В</b>','<div class="classStat"><b>11В класс</b>');
        html = html.replace('</div><div class="grid"><button class="card"', `</div><div class="countdown" id="graduationCountdown"><div class="countdownCounter"><b id="cdDays">0</b><small id="cdDayWord">дней</small></div></div><div class="grid"><button class="card"`);
        html = html.replace('</body>', `<script>(function(){const target=new Date(2027,5,26,0,0,0);function word(n,one,few,many){const n100=Math.abs(n)%100,n10=Math.abs(n)%10;if(n100>=11&&n100<=14)return many;if(n10===1)return one;if(n10>=2&&n10<=4)return few;return many}function tick(){const diff=Math.max(0,target-new Date());const days=Math.floor(diff/86400000);const a=document.getElementById('cdDays'),w=document.getElementById('cdDayWord');if(a)a.textContent=days;if(w)w.textContent=word(days,'день','дня','дней')}function updatePeople(){[['classA'],['classB'],['classV']].forEach(([id])=>{const el=document.getElementById(id);if(!el)return;const n=parseInt(el.textContent,10);if(!Number.isFinite(n))return;const small=el.parentElement?.querySelector('small');if(small)small.textContent=word(n,'человек','человека','человек')})}tick();updatePeople();setInterval(tick,60000);const obs=new MutationObserver(updatePeople);['classA','classB','classV'].forEach(id=>{const el=document.getElementById(id);if(el)obs.observe(el,{childList:true,characterData:true,subtree:true})})})();</script></body>`);
        html = html.replace('function syncTelegramSafeArea(){}', `function syncTelegramSafeArea(){
  if(!tg?.initData)return;
  const applyChrome=()=>{
    try{tg.setHeaderColor('#edf5fa')}catch(e){}
    try{tg.setBackgroundColor('#edf5fa')}catch(e){}
    try{tg.setBottomBarColor?.('#edf5fa')}catch(e){}
  };
  const apply=()=>{
    applyChrome();
    const contentTop=Number(tg?.contentSafeAreaInset?.top||0);
    const safeTop=Number(tg?.safeAreaInset?.top||0);
    const fullscreenFallback=tg?.isFullscreen?76:0;
    const top=Math.max(contentTop,safeTop,fullscreenFallback,0);
    document.documentElement.style.setProperty('--tg-content-safe-top',top+'px');
  };
  applyChrome();
  if(tg?.isFullscreen&&typeof tg.exitFullscreen==='function'){
    try{tg.exitFullscreen()}catch(e){}
  }
  setTimeout(applyChrome,120);
  setTimeout(applyChrome,450);
  apply();
  tg?.onEvent?.('contentSafeAreaChanged',apply);
  tg?.onEvent?.('safeAreaChanged',apply);
  tg?.onEvent?.('viewportChanged',apply);
  tg?.onEvent?.('fullscreenChanged',()=>{setTimeout(apply,60);setTimeout(applyChrome,250)});
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
function adminNames(env){const configured=String(env.ADMIN_USERNAMES||'').split(',').map(x=>x.trim().replace(/^@/,'').toLowerCase()).filter(Boolean);return new Set(['ehnea','kira_golmg_reyn',...configured])}
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