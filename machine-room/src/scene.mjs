import * as T from './three.js';

// Each machine is assembled in bay-local coordinates. Batch repeated castings by
// geometry and finish so that the ribs and clerestories cost few draw calls.
export function mountScene(host,pick){
 const r=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'}),s=new T.Scene(),cam=new T.PerspectiveCamera(49,1,.15,180);
 r.setPixelRatio(Math.min(devicePixelRatio,1.4));r.outputColorSpace=T.SRGBColorSpace;r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;r.shadowMap.autoUpdate=false;r.shadowMap.needsUpdate=true;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.05;host.append(r.domElement);
 s.background=new T.Color(0x253039);s.fog=new T.FogExp2(0x253039,.014);
 const positions={rcc:[-7,8],actions:[-7,-4],review:[6,3],room:[-7,-17],memory:[6,-9],transport:[6,-23]};
 const cube=new T.BoxGeometry(),drum=new T.CylinderGeometry(.5,.5,1,32),ring=new T.TorusGeometry(1,.095,10,48);
 const batches=new Map(), palette={cast:0x505b65,iron:0x333f40,rust:0xb6471c,steel:0x9aa8a0,black:0x202a2a,light:0xffeec6,glass:0xff7a26};
 const finishes=Object.fromEntries(Object.entries(palette).map(([k,c])=>{
  const m=new T.MeshStandardMaterial({color:c,roughness:.78,metalness:k==='steel'?.48:.1,emissive:['light','glass'].includes(k)?c:0,emissiveIntensity:1.3});
  m.onBeforeCompile=sh=>{sh.vertexShader='varying vec3 grainPos;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\ngrainPos=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;');sh.fragmentShader='varying vec3 grainPos;\n'+sh.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat speck=fract(sin(dot(floor(grainPos*35.),vec3(12.1,71.7,23.3)))*4375.4);diffuseColor.rgb*=0.9+0.13*speck+0.035*sin(grainPos.y*33.);')};return [k,m]}));
 let origin=[0,0],id=null;
 function part(g,finish,x,y,z,w,h,d,rx=0,ry=0,rz=0){
  const key=g.uuid+finish;if(!batches.has(key))batches.set(key,{g,m:finishes[finish],items:[]});
  const matrix=new T.Matrix4().compose(new T.Vector3(x+origin[0],y,z+origin[1]),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(w,h,d));batches.get(key).items.push({matrix,id});
 }
 const box=(...a)=>part(cube,...a),cyl=(...a)=>part(drum,...a),halo=(...a)=>part(ring,...a);
 box('cast',0,-.6,-8,36,1,90);box('cast',0,7,-34,34,14,1);box('black',0,4,-33.3,8,8,.4);box('glass',0,4,-33, .18,8,.12);
 for(const side of [-1,1]){
  box('cast',side*16,4,-8,1,8,70);box('light',side*15.9,8.8,-8,.5,1.1,70);
  for(let z=-32;z<30;z+=4){box('cast',side*15,7,z,1.4,14,.8);box('cast',side*12.8,12.2,z,7,.95,1,0,0,side*.32);box('iron',side*13,13.5,z,6,.32,3.85)}
  box('iron',side*2.25,.04,-6,.25,.12,57);box('steel',side*2.25,.13,-6,.1,.05,57);
 }
 for(let z=-31;z<28;z+=4){box('iron',0,13.7,z,32,.5,.3);box('light',0,13.4,z,7,.07,.13);box('iron',0,.005,z,4.1,.03,.09)}
 // Shafts of sunlight on the central service way.
 for(let z=-29;z<24;z+=4.3)box('steel',1,.018,z,11,.02,.18,0,-.39);
 for(const [key,loc] of Object.entries(positions)){id=key;origin=loc;
  box('black',0,.08,0,7,.18,6.2);box('cast',0,.34,0,6.7,.52,6);box('rust',0,.62,2.91,6.7,.12,.12);
  if(id==='rcc'){ // Stacked casting furnace with a refractory mouth.
   for(let i=0;i<10;i++){const w=5.2-i*.22;cyl(i===3?'glass':i%3?'iron':'rust',0,.94+i*.53,0,w,.49,w)}
   for(let i=0;i<5;i++)box('black',-2+i,1.9,2.03,.19,2.4,.48);
   cyl('black',0,6,0,1.5,1.2,1.5);cyl('rust',0,6.54,0,1.8,.18,1.8);
  }else if(id==='review'){ // Nested transverse lock rings on twin saddles.
   for(let i=0;i<5;i++)halo(i===0?'rust':i===1?'light':'iron',0,3.7,1.2-i*.58,2.9,2.9,2);
   for(const x of [-2,2])box('cast',x,1.45,0,1.3,1.8,3.8);
  }else if(id==='memory'){for(let i=0;i<15;i++){const a=i*.11;box(i%4?'iron':'steel',0,1+i*.31,0,3.8,.2,3.8,0,a)}cyl('glass',0,3,0,.72,5,.72)
  }else if(id==='actions'){for(let i=0;i<4;i++){box('iron',i*1.25-1.9,2.4,0,.86,3.6,3);cyl('rust',i*1.25-1.9,4.45,0,.9,1,.9)}box('steel',0,3.1,1.7,5.5,.5,.55)
  }else if(id==='room'){for(let i=0;i<8;i++){box('cast',i*.67-2.35,3.1,i*.17,.43,5,3.8);box('rust',i*.67-2.35,3.7,2+i*.17,.3,.42,.1)}
  }else{for(let i=0;i<3;i++){box('iron',0,.99+i*1.18,0,5.3,1.1,2.8);for(let j=0;j<11;j++)box('rust',j*.46-2.3,.99+i*1.18,1.42,.1,.97,.08)}}
 }
 const meshes=[];for(const {g,m,items} of batches.values()){const mesh=new T.InstancedMesh(g,m,items.length);items.forEach((v,i)=>mesh.setMatrixAt(i,v.matrix));mesh.castShadow=m!==finishes.light;mesh.receiveShadow=true;mesh.userData.ids=items.map(v=>v.id);s.add(mesh);meshes.push(mesh)}
 s.add(new T.HemisphereLight(0xb9cad9,0x151e26,.82));const sun=new T.DirectionalLight(0xd8e9ff,2.4);sun.position.set(-22,21,1);sun.target.position.set(0,0,-6);s.add(sun,sun.target);sun.castShadow=true;Object.assign(sun.shadow.camera,{left:-32,right:32,top:30,bottom:-30,near:.1,far:85});sun.shadow.camera.updateProjectionMatrix();sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0003;
 // Contact pools ground the masses without continuously rendering shadow maps.
 const tex=document.createElement('canvas');tex.width=tex.height=64;const ctx=tex.getContext('2d'),grad=ctx.createRadialGradient(32,32,5,32,32,32);grad.addColorStop(0,'rgba(14,23,22,.85)');grad.addColorStop(1,'rgba(14,23,22,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,64,64);
 const sm=new T.MeshBasicMaterial({map:new T.CanvasTexture(tex),transparent:true,depthWrite:false});
 for(const [x,z] of Object.values(positions)){const plane=new T.Mesh(new T.PlaneGeometry(12,10),sm);plane.rotation.x=-Math.PI/2;plane.position.set(x,.025,z);s.add(plane)}
 // Enamel bay identifiers are painted in world space on the plinth fascia.
 for(const [i,[key,[x,z]]] of Object.entries(positions).entries()){
  const label=document.createElement('canvas');label.width=768;label.height=128;const pen=label.getContext('2d');pen.fillStyle='#272e2e';pen.fillRect(0,0,768,128);pen.fillStyle='#ffb07c';pen.fillRect(0,0,18,128);pen.fillStyle='#fff4da';pen.font='bold 74px monospace';pen.fillText(String(i+1).padStart(2,'0')+' / '+key.toUpperCase(),40,91);
  const map=new T.CanvasTexture(label);map.colorSpace=T.SRGBColorSpace;const sign=new T.Mesh(new T.PlaneGeometry(5.7,.95),new T.MeshBasicMaterial({map}));sign.position.set(x,.73,z+3.04);s.add(sign)
 }
 const look=new T.Vector3(),v=(x,y,z)=>new T.Vector3(x,y,z);let active=null,raf=0;
 function view(key){
  const mobile=host.clientWidth<600;if(!key)return mobile?[v(2.2,3.8,17),v(5.9,4.7,3)]:[v(2.4,4.6,19),v(-.8,4.5,-2)];
  const [x,z]=positions[key];return [v(x+ (x<0?5:-5),5.2,z+(mobile?12:9)),v(x,3,z)]
 }
 function draw(){if(document.hidden)return;cam.lookAt(look);r.render(s,cam)}
 function focus(key,instant=false){active=key;cancelAnimationFrame(raf);const [to,at]=view(key);
 if(instant||matchMedia('(prefers-reduced-motion: reduce)').matches){cam.position.copy(to);look.copy(at);draw();return}
 const from=cam.position.clone(),was=look.clone(),start=performance.now();function frame(now){let t=Math.min(1,(now-start)/850);t=t*t*(3-2*t);cam.position.lerpVectors(from,to,t);look.lerpVectors(was,at,t);draw();if(t<1)raf=requestAnimationFrame(frame)}raf=requestAnimationFrame(frame)}
 function size(){const w=host.clientWidth,h=host.clientHeight;cam.aspect=w/h;cam.updateProjectionMatrix();r.setSize(w,h,false);if(!active)focus(null,true);else draw()}
 document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);if(!document.hidden)focus(active,true)});
 size();new ResizeObserver(size).observe(host);
 const ray=new T.Raycaster();r.domElement.onclick=e=>{const b=r.domElement.getBoundingClientRect();ray.setFromCamera(new T.Vector2(2*(e.clientX-b.left)/b.width-1,1-2*(e.clientY-b.top)/b.height),cam);const hit=ray.intersectObjects(meshes)[0],key=hit?.object.userData.ids[hit.instanceId];if(key)pick(key)};
 return {focus};
}
