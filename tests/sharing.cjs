const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader']});
 const context=await browser.newContext({permissions:['clipboard-read','clipboard-write'],viewport:{width:1400,height:1000}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.PLANNER_URL||'http://127.0.0.1:8765/';
 await page.goto(base);await page.waitForFunction(()=>items.length===4&&document.querySelector('[onclick="sharePlan()"]').textContent==='Короткая ссылка');
 let requests=0;
 if(!process.env.LIVE_SHORT_LINK)await page.route('https://is.gd/create.php?*',async route=>{requests++;const long=new URL(route.request().url()).searchParams.get('url');assert.ok(long.startsWith('https://ddayb.github.io/kladovka-planner/#planz='));await route.fulfill({contentType:'application/json',body:JSON.stringify({shorturl:'https://is.gd/test01'})});});
 const original=await page.evaluate(()=>snapshot());
 await page.getByRole('button',{name:'Короткая ссылка',exact:true}).click();
 await page.waitForFunction(()=>!shareBusy);
 const short=await page.locator('#shareResult').inputValue();assert.match(short,/^https:\/\/is\.gd\/[A-Za-z0-9_]+$/);
 await page.getByRole('button',{name:'Копировать ссылку',exact:true}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),short);
 await page.screenshot({path:'test-results/short-link.png'});
 const long=await page.evaluate(()=>shareLongUrl);
 const receiver=await context.newPage();
 await receiver.goto(process.env.LIVE_SHORT_LINK?short:base.split('#')[0]+new URL(long).hash);
 await receiver.waitForFunction(()=>typeof items!=='undefined'&&items.length===4);
 assert.deepEqual(await receiver.evaluate(()=>snapshot()),original);
 await page.getByRole('button',{name:'Закрыть окно ссылки'}).click();await page.getByRole('button',{name:'Короткая ссылка',exact:true}).click();await page.waitForFunction(()=>!shareBusy);
 assert.equal(await page.locator('#shareResult').inputValue(),short);if(!process.env.LIVE_SHORT_LINK)assert.equal(requests,1);
 if(!process.env.LIVE_SHORT_LINK){
  await page.getByRole('button',{name:'Закрыть окно ссылки'}).click();await page.evaluate(()=>rotateItem(items[0].uid));
  await page.unroute('https://is.gd/create.php?*');await page.route('https://is.gd/create.php?*',route=>route.abort());
  await page.getByRole('button',{name:'Короткая ссылка',exact:true}).click();await page.waitForFunction(()=>!shareBusy);
  assert.match(await page.locator('#shareStatus').innerText(),/недоступен/);assert.match(await page.locator('#shareResult').inputValue(),/#planz=/);
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);
 }
 assert.deepEqual(errors,[]);console.log('PASS: short link, clipboard, recipient snapshot, cached reuse, fallback; '+short);await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
