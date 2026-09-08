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
.countdown{margin:0 16px 14px;background:linear-gradient(145deg,#f9fcff 0%,#edf6ff 72%,#fffdf8 100%);border:1px solid #fff;border-radius:28px;padding:16px 14px 18px;box-shadow:0 9px 28px #397fb316;position:relative;overflow:hidden;min-height:218px}
.countdownArtwork{position:absolute;inset:0;width:100%;height:100%;z-index:2;pointer-events:none}
.countdownHead{display:flex;align-items:flex-start;gap:8px;position:relative;z-index:6;padding:0 74px 0 44px;min-height:42px}
.countdownCalendarSvg{position:absolute;left:13px;top:-1px;width:28px;height:28px;filter:drop-shadow(0 2px 2px #1b4b7820)}
.countdownTitleWrap{text-align:left;min-width:0}.countdownTitle{font-size:15px;line-height:1.12;font-weight:850;color:#183a63;white-space:nowrap}.countdownSub{font-size:9px;color:#71879b;margin-top:4px;white-space:nowrap}
.countdownDate{position:absolute;right:14px;top:12px;font-size:12px;font-weight:700;color:#b97813;transform:rotate(-6deg);line-height:1.12;text-align:center;font-family:"Segoe Print","Comic Sans MS",cursive;z-index:7}
.countdownGrid{display:flex;justify-content:center;align-items:center;margin:24px 66px 0;position:relative;z-index:6}.countdownBox{background:transparent!important;border:0!important;box-shadow:none!important;width:auto;padding:0;text-align:center}.countdownBox b{display:block;font-size:58px;line-height:.9;font-weight:900;letter-spacing:-2px;background:linear-gradient(180deg,#74c9ff 0%,#2b92df 24%,#116fc2 57%,#0b4f96 100%);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-stroke:.35px #0b5aa4;text-shadow:0 1px 0 #dff3ff,0 2px 0 #a9d8fa,0 4px 7px #0e5d9d35}.countdownBox small{display:block;margin-top:8px;font-size:12px;color:#667b90;text-transform:uppercase;font-weight:800;letter-spacing:.3px}
.countdownWish{position:absolute;right:14px;bottom:12px;font-family:"Segoe Print","Comic Sans MS",cursive;font-size:11px;font-weight:800;color:#174f91;transform:rotate(-5deg);z-index:7;padding:4px 8px;line-height:1.05;background:linear-gradient(165deg,transparent 10%,#dcecff9c 11% 88%,transparent 89%)}
.countdownDots{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);display:flex;gap:6px;z-index:7}.countdownDots i{width:6px;height:6px;border-radius:50%;background:#c9dcf2}.countdownDots i:first-child{background:#1780d8}.classStat b{white-space:nowrap}
@media(max-width:390px){.countdown{min-height:210px;padding-left:10px;padding-right:10px}.countdownHead{padding-left:40px;padding-right:66px}.countdownCalendarSvg{left:10px;width:25px;height:25px}.countdownTitle{font-size:14px}.countdownSub{font-size:8px}.countdownDate{font-size:10px;right:9px}.countdownGrid{margin:23px 58px 0}.countdownBox b{font-size:52px}.countdownBox small{font-size:11px}.countdownWish{font-size:10px;right:9px}}
</style></head>`);
        html = html.replace('<div class="classStat"><b>11А</b>','<div class="classStat"><b>11А класс</b>').replace('<div class="classStat"><b>11Б</b>','<div class="classStat"><b>11Б класс</b>').replace('<div class="classStat"><b>11В</b>','<div class="classStat"><b>11В класс</b>');
        html = html.replace('</div><div class="grid"><button class="card"', `</div><div class="countdown" id="graduationCountdown"><svg class="countdownArtwork" viewBox="0 0 340 218" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><linearGradient id="ribbonA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2b4"/><stop offset=".2" stop-color="#ffd968"/><stop offset=".44" stop-color="#d79a1e"/><stop offset=".62" stop-color="#f6cd57"/><stop offset=".82" stop-color="#bf7d0c"/><stop offset="1" stop-color="#ffe98c"/></linearGradient><linearGradient id="ribbonB" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b87308"/><stop offset=".22" stop-color="#f7d86f"/><stop offset=".5" stop-color="#c98811"/><stop offset=".76" stop-color="#ffe887"/><stop offset="1" stop-color="#d18b12"/></linearGradient><linearGradient id="capTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#465566"/><stop offset=".45" stop-color="#273441"/><stop offset="1" stop-color="#111820"/></linearGradient><linearGradient id="capBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f3b47"/><stop offset="1" stop-color="#101820"/></linearGradient><linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe887"/><stop offset=".45" stop-color="#d49a1d"/><stop offset="1" stop-color="#ad6e08"/></linearGradient><linearGradient id="planeGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a4"/><stop offset=".5" stop-color="#efbd42"/><stop offset="1" stop-color="#c7830c"/></linearGradient><filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#65470f" flood-opacity=".2"/></filter></defs><g filter="url(#softShadow)"><path d="M-10 174 C22 152 49 156 70 176 C90 194 111 189 128 171 C144 153 162 154 179 171 C196 188 216 188 235 170 C254 151 278 149 350 171" fill="none" stroke="url(#ribbonA)" stroke-width="13" stroke-linecap="round"/><path d="M15 186 C38 200 61 191 70 176 C78 162 65 151 51 159 C39 166 43 182 60 183 C78 184 87 165 96 153" fill="none" stroke="url(#ribbonB)" stroke-width="8.5" stroke-linecap="round"/><path d="M95 154 C121 165 132 180 143 190" fill="none" stroke="#ffe887" stroke-width="2.3" stroke-linecap="round" opacity=".9"/></g><g transform="translate(14 141) rotate(-7 30 24)" filter="url(#softShadow)"><path d="M4 17 L30 5 L58 18 L30 30 Z" fill="url(#capTop)"/><path d="M16 22 Q30 33 44 23 L42 42 Q30 48 18 41 Z" fill="url(#capBody)"/><ellipse cx="30" cy="18" rx="3" ry="2" fill="#d9a327"/><path d="M30 19 C28 27 26 36 24 46" stroke="url(#gold)" stroke-width="2.5" fill="none"/><path d="M22 44 L27 44 L25 55 Z" fill="url(#gold)"/></g><g transform="translate(267 62) rotate(-12)" filter="url(#softShadow)"><path d="M0 8 L34 0 L11 24 L10 13 Z" fill="url(#planeGold)"/><path d="M10 13 L34 0 L15 17 Z" fill="#f6cb57"/><path d="M10 13 L11 24 L16 18 Z" fill="#b9760c"/></g><path d="M286 82 C317 84 316 105 297 106 C278 107 278 90 290 89 C304 88 311 103 307 115 C304 125 314 127 327 120" fill="none" stroke="#cf961d" stroke-width="1.7" stroke-dasharray="3 3" stroke-linecap="round"/><g fill="#dfab31"><path d="M23 39 l3 3 3-3 -3-3z"/><path d="M310 145 l4 4 4-4 -4-4z"/><path d="M284 148 l2.5 2.5 2.5-2.5 -2.5-2.5z"/></g></svg><div class="countdownDate">26 июня<br>2027</div><div class="countdownHead"><svg class="countdownCalendarSvg" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="calBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6dc9ff"/><stop offset="1" stop-color="#2585cf"/></linearGradient></defs><rect x="4" y="6" width="24" height="22" rx="4" fill="#fff" stroke="#9fc8e7"/><rect x="4" y="6" width="24" height="7" rx="4" fill="#ef5c54"/><rect x="8" y="3" width="2" height="6" rx="1" fill="#4b89bb"/><rect x="22" y="3" width="2" height="6" rx="1" fill="#4b89bb"/><g fill="url(#calBlue)"><rect x="8" y="16" width="3" height="3" rx=".6"/><rect x="14" y="16" width="3" height="3" rx=".6"/><rect x="20" y="16" width="3" height="3" rx=".6"/><rect x="8" y="22" width="3" height="3" rx=".6"/><rect x="14" y="22" width="3" height="3" rx=".6"/><rect x="20" y="22" width="3" height="3" rx=".6"/></g></svg><div class="countdownTitleWrap"><div class="countdownTitle">До выпускного осталось</div><div class="countdownSub">«Большие мечты начинаются здесь»</div></div></div><div class="countdownGrid"><div class="countdownBox"><b id="cdDays">0</b><small>дней</small></div></div><div class="countdownDots"><i></i><i></i><i></i><i></i></div><div class="countdownWish">Лучшее<br>впереди! ♡</div></div><div class="grid"><button class="card"`);
        html = html.replace('</body>', `<script>(function(){const target=new Date(2027,5,26,0,0,0);function tick(){const diff=Math.max(0,target-new Date());const days=Math.floor(diff/86400000);const a=document.getElementById('cdDays');if(a)a.textContent=days}tick();setInterval(tick,60000)})();</script></body>`);
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