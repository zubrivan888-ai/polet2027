
(function(){
function planFirstPaymentImport(source){
 const result=JSON.parse(JSON.stringify(source)),list=result?.classes?.['11А'];
 if(!Array.isArray(list))throw Error('В базе нет списка 11А.');
 const manifest=[['Энне Ника',['мама']],['Аветисян',['мама','папа']],['Винникова',['мама','папа']],['Никитин Лев',['мама','папа']],['Долгова Кристина',['сестра']],['Петрова Алина',[]],['Сундукова Ангелина',[]],['Ремнев Кирилл',[]],['Лордкипанидзе Костя',[]]];
 const rows=[],targets=new Set();
 function apply(record,label,key){
  targets.add(key);
  if(!record||typeof record!=='object')throw Error(label+': некорректная запись.');
  if(!record.payment&&record.paid)throw Error(label+': есть прежняя отметка полной оплаты без суммы. Нужна проверка администратора.');
  const a=record.payment;
  if(a&&(!Array.isArray(a.stages)||a.stages.length!==3))throw Error(label+': некорректные этапы.');
  const first=a?.stages[0];
  const same=first?.amount===400000&&first?.date==='2026-09-14';
  if(first&&!same&&(first.amount!==0||first.date!==''))throw Error(label+': этап 1 уже заполнен другой суммой или датой.');
  rows.push({label,amount:400000,date:'2026-09-14',existing:same});
  if(!same){if(!a)record.payment={cost:null,stages:[{amount:0,date:''},{amount:0,date:''},{amount:0,date:''}]};record.payment.stages[0]={...record.payment.stages[0],amount:400000,date:'2026-09-14'};}
 }
 for(const [name,guests] of manifest){
  const found=list.map((p,i)=>({p,i})).filter(x=>x.p.name===name);
  if(found.length!==1)throw Error(name+': найдено записей '+found.length+' (нужна ровно одна).');
  const {p,i}=found[0];if(p.role==='companion')throw Error(name+': в базе указан как сопровождающий.');
  if(!Array.isArray(p.guests))throw Error(name+': отсутствует список сопровождающих.');
  if(p.guestPayments!==undefined&&(!Array.isArray(p.guestPayments)||p.guestPayments.length!==p.guests.length))throw Error(name+': нарушено соответствие сопровождающих и платежей.');
  apply(p,name+' — выпускник',i+':self');
  for(const guest of guests){
   const indices=p.guests.map((g,j)=>g===guest?j:-1).filter(j=>j>=0);
   if(indices.length!==1)throw Error(name+' / '+guest+': найдено '+indices.length+'. В базе: '+p.guests.join(', '));
   const j=indices[0];if(!p.guestPayments)p.guestPayments=p.guests.map(()=>({}));
   apply(p.guestPayments[j],name+' — '+guest,i+':'+j);
  }
 }
 for(const [i,p] of list.entries()){
  const records=[[p,i+':self'],...(p.guests||[]).map((g,j)=>[p.guestPayments?.[j],i+':'+j])];
  for(const [p,key] of records){const first=p?.payment?.stages?.[0];if(!targets.has(key)&&first&&(first.amount!==0||first.date!==''))throw Error('У другого участника 11А уже заполнен этап 1. Импорт остановлен, существующие платежи не удалены.');}
 }
 if(rows.length!==17||rows.reduce((s,r)=>s+r.amount,0)!==6800000)throw Error('Не совпала контрольная сумма.');
 return {payload:result,rows,pending:rows.filter(r=>!r.existing).length};
}
const panel=document.createElement('div');panel.className='row';panel.hidden=true;panel.style.display='none';
panel.innerHTML='<div class="grow"><b>Импорт 11А · 14.09.2026</b><small>Этап 1 · 17 человек · 68 000 ₽</small><button type="button" class="editbtn">Проверить и показать платежи</button><div class="import-preview"></div></div>';
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
  for(const row of plan.rows){const li=document.createElement('li');li.textContent=row.label+' — 4 000 ₽ · 14.09.2026'+(row.existing?' (уже внесено)':' (будет внесено)');list.appendChild(li);}
  preview.replaceChildren(list);
  const total=document.createElement('p');total.textContent='Этап 1: 17 человек · 68 000 ₽ · 14.09.2026. Новых платежей: '+plan.pending+'. Этапы 2 и 3 и полная стоимость не изменяются.';preview.appendChild(total);
  if(!plan.pending){total.textContent='Проверено по базе: Этап 1: 17 человек · 68 000 ₽ · 14.09.2026. Всё уже внесено, повторной записи не будет.';return;}
  const confirm=document.createElement('button');confirm.type='button';confirm.className='primary';confirm.textContent='Внести показанные платежи';preview.appendChild(confirm);
  confirm.addEventListener('click',async()=>{
   if(busy||!authorized())return;
   busy=true;confirm.disabled=true;checkButton.disabled=true;
   let sent=false;
   try{
    const current=await requestJson('/api/data');
    if(JSON.stringify(current.data)!==snapshot)throw Error('База изменилась после предпросмотра. Выполните проверку заново.');
    const checked=planFirstPaymentImport(current.data),payload=checked.payload;
    payload.paymentSchemaVersion=1;payload._revision=current.data._revision||0;
    sent=true;
    await requestJson('/api/data',{method:'POST',headers:{'content-type':'application/json','x-telegram-init-data':tg.initData},body:JSON.stringify(payload)});
    const actual=await requestJson('/api/data'),verified=planFirstPaymentImport(actual.data);
    if(verified.pending)throw Error('Контроль после записи не совпал.');
    preview.textContent='Проверено по базе: Этап 1: 17 человек · 68 000 ₽ · 14.09.2026.';
    await loadServer();
   }catch(e){if(sent)e.message='Запрос был отправлен; результат нужно перепроверить по базе. '+e.message;fail(e);}
   finally{busy=false;checkButton.disabled=false;}
  });
 }catch(e){fail(e);}finally{busy=false;checkButton.disabled=false;}
});
})();
