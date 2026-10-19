/* HX 計算核心。日期以本地日曆日期處理，避免時區造成生日偏移。 */
(function(root){
  'use strict';
  const rates = typeof module !== 'undefined' ? require('./rates.js') : HX_RATES;
  const factors = {year:1,half:0.52,quarter:0.262,month:0.088};
  const counts = {year:1,half:2,quarter:4,month:12};
  function date(s){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return null;
    const [y,m,d]=s.split('-').map(Number), v=new Date(y,m-1,d);
    return v.getFullYear()===y && v.getMonth()===m-1 && v.getDate()===d ? v : null;
  }
  function calendar(y,m,d){return new Date(y,m,Math.min(d,new Date(y,m+1,0).getDate()));}
  function age(birth,asOf){
    const b=date(birth), a=date(asOf);
    if(!b || !a || b>a) throw new Error('請輸入有效生日，且生日不能晚於試算日期。');
    let years=a.getFullYear()-b.getFullYear();
    if(a<calendar(b.getFullYear()+years,b.getMonth(),b.getDate())) years--;
    const six=calendar(b.getFullYear()+years,b.getMonth()+6,b.getDate());
    return {actual:years,insurance:years+(a>six?1:0)};
  }
  function quote({birth,asOf,sex,term,amount,mode,year}){
    const ages=age(birth,asOf), row=rates[ages.insurance];
    if(!['male','female'].includes(sex)) throw new Error('請選擇費率性別。');
    if(![10,20].includes(term)) throw new Error('請選擇 10 年或 20 年繳。');
    if(!row || (term===20 && ages.insurance>50)) throw new Error(term===20?'20 年繳的投保保險年齡為 0～50 歲。':'此費率表的投保保險年齡為 0～60 歲。');
    if(!Number.isInteger(amount) || amount<30 || amount>200) throw new Error('保額請輸入 30～200 萬元之間的整數。');
    if(!Object.hasOwn(factors,mode)) throw new Error('請選擇有效繳費方式。');
    if(!Number.isInteger(year) || year<1 || year>86-ages.insurance) throw new Error('請選擇保障期間內的保單年度。');
    const rate=row[(term===10?1:3)+(sex==='female'?1:0)];
    const annual=rate*amount, premium=Math.round(annual*factors[mode]);
    const sum=annual*Math.min(year,term), insured=amount*10000, returnBase=Math.round(sum*106/100);
    return {...ages,annual,premium,yearCost:premium*counts[mode],scheduledTotal:premium*counts[mode]*term,
      initial:year===1?returnBase:insured*0.05,light:year===1?returnBase:insured*0.15,
      severe:year===1?returnBase:Math.max(returnBase,insured),returnBase,
      maturityBase:Math.round(annual*term*106/100),sum,rate};
  }
  const api={date,age,quote};
  if(typeof module!=='undefined') module.exports=api; else root.HX=api;
})(typeof window!=='undefined'?window:globalThis);
