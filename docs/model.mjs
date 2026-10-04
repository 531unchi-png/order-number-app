export const KEY = 'order-number-local-v1';
export function initial() { return {version:1,staff:[{code:'411C',name:'担当者1',next:null}],orders:[]}; }
export function validate(d) {
  if (!d || d.version!==1 || !Array.isArray(d.staff) || !d.staff.length || !Array.isArray(d.orders)) throw Error('バックアップの形式が違います');
  const codes=new Set(), ids=new Set(), numbers=new Set();
  for (const s of d.staff) {
    if (!/^[0-9]{3}C$/.test(s.code) || typeof s.name!=='string' || !s.name.trim() || s.name.length>40 || codes.has(s.code) || !(s.next===null || Number.isInteger(s.next)&&s.next>=1&&s.next<=1000000)) throw Error('担当者の設定が不正です');
    codes.add(s.code);
  }
  for (const o of d.orders) {
    if (!codes.has(o.code) || !Number.isInteger(o.seq) || o.seq<1 || o.seq>999999 || typeof o.id!=='string' || !o.id || ids.has(o.id) || numbers.has(o.code+o.seq) || !['active','cancelled'].includes(o.status) || typeof o.created!=='string' || !Number.isFinite(Date.parse(o.created)) || ['customer','memo','amount'].some(k=>typeof o[k]!=='string'||o[k].length>500)) throw Error('履歴の形式・番号が不正です');
    ids.add(o.id);numbers.add(o.code+o.seq);
  }
  for (const s of d.staff) { const max=d.orders.reduce((max,o)=>o.code===s.code?Math.max(max,o.seq):max,0); if(max && (s.next===null || s.next<=max)) throw Error('次の番号が発行済み番号と重複します'); }
  return d;
}
export const number=o=>o.code+String(o.seq).padStart(6,'0');
export function addStaff(d,code,name) {
  code=code.trim().toUpperCase();name=name.trim();
  if(!/^[0-9]{3}C$/.test(code))throw Error('担当コードは411Cのように数字3桁＋Cで入力してください');
  if(!name || name.length>40)throw Error('担当者名は1〜40文字で入力してください');
  if(d.staff.some(s=>s.code===code))throw Error('その担当コードは登録済みです');
  d.staff.push({code,name,next:null});
}
export function setNext(d,code,n) {
  const s=d.staff.find(s=>s.code===code); if(!s)throw Error('担当者を選んでください');
  if(!Number.isInteger(n)||n<1||n>999999)throw Error('1〜999999の整数で入力してください');
  if(s.next!==null && n<s.next)throw Error('番号を前に戻すことはできません');
  if(d.orders.some(o=>o.code===code&&o.seq>=n))throw Error('発行済み番号と重複します');
  s.next=n;
}
export function issue(d,code,fields,id,created) {
  const old=d.orders.find(o=>o.id===id);if(old)return old;
  const s=d.staff.find(s=>s.code===code);if(!s||s.next===null)throw Error('最初に「次に発行する番号」を設定してください');
  if(s.next>999999)throw Error('6桁の上限に達しました');
  const o={id,code,seq:s.next,created,status:'active',customer:fields.customer||'',memo:fields.memo||'',amount:fields.amount||''};
  if(d.orders.some(x=>x.code===code&&x.seq===o.seq))throw Error('番号が重複しています。発行を停止しました');
  d.orders.push(o);s.next++;return o;
}
