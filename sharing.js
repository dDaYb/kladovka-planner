// Links contain immutable snapshots; no account or access token is required.
const SHORT_LINK_CACHE='kladovka-short-link-v1';
let shareLongUrl='',shareBusy=false;
async function decodeCompressedPlan(encoded){
 if(encoded.length>50000)throw Error('Ссылка слишком большая.');
 if(!window.DecompressionStream)throw Error('Для этой ссылки обновите браузер.');
 const binary=atob(encoded.replace(/-/g,'+').replace(/_/g,'/'));
 const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
 const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
 const chunks=[];let size=0;
 try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>200000){await reader.cancel();throw Error('Проект слишком большой.');}chunks.push(value);}}finally{reader.releaseLock();}
 return JSON.parse(await new Blob(chunks).text());
}
async function makeShareUrl(plan){
 const json=JSON.stringify(plan);
 const base=location.hostname==='localhost'||location.hostname==='127.0.0.1'?'https://ddayb.github.io/kladovka-planner/':location.origin+location.pathname;
 if(!window.CompressionStream)return base+'#plan='+btoa(unescape(encodeURIComponent(json)));
 const bytes=new Uint8Array(await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
 return base+'#planz='+btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function validShortUrl(url){return typeof url==='string'&&/^https:\/\/is\.gd\/[A-Za-z0-9_]{1,30}$/.test(url);}
async function shareShortPlan(){
 const dialog=document.getElementById('shareDialog');if(!dialog.open)dialog.showModal();if(shareBusy)return;
 const plan=snapshot();shareBusy=true;shareLongUrl='';
 const status=document.getElementById('shareStatus'),result=document.getElementById('shareResult');
 result.value='';document.getElementById('copyShortLink').disabled=true;document.getElementById('copyLongLink').disabled=true;status.textContent='Создаю короткую ссылку…';
 let timer;
 try{
  shareLongUrl=await makeShareUrl(plan);document.getElementById('copyLongLink').disabled=false;
  let cached;try{cached=JSON.parse(localStorage.getItem(SHORT_LINK_CACHE)||'null');}catch{}
  let shortUrl=cached?.long===shareLongUrl&&validShortUrl(cached.short)?cached.short:null;
  if(!shortUrl){
   if(shareLongUrl.length>5000)throw Error('size');
   const controller=new AbortController();timer=setTimeout(()=>controller.abort(),15000);
   const response=await fetch('https://is.gd/create.php?'+new URLSearchParams({format:'json',url:shareLongUrl}),{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
   const data=await response.json();if(!response.ok||!validShortUrl(data.shorturl))throw Error('service');shortUrl=data.shorturl;
   try{localStorage.setItem(SHORT_LINK_CACHE,JSON.stringify({long:shareLongUrl,short:shortUrl}));}catch{}
  }
  result.value=shortUrl;document.getElementById('copyShortLink').disabled=false;status.textContent='Короткая ссылка готова. Нажмите «Копировать ссылку».';
 }catch(e){
  status.textContent=e.message==='size'?'Проект слишком большой для сокращения. Можно поделиться обычной ссылкой или файлом проекта.':'Сервис коротких ссылок недоступен. Можно поделиться обычной ссылкой или попробовать позже.';
  if(shareLongUrl){result.value=shareLongUrl;document.getElementById('copyShortLink').disabled=false;}
 }finally{clearTimeout(timer);shareBusy=false;}
}
async function copyShareResult(){
 const field=document.getElementById('shareResult');if(!field.value)return;
 try{await navigator.clipboard.writeText(field.value);document.getElementById('shareStatus').textContent='Ссылка скопирована. Отправьте её получателю.';}catch{field.focus();field.select();document.getElementById('shareStatus').textContent='Ссылка выделена — скопируйте её вручную.';}
}
function showLongShareLink(){if(!shareLongUrl)return;document.getElementById('shareResult').value=shareLongUrl;document.getElementById('copyShortLink').disabled=false;document.getElementById('shareStatus').textContent='Обычная ссылка на тот же снимок проекта. Нажмите «Копировать ссылку».';}
