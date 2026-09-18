
(function(){
function planFirstPaymentImport(source){
 const result=JSON.parse(JSON.stringify(source)),list=result?.classes?.['11В'];
 if(!Array.isArray(list))throw Error('В базе нет списка 11В.');
 // name, complete expected guest list, number of paid guests, date, preserve existing payment
 const manifest=[
 ['Малыхина Ксения',[],0],
 ['Котов Сергей',['гость','гость'],2],
 ['Алферова Таисия',[],0],
 ['Гильмутдинова София',['Мама'],1,'2026-09-15',true],
 ['Усков Альберт',[],0],
 ['Гагиев Луис',[],0],
 ['Рожкова Ольга',['гость','гость'],2],
 ['Шкляева Софья',[],0],
 ['Мельник',[],0],
 ['Иванова Екатерина',['гость'],0],
 ['Ан Александра',[],0],
 ['Поздеева София',[],0],
 ['Исаева Мария',[],0],
 ['Сырцова Полина',[],0],
 ['Матасов',['гость','гость','гость'],3],
 ['Юркова Мария',[],0]
 ];
 const rows=[];
 function apply(record,label,date,preserve){
  if(!record||typeof record!=='object'||Array.isArray(record))throw Error(label+': некорректная запись.');
  const a=record.payment;
  if(!a||!Array.isArray(a.stages)||a.stages.length!==3)throw Error(label+': нет корректной записи трёх этапов оплаты.');
  const first=a.stages[0];
  const same=first?.amount===400000&&first?.date===date;
  if(preserve&&!same)throw Error(label+': ожидался уже внесённый платёж 4 000 ₽ от 15.09.2026. Требуется повторная сверка.');
  if(!same&&(!first||first.amount!==0||first.date!==''||record.paid===true))throw Error(label+': этап 1 уже заполнен другой суммой, датой или прежней отметкой оплаты.');
  rows.push({label,amount:400000,date,existing:same});
  if(!same)a.stages[0]={...first,amount:400000,date};
 }
 for(const [name,guests,paidGuests,date='2026-09-18',preserve=false] of manifest){
  const found=list.filter(p=>p.name===name);
  if(found.length!==1)throw Error(name+': найдено записей '+found.length+' (нужна ровно одна).');
  const p=found[0];
  if(p.role!=='student')throw Error(name+': статус в базе не «Выпускник».');
  if(JSON.stringify(p.guests)!==JSON.stringify(guests))throw Error(name+': состав сопровождающих изменился. В базе: '+JSON.stringify(p.guests)+'. Ожидалось: '+JSON.stringify(guests));
  if(guests.length&&(!Array.isArray(p.guestPayments)||p.guestPayments.length!==guests.length))throw Error(name+': нарушено соответствие сопровождающих и платежей.');
  apply(p,name+' — выпускник',date,preserve);
  // Duplicate labels «гость» are separate existing slots; all of them are paid for these families.
  for(let i=0;i<paidGuests;i++)apply(p.guestPayments[i],name+' — сопровождающий '+(i+1)+' ('+guests[i]+')',date,preserve);
 }
 if(rows.length!==24||rows.reduce((s,r)=>s+r.amount,0)!==9600000)throw Error('Не совпала контрольная сумма.');
 return {payload:result,rows,pending:rows.filter(r=>!r.existing).length};
}
const panel=document.createElement('div');panel.className='row';panel.hidden=true;panel.style.display='none';
panel.innerHTML='<div class="grow"><b>Импорт 11В · 18.09.2026</b><small>Этап 1 · 24 человека · 96 000 ₽</small><button type="button" class="editbtn">Проверить и показать платежи</button><div class="import-preview"></div></div>';
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
  const total=document.createElement('p');total.textContent='Этап 1: 24 человека · 96 000 ₽. Даты: 22 платежа от 18.09.2026 и 2 от 15.09.2026. Новых платежей: '+plan.pending+' на сумму '+(plan.pending*4000).toLocaleString('ru-RU')+' ₽. Этапы 2 и 3 и полная стоимость не изменяются.';preview.appendChild(total);
  if(!plan.pending){total.textContent='Проверено по базе: Этап 1: 24 человека · 96 000 ₽. Даты: 22 платежа от 18.09.2026 и 2 от 15.09.2026. Всё уже внесено, повторной записи не будет.';return;}
  const confirm=document.createElement('button');confirm.type='button';confirm.className='primary';confirm.textContent='Внести показанные платежи';preview.appendChild(confirm);
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
    if(verified.pending)throw Error('Контроль после записи не совпал.');
    preview.textContent='Проверено по базе: Этап 1: 24 человека · 96 000 ₽. Даты: 22 платежа от 18.09.2026 и 2 от 15.09.2026.';
    await loadServer();
   }catch(e){if(sent)e.message='Запрос был отправлен; результат нужно перепроверить по базе. '+e.message;fail(e);}
   finally{busy=false;checkButton.disabled=false;}
  });
 }catch(e){fail(e);}finally{busy=false;checkButton.disabled=false;}
});
})();
