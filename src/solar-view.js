import * as THREE from 'three';

export function createSolarView() {
  const group = new THREE.Group();
  group.visible = false;
  group.name = 'SOLAR_VIEW';
  const sun = new THREE.Mesh(new THREE.SphereGeometry(1.45, 32, 24), new THREE.MeshBasicMaterial({color:0xffc45d}));
  const glow = new THREE.Mesh(new THREE.SphereGeometry(2.3, 24, 16), new THREE.MeshBasicMaterial({color:0xff9f32,transparent:true,opacity:.12,blending:THREE.AdditiveBlending,depthWrite:false}));
  group.add(sun, glow);
  const defs=[['Mercury',3,.18,0x9b8b7e,.018],['Venus',4.6,.28,0xd7ad75,.012],['Earth',6.3,.31,0x3e7bc1,.009],['Mars',8.2,.24,0xb75439,.007],['Jupiter',13,.95,0xc39b72,.004],['Saturn',17,.82,0xd2b37d,.003],['Uranus',21,.48,0x7ac4cf,.0022],['Neptune',25,.46,0x3d66b5,.0018]];
  const planets=[];
  for(const [name,d,r,c,s] of defs){
    const orbit=new THREE.Group();
    const linePts=[]; for(let i=0;i<=128;i++){const a=i/128*Math.PI*2; linePts.push(new THREE.Vector3(Math.cos(a)*d,0,Math.sin(a)*d));}
    orbit.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(linePts),new THREE.LineBasicMaterial({color:0x7688ad,transparent:true,opacity:.14,depthWrite:false})));
    const anchor=new THREE.Group(); anchor.position.x=d;
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,24,16),new THREE.MeshStandardMaterial({color:c,roughness:.78,metalness:.02}));
    anchor.add(mesh); orbit.add(anchor); group.add(orbit); planets.push({orbit,mesh,s});
    if(name==='Saturn'){
      const ring=new THREE.Mesh(new THREE.RingGeometry(1.05,1.55,64),new THREE.MeshBasicMaterial({color:0xbfa47c,transparent:true,opacity:.52,side:THREE.DoubleSide,depthWrite:false})); ring.rotation.x=Math.PI/2; anchor.add(ring);
    }
  }
  const asteroid=new THREE.Group();
  const pts=[]; for(let i=0;i<500;i++){const a=Math.random()*Math.PI*2,r=9.5+Math.random()*1.4; pts.push(Math.cos(a)*r,(Math.random()-.5)*.55,Math.sin(a)*r);} 
  const bg=new THREE.BufferGeometry(); bg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
  asteroid.add(new THREE.Points(bg,new THREE.PointsMaterial({color:0xb6a38e,size:.11,transparent:true,opacity:.5,depthWrite:false})));
  group.add(asteroid);
  group.userData.advance=(t)=>{
    if(!group.visible)return;
    for(const p of planets){p.orbit.rotation.y+=p.s; p.mesh.rotation.y+=.005;}
    sun.rotation.y=t*.03; glow.scale.setScalar(1+Math.sin(t*1.3)*.035); asteroid.rotation.y=t*.001;
  };
  return group;
}
