
(function(){
function planFirstPaymentImport(source){
 const result=JSON.parse(JSON.stringify(source)),list=result?.classes?.['11Б'];
 if(!Array.isArray(list))throw Error('В базе нет списка 11Б.');
 const rows=[],rosterChanges=[];
 const oldName='Петропавловская Софья',newName='Петропаловская Софья';
 const old=list.filter(p=>p.name===oldName),correct=list.filter(p=>p.name===newName);
 if(old.length+correct.length!==1)throw Error('Петропаловская Софья: нужна ровно одна запись со старым или исправленным написанием.');
 if(old.length){old[0].name=newName;rosterChanges.push('Исправить фамилию: '+oldName+' → '+newName);}
 const normalize=s=>String(s).trim().replace(/\s+/g,' ').replace(/ё/g,'е').toLowerCase();
 for(const name of ['Драбкина Алёна','Галактионов Никита']){
  const matches=Object.entries(result.classes).flatMap(([c,ps])=>ps.filter(p=>normalize(p.name)===normalize(name)).map(p=>({c,p})));
  if(matches.length===0){
   list.push({name,role:'student',guests:[],paid:false,payment:{cost:2440000,stages:[{amount:0,date:''},{amount:0,date:''},{amount:0,date:''}]}});
   rosterChanges.push('Добавить выпускника: '+name+' · без сопровождающих · стоимость 24 400 ₽');
  }else if(matches.length!==1||matches[0].c!=='11Б'||matches[0].p.name!==name)throw Error(name+': найдена другая или повторная запись. Требуется сверка.');
 }
 const manifest=[
 ['Дурасова Валерия',0],['Скоробогатая Ника',0],['Шаталина Софья',1],
 ['Лубнина Вероника',1],['Шевелева Эльвира',1],['Сорокина Ксения',1],
 ['Эльгаров Каплан',2],['Петропаловская Софья',2],['Переяславский Владислав',2],
 ['Суворова Вероника',2],['Матиев Умар',0],['Ташова Диана',0],
 ['Осипова Василина',0],['Черкезов Георгий',0],['Кумпан Виктория',1],
 ['Иванова Анастасия',1],['Мукомол Елена',1],['Драбкина Алёна',0],['Галактионов Никита',0]
 ];
 function apply(record,label){
  const a=record?.payment;
  if(!a||!Array.isArray(a.stages)||a.stages.length!==3)throw Error(label+': некорректная запись платежей.');
  const first=a.stages[0],same=first?.amount===400000&&first?.date==='2026-09-18';
  if(!same&&(!first||first.amount!==0||first.date!==''||record.paid===true))throw Error(label+': уже есть другая сумма, дата или отметка оплаты. Требуется сверка.');
  rows.push({label,amount:400000,date:'2026-09-18',existing:same});
  if(!same)a.stages[0]={...first,amount:400000,date:'2026-09-18'};
 }
 for(const [name,count] of manifest){
  const found=list.filter(p=>p.name===name);if(found.length!==1)throw Error(name+': найдено записей '+found.length+'.');
  const p=found[0];if(p.role!=='student')throw Error(name+': статус не «Выпускник».');
  if(JSON.stringify(p.guests)!==JSON.stringify(Array(count).fill('гость')))throw Error(name+': изменилось количество или обозначение сопровождающих.');
  if(p.guestPayments!==undefined&&(!Array.isArray(p.guestPayments)||p.guestPayments.length!==count))throw Error(name+': нарушено соответствие платежей и сопровождающих.');
  if(count&&!p.guestPayments)throw Error(name+': нет платежных записей сопровождающих.');
  apply(p,name+' — выпускник');
  for(let i=0;i<count;i++)apply(p.guestPayments[i],name+' — сопровождающий '+(i+1));
 }
 // Unpaid participant is explicitly excluded; never clear an existing payment silently.
 const unpaid=list.filter(p=>p.name==='Хачатрян Давид');
 if(unpaid.length!==1)throw Error('Хачатрян Давид: нужна ровно одна запись.');
 const stage=unpaid[0].payment?.stages?.[0];
 if(!stage||stage.amount!==0||stage.date!==''||unpaid[0].paid===true)throw Error('Хачатрян Давид: в базе уже есть отметка первого платежа. Требуется сверка.');
 if(rows.length!==34||rows.reduce((n,r)=>n+r.amount,0)!==13600000)throw Error('Не совпала контрольная сумма.');
 return {payload:result,rows,rosterChanges,pending:rows.filter(r=>!r.existing).length};
}
const panel=document.createElement('div');panel.className='row';panel.hidden=true;panel.style.display='none';
panel.innerHTML='<div class="grow"><b>Импорт 11Б · 18.09.2026</b><small>Этап 1 · 34 человека · 136 000 ₽</small><button type="button" class="editbtn">Проверить и показать платежи</button><div class="import-preview"></div></div>';
document.getElementById('info').appendChild(panel);
const beforeImportRender=render;
render=function(){beforeImportRender();const visible=admin&&verifiedAdmin&&serverReady;panel.hidden=!visible;panel.style.display=visible?'flex':'none'};
const preview=panel.querySelector('.import-preview'),checkButton=panel.querySelector('button');let busy=false;
const authorized=()=>admin&&verifiedAdmin&&serverReady&&tg?.initData;
async function requestJson(url,options={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{const response=await fetch(url,{...options,cache:'no-store',signal:controller.signal});const value=await response.json();if(!response.ok||!value.ok)throw Error(value.error||'Ошибка HTTP '+response.status);return value;}finally{clearTimeout(timer)}
}
function fail(error){preview.textContent='Импорт остановлен: '+error.message+' Ничего повторно не отправляйте; нажмите проверку, чтобы прочитать базу заново.'}
checkButton.addEventListener('click',async()=>{
 if(busy||!authorized())return;
 busy=true;checkButton.disabled=true;preview.textContent='Проверяем актуальные записи D1…';
 try{
  const session=await requestJson('/api/session',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({initData:tg.initData})});
  if(!session.isAdmin)throw Error('Требуется подтверждённый Telegram-администратор.');
  const fresh=await requestJson('/api/data'),snapshot=JSON.stringify(fresh.data),plan=planFirstPaymentImport(fresh.data);
  const list=document.createElement('ol');
  for(const row of plan.rows){const li=document.createElement('li');li.textContent=row.label+' — 4 000 ₽ · '+row.date.split('-').reverse().join('.')+(row.existing?' (уже внесено)':' (будет внесено)');list.appendChild(li);}
  preview.replaceChildren(list);
  const changes=document.createElement('ul');for(const change of plan.rosterChanges){const li=document.createElement('li');li.textContent=change;changes.appendChild(li);}preview.prepend(changes);
  const total=document.createElement('p');total.textContent='Этап 1: 34 человека · 136 000 ₽. Дата: 18.09.2026. Новых платежей: '+plan.pending+' на сумму '+(plan.pending*4000).toLocaleString('ru-RU')+' ₽. Хачатрян Давид остаётся без платежа. У существующих участников стоимость и этапы 2 и 3 не меняются.';preview.appendChild(total);
  if(!plan.pending&&!plan.rosterChanges.length){total.textContent='Проверено по базе: Этап 1: 34 человека · 136 000 ₽. Дата: 18.09.2026. Всё уже внесено, повторной записи не будет.';return;}
  const confirm=document.createElement('button');confirm.type='button';confirm.className='primary';confirm.textContent='Внести платежи и изменения списка';preview.appendChild(confirm);
  confirm.addEventListener('click',async()=>{
   if(busy||!authorized())return;
   busy=true;confirm.disabled=true;checkButton.disabled=true;
   let sent=false;
   try{
    const current=await requestJson('/api/data');
    if(JSON.stringify(current.data)!==snapshot)throw Error('База изменилась после предпросмотра. Выполните проверку заново.');
    const checked=planFirstPaymentImport(current.data),payload=checked.payload;
    payload.paymentSchemaVersion=2;payload._revision=current.data._revision||0;
    sent=true;
    await requestJson('/api/data',{method:'POST',headers:{'content-type':'application/json','x-telegram-init-data':tg.initData},body:JSON.stringify(payload)});
    const actual=await requestJson('/api/data'),verified=planFirstPaymentImport(actual.data);
    if(verified.pending||verified.rosterChanges.length)throw Error('Контроль после записи не совпал.');
    preview.textContent='Проверено по базе: Этап 1: 34 человека · 136 000 ₽. Дата: 18.09.2026.';
    await loadServer();
   }catch(e){if(sent)e.message='Запрос был отправлен; результат нужно перепроверить по базе. '+e.message;fail(e);}
   finally{busy=false;checkButton.disabled=false;}
  });
 }catch(e){fail(e);}finally{busy=false;checkButton.disabled=false;}
});
})();
