import * as THREE from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
const canvas=document.getElementById('canvas3d'),status=document.getElementById('glStatus');
try {
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0xf2f5f8);renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(42,1,10,30000);camera.position.set(5200,5000,6200);
 const controls=new OrbitControls(camera,canvas);controls.target.set(850,1300,1400);controls.enableDamping=true;controls.minDistance=1300;controls.maxDistance=12000;controls.maxPolarAngle=Math.PI*.49;controls.update();
 scene.add(new THREE.HemisphereLight(0xffffff,0x748095,2.5));const sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(4000,7000,3000);scene.add(sun);
 let contents=new THREE.Group();scene.add(contents);const selectable=[];
 const box=(w,h,d,x,y,z,color,opacity=1)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,transparent:opacity<1,opacity,roughness:.75,depthWrite:opacity===1}));m.position.set(x,y,z);contents.add(m);return m;};
 function clear(){contents.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.dispose();}}});scene.remove(contents);contents=new THREE.Group();scene.add(contents);selectable.length=0;}
 function label(text,x,y,z){const c=document.createElement('canvas');c.width=512;c.height=100;const g=c.getContext('2d');g.fillStyle='rgba(255,255,255,.94)';g.fillRect(0,0,512,100);g.fillStyle='#19334d';g.font='bold 32px sans-serif';g.textAlign='center';g.fillText(text,256,62);const tex=new THREE.CanvasTexture(c),sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false}));sp.position.set(x,y,z);sp.scale.set(640,125,1);contents.add(sp);}
 function beam(a,b,color,r=16){const vec=new THREE.Vector3().subVectors(b,a),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,vec.length(),8),new THREE.MeshStandardMaterial({color}));m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vec.normalize());contents.add(m);}
 function bike(item,r){
  const g=new THREE.Group();g.name='detailed-bicycle';contents.add(g);
  const metal=0x94a3b8,dark=0x17212b,paint=0xe87919;
  const v=(x,y,z=0)=>new THREE.Vector3(x,y,z);
  function rod(a,b,color=paint,radius=14){const delta=b.clone().sub(a),mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,delta.length(),10),new THREE.MeshStandardMaterial({color,metalness:.5,roughness:.35}));mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(v(0,1),delta.normalize());g.add(mesh);}
  function block(w,h,d,x,y,z,color){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.5}));m.position.set(x,y,z);g.add(m);}
  function ring(radius,tube,x,y,z,color){const m=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,10,64),new THREE.MeshStandardMaterial({color,metalness:color===metal?.7:0,roughness:.6}));m.position.set(x,y,z);g.add(m);}
  const rear=v(-535,335),front=v(535,335),crank=v(-90,310),seat=v(-220,780),head=v(380,790),fork=v(415,650);
  for(const hub of [rear,front]){ring(310,25,hub.x,hub.y,0,dark);ring(290,7,hub.x,hub.y,0,metal);rod(hub.clone().add(v(0,0,-45)),hub.clone().add(v(0,0,45)),metal,17);for(let n=0;n<24;n++){const angle=n*Math.PI/12;rod(hub.clone().add(v(0,0,n%2?22:-22)),hub.clone().add(v(Math.cos(angle)*289,Math.sin(angle)*289,0)),metal,2);}}
  for(const [a,b] of [[crank,seat],[seat,head],[head,crank],[head,fork]])rod(a,b);
  for(const z of [-38,38]){rod(rear.clone().add(v(0,0,z)),seat,paint,10);rod(rear.clone().add(v(0,0,z)),crank,paint,10);rod(fork.clone().add(v(0,0,z)),front.clone().add(v(0,0,z)),metal,15);}
  rod(seat,v(-235,890),metal,12);block(235,40,140,-250,905,0,dark);
  rod(head,v(395,970),metal,13);rod(v(395,970),v(470,995),dark,13);
  const bar=item.bikeMode==='floor_turn'?420:620;rod(v(470,995,-bar/2+20),v(470,995,bar/2-20),metal,12);
  for(const sign of [-1,1]){rod(v(470,995,sign*(bar/2-100)),v(470,995,sign*(bar/2-12)),dark,19);rod(v(470,990,sign*(bar/2-100)),v(420,960,sign*(bar/2-80)),dark,6);}
  ring(85,8,crank.x,crank.y,52,dark);ring(45,6,rear.x,rear.y,52,metal);
  rod(v(crank.x,crank.y+80,52),v(rear.x,rear.y+42,52),dark,4);rod(v(crank.x,crank.y-80,52),v(rear.x,rear.y-42,52),dark,4);
  for(const sign of [-1,1]){rod(v(crank.x,crank.y,sign*60),v(crank.x+sign*100,crank.y-sign*90,sign*60),metal,10);block(90,22,100,crank.x+sign*100,crank.y-sign*90,sign*100,dark);}
  if(item.bikeMode==='vert')g.rotation.z=Math.PI/2;
  const side=(item.wall!=='top')!==((item.rotation||0)%180===90);
  g.rotation.y=item.bikeMode==='vert'?(side?0:Math.PI/2):(side?Math.PI/2:0);
  g.updateMatrixWorld(true);let bounds=new THREE.Box3().setFromObject(g),size=bounds.getSize(new THREE.Vector3());
  const scale=Math.min(r.width/size.x,item.h/size.y,r.height/size.z)*.97;g.scale.setScalar(scale);g.updateMatrixWorld(true);bounds=new THREE.Box3().setFromObject(g);
  const center=bounds.getCenter(new THREE.Vector3());g.position.set(r.x+r.width/2-center.x,(item.z||0)-bounds.min.y,r.y+r.height/2-center.z);
 }
 function ladder(item,r){
  const side=(item.wall!=='top')!==((item.rotation||0)%180===90),base=item.z||0;
  const point=(u,y,d)=>new THREE.Vector3(r.x+r.width/2+(side?d:u),base+y,r.y+r.height/2+(side?u:d));
  const width=side?r.height:r.width,depth=side?r.width:r.height;
  for(const sign of [-1,1]){beam(point(sign*width*.43,20,-depth*.2),point(sign*width*.35,item.h-30,depth*.2),0xa8b7c6,18);beam(point(sign*width*.43,20,depth*.3),point(sign*width*.35,item.h*.85,depth*.2),0x71869a,12);}
  const n=Math.max(2,Math.min(12,Math.floor(item.h/270)));for(let k=1;k<n;k++){const y=k*item.h/(n+1);beam(point(-width*.36,y,0),point(width*.36,y,0),0x334155,24);}
 }
 window.renderWebGL=()=>{const state=window.plannerState?.();if(!state)return;clear();const {items,getItemRect,ceilingHeight,wallOpacity,selectedId}=state;
  const shape=new THREE.Shape();[[0,0],[1468,0],[1468,1394],[1779,1394],[1779,2860],[0,2860]].forEach(([x,z],k)=>k?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();const floor=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshStandardMaterial({color:0xdbe4e9,side:THREE.DoubleSide}));floor.rotation.x=-Math.PI/2;contents.add(floor);
  const H=ceilingHeight;for(const [w,dep,x,z]of[[1468,30,734,-15],[30,2860,-15,1430],[30,1394,1483,697],[311,30,1623.5,1409],[30,1466,1794,2127],[510,30,255,2875],[192,30,1683,2875]])box(w,H,dep,x,H/2,z,0x9aaab8,wallOpacity);
  const grid=new THREE.GridHelper(4000,20,0xb2bdc9,0xd1d9e2);grid.position.set(850,-2,1430);contents.add(grid);
  for(const item of items){const r=getItemRect(item),base=item.z||0,color=item.uid===selectedId?0xdc2626:item.color,cx=r.x+r.width/2,cz=r.y+r.height/2;
   const envelope=box(r.width,item.h,r.height,cx,base+item.h/2,cz,color,(item.isBike||item.isSki)?0.12:0.035);envelope.userData.uid=item.uid;selectable.push(envelope);
   const edges=new THREE.LineSegments(new THREE.EdgesGeometry(envelope.geometry),new THREE.LineBasicMaterial({color,transparent:true,opacity:.65}));edges.position.copy(envelope.position);contents.add(edges);
   if(item.isBike)bike(item,r);else if(item.isLadder)ladder(item,r);else if(item.isSki){const side=(item.wall!=='top')!==((item.rotation||0)%180===90);for(const k of [-1,1])box(side?30:55,item.h,side?55:30,cx+(side?0:k*45),base+item.h/2,cz+(side?k*45:0),color);}
   else {for(const xx of [r.x+15,r.x+r.width-15])for(const zz of [r.y+15,r.y+r.height-15])box(30,item.h,30,xx,base+item.h/2,zz,0x657991);const n=Math.max(2,item.shelves||5);for(let i=0;i<n;i++){const y=base+Math.min(150,item.h*.1)+i*(item.h-Math.min(300,item.h*.2))/(n-1);box(r.width,25,r.height,cx,y,cz,0xc4d1df);}}
   label(`#${item.uid} ${item.w}×${item.d} · H${item.h}`,cx,base+item.h+90,cz);
  }for(const i of items.filter(i=>i.isBike&&i.clearanceVisible!==false)){const r=window.getBikeClearance(i),color=window.bikeClearanceIssues(i).length?0xdc2626:0x0d9488;const m=box(r.width,r.height3d,r.height,r.x+r.width/2,r.height3d/2,r.y+r.height/2,color,.035);const edge=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry),new THREE.LineBasicMaterial({color,transparent:true,opacity:.45}));edge.position.copy(m.position);contents.add(edge);}label('1468 мм',734,30,-160);label('1779 мм · ВХОД',889,30,3020);label(`Потолок ${H} · труба 3221 (трасса неизвестна)`,850,H+170,1400);status.textContent='WebGL · подробная модель велосипеда; габаритный контур — по вашим размерам';resize();
 };
 function resize(){const rect=canvas.parentElement.getBoundingClientRect();if(rect.width<1||rect.height<1)return;renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();}
 new ResizeObserver(resize).observe(canvas.parentElement);window.addEventListener('resize',resize);
 const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();let down=null;
 function hitAt(e){const r=canvas.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera);return raycaster.intersectObjects(selectable)[0];}
 canvas.addEventListener('contextmenu',e=>{e.preventDefault();const hit=hitAt(e);if(hit)window.openObjectMenu(hit.object.userData.uid,e.clientX,e.clientY);});
 canvas.addEventListener('pointermove',e=>{if(down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)window.closeObjectMenu?.();});
 canvas.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);canvas.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=canvas.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera);const hit=raycaster.intersectObjects(selectable)[0];if(hit)window.selectPlannerItem(hit.object.userData.uid);});
 function frame(){requestAnimationFrame(frame);controls.update();renderer.render(scene,camera);}frame();window.renderWebGL();
} catch(e){status.textContent='WebGL недоступен: '+e.message+'. План 2D продолжает работать.';console.error(e);}
