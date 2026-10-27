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
 function bike(item,r){const x=r.x+r.width/2,z=r.y+r.height/2,base=item.z||0;const group=new THREE.Group();contents.add(group);const vertical=item.bikeMode==='vert',h=item.h;const alongSide=item.wall!=='top';
  const wheelR=vertical?Math.min(330,h/5):Math.min(330,h*.31),span=vertical?h-2*wheelR:item.w-2*wheelR;
  const pts=vertical?[new THREE.Vector3(x,base+wheelR,z),new THREE.Vector3(x,base+wheelR+span,z)]:[new THREE.Vector3(x,base+wheelR,z-span/2),new THREE.Vector3(x,base+wheelR,z+span/2)];
  if(!vertical&&!alongSide){pts[0].set(x-span/2,base+wheelR,z);pts[1].set(x+span/2,base+wheelR,z);}
  for(const pos of pts){const wheel=new THREE.Mesh(new THREE.TorusGeometry(wheelR,25,10,40),new THREE.MeshStandardMaterial({color:0x253343}));wheel.position.copy(pos);if(alongSide)wheel.rotation.y=Math.PI/2;contents.add(wheel);}
  const mid=pts[0].clone().add(pts[1]).multiplyScalar(.5),off=alongSide?new THREE.Vector3(0,0,Math.min(280,item.d*.25)):new THREE.Vector3(Math.min(280,item.d*.25),0,0);if(!vertical)off.set(0,Math.min(300,h*.3),0);const c=mid.clone().add(off),v=mid.clone().add(off.clone().multiplyScalar(-.5));
  [[pts[0],c],[c,pts[1]],[pts[1],v],[v,pts[0]],[v,c]].forEach(([a,b])=>beam(a,b,0xd97706));
  const handle=pts[1].clone().add(new THREE.Vector3(0,-80,0));beam(handle.clone().add(new THREE.Vector3(-Math.min(item.w,620)/2,0,0)),handle.clone().add(new THREE.Vector3(Math.min(item.w,620)/2,0,0)),0x334155,14);
 }
 window.renderWebGL=()=>{const state=window.plannerState?.();if(!state)return;clear();const {items,getItemRect,ceilingHeight,wallOpacity,selectedId}=state;
  const shape=new THREE.Shape();[[0,0],[1468,0],[1468,1394],[1779,1394],[1779,2860],[0,2860]].forEach(([x,z],k)=>k?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();const floor=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshStandardMaterial({color:0xdbe4e9,side:THREE.DoubleSide}));floor.rotation.x=-Math.PI/2;contents.add(floor);
  const H=ceilingHeight;for(const [w,dep,x,z]of[[1468,30,734,-15],[30,2860,-15,1430],[30,1394,1483,697],[311,30,1623.5,1409],[30,1466,1794,2127],[510,30,255,2875],[192,30,1683,2875]])box(w,H,dep,x,H/2,z,0x9aaab8,wallOpacity);
  const grid=new THREE.GridHelper(4000,20,0xb2bdc9,0xd1d9e2);grid.position.set(850,-2,1430);contents.add(grid);
  for(const item of items){const r=getItemRect(item),base=item.z||0,color=item.uid===selectedId?0xdc2626:item.color,cx=r.x+r.width/2,cz=r.y+r.height/2;
   const envelope=box(r.width,item.h,r.height,cx,base+item.h/2,cz,color,(item.isBike||item.isSki)?0.12:0.035);envelope.userData.uid=item.uid;selectable.push(envelope);
   const edges=new THREE.LineSegments(new THREE.EdgesGeometry(envelope.geometry),new THREE.LineBasicMaterial({color,transparent:true,opacity:.65}));edges.position.copy(envelope.position);contents.add(edges);
   if(item.isBike)bike(item,r);else if(item.isSki){const side=item.wall!=='top';for(const k of [-1,1])box(side?30:55,item.h,side?55:30,cx+(side?0:k*45),base+item.h/2,cz+(side?k*45:0),color);}
   else {for(const xx of [r.x+15,r.x+r.width-15])for(const zz of [r.y+15,r.y+r.height-15])box(30,item.h,30,xx,base+item.h/2,zz,0x657991);const n=Math.max(2,item.shelves||5);for(let i=0;i<n;i++){const y=base+Math.min(150,item.h*.1)+i*(item.h-Math.min(300,item.h*.2))/(n-1);box(r.width,25,r.height,cx,y,cz,0xc4d1df);}}
   label(`#${item.uid} ${item.w}×${item.d} · H${item.h}`,cx,base+item.h+90,cz);
  }label('1468 мм',734,30,-160);label('1779 мм · ВХОД',889,30,3020);label(`Потолок ${H} · труба 3221 (трасса неизвестна)`,850,H+170,1400);status.textContent='WebGL · габариты из 2D; форма велосипеда условная';resize();
 };
 function resize(){const rect=canvas.parentElement.getBoundingClientRect();if(rect.width<1||rect.height<1)return;renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();}
 new ResizeObserver(resize).observe(canvas.parentElement);window.addEventListener('resize',resize);
 const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();let down=null;
 canvas.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);canvas.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=canvas.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera);const hit=raycaster.intersectObjects(selectable)[0];if(hit)window.selectPlannerItem(hit.object.userData.uid);});
 function frame(){requestAnimationFrame(frame);controls.update();renderer.render(scene,camera);}frame();window.renderWebGL();
} catch(e){status.textContent='WebGL недоступен: '+e.message+'. План 2D продолжает работать.';console.error(e);}
