/* 五站解說互動。所有選擇只保留在本頁記憶體，不儲存或上傳。 */
(function(){
  'use strict';
  const get=id=>document.getElementById(id);
  const titles=['為什麼準備','保障怎麼分','認識這張保單','我的保費給付','一起看方案'];
  let current=1,concern='treatment';
  const concerns={
    treatment:['治療的選擇','希望做決定時，多一份餘裕。','如果治療計畫中有自費項目，事先準備的一筆資金，可以讓您與家人一起討論如何安排。'],
    living:['休養的生活','好好休養時，生活仍有支援。','當工作需要暫緩，日常生活費仍然持續。可以先想想，自己希望預留哪些休養期間的支出。'],
    family:['家人的日常','家人的日常，也值得準備。','房貸、子女與家庭固定開銷，不一定會隨著治療而暫停。多一份事前準備，就多一個一起討論的選項。']
  };
  const supports={
    daily:['住院期間的一份補貼','符合保單約定的住院條件時，依約定天數與日額等方式給付。適合用來理解住院期間的定額支援。','如果治療不需要住院，原有保單有哪些給付可以支援？'],
    expense:['針對符合約定的醫療費用','依保單約定的費用項目、限額與申請條件給付。哪些住院、門診或手術費用納入保障，需要逐張保單確認。','原有保單包含哪些費用？限額、除外與申請條件是什麼？'],
    lump:['符合約定時，一筆可以安排的資金','癌症一次金依條款的癌症定義、保單年度及給付條件計算。領到一筆資金後，可依需要安排治療與生活。','除了醫療費，休養生活與家庭固定開銷，您希望如何安排？']
  };
  function summary(){
    get('review-concern').textContent=concerns[concern][0];
    const valid=get('premium').textContent!=='—';
    if(!valid){
      get('review-mode').textContent='試算保費';get('review-premium').textContent='尚未試算';
      get('review-description').textContent='輸入生日與方案後，這裡會帶入您的試算摘要。';
      ['review-amount','review-initial','review-severe'].forEach(id=>get(id).textContent='—');
      get('review-year').textContent='癌症給付須符合等待期間、初次罹患與完整條款約定。';
      get('review-edit').textContent='先試算我的方案 ↗';return;
    }
    get('review-mode').textContent=get('mode').selectedOptions[0].textContent+'保費';
    get('review-premium').textContent='NT$ '+get('premium').textContent;
    get('review-description').textContent=get('summary').textContent+' · 每年應繳合計 '+get('year-cost').textContent;
    get('review-amount').textContent=get('amount').value+' 萬元';
    get('review-initial').textContent=get('initial').textContent+' / '+get('light').textContent;
    get('review-severe').textContent=get('severe').textContent;
    get('review-year').textContent='依第 '+get('policy-year').value+' 保單年度展示，非同時給付的加總。重度給付後契約終止；癌症給付須符合等待期間與條款約定。';
    get('review-edit').textContent='再調整保額與預算 ↗';
  }
  function navigate(step,focus=true){
    if(!Number.isInteger(step)||step<1||step>5)return;
    current=step;
    document.querySelectorAll('.station').forEach((panel,i)=>panel.hidden=i+1!==step);
    document.querySelectorAll('[role="tab"]').forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i+1===step));tab.tabIndex=i+1===step?0:-1;});
    get('station-progress').style.width=(step*20)+'%';
    get('station-counter').textContent=String(step).padStart(2,'0')+' / 05';
    get('previous').disabled=step===1;
    get('next').textContent=step===5?'回到第一站 ↺':'下一站：'+titles[step]+' →';
    summary();
    try{history.replaceState(null,'','#step-'+step);}catch{ /* 離線預覽限制不影響切換。 */ }
    if(focus){window.scrollTo({top:0,behavior:'instant'});get('step-'+step).querySelector('h1').focus({preventScroll:true});}
    const tab=get('tab-'+step);const holder=tab.parentElement;
    if(tab.offsetLeft<holder.scrollLeft)holder.scrollLeft=tab.offsetLeft;
    else if(tab.offsetLeft+tab.offsetWidth>holder.scrollLeft+holder.clientWidth)holder.scrollLeft=tab.offsetLeft+tab.offsetWidth-holder.clientWidth;
  }
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>navigate(Number(b.dataset.go))));
  document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();navigate(1);});
  document.querySelectorAll('[data-concern]').forEach(b=>b.addEventListener('click',()=>{
    concern=b.dataset.concern;
    document.querySelectorAll('[data-concern]').forEach(x=>{const yes=x===b;x.classList.toggle('active',yes);x.setAttribute('aria-pressed',String(yes));});
    const photo=get('opening-scene');
    photo.src=concern==='family'?'assets/family.png':'assets/preparation.png';
    photo.alt=concern==='family'?'夫妻在家中一起閱讀筆記，討論家庭生活安排':'女性在暖光窗邊整理筆記，思考未來的生活安排';
    get('concern-title').textContent=concerns[concern][1];get('concern-copy').textContent=concerns[concern][2];summary();
  }));
  document.querySelectorAll('[data-support]').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('[data-support]').forEach(x=>{const yes=x===b;x.classList.toggle('active',yes);x.setAttribute('aria-pressed',String(yes));});
    const data=supports[b.dataset.support];get('support-title').textContent=data[0];get('support-copy').textContent=data[1];get('support-question').textContent=data[2];
  }));
  get('previous').addEventListener('click',()=>navigate(current-1));
  get('next').addEventListener('click',()=>navigate(current===5?1:current+1));
  document.querySelector('[role="tablist"]').addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    e.preventDefault();let n=e.key==='Home'?1:e.key==='End'?5:((current-1+(e.key==='ArrowRight'?1:4))%5)+1;
    navigate(n,false);get('tab-'+n).focus();
  });
  window.addEventListener('hashchange',()=>{const m=location.hash.match(/^#step-([1-5])$/);if(m)navigate(Number(m[1]));});
  const initial=location.hash.match(/^#step-([1-5])$/);navigate(initial?Number(initial[1]):1,false);
})();
