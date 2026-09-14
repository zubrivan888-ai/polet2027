/* Individual payments; amounts are stored as integer kopecks. */
let paymentRevision=0, paymentPayload={}, savingPayment=false, verifiedAdmin=false;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rub=n=>(n/100).toLocaleString('ru-RU',{minimumFractionDigits:0,maximumFractionDigits:2})+' ₽';
function emptyAccount(){return {cost:null,stages:Array.from({length:3},()=>({amount:0,date:''}))}}
function accountOf(p){return p?.payment||emptyAccount()}
function paymentStatus(p){const a=accountOf(p),total=a.stages.reduce((s,x)=>s+x.amount,0);if(!p.payment&&p.paid)return 'Оплачено ранее';if(a.cost===null)return total?'Частично · стоимость не задана':'Стоимость не задана';if(total>a.cost)return 'Переплата';if(total===a.cost)return 'Оплачено';return total?'Частично':'Не оплачено'}
function paymentSummary(p){const a=accountOf(p),sum=a.stages.reduce((s,x)=>s+x.amount,0);return `Стоимость: ${a.cost===null?'не задана':rub(a.cost)} · Внесено: ${rub(sum)}${a.cost===null?'':sum>a.cost?' · Переплата: '+rub(sum-a.cost):' · Осталось: '+rub(a.cost-sum)}`}
function moneyInput(v,optional=false){const s=String(v).trim().replace(/\s/g,'').replace(',','.');if(!s&&optional)return null;if(!s)return 0;if(!/^\d+(\.\d{1,2})?$/.test(s))throw Error('Введите неотрицательную сумму, не более двух знаков после запятой.');const [r,k='']=s.split('.');const n=Number(r)*100+Number(k.padEnd(2,'0'));if(!Number.isSafeInteger(n)||n>10000000000)throw Error('Слишком большая сумма.');return n}
function accountFields(p){const a=accountOf(p);return `<div class="payment-account"><div class="field"><label>Стоимость участия, ₽ (индивидуальная)</label><input class="payment-cost" inputmode="decimal" placeholder="Не задана" value="${a.cost===null?'':a.cost/100}" aria-label="Стоимость участия"></div>${!p.payment&&p.paid?'<div class="note">Ранее отмечено «Оплачено». Сумма неизвестна; внесите фактические платежи.</div>':''}${a.stages.map((x,i)=>`<div class="payment-stage"><b>Этап ${i+1}</b><div class="payment-inputs"><label>Внесено, ₽<input class="payment-amount" inputmode="decimal" value="${x.amount?x.amount/100:''}" placeholder="0" aria-label="Этап ${i+1}: сумма"></label><label>Дата платежа<input class="payment-date" type="date" value="${esc(x.date)}" aria-label="Этап ${i+1}: дата"></label></div></div>`).join('')}<div class="note payment-total">${esc(paymentSummary(p))}</div></div>`}
function readAccount(root){const cost=moneyInput(root.querySelector('.payment-cost').value,true),amounts=[...root.querySelectorAll('.payment-amount')],dates=[...root.querySelectorAll('.payment-date')];const stages=amounts.map((x,i)=>{const amount=moneyInput(x.value),date=dates[i].value;if(amount&&!date)throw Error('Укажите дату каждого внесённого платежа.');if(!amount&&date)throw Error('Укажите сумму платежа или очистите его дату.');return {amount,date}});return {cost,stages}}
function updatePaymentTotals(event){const root=event.target.closest('.payment-account');if(!root)return;try{root.querySelector('.payment-total').textContent=paymentSummary({payment:readAccount(root)})}catch(e){root.querySelector('.payment-total').textContent=e.message}}
function preserveAccount(root,p){const a=readAccount(root);if(!p.payment&&a.cost===null&&a.stages.every(x=>!x.amount&&!x.date))return {...p};return {...p,payment:a,paid:a.cost!==null&&a.stages.reduce((s,x)=>s+x.amount,0)>=a.cost}}
function syncRoleFields(){const companion=document.getElementById('roleInput').value==='companion';document.getElementById('guestFields').style.display=companion?'none':'block';document.querySelector('#modal .mini').style.display=companion?'none':'inline-block'}
function openEditor(c,i){if(!admin||!verifiedAdmin||!serverReady)return alert('Редактирование доступно администратору после загрузки общей базы.');editing=c!=null?{c,i}:null;const p=editing?data[c][i]:{name:'',guests:[],paid:false,role:'student'};document.getElementById('editorTitle').textContent=editing?'Участник и платежи':'Новый участник';document.getElementById('classInput').value=c||'11А';document.getElementById('nameInput').value=p.name||'';document.getElementById('roleInput').value=isCompanion(p)?'companion':'student';document.getElementById('paymentField').innerHTML='<h4>Личная оплата участника</h4>'+accountFields(p);document.getElementById('guestFields').innerHTML='';(p.guests||[]).forEach((g,i)=>addGuestField(g,p.guestPayments?.[i]||{}));document.getElementById('deleteBtn').style.display=editing?'block':'none';syncRoleFields();document.getElementById('modal').classList.add('open')}
function addGuestField(v='',old={}){const d=document.createElement('div');d.className='guestline payment-guest';d.paymentRecord=old;d.innerHTML=`<div class="guest-heading"><input class="guest-name" placeholder="Например: мама, папа" aria-label="Имя сопровождающего" value="${esc(v)}"><button type="button" onclick="if(confirm('Удалить гостя вместе с его платежами?'))this.closest('.payment-guest').remove()">×</button></div><details><summary>Индивидуальная стоимость и 3 платежа</summary>${accountFields(old)}</details>`;document.getElementById('guestFields').appendChild(d)}
async function saveEditor(){if(savingPayment||!verifiedAdmin)return;const c=document.getElementById('classInput').value,n=document.getElementById('nameInput').value.trim(),role=document.getElementById('roleInput').value;if(!n)return alert('Введите имя');const snapshot=JSON.stringify(data);try{const old=editing?data[editing.c][editing.i]:{};let p=preserveAccount(document.querySelector('#paymentField .payment-account'),old);const rows=[...document.querySelectorAll('.payment-guest')];if(role==='companion'&&rows.length)throw Error('Сначала удалите вложенных гостей или оставьте роль «Выпускник».');const guests=[],guestPayments=[];for(const row of rows){const name=row.querySelector('.guest-name').value.trim();if(!name)throw Error('Укажите имя каждого сопровождающего или удалите пустую строку.');guests.push(name);guestPayments.push(preserveAccount(row.querySelector('.payment-account'),row.paymentRecord||{}))}p={...p,name:n,role,guests,guestPayments};savingPayment=true;setPaymentBusy(true);if(editing){data[editing.c].splice(editing.i,1);if(editing.c===c)data[c].splice(editing.i,0,p);else data[c].push(p)}else data[c].push(p);await saveData();closeEditor();render()}catch(e){data=JSON.parse(snapshot);render();alert('Не удалось сохранить: '+e.message)}finally{savingPayment=false;setPaymentBusy(false)}}
function setPaymentBusy(b){document.querySelectorAll('#modal button,#modal input,#modal select').forEach(x=>x.disabled=b)}
const baseRender=render;
render=function(){baseRender();let h='';for(const c of ['11А','11Б','11В']){h+=`<h3 class="classTitle">${c}</h3>`;for(const [i,p] of data[c].entries()){const people=[{p,label:p.name},...(p.guests||[]).map((g,j)=>({p:p.guestPayments?.[j]||{},label:g+' — семья '+p.name}))];for(const person of people){const status=paymentStatus(person.p);h+=`<div class="row"><div class="grow"><b>${esc(person.label)}</b><small>${esc(status)}</small><small>${esc(paymentSummary(person.p))}</small>${accountOf(person.p).stages.map((s,j)=>s.amount?`<small>Этап ${j+1}: ${rub(s.amount)} · ${esc(s.date.split('-').reverse().join('.'))}</small>`:'').join('')}</div>${admin&&verifiedAdmin?`<button class="editbtn" onclick="openEditor('${c}',${i})">Изменить</button>`:''}</div>`}}}document.getElementById('paylist').innerHTML=h;const entries=[...document.querySelectorAll('#people .row')];let pos=0;for(const c of ['11А','11Б','11В'])for(const p of data[c]){const row=entries[pos++],badge=row?.querySelector('.badge');if(badge&&!isCompanion(p)){badge.textContent=paymentStatus(p);badge.classList.toggle('paid',paymentStatus(p)==='Оплачено');}}};
async function saveData(){if(!tg?.initData||!verifiedAdmin)throw Error('Откройте приложение в Telegram под аккаунтом администратора.');if(!serverReady)throw Error('Общая база ещё не загружена. Закройте и заново откройте приложение.');const payload={...paymentPayload,classes:data,expenses:expenses,rosterVersion:3,paymentSchemaVersion:1,_revision:paymentRevision};const r=await fetch('/api/data',{method:'POST',headers:{'content-type':'application/json','x-telegram-init-data':tg.initData},body:JSON.stringify(payload)});const j=await r.json();if(!r.ok||!j.ok)throw Error(r.status===409?'Данные уже изменены другим администратором. Заново откройте приложение и повторите ввод.':j.error||'Ошибка сохранения');paymentRevision=j.revision;paymentPayload={...payload,_revision:paymentRevision};serverReady=true}
async function loadServer(){
 if(dataLoadPending)return;
 dataLoadPending=true;serverReady=false;setDataLoadState('loading');
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
 try{
  const r=await fetch('/api/data',{cache:'no-store',signal:controller.signal});
  if(!r.ok)throw Error('HTTP '+r.status);
  const j=await r.json();
  if(!j.ok||!j.data?.classes||!['11А','11Б','11В'].every(c=>Array.isArray(j.data.classes[c])))throw Error('Некорректный ответ базы');
  paymentPayload=j.data;paymentRevision=paymentPayload._revision||0;
  data=Object.fromEntries(['11А','11Б','11В'].map(c=>[c,j.data.classes[c].map(x=>({...x,role:isCompanion(x)?'companion':'student'}))]));
  if(Array.isArray(j.data.expenses))expenses=j.data.expenses.map(x=>typeof x==='string'?{name:x,amount:0}:{...x});
  expenseNames=expenses.map(x=>x.name);
  serverReady=true;render();setDataLoadState('ready');
 }catch(e){serverReady=false;setDataLoadState('error')}
 finally{clearTimeout(timeout);dataLoadPending=false}
}
async function startSession(){if(!tg?.initData)return;try{const r=await fetch('/api/session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:tg.initData})});const j=await r.json();verifiedAdmin=!!(r.ok&&j.ok&&j.isAdmin);admin=verifiedAdmin;if(admin)document.getElementById('adminWho').textContent=j.user?.username?'@'+j.user.username:'Администратор';render()}catch(e){verifiedAdmin=false;admin=false}}
function enterAdmin(){if(!verifiedAdmin)return alert('Редактирование доступно только администратору в Telegram.');admin=true;render();showPage('participants')}
const oldBuildReport=buildReport;
buildReport=function(){if(reportType==='summary')return oldBuildReport();let out='Выпускной 2027 — отчёт по участникам и оплате\n';for(const c of reportType==='class'?[reportClass]:['11А','11Б','11В']){out+='\n'+c+'\n';for(const p of data[c]){out+=p.name+' — '+paymentStatus(p)+'; '+paymentSummary(p)+'\n';(p.guests||[]).forEach((g,i)=>{const a=p.guestPayments?.[i]||{};out+='  '+g+' — '+paymentStatus(a)+'; '+paymentSummary(a)+'\n'})}}return out};
document.getElementById('modal').addEventListener('input',updatePaymentTotals);

/* Read-only list search; does not change roster, payments, or report data. */
const listFilters={participants:{query:'',className:''},payments:{query:'',className:''}};
function normalizedSearch(value){return String(value||'').toLocaleLowerCase('ru-RU').replace(/ё/g,'е').trim().replace(/\s+/g,' ')}
function matchesFamily(person,query){const text=normalizedSearch([person.name,...(person.guests||[])].join(' '));return normalizedSearch(query).split(' ').filter(Boolean).every(word=>text.includes(word))}
function installListFilter(pageId,listId){
  const list=document.getElementById(listId),panel=document.createElement('div');
  panel.className='list-filter';panel.innerHTML=`<label for="${pageId}-search">Поиск по фамилии или имени</label><input id="${pageId}-search" type="search" placeholder="Например: Смирнов" autocomplete="off"><div class="list-filter-actions"><label for="${pageId}-class">Класс</label><select id="${pageId}-class"><option value="">Все классы</option><option>11А</option><option>11Б</option><option>11В</option></select><button type="button">Сбросить</button></div><div class="muted" role="status" aria-live="polite" id="${pageId}-found"></div>`;
  list.before(panel);
  panel.querySelector('input').addEventListener('input',event=>{listFilters[pageId].query=event.target.value;applyListFilter(pageId,listId)});
  panel.querySelector('select').addEventListener('change',event=>{listFilters[pageId].className=event.target.value;applyListFilter(pageId,listId)});
  panel.querySelector('button').addEventListener('click',()=>{listFilters[pageId]={query:'',className:''};panel.querySelector('input').value='';panel.querySelector('select').value='';applyListFilter(pageId,listId)});
}
function applyListFilter(pageId,listId){
  const {query,className}=listFilters[pageId],list=document.getElementById(listId),rows=[...list.querySelectorAll('.row')],headings=[...list.querySelectorAll('.classTitle')];
  let index=0,shown=0;
  ['11А','11Б','11В'].forEach((c,ci)=>{
    let classShown=0;
    for(const person of data[c]||[]){
      const visible=(!className||className===c)&&matchesFamily(person,query);
      const count=pageId==='participants'?1:1+(person.guests||[]).length;
      for(let i=0;i<count;i++){const row=rows[index++];if(row)row.hidden=!visible;if(visible&&row){shown++;classShown++}}
    }
    if(headings[ci])headings[ci].hidden=!classShown;
  });
  document.getElementById(pageId+'-found').textContent=shown
    ? (pageId==='participants'?'Показано записей: ':'Показано людей: ')+shown+(query?' · вместе с семьёй':'')
    : 'Ничего не найдено. Проверьте имя или сбросьте фильтры.';
}
const listFilterStyle=document.createElement('style');
listFilterStyle.textContent='.list-filter{background:#f9fcfe;border-radius:18px;padding:14px;margin:0 0 14px}.list-filter>label{display:block;font-size:13px;color:#526b80;margin-bottom:7px}.list-filter input{width:100%;min-width:0;font-size:16px;padding:12px;border:1px solid #d5e2ed;border-radius:12px;background:white;color:#14233a}.list-filter-actions{display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap}.list-filter-actions label{font-size:13px}.list-filter select,.list-filter button{min-height:44px;border:1px solid #d5e2ed;border-radius:12px;padding:8px 10px;background:#eef5ff;color:#245f86;font-size:14px}.list-filter select{flex:1}.list-filter .muted{padding:10px 0 0;font-size:13px;color:#526b80}#people [hidden],#paylist [hidden]{display:none!important}.list-filter input:focus-visible,.list-filter select:focus-visible,.list-filter button:focus-visible{outline:2px solid #1685ee;outline-offset:2px}';
document.head.appendChild(listFilterStyle);
installListFilter('participants','people');installListFilter('payments','paylist');
const renderBeforeFilters=render;
render=function(){renderBeforeFilters();applyListFilter('participants','people');applyListFilter('payments','paylist')};
const jumpBeforeFilters=jumpParticipantClass;
jumpParticipantClass=function(c){
  listFilters.participants.className=c;document.getElementById('participants-class').value=c;
  applyListFilter('participants','people');
  const heading=document.getElementById('class-'+c);
  if(heading&&!heading.hidden)jumpBeforeFilters(c);
  else document.getElementById('participants-search').scrollIntoView({block:'center',behavior:'smooth'});
};

/* One pinned announcement, stored with the shared application state. */
let savingAnnouncement=false;
function currentAnnouncement(){const a=paymentPayload.announcement;return a&&typeof a==='object'?a:null}
function renderAnnouncement(){
 const a=currentAnnouncement(),visible=!!(a&&a.visible&&a.title);
 const card=document.getElementById('pinned-announcement');card.hidden=!visible;
 if(visible){card.querySelector('h2').textContent=a.title;card.querySelector('p').textContent=a.text||'';card.querySelector('small').textContent=a.updatedAt?'Обновлено '+new Date(a.updatedAt).toLocaleDateString('ru-RU'):''}
 const info=document.getElementById('announcement-info');
 info.querySelector('p').textContent=visible?a.title+'\n'+(a.text||''):'Важных объявлений пока нет.';
 info.querySelector('button').hidden=!(admin&&verifiedAdmin&&serverReady);
}
function openAnnouncementEditor(){
 if(!admin||!verifiedAdmin||!serverReady)return;
 const a=currentAnnouncement();
 document.getElementById('announcement-title').value=a?.title||'';
 document.getElementById('announcement-text').value=a?.text||'';
 document.getElementById('announcement-visible').checked=a?a.visible!==false:true;
 document.getElementById('announcement-error').textContent='';
 document.getElementById('announcement-modal').classList.add('open');
 document.getElementById('announcement-title').focus();
}
function closeAnnouncementEditor(){if(!savingAnnouncement)document.getElementById('announcement-modal').classList.remove('open')}
async function saveAnnouncement(event){
 event.preventDefault();if(savingAnnouncement||!admin||!verifiedAdmin||!serverReady)return;
 const title=document.getElementById('announcement-title').value.trim(),text=document.getElementById('announcement-text').value.trim(),visible=document.getElementById('announcement-visible').checked;
 const error=document.getElementById('announcement-error');error.textContent='';
 if(!title||title.length>100||text.length>2000){error.textContent='Укажите заголовок до 100 символов и текст до 2000 символов.';return}
 const previous=paymentPayload;
 savingAnnouncement=true;
 document.querySelectorAll('#announcement-modal input,#announcement-modal textarea,#announcement-modal button').forEach(x=>x.disabled=true);
 try{
  paymentPayload={...paymentPayload,announcement:{title,text,visible,updatedAt:new Date().toISOString()}};
  await saveData();
  document.getElementById('announcement-modal').classList.remove('open');renderAnnouncement();
 }catch(e){paymentPayload=previous;error.textContent='Не удалось сохранить: '+e.message}
 finally{savingAnnouncement=false;document.querySelectorAll('#announcement-modal input,#announcement-modal textarea,#announcement-modal button').forEach(x=>x.disabled=false)}
}
const announcementStyle=document.createElement('style');
announcementStyle.textContent='#pinned-announcement{margin:8px 16px 14px;padding:16px;background:#fff5df;border:1px solid #eddbad;border-radius:20px}#pinned-announcement[hidden],#announcement-info button[hidden]{display:none!important}#pinned-announcement h2{font-size:18px;line-height:1.35;margin:0 0 8px}#pinned-announcement p,#announcement-info p{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.5;margin:8px 0;font-size:14px}#pinned-announcement small{color:#6e654e;font-size:12px}#announcement-info{display:block}#announcement-info h3{margin:0;font-size:17px}#announcement-modal{z-index:145}#announcement-modal textarea{width:100%;min-height:150px;resize:vertical;border:1px solid #dfe6ed;border-radius:14px;padding:12px;font:16px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}#announcement-modal .publish-check{display:flex;align-items:center;gap:10px;font-size:14px}#announcement-error{color:#a82d27;font-size:14px;line-height:1.4}#announcement-modal input[type=checkbox]{width:20px;height:20px}';
document.head.appendChild(announcementStyle);
const announcementCard=document.createElement('aside');announcementCard.id='pinned-announcement';announcementCard.hidden=true;announcementCard.setAttribute('aria-label','Важное объявление');announcementCard.innerHTML='<h2></h2><p></p><small></small>';
document.querySelector('#home .top').after(announcementCard);
const announcementInfo=document.createElement('div');announcementInfo.id='announcement-info';announcementInfo.className='row';announcementInfo.innerHTML='<h3>Важное объявление</h3><p></p><button type="button" class="editbtn" hidden>Изменить объявление</button>';
const oldNews=[...document.querySelectorAll('#info .row')].find(x=>x.querySelector('b')?.textContent==='Новости');if(oldNews)oldNews.replaceWith(announcementInfo);else document.getElementById('info').appendChild(announcementInfo);
announcementInfo.querySelector('button').addEventListener('click',openAnnouncementEditor);
const announcementModal=document.createElement('div');announcementModal.id='announcement-modal';announcementModal.className='modal';announcementModal.setAttribute('role','dialog');announcementModal.setAttribute('aria-modal','true');announcementModal.setAttribute('aria-labelledby','announcement-heading');
announcementModal.innerHTML='<form class="sheet"><h3 id="announcement-heading">Важное объявление</h3><div class="note">Объявление видно всем на главной. Редактировать могут только администраторы.</div><div class="field"><label for="announcement-title">Заголовок</label><input id="announcement-title" maxlength="100" required placeholder="Например: первый этап оплаты"></div><div class="field"><label for="announcement-text">Текст</label><textarea id="announcement-text" maxlength="2000" placeholder="Что нужно знать родителям"></textarea></div><label class="publish-check"><input type="checkbox" id="announcement-visible">Показывать на главной</label><p id="announcement-error" role="alert"></p><div class="sheetactions"><button type="button" class="secondary">Отмена</button><button type="submit" class="primary">Сохранить</button></div></form>';
document.body.appendChild(announcementModal);announcementModal.querySelector('form').addEventListener('submit',saveAnnouncement);announcementModal.querySelector('button[type=button]').addEventListener('click',closeAnnouncementEditor);
announcementModal.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeAnnouncementEditor()}});
const renderBeforeAnnouncement=render;
render=function(){renderBeforeAnnouncement();renderAnnouncement()};

/* Event details share the existing authenticated, revision-checked save path. */
let savingEvent=false,eventReturnFocus=null;
function eventDetails(){return paymentPayload.eventDetails||{date:'2027-06-26',time:'',venue:'Президент Отель',address:'',route:'',contacts:''}}
function safeRoute(value){if(!value)return '';try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}}
function eventDate(value){if(!value)return 'Уточняется';const parts=value.split('-');return parts.length===3?parts.reverse().join('.'):value}
function renderEventDetails(){
 const e=eventDetails(),card=document.getElementById('event-details-card');
 for(const [key,label] of [['date','Дата'],['time','Время сбора'],['venue','Место'],['address','Адрес'],['contacts','Контакты организаторов']]){
  card.querySelector('[data-event="'+key+'"]').textContent=key==='date'?eventDate(e[key]):e[key]||'Уточняется';
 }
 const route=card.querySelector('a');route.hidden=!safeRoute(e.route);if(!route.hidden)route.href=safeRoute(e.route);else route.removeAttribute('href');
 card.querySelector('button').hidden=!(admin&&verifiedAdmin&&serverReady);
}
function openEventEditor(){
 if(!admin||!verifiedAdmin||!serverReady)return;
 const e=eventDetails();for(const key of ['date','time','venue','address','route','contacts','program'])document.getElementById('event-'+key).value=e[key]||'';
 document.getElementById('event-error').textContent='';eventReturnFocus=document.activeElement;
 document.getElementById('event-editor').classList.add('open');document.getElementById('event-date').focus();
}
function closeEventEditor(){if(savingEvent)return;document.getElementById('event-editor').classList.remove('open');eventReturnFocus?.focus()}
async function saveEventDetails(event){
 event.preventDefault();if(savingEvent||!admin||!verifiedAdmin||!serverReady)return;
 const e={};for(const key of ['date','time','venue','address','route','contacts','program'])e[key]=document.getElementById('event-'+key).value.trim();
 const error=document.getElementById('event-error');error.textContent='';
 if(e.route&&!safeRoute(e.route)){error.textContent='Для маршрута укажите полную ссылку, начинающуюся с https://';return}
 if(e.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||!Number.isFinite(Date.parse(e.date))||new Date(e.date).toISOString().slice(0,10)!==e.date)){error.textContent='Проверьте дату мероприятия.';return}
 if(e.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(e.time)){error.textContent='Проверьте время сбора.';return}
 if(e.venue.length>200||e.address.length>400||e.route.length>2000||e.contacts.length>1000||e.program.length>5000){error.textContent='Сократите слишком длинный текст.';return}
 const previous=paymentPayload;savingEvent=true;document.querySelectorAll('#event-editor input,#event-editor textarea,#event-editor button').forEach(x=>x.disabled=true);
 try{paymentPayload={...paymentPayload,eventDetails:e};await saveData();renderEventDetails();document.getElementById('event-editor').classList.remove('open');eventReturnFocus?.focus()}
 catch(err){paymentPayload=previous;error.textContent='Не удалось сохранить: '+err.message}
 finally{savingEvent=false;document.querySelectorAll('#event-editor input,#event-editor textarea,#event-editor button').forEach(x=>x.disabled=false)}
}
const eventStyle=document.createElement('style');
eventStyle.textContent='#event-details-card{display:block}#event-details-card h3{margin:0 0 14px;font-size:20px}#event-details-card dl{margin:0}#event-details-card dt{font-size:12px;color:#526b80;margin-top:12px}#event-details-card dd{margin:4px 0 0;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere;font-size:15px}#event-details-card .event-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}#event-details-card a{display:inline-block;text-decoration:none;padding:11px 14px;border-radius:14px;background:#1685ee;color:white;font-weight:600}#event-details-card [hidden]{display:none!important}#event-editor{z-index:146}#event-editor textarea{width:100%;min-height:110px;resize:vertical;font:16px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;border:1px solid #dfe6ed;border-radius:14px;padding:12px}#event-editor input{min-width:0}#event-error{color:#a82d27;font-size:14px}';
document.head.appendChild(eventStyle);
const eventCard=document.createElement('div');eventCard.id='event-details-card';eventCard.className='row';
eventCard.innerHTML='<h3>Мероприятие</h3><dl>'+[['date','Дата'],['time','Время сбора'],['venue','Место'],['address','Адрес'],['contacts','Контакты организаторов']].map(([key,label])=>'<dt>'+label+'</dt><dd data-event="'+key+'"></dd>').join('')+'</dl><div class="event-actions"><a hidden target="_blank" rel="noopener noreferrer">Открыть маршрут</a><button hidden type="button" class="editbtn">Изменить данные мероприятия</button></div>';
document.querySelector('#info h2').after(eventCard);eventCard.querySelector('button').addEventListener('click',openEventEditor);
const eventModal=document.createElement('div');eventModal.id='event-editor';eventModal.className='modal';eventModal.setAttribute('role','dialog');eventModal.setAttribute('aria-modal','true');eventModal.setAttribute('aria-labelledby','event-editor-title');
eventModal.innerHTML='<form class="sheet"><h3 id="event-editor-title">Данные мероприятия</h3><div class="note">Изменения видны всем участникам. Неизвестные данные можно оставить пустыми.</div>'+[['date','Дата мероприятия','date',10],['time','Время сбора (местное)','time',5],['venue','Место проведения','text',200],['address','Адрес','text',400],['route','Ссылка на маршрут (https://)','url',2000]].map(([key,label,type,max])=>'<div class="field"><label for="event-'+key+'">'+label+'</label><input id="event-'+key+'" type="'+type+'" maxlength="'+max+'"></div>').join('')+'<div class="field"><label for="event-contacts">Контакты организаторов</label><textarea id="event-contacts" maxlength="1000" placeholder="Имя, телефон или Telegram"></textarea></div><p id="event-error" role="alert"></p><div class="sheetactions"><button type="button" class="secondary">Отмена</button><button type="submit" class="primary">Сохранить</button></div></form>';
document.body.appendChild(eventModal);eventModal.querySelector('form').addEventListener('submit',saveEventDetails);eventModal.querySelector('button[type=button]').addEventListener('click',closeEventEditor);
eventModal.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeEventEditor()}if(event.key==='Tab'){const fields=[...eventModal.querySelectorAll('input,textarea,button')].filter(x=>!x.disabled);if(!fields.length)return;const first=fields[0],last=fields[fields.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}});
const renderBeforeEventDetails=render;render=function(){renderBeforeEventDetails();renderEventDetails()};

/* Financial summary is computed from every individual's account, in kopecks. */
function summarizePayments(classes){
 const total={cost:0,paid:0,due:0,over:0,unknown:0,legacy:0,people:0};
 for(const c of classes)for(const person of data[c]||[]){
  for(const p of [person,...(person.guests||[]).map((g,i)=>person.guestPayments?.[i]||{})]){
   const account=accountOf(p),paid=account.stages.reduce((s,x)=>s+x.amount,0);
   total.people++;total.paid+=paid;
   if(!p.payment&&p.paid)total.legacy++;
   if(account.cost===null){total.unknown++;continue}
   total.cost+=account.cost;total.due+=Math.max(0,account.cost-paid);total.over+=Math.max(0,paid-account.cost);
  }
 }
 return total;
}
function summaryMarkup(title,s){
 return '<div class="payment-summary-card"><h3>'+esc(title)+'</h3><dl><div><dt>Начислено</dt><dd>'+rub(s.cost)+'</dd></div><div><dt>Внесено</dt><dd>'+rub(s.paid)+'</dd></div><div><dt>Осталось</dt><dd>'+rub(s.due)+'</dd></div></dl><p>'+s.people+' чел.'+(s.unknown?' · Без стоимости: '+s.unknown:'')+(s.legacy?' · Прежняя отметка «Оплачено» без суммы: '+s.legacy:'')+'</p>'+(s.over?'<p>Переплата: '+rub(s.over)+'</p>':'')+'</div>';
}
function renderPaymentSummary(){
 const panel=document.getElementById('payment-summary');if(!serverReady){panel.querySelector('.payment-summary-content').textContent='Сводка появится после загрузки общей базы.';return}
 const classes=['11А','11Б','11В'];
 panel.querySelector('.payment-summary-content').innerHTML=summaryMarkup('Все участники',summarizePayments(classes))+'<details><summary>По классам</summary>'+classes.map(c=>summaryMarkup(c,summarizePayments([c]))).join('')+'</details><p class="payment-summary-hint">Итоги по всем участникам, независимо от поиска. Начислено и остаток рассчитаны только для людей с заданной стоимостью. Внесено — все записанные платежи. Переплата одного человека не уменьшает долг другого.</p>';
}
const summaryStyle=document.createElement('style');
summaryStyle.textContent='#payment-summary{margin:0 0 16px}.payment-summary-card{padding:14px;background:#f9fcfe;border-radius:18px;margin-bottom:9px}.payment-summary-card h3{font-size:16px;margin:0 0 12px}.payment-summary-card dl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:0}.payment-summary-card dt{font-size:12px;color:#526b80}.payment-summary-card dd{font-size:17px;font-weight:700;margin:5px 0 0;overflow-wrap:anywhere}.payment-summary-card p,.payment-summary-hint{font-size:12px;line-height:1.5;color:#526b80;margin:10px 0 0}#payment-summary summary{padding:12px;background:#e3f1ff;border-radius:12px;color:#245f86;cursor:pointer;margin-bottom:8px}.payment-summary-hint{padding:0 3px}';
document.head.appendChild(summaryStyle);
const paymentSummaryPanel=document.createElement('section');paymentSummaryPanel.id='payment-summary';paymentSummaryPanel.setAttribute('aria-label','Сводка оплаты');paymentSummaryPanel.innerHTML='<div class="payment-summary-content"></div>';
document.querySelector('#payments h2').after(paymentSummaryPanel);
const renderBeforePaymentSummary=render;render=function(){renderBeforePaymentSummary();renderPaymentSummary()};

/* Never present the bundled starter roster as current server data. */
let dataLoadPending=false;
function setDataLoadState(state){
 document.body.classList.toggle('shared-data-unavailable',state!=='ready');
 const panel=document.getElementById('shared-data-status');
 panel.hidden=state==='ready';
 panel.querySelector('p').textContent=state==='loading'?'Загружаем актуальные списки и оплату…':'Не удалось загрузить общую базу. Списки и суммы временно скрыты, чтобы не показывать устаревшие данные.';
 const button=panel.querySelector('button');button.hidden=state!=='error';button.disabled=state==='loading';
 panel.setAttribute('aria-busy',String(state==='loading'));
}
const loadStateStyle=document.createElement('style');
loadStateStyle.textContent='#shared-data-status{margin:12px 16px;padding:14px;border-radius:16px;background:#e3f1ff;color:#245f86}#shared-data-status p{margin:0;line-height:1.5;font-size:14px}#shared-data-status button{margin-top:10px;min-height:44px}#shared-data-status[hidden],#shared-data-status button[hidden]{display:none!important}.shared-data-unavailable .classStats,.shared-data-unavailable #home .stats,.shared-data-unavailable #participants .classJumpIntro,.shared-data-unavailable #participants .classJump,.shared-data-unavailable #participants .shareReportBtn,.shared-data-unavailable #adminControls,.shared-data-unavailable #people,.shared-data-unavailable #paylist,.shared-data-unavailable #explist,.shared-data-unavailable #payment-summary,.shared-data-unavailable .list-filter{display:none!important}';
document.head.appendChild(loadStateStyle);
const loadStatePanel=document.createElement('div');loadStatePanel.id='shared-data-status';loadStatePanel.setAttribute('role','status');loadStatePanel.setAttribute('aria-live','polite');loadStatePanel.innerHTML='<p></p><button type="button" class="primary" hidden>Повторить загрузку</button>';
document.querySelector('.app').prepend(loadStatePanel);
loadStatePanel.querySelector('button').addEventListener('click',async()=>{await loadServer();if(serverReady)await startSession()});
setDataLoadState('loading');

/* Program text is an optional part of the event record. */
const programField=document.createElement('div');programField.className='field';
programField.innerHTML='<label for="event-program">Программа мероприятия</label><textarea id="event-program" maxlength="5000" placeholder="Каждый пункт — с новой строки. Например: время, название и описание"></textarea><small>До 5000 символов. Оставьте поле пустым, если программа ещё не утверждена.</small>';
document.getElementById('event-error').before(programField);
const programPanel=document.createElement('details');programPanel.id='event-program-panel';programPanel.className='row';
programPanel.innerHTML='<summary><span>Программа мероприятия</span><small></small></summary><div class="program-text"></div><button hidden type="button" class="editbtn">Редактировать программу</button>';
const programPlaceholder=[...document.querySelectorAll('#info .row')].find(x=>x.querySelector('b')?.textContent==='Программа мероприятия');
if(programPlaceholder)programPlaceholder.replaceWith(programPanel);else document.getElementById('info').appendChild(programPanel);
programPanel.querySelector('button').addEventListener('click',()=>{if(!admin||!verifiedAdmin||!serverReady)return;openEventEditor();document.getElementById('event-program').focus()});
const programStyle=document.createElement('style');
programStyle.textContent='#event-program-panel{display:block}#event-program-panel summary{cursor:pointer;min-height:44px;font-size:16px;font-weight:700}#event-program-panel summary small{display:block;font-size:12px;font-weight:400;color:#526b80;margin-top:6px}#event-program-panel .program-text{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.7;font-size:15px;margin:14px 0}#event-program-panel button[hidden]{display:none!important}#event-program{min-height:220px}#event-program-panel summary:focus-visible{outline:2px solid #1685ee;outline-offset:4px}.shared-data-unavailable #event-program-panel{display:none!important}';
document.head.appendChild(programStyle);
const renderEventBeforeProgram=renderEventDetails;
renderEventDetails=function(){
 renderEventBeforeProgram();
 const text=String(eventDetails().program||'').trim();
 programPanel.querySelector('summary small').textContent=text?'Нажмите, чтобы посмотреть расписание':'Пока не утверждена';
 programPanel.querySelector('.program-text').textContent=text||'Организаторы добавят программу после утверждения.';
 programPanel.querySelector('button').hidden=!(admin&&verifiedAdmin&&serverReady);
};

/* Financial report uses recorded payments; it never changes shared data. */
function paymentStageTotals(classes){
 const stages=[0,0,0];
 for(const c of classes)for(const person of data[c]||[]){
  for(const p of [person,...(person.guests||[]).map((g,i)=>person.guestPayments?.[i]||{})]){
   accountOf(p).stages.forEach((stage,i)=>stages[i]+=stage.amount);
  }
 }
 return stages;
}
function financialReportBlock(title,classes){
 const s=summarizePayments(classes),stages=paymentStageTotals(classes);
 return title+'\nУчастников: '+s.people+'\nНачислено: '+rub(s.cost)+'\nВнесено: '+rub(s.paid)+'\nОсталось: '+rub(s.due)
  +'\nЭтап 1: '+rub(stages[0])+'\nЭтап 2: '+rub(stages[1])+'\nЭтап 3: '+rub(stages[2])
  +(s.over?'\nПереплата: '+rub(s.over):'')
  +(s.unknown?'\nБез заданной стоимости: '+s.unknown+' чел.':'')
  +(s.legacy?'\nОтмечено «Оплачено» ранее, без суммы: '+s.legacy+' чел.':'');
}
const buildReportBeforeFinance=buildReport;
buildReport=function(){
 if(reportType!=='finance')return buildReportBeforeFinance();
 if(!serverReady)return 'Сначала загрузите актуальные данные общей базы.';
 const classes=['11А','11Б','11В'];
 return 'Выпускной 2027 — финансовый отчёт\n'
  +classes.map(c=>financialReportBlock(c+' класс',[c])).join('\n\n')
  +'\n\n'+financialReportBlock('ОБЩИЙ ИТОГ',classes)
  +'\n\nНачислено и остаток — только по людям с заданной стоимостью. Внесено и этапы — все записанные платежи. Переплата одного человека не уменьшает долг другого. Прежние отметки без суммы в платежи не включены.';
};
const financeReportButton=document.createElement('button');financeReportButton.type='button';financeReportButton.id='rt-finance';financeReportButton.setAttribute('aria-pressed','false');
financeReportButton.innerHTML='<svg class="reportIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 20V10m8 10V4m8 16v-7"/></svg><span class="reportTypeCopy"><b>Финансовый отчёт</b><small>По классам, трём этапам и общий итог</small></span><span class="reportRadio" aria-hidden="true"></span>';
document.querySelector('#reportModal .reportTypes').appendChild(financeReportButton);
financeReportButton.addEventListener('click',()=>setReportType('finance'));
const financeShareButton=document.createElement('button');financeShareButton.type='button';financeShareButton.className='shareReportBtn';financeShareButton.textContent='Поделиться финансовым отчётом';financeShareButton.style.marginTop='12px';
financeShareButton.addEventListener('click',()=>{if(!serverReady)return;openReportShare();setReportType('finance')});
document.getElementById('payment-summary').appendChild(financeShareButton);
