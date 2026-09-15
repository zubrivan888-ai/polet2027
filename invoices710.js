/* Published invoices are documents, not payment confirmations. */
(function(){
 const page=document.createElement('section');page.id='invoices710';page.className='page';
 page.innerHTML='<button type="button" class="back">← Назад</button><h2>Счета на оплату</h2><h3>Первый платёж</h3><p class="invoice-note">Общие счета по классам по договору №710 от 07.09.2026. Сумма счёта — за класс, а не за одного человека. Порядок перечисления согласуйте с администратором своего класса.</p><div class="invoice-cards"></div><p class="invoice-note">Дата выставления в PDF отдельно не указана. Публикация счёта не подтверждает его оплату. Фактически внесённые взносы отражены в разделе «Статусы».</p>';
 for(const [className,slug,amount] of [['11А','a','168 000'],['11Б','b','128 000'],['11В','v','100 000']]){
  const card=document.createElement('article');card.className='invoice-card';
  const path='/documents/invoice-710-'+slug+'.pdf';
  card.innerHTML='<h3>'+className+' · Первый платёж</h3><strong>'+amount+' ₽</strong><p>Общая сумма счёта по классу<br>В том числе НДС 5% · 1 страница · PDF</p><p>Получатель: ООО «АБ Ивент»</p><a class="invoice-open" href="'+path+'" target="_blank" rel="noopener" aria-label="Открыть PDF счёта '+className+'">Открыть PDF ↗</a><a class="invoice-download" href="'+path+'" download aria-label="Скачать счёт '+className+'">Скачать</a>';
  page.querySelector('.invoice-cards').appendChild(card);
 }
 document.querySelector('.app').appendChild(page);
 const entry=document.createElement('button');entry.type='button';entry.id='invoices710-entry';entry.className='row click';entry.innerHTML='<span class="grow"><b>📑 Счета на оплату</b><small>Первый платёж · 11А, 11Б и 11В</small></span><span aria-hidden="true">›</span>';
 document.getElementById('contract710-entry').after(entry);
 const previousShowPage=showPage;showPage=function(id){previousShowPage(id);if(id==='invoices710')document.getElementById('n-info').classList.add('on')};
 const previousBack=handleTgBack;handleTgBack=function(){if(currentPage==='invoices710')showPage('info');else previousBack()};
 entry.addEventListener('click',()=>showPage('invoices710'));
 page.querySelector('.back').addEventListener('click',()=>{showPage('info');entry.focus()});
 const style=document.createElement('style');style.textContent='#invoices710-entry{width:100%;text-align:left;font:inherit;color:inherit;border:1px solid #bed8ee;background:#edf6ff;gap:10px}#invoices710-entry small{display:block;margin-top:6px;color:#526b80}#invoices710 .invoice-card{padding:16px;background:#f9fcfe;border-radius:20px;margin:14px 0;line-height:1.5}#invoices710 h3{font-size:17px;margin:0 0 12px}#invoices710 strong{font-size:28px;color:#145a9d}#invoices710 p{font-size:14px;line-height:1.6;color:#526b80}#invoices710 .invoice-open{display:block;background:#1685ee;color:white;text-align:center;text-decoration:none;padding:12px;border-radius:14px}#invoices710 .invoice-download{display:block;padding:12px;text-align:center;color:#145a9d}#invoices710 a:focus-visible,#invoices710-entry:focus-visible{outline:3px solid #216ca8;outline-offset:3px}';
 document.head.appendChild(style);
})();
