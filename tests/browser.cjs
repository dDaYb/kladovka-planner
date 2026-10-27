require('node:fs').mkdirSync('test-results',{recursive:true});
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||undefined,headless:true,args:['--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1600,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.PLANNER_URL||'http://127.0.0.1:8765');await page.waitForFunction(()=>document.querySelector('#glStatus').textContent.startsWith('WebGL ·'));
const initial=await page.evaluate(()=>({count:items.length,height:ceilingHeight,total:items.reduce((s,i)=>s+i.price,0),gap:largestGap(900),analysis:analyze(),rects:items.map(getItemRect)}));assert.equal(initial.count,4);assert.equal(initial.height,3358);assert.equal(initial.total,26018);assert.deepEqual(initial.gap,[520,1148]);assert.equal(initial.analysis.warnings.length,0);assert.ok(Math.abs(initial.analysis.freeArea-2.894406)<.000001);
await page.screenshot({path:'test-results/planner-desktop.png'});
await page.keyboard.press('Delete');assert.equal(await page.evaluate(()=>items.length),3);
await page.reload();assert.equal(await page.evaluate(()=>items.length),3);
await page.evaluate(()=>{addItem('ski_nordic','left',1400);});const input=page.locator('input[aria-label="h"]');await input.focus();await page.keyboard.press('Delete');assert.equal(await page.evaluate(()=>items.length),4);await input.fill('2100');await input.press('Tab');
await page.evaluate(()=>{addItem('se_1200_500','left',40)});assert.ok((await page.evaluate(()=>analyze().warnings)).some(s=>s.includes('Пересечение')));
await page.evaluate(()=>{addItem('bike_floor','right_bot',0)});assert.ok((await page.evaluate(()=>analyze().warnings)).some(s=>s.includes('контур')));
const snap=await page.evaluate(()=>snapshot());await page.evaluate(s=>loadSnapshot(s),snap);assert.equal(await page.evaluate(()=>items.length),6);
let rejected=await page.evaluate(()=>{try{loadSnapshot({version:1,ceilingHeight:3358,items:[{modelId:'nope'}]});return false;}catch{return true;}});assert.equal(rejected,true);
await page.evaluate(()=>applyPreset('se_bike'));await page.reload();assert.equal(await page.evaluate(()=>items.length),4);
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/planner-mobile.png',fullPage:true});const size=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,w:innerWidth}));assert.ok(size.sw<=size.w+1,JSON.stringify(size));assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,initial,mobile:size,errors},null,2));await browser.close();})();

