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
.countdown{margin:0 16px 14px;background:linear-gradient(145deg,#f9fcff 0%,#edf6ff 72%,#fffdf8 100%);border:1px solid #fff;border-radius:28px;padding:18px 14px 17px;box-shadow:0 9px 28px #397fb316;position:relative;overflow:hidden;min-height:246px}.countdownHead{display:flex;align-items:center;justify-content:center;gap:10px;position:relative;z-index:4;padding:0 72px}.countdownCalendar{font-size:26px;line-height:1}.countdownTitleWrap{text-align:left}.countdownTitle{font-size:18px;line-height:1.12;font-weight:850;color:#183a63;white-space:nowrap}.countdownSub{font-size:11px;color:#71879b;margin-top:4px;white-space:nowrap}.countdownDate{position:absolute;right:18px;top:15px;font-size:14px;font-weight:700;color:#b97813;transform:rotate(-7deg);line-height:1.15;text-align:center;font-family:"Segoe Print","Comic Sans MS",cursive;z-index:5}.countdownPlane{position:absolute;right:70px;top:51px;width:34px;height:24px;z-index:4;transform:rotate(-11deg)}.countdownPlane:before{content:'';position:absolute;left:0;top:7px;border-left:34px solid #d7a02b;border-top:10px solid transparent;border-bottom:6px solid transparent}.countdownPlane:after{content:'';position:absolute;left:8px;top:12px;border-left:20px solid #f0c34c;border-top:5px solid transparent;border-bottom:4px solid transparent}.countdownTrail{position:absolute;right:21px;top:67px;width:72px;height:48px;border-right:2px dashed #c99838;border-bottom:2px dashed #c99838;border-radius:0 0 42px 0;transform:rotate(-8deg);z-index:2}.countdownCapBig{position:absolute;left:-8px;bottom:50px;font-size:60px;transform:rotate(-7deg);filter:drop-shadow(0 6px 6px #1c37542a);z-index:4}.countdownGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:24px 0 0 58px;position:relative;z-index:3}.countdownBox{background:linear-gradient(180deg,#fff,#f5faff);border:1px solid #fff;border-radius:21px;padding:15px 3px 13px;text-align:center;box-shadow:0 6px 18px #3b7dac10;min-width:0}.countdownBox b{display:block;font-size:30px;line-height:1;color:#1676d2;font-weight:850;letter-spacing:-1px}.countdownBox small{display:block;margin-top:8px;font-size:9px;color:#667b90;text-transform:uppercase;font-weight:700}.countdownRibbon{position:absolute;left:-8px;bottom:4px;width:165px;height:44px;z-index:2;transform:rotate(2deg)}.countdownRibbon:before{content:'';position:absolute;left:-25px;top:10px;width:115px;height:18px;border-radius:50%;border-top:10px solid #e2aa28;transform:rotate(11deg)}.countdownRibbon:after{content:'';position:absolute;left:52px;top:0;width:118px;height:24px;border-radius:50%;border-bottom:10px solid #f0c34c;transform:rotate(-18deg)}.countdownWish{position:absolute;right:18px;bottom:9px;font-family:"Segoe Print","Comic Sans MS",cursive;font-size:14px;font-weight:800;color:#174f91;transform:rotate(-6deg);z-index:5;padding:4px 10px;line-height:1.05;background:linear-gradient(165deg,transparent 10%,#dcecffb0 11% 88%,transparent 89%)}.countdownDots{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);display:flex;gap:7px;z-index:5}.countdownDots i{width:7px;height:7px;border-radius:50%;background:#c9dcf2}.countdownDots i:first-child{background:#1780d8}.countdownConfetti span{position:absolute;z-index:4;color:#e3b23c;font-size:13px}.countdownConfetti span:nth-child(1){left:18px;top:17px}.countdownConfetti span:nth-child(2){left:42px;top:63px;transform:rotate(22deg)}.countdownConfetti span:nth-child(3){right:22px;bottom:58px}.classStat b{white-space:nowrap}@media(max-width:390px){.countdown{min-height:238px;padding-left:10px;padding-right:10px}.countdownHead{padding:0 60px}.countdownTitle{font-size:16px}.countdownSub{font-size:10px}.countdownDate{font-size:12px;right:11px}.countdownPlane{right:57px;transform:scale(.9) rotate(-11deg)}.countdownCapBig{font-size:54px;left:-10px;bottom:54px}.countdownGrid{margin-left:48px;gap:6px}.countdownBox{padding:14px 1px 12px;border-radius:18px}.countdownBox b{font-size:26px}.countdownWish{font-size:12px}.countdownRibbon{width:145px;left:-12px}}
</style></head>`);
        html = html.replace('<div class="classStat"><b>11А</b>','<div class="classStat"><b>11А класс</b>').replace('<div class="classStat"><b>11Б</b>','<div class="classStat"><b>11Б класс</b>').replace('<div class="classStat"><b>11В</b>','<div class="classStat"><b>11В класс</b>');
        html = html.replace('</div><div class="grid"><button class="card"', `</div><div class="countdown" id="graduationCountdown"><div class="countdownConfetti"><span>◆</span><span>✦</span><span>◆</span></div><div class="countdownDate">26 июня<br>2027</div><div class="countdownPlane"></div><div class="countdownTrail"></div><div class="countdownHead"><div class="countdownCalendar">🗓️</div><div class="countdownTitleWrap"><div class="countdownTitle">До выпускного осталось</div><div class="countdownSub">«Большие мечты начинаются здесь»</div></div></div><div class="countdownCapBig">🎓</div><div class="countdownGrid"><div class="countdownBox"><b id="cdDays">0</b><small>день</small></div><div class="countdownBox"><b id="cdHours">00</b><small>часа</small></div><div class="countdownBox"><b id="cdMinutes">00</b><small>минуты</small></div><div class="countdownBox"><b id="cdSeconds">00</b><small>секунда</small></div></div><div class="countdownRibbon"></div><div class="countdownDots"><i></i><i></i><i></i><i></i></div><div class="countdownWish">Лучшее<br>впереди! ♡</div></div><div class="grid"><button class="card"`);
        html = html.replace('</body>', `<script>(function(){const target=new Date(2027,5,26,0,0,0);function tick(){let d=Math.max(0,target-new Date());const days=Math.floor(d/86400000);d%=86400000;const h=Math.floor(d/3600000);d%=3600000;const m=Math.floor(d/60000);const s=Math.floor((d%60000)/1000);const pad=n=>String(n).padStart(2,'0');const a=document.getElementById('cdDays'),b=document.getElementById('cdHours'),c=document.getElementById('cdMinutes'),e=document.getElementById('cdSeconds');if(a)a.textContent=days;if(b)b.textContent=pad(h);if(c)c.textContent=pad(m);if(e)e.textContent=pad(s)}tick();setInterval(tick,1000)})();</script></body>`);
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