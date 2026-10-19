'use strict';
const $=id=>document.getElementById(id);
const money=n=>'NT$ '+new Intl.NumberFormat('zh-TW').format(n);
const benefitMoney=n=>Number.isInteger(n/10000)?`${n/10000} 萬元`:`${new Intl.NumberFormat('zh-TW').format(n)} 元`;
const modes={year:['年繳','／年',1],half:['半年繳','／半年',2],quarter:['季繳','／季',4],month:['月繳','／月',12]};
const checked=name=>document.querySelector(`input[name="${name}"]:checked`).value;
function localToday(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function updateMaturity(q){
  if(!q){
    ['maturity-value','maturity-paid','review-maturity-value'].forEach(id=>$(id).textContent='—');
    $('maturity-formula').textContent='輸入生日，看看繳滿後的表定保費總和與滿期給付試算基礎。';
    $('maturity-period').textContent='繳滿年期的表定保費總和';
    $('maturity-mode-note').textContent='10 年或 20 年繳滿後，保障繼續；滿期給付須等到保險年齡 86 歲之保單週年日。';
    $('review-maturity-formula').textContent='完成試算後，這裡會顯示計算過程。';
    return;
  }
  const term=Number(checked('term')),total=q.annual*term;
  const formula=`表定年繳 ${money(q.annual)} × ${term} 年 ＝ ${money(total)}；再 × 1.06 ＝ ${money(q.maturityBase)}`;
  $('maturity-value').textContent=money(q.maturityBase);
  $('maturity-paid').textContent=money(total);
  $('maturity-period').textContent=`繳滿 ${term} 年的表定保費總和`;
  $('maturity-formula').textContent=formula;
  $('review-maturity-value').textContent=money(q.maturityBase);
  $('review-maturity-formula').textContent=formula;
  $('maturity-mode-note').textContent=$('mode').value==='year'
    ? `依保額不變、原方案繳滿 ${term} 年試算，尚未計入繳費折扣。繳費期滿不立即領取滿期金。`
    : `依目前${modes[$('mode').value][0]}排定，繳滿 ${term} 年的實繳合計為 ${money(q.scheduledTotal)}。滿期基礎依條款的表定年繳保費計算，不直接以分期實繳合計乘 1.06。`;
}
function empty(message,error=false){
  updateMaturity(null);
  ['premium','year-cost','total-cost','initial','light','severe'].forEach(id=>$(id).textContent='—');
  $('age-value').innerHTML='— <small>歲</small>';$('actual-age').textContent='尚未完成試算';
  $('summary').textContent='等待有效試算條件';$('premium-caption').textContent='完成左側設定，即可查看保費與給付。';
  $('feedback').textContent=message;$('feedback').className='feedback'+(error?' error':'');
  $('death-note').textContent='給付或退還後契約終止；未匯入保單價值準備金，不顯示確定金額。';
  $('maturity-note').textContent='給付後契約終止。此給付與重度癌症、身故給付不能視為必然可累加。';
}
function update(){
  const amount=Number($('amount').value),mode=$('mode').value,year=Number($('policy-year').value);
  if(Number.isInteger(amount) && amount>=30 && amount<=200) $('amount-range').value=amount;
  document.querySelectorAll('[data-amount]').forEach(b=>{const active=Number(b.dataset.amount)===amount;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  $('minus').disabled=amount<=30;$('plus').disabled=amount>=200;
  $('pay-unit').textContent=modes[mode][1];
  const first=year===1;
  $('initial-rule').textContent=first?'第 1 保單年度，按「年繳保險費總和 × 1.06」給付。':'第 2 保單年度起，按保險金額的 5% 給付。';
  $('light-rule').textContent=first?'第 1 保單年度，按「年繳保險費總和 × 1.06」給付。':'第 2 保單年度起，按保險金額的 15% 給付。';
  $('severe-rule').textContent=first?'第 1 保單年度，按「年繳保險費總和 × 1.06」給付。':'第 2 保單年度起，比較「保險金額」與「年繳保險費總和 × 1.06」，取較大者。';
  if(!$('birth').value){empty('請輸入生日，即可開始試算。');return;}
  try{
    const ages=HX.age($('birth').value,$('asof').value);
    if(ages.insurance>60) throw new Error('此費率表的投保保險年齡為 0～60 歲。');
    const maxYear=86-ages.insurance;
    if($('policy-year').options.length!==maxYear){
      $('policy-year').replaceChildren();
      for(let n=1;n<=maxYear;n++){const o=document.createElement('option');o.value=n;o.textContent=`第 ${n} 保單年度`;$('policy-year').append(o);}
      $('policy-year').value=String(Math.min(year,maxYear));
      if(year>maxYear){update();return;}
    }
    const twenty=document.querySelector('input[name="term"][value="20"]');
    twenty.disabled=ages.insurance>50;
    let switched=false;
    if(twenty.disabled && twenty.checked && ages.insurance<=60){document.querySelector('input[name="term"][value="10"]').checked=true;switched=true;}
    const term=Number(checked('term'));
    const q=HX.quote({birth:$('birth').value,asOf:$('asof').value,sex:checked('sex'),term,amount,mode,year});
    updateMaturity(q);
    $('age-value').innerHTML=`${q.insurance} <small>歲</small>`;$('actual-age').textContent=`實歲 ${q.actual} 歲`;
    $('premium').textContent=new Intl.NumberFormat('zh-TW').format(q.premium);
    $('year-cost').textContent=money(q.yearCost);$('total-cost').textContent=money(q.scheduledTotal);
    $('summary').textContent=`${checked('sex')==='male'?'男性':'女性'} · ${q.insurance} 歲 · ${term} 年繳`;
    $('premium-caption').textContent=`保額 ${amount} 萬元 · ${modes[mode][0]}，每期 ${money(q.premium)}`;
    ['initial','light','severe'].forEach(id=>$(id).textContent=benefitMoney(q[id]));
    $('death-note').textContent=q.insurance+year-1<16
      ? '保險年齡達 16 歲之保單週年日前，改依條款退還或給付「所繳保險費加計利息」；滿 15 足歲前退還予要保人或應得之人，滿 15 足歲後給付身故保險金。加計利息依條款以年利率 2.25% 單利計算。給付或退還後契約終止。'
      : `第 ${year} 保單年度的「年繳保險費總和 × 1.06」為 ${money(q.returnBase)}；須再比較保單價值準備金。給付或退還後契約終止。`;
    $('maturity-note').textContent=`若依此方案繳滿 ${term} 年，「年繳保險費總和 × 1.06」為 ${money(q.maturityBase)}；滿期金須再比較當時保單價值準備金。須契約持續有效且未因重度癌症或身故等給付而終止。`;
    $('feedback').className='feedback';
    $('feedback').textContent=switched?'保險年齡超過 50 歲，已切換為可試算的 10 年繳。':`試算日期 ${$('asof').value.replaceAll('-','/')}。${q.insurance>50?'此年齡僅可試算 10 年繳。':'金額已隨設定更新。'}`;
    $('premium').classList.remove('changed');void $('premium').offsetWidth;$('premium').classList.add('changed');
  }catch(e){empty(e.message,true);}
}
function setAmount(value){$('amount').value=value;update();}
$('amount-range').addEventListener('input',e=>setAmount(Number(e.target.value)));
$('amount').addEventListener('input',update);
$('minus').addEventListener('click',()=>setAmount(Math.max(30,(Number($('amount').value)||30)-10)));
$('plus').addEventListener('click',()=>setAmount(Math.min(200,(Number($('amount').value)||30)+10)));
document.querySelectorAll('[data-amount]').forEach(b=>b.addEventListener('click',()=>setAmount(Number(b.dataset.amount))));
['birth','asof','mode','policy-year'].forEach(id=>$(id).addEventListener('change',update));
document.querySelectorAll('input[type=radio]').forEach(r=>r.addEventListener('change',update));
function reset(){
  $('birth').value='';$('asof').value=localToday();$('birth').max=localToday();$('amount').value=100;$('amount-range').value=100;$('mode').value='year';
  document.querySelector('input[name="sex"][value="male"]').checked=true;
  document.querySelector('input[name="term"][value="20"]').disabled=false;
  document.querySelector('input[name="term"][value="20"]').checked=true;
  $('policy-year').replaceChildren();for(let n=1;n<=86;n++){const o=document.createElement('option');o.value=n;o.textContent=`第 ${n} 保單年度`;$('policy-year').append(o);}$('policy-year').value='2';update();
}
$('reset').addEventListener('click',reset);reset();
