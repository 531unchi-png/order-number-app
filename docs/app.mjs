import {KEY,initial,validate,number,addStaff,setNext,issue} from './model.mjs';
const $=id=>document.getElementById(id);
let data,selected='411C',last=null,busy=false;
const message=t=>{$('message').textContent=t;};
function read(){const raw=localStorage.getItem(KEY);return raw?validate(JSON.parse(raw)):initial();}
function render(){
  const select=$('staff');select.replaceChildren();
  for(const s of data.staff){const o=document.createElement('option');o.value=s.code;o.textContent=`${s.name}（${s.code}）`;select.append(o);}
  if(!data.staff.some(s=>s.code===selected))selected=data.staff[0].code;select.value=selected;
  const s=data.staff.find(s=>s.code===selected);
  $('next').textContent=s.next===null?'未設定':s.next>999999?'上限に到達':number({code:s.code,seq:s.next});
  $('issueButton').disabled=busy||s.next===null||s.next>999999;
  const q=$('search').value.trim().toLowerCase();
  const orders=data.orders.filter(o=>o.code===selected&&[number(o),o.customer,o.memo,o.amount].join(' ').toLowerCase().includes(q)).slice().reverse();
  $('count').textContent=`${orders.length}件`;$('history').replaceChildren();
  if(!orders.length){const p=document.createElement('p');p.className='hint';p.textContent='履歴はありません';$('history').append(p);}
  for(const o of orders.slice(0,200)){
    const row=document.createElement('article');row.className='row '+(o.status==='cancelled'?'cancelled':'');
    const title=document.createElement('strong');title.textContent=number(o);row.append(title);
    const time=document.createElement('time');time.dateTime=o.created;time.textContent=new Date(o.created).toLocaleString('ja-JP');row.append(time);
    if(o.status==='cancelled'){const badge=document.createElement('p');badge.className='badge';badge.textContent='取消済み（番号は再利用しません）';row.append(badge);}
    for(const value of [o.customer,o.memo,o.amount?`${Number(o.amount).toLocaleString('ja-JP')}円`:''])if(value){const p=document.createElement('p');p.textContent=value;row.append(p);}
    const copy=document.createElement('button');copy.type='button';copy.textContent='コピー';copy.onclick=()=>copyNumber(number(o));row.append(copy);
    if(o.status==='active'){const cancel=document.createElement('button');cancel.type='button';cancel.textContent='取消';cancel.onclick=async()=>{if(!confirm(`${number(o)}を取り消しますか？ 番号は再利用されません。`))return;await mutate(d=>{const found=d.orders.find(x=>x.id===o.id);if(found)found.status='cancelled';},'取り消しました');};row.append(cancel);}
    $('history').append(row);
  }
  if(orders.length>200){const p=document.createElement('p');p.className='hint';p.textContent='最新200件を表示中です。検索で絞り込めます。バックアップには全件含まれます。';$('history').append(p);}
}
async function mutate(fn,success){
  if(busy)return;busy=true;$('issueButton').disabled=true;
  try{
    if(!navigator.locks)throw Error('同じ端末での番号重複を防ぐため、最新のSafariで開いてください');
    await navigator.locks.request(KEY,()=>{const fresh=read();fn(fresh);validate(fresh);localStorage.setItem(KEY,JSON.stringify(fresh));data=fresh;});
    render();if(success)message(success);return true;
  }catch(e){message(`保存できませんでした：${e.message}。番号は使用せず、履歴を確認してください。`);return false;}
  finally{busy=false;if(data)render();}
}
async function copyNumber(n){try{await navigator.clipboard.writeText(n);message('番号をコピーしました');}catch{message(`コピーできない場合は番号を長押ししてください：${n}`);}}
$('staff').onchange=()=>{selected=$('staff').value;$('result').hidden=true;render();};
$('search').oninput=render;
$('issue').onsubmit=async e=>{
  e.preventDefault();const fields={customer:$('customer').value.trim(),memo:$('memo').value.trim(),amount:$('amount').value};
  if(fields.amount && (!Number.isSafeInteger(Number(fields.amount)) || Number(fields.amount)<0)){message('金額は0以上の整数で入力してください');return;}
  let result;const code=selected,id=crypto.randomUUID();const ok=await mutate(d=>{result=issue(d,code,fields,id,new Date().toISOString());});
  if(ok){last=number(result);$('issued').textContent=last;$('result').hidden=false;$('issue').reset();message('保存して発行しました');}
};
$('copy').onclick=()=>last&&copyNumber(last);
$('setNext').onsubmit=async e=>{e.preventDefault();const code=selected,n=Number($('start').value);if(!confirm(`${code}の次の連番を${n}に設定しますか？ 既存の用紙・使用済み番号を確認してください。`))return;await mutate(d=>setNext(d,code,n),'次の番号を設定しました');};
$('addStaff').onsubmit=async e=>{e.preventDefault();const code=$('staffCode').value.trim().toUpperCase(),name=$('staffName').value;const ok=await mutate(d=>addStaff(d,code,name),'担当者を追加しました。次の番号を設定してください');if(ok){selected=code;$('addStaff').reset();render();}};
$('backup').onclick=()=>{try{const d=read();const blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`order-number-backup-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);message('保存画面で「ファイルに保存」を選び、保存できたことを確認してください');}catch(e){message(e.message);}};
$('restore').onchange=async()=>{
  const file=$('restore').files[0];if(!file)return;
  try{
    if(file.size>10*1024*1024)throw Error('ファイルが大きすぎます');const restored=validate(JSON.parse(await file.text()));
    if(!confirm('現在の履歴を置き換えます。先に現在のバックアップを保存してください。復元後は会社で使った最後の番号を確認してください。続けますか？'))return;
    await mutate(d=>{
      for(const s of restored.staff){const current=d.staff.find(x=>x.code===s.code);if(current?.next!==null && current?.next!==undefined)s.next=Math.max(s.next??1,current.next);}
      d.staff=restored.staff;d.orders=restored.orders;
    },'復元しました。使用済み・印刷済みの最後の番号を確認してから発行してください');$('result').hidden=true;
  }catch(e){message(`復元できませんでした：${e.message}`);}finally{$('restore').value='';}
};
window.addEventListener('storage',e=>{if(e.key===KEY){try{data=read();render();}catch(err){message('保存データを読み込めません。バックアップを確認してください');$('issueButton').disabled=true;}}});
try{data=read();const probe=KEY+'-check';localStorage.setItem(probe,'1');localStorage.removeItem(probe);render();if(!navigator.locks){$('issueButton').disabled=true;message('最新版のSafariで開いてください');}}catch(e){$('issueButton').disabled=true;message('保存データを読み込めません。ブラウザの保存設定とバックアップを確認してください。');}
