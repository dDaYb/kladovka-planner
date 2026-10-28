const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.PLANNER_URL||'http://127.0.0.1:8765');
 await page.waitForFunction(()=>window.renderWebGL&&items.length);
 fs.mkdirSync('test-results',{recursive:true});
 for(const mode of ['floor','vert']){
  await page.evaluate(mode=>{items=[];addItem(mode==='vert'?'bike_vert':'bike_floor','top',20);const i=items[0];i.clearanceVisible=false;if(mode==='floor'){i.free=true;i.x=20;i.y=600;}selectedId=i.uid;refreshAll();},mode);
  const original=await page.evaluate(()=>getItemRect(items[0])),images=[],headings=[];
  for(let turn=0;turn<4;turn++){
   await page.waitForTimeout(150);
   images.push(await page.locator('#canvas3d').screenshot({path:`test-results/rotation-${mode}-${turn*90}.png`}));
   headings.push(await page.locator('.bike-heading').getAttribute('transform'));
   if(mode==='floor'){const r=await page.evaluate(()=>getItemRect(items[0]));assert.equal(r.x+r.width/2,original.x+original.width/2);assert.equal(r.y+r.height/2,original.y+original.height/2);}
   await page.evaluate(()=>openObjectMenu(items[0].uid,600,300));
   await page.getByRole('menuitem',{name:'↻ Повернуть на 90°',exact:true}).click();
  }
  assert.equal(new Set(headings).size,4);
  assert.ok(!images[0].equals(images[2]),`${mode}: 0 and 180 must look different`);
  assert.ok(!images[1].equals(images[3]),`${mode}: 90 and 270 must look different`);
  assert.deepEqual(await page.evaluate(()=>getItemRect(items[0])),original);
  await page.evaluate(()=>{rotateItem(items[0].uid);rotateItem(items[0].uid);rotateItem(items[0].uid);});
  await page.reload();await page.waitForFunction(()=>window.renderWebGL&&items.length);
  assert.equal(await page.evaluate(()=>items[0].rotation),270);
 }
 assert.deepEqual(errors,[]);console.log('PASS: four visible orientations in 2D/3D, fixed free-bike center, full circle and persisted 270 degrees');await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
