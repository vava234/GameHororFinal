(function(){
"use strict";

if(typeof THREE==="undefined"){
  document.getElementById("loadErr").style.display="flex";
  return;
}

let actx=null;
let audioMuted=false;
let audioUnavailable=false;

function ensureAudio(){
  if(audioUnavailable){
    return false;
  }

  try{
    if(!actx){
      const AudioContextClass=
        window.AudioContext||
        window.webkitAudioContext;

      if(!AudioContextClass){
        audioUnavailable=true;
        return false;
      }

      actx=new AudioContextClass();
    }

    if(actx.state==="suspended"){
      actx.resume();
    }

    return true;
  }catch(error){
    audioUnavailable=true;
    return false;
  }
}

function toggleAudio(){
  audioMuted=!audioMuted;

  if(audioMuted){
    stopAmbient();
    stopGamelan();
  }else if(stage!=="intro"&&stage!=="ending"){
    startAmbient();
  }

  audioButton.setAttribute(
    "aria-pressed",
    String(audioMuted)
  );

  audioButton.setAttribute(
    "aria-label",
    audioMuted?
    "Nyalakan suara":
    "Matikan suara"
  );
}

let ambientNodes=null;

function startAmbient(){
  if(audioMuted||!ensureAudio()){
    return;
  }
  stopAmbient();

  const now=actx.currentTime;
  const master=actx.createGain();
  master.gain.value=0.12;
  master.connect(actx.destination);

  const o1=actx.createOscillator();
  const o2=actx.createOscillator();

  o1.type="sine";
  o1.frequency.value=55;

  o2.type="sine";
  o2.frequency.value=58;

  const lp=actx.createBiquadFilter();
  lp.type="lowpass";
  lp.frequency.value=300;

  o1.connect(lp);
  o2.connect(lp);
  lp.connect(master);

  o1.start(now);
  o2.start(now);

  const bufSize=actx.sampleRate*2;
  const buf=actx.createBuffer(1,bufSize,actx.sampleRate);
  const d=buf.getChannelData(0);

  for(let i=0;i<bufSize;i++){
    d[i]=(Math.random()*2-1)*0.5;
  }

  const noise=actx.createBufferSource();
  noise.buffer=buf;
  noise.loop=true;

  const noiseFilter=actx.createBiquadFilter();
  noiseFilter.type="bandpass";
  noiseFilter.frequency.value=500;
  noiseFilter.Q.value=0.6;

  const noiseGain=actx.createGain();
  noiseGain.gain.value=0.05;

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(master);

  noise.start(now);

  ambientNodes={
    o1,
    o2,
    noise,
    master
  };
}

function stopAmbient(){
  if(ambientNodes){
    try{
      ambientNodes.o1.stop();
      ambientNodes.o2.stop();
      ambientNodes.noise.stop();
    }catch(e){}

    ambientNodes=null;
  }
}

let gamelanTimer=null;

function startGamelan(){
  if(audioMuted||!ensureAudio()){
    return;
  }
  stopGamelan();

  const notes=[
    261.6,
    293.7,
    329.6,
    392,
    440,
    523.3
  ];

  function pluck(){
    const now=actx.currentTime;
    const f=
      notes[Math.floor(Math.random()*notes.length)]*
      (Math.random()<0.3?0.5:1);

    const o=actx.createOscillator();
    o.type="triangle";
    o.frequency.value=f;

    const g=actx.createGain();
    g.gain.value=0;
    g.gain.linearRampToValueAtTime(0.08,now+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001,now+1.4);

    o.connect(g);
    g.connect(actx.destination);

    o.start(now);
    o.stop(now+1.5);

    gamelanTimer=setTimeout(
      pluck,
      260+Math.random()*420
    );
  }

  pluck();
}

function stopGamelan(){
  if(gamelanTimer){
    clearTimeout(gamelanTimer);
    gamelanTimer=null;
  }
}

function stinger(){
  if(audioMuted||!ensureAudio()){
    return;
  }

  const now=actx.currentTime;
  const bufSize=actx.sampleRate*0.6;
  const buf=actx.createBuffer(1,bufSize,actx.sampleRate);
  const d=buf.getChannelData(0);

  for(let i=0;i<bufSize;i++){
    d[i]=Math.random()*2-1;
  }

  const noise=actx.createBufferSource();
  noise.buffer=buf;

  const ng=actx.createGain();
  ng.gain.setValueAtTime(0.6,now);
  ng.gain.exponentialRampToValueAtTime(
    0.001,
    now+0.55
  );

  noise.connect(ng);
  ng.connect(actx.destination);
  noise.start(now);

  const o=actx.createOscillator();
  o.type="sawtooth";
  o.frequency.setValueAtTime(1400,now);
  o.frequency.exponentialRampToValueAtTime(
    90,
    now+0.9
  );

  const og=actx.createGain();
  og.gain.setValueAtTime(0.35,now);
  og.gain.exponentialRampToValueAtTime(
    0.001,
    now+0.9
  );

  o.connect(og);
  og.connect(actx.destination);

  o.start(now);
  o.stop(now+0.9);
}

function thud(){
  if(audioMuted||!ensureAudio()){
    return;
  }

  const now=actx.currentTime;

  const o=actx.createOscillator();
  o.type="sine";
  o.frequency.setValueAtTime(120,now);
  o.frequency.exponentialRampToValueAtTime(
    30,
    now+0.3
  );

  const g=actx.createGain();
  g.gain.setValueAtTime(0.5,now);
  g.gain.exponentialRampToValueAtTime(
    0.001,
    now+0.35
  );

  o.connect(g);
  g.connect(actx.destination);

  o.start(now);
  o.stop(now+0.35);
}

function warningRumble(){
  if(audioMuted||!ensureAudio()){
    return;
  }

  const now=actx.currentTime;
  const oscillator=actx.createOscillator();
  const gain=actx.createGain();

  oscillator.type="sawtooth";
  oscillator.frequency.setValueAtTime(48,now);
  oscillator.frequency.exponentialRampToValueAtTime(19,now+1.6);

  gain.gain.setValueAtTime(0.001,now);
  gain.gain.exponentialRampToValueAtTime(0.32,now+0.08);
  gain.gain.exponentialRampToValueAtTime(0.001,now+1.7);

  oscillator.connect(gain);
  gain.connect(actx.destination);
  oscillator.start(now);
  oscillator.stop(now+1.75);
}

function whisper(){
  if(audioMuted||!ensureAudio()){
    return;
  }

  const now=actx.currentTime;
  const bufSize=actx.sampleRate*0.5;
  const buf=actx.createBuffer(1,bufSize,actx.sampleRate);
  const d=buf.getChannelData(0);

  for(let i=0;i<bufSize;i++){
    d[i]=Math.random()*2-1;
  }

  const src=actx.createBufferSource();
  src.buffer=buf;

  const bp=actx.createBiquadFilter();
  bp.type="bandpass";
  bp.frequency.value=1800;
  bp.Q.value=4;

  const g=actx.createGain();
  g.gain.setValueAtTime(0.18,now);
  g.gain.linearRampToValueAtTime(0,now+0.5);

  src.connect(bp);
  bp.connect(g);
  g.connect(actx.destination);

  src.start(now);
}

function footstep(){
  if(audioMuted||!ensureAudio()){
    return;
  }

  const now=actx.currentTime;
  const bufSize=actx.sampleRate*0.08;
  const buf=actx.createBuffer(1,bufSize,actx.sampleRate);
  const d=buf.getChannelData(0);

  for(let i=0;i<bufSize;i++){
    d[i]=(Math.random()*2-1)*(1-i/bufSize);
  }

  const src=actx.createBufferSource();
  src.buffer=buf;

  const lp=actx.createBiquadFilter();
  lp.type="lowpass";
  lp.frequency.value=700;

  const g=actx.createGain();
  g.gain.value=0.10;

  src.connect(lp);
  lp.connect(g);
  g.connect(actx.destination);

  src.start(now);
}

function creepyFaceDataURL(variant){
  const c=document.createElement("canvas");

  c.width=900;
  c.height=600;

  const ctx=c.getContext("2d");

  ctx.fillStyle="#000";
  ctx.fillRect(
    0,
    0,
    c.width,
    c.height
  );

  const grad=ctx.createRadialGradient(
    450,
    300,
    60,
    450,
    300,
    420
  );

  grad.addColorStop(
    0,
    variant==="nenek"?"#cfcabb":"#d8cfc4"
  );

  grad.addColorStop(
    1,
    "#050403"
  );

  ctx.fillStyle=grad;

  ctx.beginPath();

  ctx.ellipse(
    450,
    300,
    300,
    380,
    0,
    0,
    Math.PI*2
  );

  ctx.fill();

  ctx.strokeStyle="rgba(60,10,10,.5)";

  for(let i=0;i<40;i++){
    ctx.beginPath();

    const x1=300+Math.random()*300;
    const y1=150+Math.random()*300;

    ctx.moveTo(x1,y1);

    ctx.lineTo(
      x1+(Math.random()*60-30),
      y1+(Math.random()*60-30)
    );

    ctx.lineWidth=Math.random()*1.5;
    ctx.stroke();
  }

  [[-1],[1]].forEach(function(s){
    const ex=450+s[0]*110;
    const ey=270;

    const g2=ctx.createRadialGradient(
      ex,
      ey,
      4,
      ex,
      ey,
      70
    );

    g2.addColorStop(0,"#000");
    g2.addColorStop(
      1,
      "rgba(0,0,0,0)"
    );

    ctx.fillStyle=g2;

    ctx.beginPath();

    ctx.ellipse(
      ex,
      ey,
      70,
      55,
      0,
      0,
      Math.PI*2
    );

    ctx.fill();

    ctx.fillStyle="#8a0000";

    ctx.beginPath();

    ctx.ellipse(
      ex,
      ey+6,
      12,
      14,
      0,
      0,
      Math.PI*2
    );

    ctx.fill();

    ctx.fillStyle="#fff";

    ctx.beginPath();

    ctx.arc(
      ex-3,
      ey+2,
      2.5,
      0,
      Math.PI*2
    );

    ctx.fill();
  });

  ctx.fillStyle="#1a0000";

  ctx.beginPath();

  ctx.ellipse(
    450,
    430,
    90,
    55,
    0,
    0,
    Math.PI*2
  );

  ctx.fill();

  ctx.fillStyle="#3a0505";

  ctx.beginPath();

  ctx.ellipse(
    450,
    430,
    90,
    55,
    0,
    0,
    Math.PI
  );

  ctx.fill();

  ctx.fillStyle="#cfc6b8";

  for(let i=-3;i<=3;i++){
    ctx.fillRect(
      450+i*16-5,
      400,
      10,
      24
    );
  }

  if(variant==="nenek"){
    ctx.fillStyle="#050403";

    ctx.beginPath();

    ctx.moveTo(
      180,
      320
    );

    ctx.quadraticCurveTo(
      450,
      -40,
      720,
      320
    );

    ctx.quadraticCurveTo(
      650,
      120,
      450,
      90
    );

    ctx.quadraticCurveTo(
      250,
      120,
      180,
      320
    );

    ctx.fill();
  }else if(variant==="crowd"){
    for(let i=0;i<10;i++){
      const fx=Math.random()*c.width;
      const fy=
        Math.random()*c.height*0.6+80;

      ctx.fillStyle=
        "rgba(40,35,30,.5)";

      ctx.beginPath();

      ctx.ellipse(
        fx,
        fy,
        40,
        55,
        0,
        0,
        Math.PI*2
      );

      ctx.fill();
    }
  }

  ctx.fillStyle="rgba(0,0,0,.55)";

  ctx.fillRect(
    0,
    0,
    c.width,
    c.height*0.15
  );

  ctx.fillRect(
    0,
    c.height*0.85,
    c.width,
    c.height*0.15
  );

  return c.toDataURL("image/png");
}

let sharedGroundTexture=null;

function groundTexture(){
  if(sharedGroundTexture){
    return sharedGroundTexture;
  }

  const c=document.createElement("canvas");

  c.width=256;
  c.height=256;

  const ctx=c.getContext("2d");

  ctx.fillStyle="#171310";

  ctx.fillRect(
    0,
    0,
    256,
    256
  );

  for(let i=0;i<1800;i++){
    ctx.fillStyle=
      "rgba("+
      (20+Math.random()*30)+","+
      (16+Math.random()*24)+","+
      (12+Math.random()*18)+",1)";

    ctx.fillRect(
      Math.random()*256,
      Math.random()*256,
      2,
      2
    );
  }

  sharedGroundTexture=
    new THREE.CanvasTexture(c);

  sharedGroundTexture.wrapS=
    THREE.RepeatWrapping;

  sharedGroundTexture.wrapT=
    THREE.RepeatWrapping;

  sharedGroundTexture.repeat.set(
    40,
    40
  );

  return sharedGroundTexture;
}

const container=
  document.getElementById("container");

const scene=
  new THREE.Scene();

const camera=
  new THREE.PerspectiveCamera(
    72,
    window.innerWidth/window.innerHeight,
    0.1,
    500
  );

const renderer=
  new THREE.WebGLRenderer({
    antialias:false,
    powerPreference:"high-performance",
    alpha:false
  });

const RENDER_SCALE=0.8;

renderer.setPixelRatio(
  RENDER_SCALE
);

renderer.setSize(
  window.innerWidth,
  window.innerHeight,
  false
);

const domEl=
  renderer.domElement;

renderer.shadowMap.enabled=false;

renderer.outputColorSpace=
  THREE.SRGBColorSpace;

renderer.toneMapping=
  THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure=1.12;

container.appendChild(domEl);

window.addEventListener(
  "resize",
  function(){
    camera.aspect=
      window.innerWidth/
      window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setPixelRatio(
      RENDER_SCALE
    );

    renderer.setSize(
      window.innerWidth,
      window.innerHeight,
      false
    );
  }
);

scene.fog=
  new THREE.FogExp2(
    0x10100d,
    0.025
  );

scene.background=
  new THREE.Color(0x0b0a08);

const ambientLight=
  new THREE.AmbientLight(
    0x667788,
    1.4
  );

scene.add(
  ambientLight
);

const moonLight=
  new THREE.DirectionalLight(
    0xb4c7d8,
    0.82
  );

moonLight.position.set(
  -20,
  40,
  -10
);

moonLight.castShadow=false;

scene.add(
  moonLight
);

const flashlight=
  new THREE.SpotLight(
    0xfff5d6,
    3.4,
    100,
    Math.PI/2.3,
    0.72,
    1.3
  );

flashlight.position.set(
  0,
  0,
  0
);

camera.add(
  flashlight
);

flashlight.target.position.set(
  0,
  0,
  -1
);

camera.add(
  flashlight.target
);

scene.add(
  camera
);

function makeGlowTexture(){
  const c=document.createElement("canvas");

  c.width=128;
  c.height=128;

  const ctx=c.getContext("2d");

  const grad=
    ctx.createRadialGradient(
      64,
      64,
      0,
      64,
      64,
      64
    );

  grad.addColorStop(
    0,
    "rgba(255,246,220,0.95)"
  );

  grad.addColorStop(
    0.28,
    "rgba(255,240,205,0.68)"
  );

  grad.addColorStop(
    0.6,
    "rgba(255,232,190,0.38)"
  );

  grad.addColorStop(
    1,
    "rgba(255,225,180,0)"
  );

  ctx.fillStyle=grad;

  ctx.fillRect(
    0,
    0,
    128,
    128
  );

  return new THREE.CanvasTexture(c);
}

const flashlightGlowTexture=
  makeGlowTexture();

const flashlightBeam=
  new THREE.Group();

const FLASHLIGHT_BEAM_STEPS=4;

for(
  let i=0;
  i<FLASHLIGHT_BEAM_STEPS;
  i++
){
  const t=
    i/
    (FLASHLIGHT_BEAM_STEPS-1);

  const sprite=
    new THREE.Sprite(
      new THREE.SpriteMaterial({
        map:flashlightGlowTexture,
        color:0xfff2c8,
        transparent:true,
        opacity:0.11*(1-t*0.8),
        blending:THREE.AdditiveBlending,
        depthWrite:false
      })
    );

  const dist=
    1.2+
    t*24;

  const size=
    1.5+
    t*11;

  sprite.scale.set(
    size,
    size,
    1
  );

  sprite.position.set(
    0,
    0,
    -dist
  );

  flashlightBeam.add(
    sprite
  );
}

camera.add(
  flashlightBeam
);

const flashlightGlow=
  new THREE.PointLight(
    0xfff0c0,
    0.42,
    5,
    1.8
  );

flashlightGlow.position.set(
  0,
  0,
  -0.4
);

camera.add(
  flashlightGlow
);

const treeTrunkGeo=
  new THREE.CylinderGeometry(
    0.25,
    0.4,
    4,
    6
  );

const treeLeafGeo1=
  new THREE.ConeGeometry(
    1.6,
    3.2,
    7
  );

const treeLeafGeo2=
  new THREE.ConeGeometry(
    1.3,
    3.2,
    7
  );

const treeLeafGeo3=
  new THREE.ConeGeometry(
    1,
    3.2,
    7
  );

const treeTrunkMat=
  new THREE.MeshStandardMaterial({
    color:0x241a12,
    roughness:1
  });

const treeLeafMat=
  new THREE.MeshStandardMaterial({
    color:0x0e1a10,
    roughness:1
  });

const humanoidHeadGeo=
  new THREE.SphereGeometry(
    0.24,
    10,
    10
  );

const humanoidBodyGeo=
  new THREE.CylinderGeometry(
    0.24,
    0.32,
    1.05,
    10
  );

const humanoidArmGeo=
  new THREE.CylinderGeometry(
    0.06,
    0.06,
    0.85,
    6
  );

const humanoidSkinMaterials={};
const humanoidRobeMaterials={};

function getMaterial(
  cache,
  key,
  color
){
  if(!cache[key]){
    cache[key]=
      new THREE.MeshStandardMaterial({
        color:color,
        roughness:1
      });
  }

  return cache[key];
}

function makeTree(
  x,
  z,
  scale
){
  const g=
    new THREE.Group();

  const trunk=
    new THREE.Mesh(
      treeTrunkGeo,
      treeTrunkMat
    );

  trunk.position.y=2;

  g.add(
    trunk
  );

  const cone1=
    new THREE.Mesh(
      treeLeafGeo1,
      treeLeafMat
    );

  const cone2=
    new THREE.Mesh(
      treeLeafGeo2,
      treeLeafMat
    );

  const cone3=
    new THREE.Mesh(
      treeLeafGeo3,
      treeLeafMat
    );

  cone1.position.y=3.6;
  cone2.position.y=5.5;
  cone3.position.y=7.4;

  g.add(
    cone1,
    cone2,
    cone3
  );

  g.position.set(
    x,
    0,
    z
  );

  g.scale.setScalar(
    scale||1
  );

  g.rotation.y=
    Math.random()*Math.PI*2;

  return g;
}

function makeHumanoid(
  skinColor,
  robeColor
){
  const g=
    new THREE.Group();

  const skin=
    getMaterial(
      humanoidSkinMaterials,
      skinColor,
      skinColor
    );

  const robe=
    getMaterial(
      humanoidRobeMaterials,
      robeColor,
      robeColor
    );

  const head=
    new THREE.Mesh(
      humanoidHeadGeo,
      skin
    );

  head.position.y=1.62;

  const body=
    new THREE.Mesh(
      humanoidBodyGeo,
      robe
    );

  body.position.y=1;

  const armL=
    new THREE.Mesh(
      humanoidArmGeo,
      robe
    );

  armL.position.set(
    0.34,
    1.05,
    0
  );

  armL.rotation.z=0.18;

  const armR=
    new THREE.Mesh(
      humanoidArmGeo,
      robe
    );

  armR.position.set(
    -0.34,
    1.05,
    0
  );

  armR.rotation.z=-0.18;

  g.add(
    head,
    body,
    armL,
    armR
  );

  return g;
}

const hutWallMat=
  new THREE.MeshStandardMaterial({
    color:0x2a2013,
    roughness:1
  });

const hutRoofMat=
  new THREE.MeshStandardMaterial({
    color:0x1a1108,
    roughness:1
  });

const hutBaseGeo=
  new THREE.BoxGeometry(
    3.4,
    2.2,
    3.4
  );

const hutRoofGeo=
  new THREE.ConeGeometry(
    2.7,
    1.8,
    4
  );

function makeHut(
  x,
  z,
  rotY
){
  const g=
    new THREE.Group();

  const base=
    new THREE.Mesh(
      hutBaseGeo,
      hutWallMat
    );

  base.position.y=1.1;

  const roof=
    new THREE.Mesh(
      hutRoofGeo,
      hutRoofMat
    );

  roof.position.y=3.1;
  roof.rotation.y=Math.PI/4;

  g.add(
    base,
    roof
  );

  g.position.set(
    x,
    0,
    z
  );

  g.rotation.y=
    rotY||0;

  return g;
}

const graveMat=
  new THREE.MeshStandardMaterial({
    color:0x4a463f,
    roughness:1
  });

const graveStoneGeo=
  new THREE.BoxGeometry(
    0.7,
    1.1,
    0.18
  );

const graveBaseGeo=
  new THREE.BoxGeometry(
    1,
    0.15,
    0.5
  );

function makeGrave(
  x,
  z
){
  const g=
    new THREE.Group();

  const stone=
    new THREE.Mesh(
      graveStoneGeo,
      graveMat
    );

  stone.position.y=0.55;

  stone.rotation.z=
    (Math.random()-0.5)*0.15;

  const base=
    new THREE.Mesh(
      graveBaseGeo,
      graveMat
    );

  g.add(
    stone,
    base
  );

  g.position.set(
    x,
    0,
    z
  );

  g.rotation.y=
    Math.random()*0.3;

  return g;
}

const groundGeoCache={};
const groundMatCache={};

function makeGround(
  size,
  color
){
  const c=
    color||0x1a140f;

  if(!groundGeoCache[size]){
    groundGeoCache[size]=
      new THREE.PlaneGeometry(
        size,
        size,
        1,
        1
      );
  }

  const key=
    String(c);

  if(!groundMatCache[key]){
    groundMatCache[key]=
      new THREE.MeshStandardMaterial({
        color:c,
        roughness:1,
        map:groundTexture()
      });
  }

  const mesh=
    new THREE.Mesh(
      groundGeoCache[size],
      groundMatCache[key]
    );

  mesh.rotation.x=
    -Math.PI/2;

  return mesh;
}

function redBundle(
  x,
  y,
  z
){
  const g=
    new THREE.Group();

  const mat=
    new THREE.MeshStandardMaterial({
      color:0x8a0f14,
      emissive:0x4a0505,
      emissiveIntensity:0.6,
      roughness:0.6
    });

  const wrap=
    new THREE.Mesh(
      new THREE.IcosahedronGeometry(
        0.22,
        0
      ),
      mat
    );

  g.add(
    wrap
  );

  const glow=
    new THREE.PointLight(
      0xaa2222,
      1.1,
      5
    );

  g.add(
    glow
  );

  g.position.set(
    x,
    y,
    z
  );

  return g;
}

function makeSign(
  text,
  width,
  height,
  fontSize
){
  const canvas=
    document.createElement("canvas");

  canvas.width=768;
  canvas.height=180;

  const context=
    canvas.getContext("2d");

  context.fillStyle="#20170f";

  context.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  context.strokeStyle="#b79a68";
  context.lineWidth=8;

  context.strokeRect(
    8,
    8,
    canvas.width-16,
    canvas.height-16
  );

  context.fillStyle="#ead7ad";

  context.font=
    "bold "+
    (fontSize||64)+
    "px Georgia, serif";

  context.textAlign="center";
  context.textBaseline="middle";

  context.fillText(
    text,
    canvas.width/2,
    canvas.height/2
  );

  const texture=
    new THREE.CanvasTexture(
      canvas
    );

  const material=
    new THREE.MeshBasicMaterial({
      map:texture,
      transparent:true
    });

  return new THREE.Mesh(
    new THREE.PlaneGeometry(
      width,
      height
    ),
    material
  );
}

function makeMultilineSign(
  lines,
  width,
  height,
  opts
){
  opts=opts||{};

  const canvasW=
    opts.canvasW||900;

  const canvasH=
    opts.canvasH||480;

  const canvas=
    document.createElement("canvas");

  canvas.width=canvasW;
  canvas.height=canvasH;

  const ctx=
    canvas.getContext("2d");

  ctx.fillStyle="#20170f";

  ctx.fillRect(
    0,
    0,
    canvasW,
    canvasH
  );

  ctx.strokeStyle="#b79a68";
  ctx.lineWidth=10;

  ctx.strokeRect(
    10,
    10,
    canvasW-20,
    canvasH-20
  );

  ctx.textAlign="center";
  ctx.textBaseline="middle";

  const titleSize=
    opts.titleSize||46;

  const bodySize=
    opts.bodySize||34;

  const gap=
    opts.lineGap||62;

  const startY=
    canvasH/2-
    ((lines.length-1)*gap)/2;

  lines.forEach(
    function(line,i){
      const isTitle=
        typeof line==="object";

      const text=
        isTitle?
        line.text:
        line;

      const color=
        isTitle&&line.color?
        line.color:
        "#ead7ad";

      const size=
        isTitle&&line.size?
        line.size:
        (i===0?
          titleSize:
          bodySize);

      ctx.fillStyle=color;

      ctx.font=
        "bold "+
        size+
        "px Georgia, serif";

      ctx.fillText(
        text,
        canvasW/2,
        startY+i*gap
      );
    }
  );

  const texture=
    new THREE.CanvasTexture(
      canvas
    );

  const material=
    new THREE.MeshBasicMaterial({
      map:texture,
      transparent:true
    });

  return new THREE.Mesh(
    new THREE.PlaneGeometry(
      width,
      height
    ),
    material
  );
}

function makeIntroArea(){
  const group=
    new THREE.Group();

  const wallMaterial=
    new THREE.MeshStandardMaterial({
      color:0x594333,
      roughness:1
    });

  const roofMaterial=
    new THREE.MeshStandardMaterial({
      color:0x21140d,
      roughness:1
    });

  const woodMaterial=
    new THREE.MeshStandardMaterial({
      color:0x3b2415,
      roughness:1
    });

  const gateStoneMaterial=
    new THREE.MeshStandardMaterial({
      color:0x3f3934,
      roughness:1
    });

  const gateStoneDarkMaterial=
    new THREE.MeshStandardMaterial({
      color:0x211d1a,
      roughness:1
    });

  const house=
    new THREE.Group();

  const walls=
    new THREE.Mesh(
      new THREE.BoxGeometry(
        9,
        4.5,
        6
      ),
      wallMaterial
    );

  walls.position.y=2.25;

  const roof=
    new THREE.Mesh(
      new THREE.ConeGeometry(
        6.8,
        3.2,
        4
      ),
      roofMaterial
    );

  roof.position.y=6.1;
  roof.rotation.y=Math.PI/4;

  const door=
    new THREE.Mesh(
      new THREE.BoxGeometry(
        1.5,
        2.7,
        0.12
      ),
      woodMaterial
    );

  door.position.set(
    0,
    1.35,
    -3.06
  );

  house.add(
    walls,
    roof,
    door
  );

  house.position.set(
    0,
    0,
    19
  );

  group.add(
    house
  );

  const gate=
    new THREE.Group();

  [-4.5,4.5].forEach(
    function(x){
      const post=
        new THREE.Mesh(
          new THREE.BoxGeometry(
            0.8,
            6,
            0.8
          ),
          woodMaterial
        );

      post.position.set(
        x,
        3,
        8
      );

      gate.add(
        post
      );

      for(
        let i=0;
        i<3;
        i++
      ){
        const block=
          new THREE.Mesh(
            new THREE.BoxGeometry(
              2.2,
              1.35,
              1.8
            ),
            gateStoneMaterial
          );

        block.position.set(
          x,
          0.7+i*1.35,
          8
        );

        block.rotation.y=
          i%2===0?
          0.02:
          -0.02;

        gate.add(
          block
        );
      }

      const cap=
        new THREE.Mesh(
          new THREE.BoxGeometry(
            2.55,
            0.35,
            2.1
          ),
          gateStoneDarkMaterial
        );

      cap.position.set(
        x,
        4.25,
        8
      );

      gate.add(
        cap
      );
    }
  );

  const beam=
    new THREE.Mesh(
      new THREE.BoxGeometry(
        10,
        1,
        0.9
      ),
      woodMaterial
    );

  beam.position.set(
    0,
    6,
    8
  );

  gate.add(
    beam
  );

  const topRoof=
    new THREE.Mesh(
      new THREE.ConeGeometry(
        5.9,
        2.2,
        4
      ),
      gateStoneDarkMaterial
    );

  topRoof.position.set(
    0,
    7.05,
    8
  );

  topRoof.rotation.y=
    Math.PI/4;

  gate.add(
    topRoof
  );

  [-5.45,5.45].forEach(
    function(x){
      const torch=
        new THREE.Mesh(
          new THREE.CylinderGeometry(
            0.11,
            0.16,
            0.9,
            6
          ),
          woodMaterial
        );

      torch.position.set(
        x,
        4.9,
        7.35
      );

      const fire=
        new THREE.PointLight(
          0xff7a32,
          1.1,
          8
        );

      fire.position.set(
        x,
        5.55,
        7.25
      );

      gate.add(
        torch,
        fire
      );
    }
  );

  const sign=
    makeSign(
      "GUNUNG KIWI",
      6.8,
      1.6
    );

  sign.position.set(
    0,
    5.1,
    7.5
  );

  gate.add(
    sign
  );

  group.add(
    gate
  );

  const porchLight=
    new THREE.PointLight(
      0xffb35c,
      1.2,
      16
    );

  porchLight.position.set(
    0,
    3.5,
    14
  );

  group.add(
    porchLight
  );

  group.add(
    makeTree(-9,14,1.1),
    makeTree(9,14,1.1)
  );

  return group;
}

function makeTrailMarker(
  label,
  z,
  side
){
  const group=
    new THREE.Group();

  const wood=
    new THREE.MeshStandardMaterial({
      color:0x4a2b18,
      roughness:1
    });

  const post=
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.22,
        2.4,
        0.22
      ),
      wood
    );

  post.position.y=1.2;

  const sign=
    makeSign(
      label,
      2.8,
      0.7
    );

  sign.position.set(
    0,
    2.35,
    0
  );

  const lamp=
    new THREE.PointLight(
      0xffbd72,
      0.45,
      5
    );

  lamp.position.set(
    0,
    2.3,
    0.25
  );

  group.add(
    post,
    sign,
    lamp
  );

  group.position.set(
    side||3.2,
    0,
    z
  );

  return group;
}

const mountainGeo=
  new THREE.ConeGeometry(
    15,
    30,
    7
  );

const mountainMat=
  new THREE.MeshStandardMaterial({
    color:0x29312d,
    roughness:1
  });

function makeMountain(
  x,
  z,
  scale
){
  const mountain=
    new THREE.Mesh(
      mountainGeo,
      mountainMat
    );

  mountain.position.set(
    x,
    15,
    z
  );

  mountain.scale.set(
    scale,
    scale,
    scale
  );

  mountain.rotation.y=
    Math.random()*Math.PI;

  return mountain;
}

const rockGeo=
  new THREE.DodecahedronGeometry(
    1.6,
    0
  );

const rockMat=
  new THREE.MeshStandardMaterial({
    color:0x49443d,
    roughness:1
  });

function makeRock(
  x,
  z,
  scale
){
  const rock=
    new THREE.Mesh(
      rockGeo,
      rockMat
    );

  rock.position.set(
    x,
    1.1*scale,
    z
  );

  rock.scale.set(
    scale,
    scale*0.8,
    scale
  );

  rock.rotation.set(
    Math.random(),
    Math.random(),
    Math.random()
  );

  rock.userData.obstacle={
    radius:1.5*scale
  };

  return rock;
}

const logGeo=
  new THREE.CylinderGeometry(
    0.45,
    0.65,
    6,
    8
  );

const logMat=
  new THREE.MeshStandardMaterial({
    color:0x352218,
    roughness:1
  });

function makeFallenLog(
  x,
  z,
  rotation
){
  const log=
    new THREE.Mesh(
      logGeo,
      logMat
    );

  log.position.set(
    x,
    0.65,
    z
  );

  log.rotation.z=
    Math.PI/2;

  log.rotation.y=
    rotation||0;

  log.userData.obstacle={
    radius:3.1
  };

  return log;
}

const forestGroup=
  new THREE.Group();

const villageGroup=
  new THREE.Group();

const graveyardGroup=
  new THREE.Group();

const partyGroup=
  new THREE.Group();

const mysteryClues=[];

function makeMysteryClue(
  x,
  z,
  lines,
  message,
  subtitle
){
  const clue=
    new THREE.Group();

  const board=
    makeMultilineSign(
      lines,
      3.8,
      1.25
    );

  board.position.y=2.15;

  const post= 
    new THREE.Mesh(
      new THREE.BoxGeometry(
        0.18,
        2.2,
        0.18
      ),
      new THREE.MeshStandardMaterial({
        color:0x24160e,
        roughness:1
      })
    );

  post.position.y=1.05;

  const light=
    new THREE.PointLight(
      0x8b1717,
      0.45,
      4
    );

  light.position.set(
    0,
    2.2,
    0.2
  );

  clue.add(
    board,
    post,
    light
  );

  clue.position.set(
    x,
    0,
    z
  );

  clue.userData.mysteryClue={
    message,
    subtitle,
    read:false
  };

  mysteryClues.push(clue);

  return clue;
}

const introGroup=
  makeIntroArea();

scene.add(
  introGroup,
  partyGroup,
  forestGroup,
  villageGroup,
  graveyardGroup
);

villageGroup.visible=false;
graveyardGroup.visible=false;

const PATH_SCALE=2.1;

forestGroup.add(
  makeGround(
    400,
    0x181410
  )
);

const trailMaterial=
  new THREE.MeshStandardMaterial({
    color:0x393128,
    roughness:1,
    map:groundTexture()
  });

const trail=
  new THREE.Mesh(
    new THREE.PlaneGeometry(
      5.5,
      260*PATH_SCALE
    ),
    trailMaterial
  );

trail.rotation.x=
  -Math.PI/2;

trail.position.set(
  0,
  0.025,
  -105*PATH_SCALE
);

forestGroup.add(
  trail
);

[
  [-25,-18,1.45],
  [25,-18,1.3],
  [-28,-38,1.65],
  [28,-40,1.5],
  [-30,-58,1.8],
  [30,-58,1.7],
  [-30,-78,1.9],
  [30,-78,1.85],
  [-30,-95,1.9],
  [30,-95,1.85],
  [-34,-116,2.15],
  [34,-120,2.05],
  [-18,-145,2.4],
  [18,-150,2.5]
].forEach(
  function(mountain){
    forestGroup.add(
      makeMountain(
        mountain[0],
        mountain[1]*PATH_SCALE,
        mountain[2]
      )
    );
  }
);

[
  makeRock(
    -3.8,
    -30*PATH_SCALE,
    1.2
  ),

  makeRock(
    3.7,
    -49*PATH_SCALE,
    1.3
  ),

  makeFallenLog(
    -3.4,
    -68*PATH_SCALE,
    0.3
  ),

  makeRock(
    3.8,
    -88*PATH_SCALE,
    1.1
  ),

  makeFallenLog(
    -3.5,
    -113*PATH_SCALE,
    -0.25
  )
].forEach(
  function(obstacle){
    forestGroup.add(
      obstacle
    );
  }
);

[
  ["POS 2",-38],
  ["POS 4",-78],
  ["POS 5",-95],
  ["PUNCAK",-116]
].forEach(
  function(marker){
    const m=
      makeTrailMarker(
        marker[0],
        marker[1]*PATH_SCALE,
        3.4
      );

    m.scale.set(
      1.35,
      1.35,
      1.35
    );

    forestGroup.add(
      m
    );
  }
);

forestGroup.add(
  makeMysteryClue(
    -4.6,
    -24*PATH_SCALE,
    [
      "JANGAN PERCAYA",
      "YANG PULANG"
    ],
    "Tulisan itu dibuat dengan arang. Di bawahnya ada enam goresan nama, tetapi hanya lima yang dicoret.",
    'Suara asing: "Yang pulang bukan selalu yang selamat."'
  ),
  makeMysteryClue(
    4.6,
    -44*PATH_SCALE,
    [
      "SARI TIDAK",
      "HILANG"
    ],
    "Di balik papan terselip foto rombongan. Sari berdiri paling belakang, menatap kamera seperti sudah tahu foto itu akan ditemukan.",
    'Catatan di belakang foto: "Dia ikut naik. Dia tidak pernah turun."'
  ),
  makeMysteryClue(
    -4.6,
    -84*PATH_SCALE,
    [
      "MEREKA TIDAK",
      "NAIK"
    ],
    "Tanah di sekitar papan masih basah, tetapi tidak ada jejak kaki menuju puncak. Hanya ada jejak yang kembali ke hutan.",
    'Bisikan dari pepohonan: "Kalian datang terlambat."'
  )
);

for(
  let z=-5*PATH_SCALE;
  z>-145*PATH_SCALE;
  z-=3.8*PATH_SCALE
){
  const side=
    5+
    Math.random()*4.5;

  forestGroup.add(
    makeTree(
      -side-Math.random()*6,
      z+Math.random()*2.5,
      0.9+Math.random()*0.65
    ),

    makeTree(
      side+Math.random()*6,
      z-Math.random()*2.5,
      0.9+Math.random()*0.65
    )
  );

  if(
    z<-32*PATH_SCALE&&
    Math.random()<0.55
  ){
    forestGroup.add(
      makeTree(
        (Math.random()-0.5)*4,
        z-2,
        0.65+Math.random()*0.35
      )
    );
  }
}

function makeToilet(
  x,
  z
){
  const g=
    new THREE.Group();

  const wall=
    new THREE.MeshStandardMaterial({
      color:0x39312a,
      roughness:0.95
    });

  const roof=
    new THREE.MeshStandardMaterial({
      color:0x17120e,
      roughness:1
    });

  const wood=
    new THREE.MeshStandardMaterial({
      color:0x302116,
      roughness:1
    });

  const body=
    new THREE.Mesh(
      new THREE.BoxGeometry(
        3.2,
        2.8,
        2.8
      ),
      wall
    );

  body.position.y=1.4;

  const top=
    new THREE.Mesh(
      new THREE.ConeGeometry(
        2.45,
        1.25,
        4
      ),
      roof
    );

  top.position.y=3.4;
  top.rotation.y=Math.PI/4;

  const door=
    new THREE.Mesh(
      new THREE.BoxGeometry(
        1.05,
        2.1,
        0.1
      ),
      wood
    );

  door.position.set(
    0,
    1.05,
    -1.42
  );

  const sign=
    makeSign(
      "TOILET",
      2,
      0.55
    );

  sign.position.set(
    0,
    2.35,
    -1.48
  );

  g.add(
    body,
    top,
    door,
    sign
  );

  const porchLight=
    new THREE.PointLight(
      0xffe3ad,
      2.2,
      12,
      2
    );

  porchLight.position.set(
    0,
    3.1,
    -0.6
  );

  const frontLight=
    new THREE.PointLight(
      0xffdca0,
      1.6,
      9,
      2
    );

  frontLight.position.set(
    0,
    1.8,
    1.6
  );

  g.add(
    porchLight,
    frontLight
  );

  g.position.set(
    x,
    0,
    z
  );

  return g;
}

function makeBracelet(
  x,
  y,
  z
){
  const g=
    new THREE.Group();

  const metal=
    new THREE.MeshStandardMaterial({
      color:0x8b6b38,
      metalness:0.75,
      roughness:0.25,
      emissive:0x241500,
      emissiveIntensity:0.35
    });

  const ring=
    new THREE.Mesh(
      new THREE.TorusGeometry(
        0.28,
        0.045,
        8,
        20
      ),
      metal
    );

  ring.rotation.x=
    Math.PI/2;

  const charm=
    new THREE.Mesh(
      new THREE.OctahedronGeometry(
        0.09,
        0
      ),
      new THREE.MeshStandardMaterial({
        color:0x7b1717,
        emissive:0x350000,
        emissiveIntensity:0.7
      })
    );

  charm.position.set(
    0.28,
    0,
    0
  );

  const glow=
    new THREE.PointLight(
      0xaa3322,
      0.55,
      3
    );

  g.add(
    ring,
    charm,
    glow
  );

  g.position.set(
    x,
    y,
    z
  );

  g.visible=false;

  return g;
}

function makeFoodOffering(
  x,
  z
){
  const g=
    new THREE.Group();

  const tableMat=
    new THREE.MeshStandardMaterial({
      color:0x2b180d,
      roughness:1
    });

  const foodMat=
    new THREE.MeshStandardMaterial({
      color:0x8b4a20,
      roughness:0.9
    });

  const plateMat=
    new THREE.MeshStandardMaterial({
      color:0x9d8870,
      roughness:0.8
    });

  const table=
    new THREE.Mesh(
      new THREE.BoxGeometry(2.4,0.18,1.2),
      tableMat
    );

  table.position.y=0.8;

  const legGeo=
    new THREE.CylinderGeometry(0.08,0.1,0.8,6);

  [-0.85,0.85].forEach(
    function(px){
      const leg=
        new THREE.Mesh(
          legGeo,
          tableMat
        );

      leg.position.set(
        px,
        0.4,
        0
      );

      g.add(leg);
    }
  );

  const plate=
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.38,0.38,0.06,12),
      plateMat
    );

  plate.position.set(
    -0.55,
    0.94,
    0
  );

  const bowl=
    new THREE.Mesh(
      new THREE.SphereGeometry(0.28,10,6),
      foodMat
    );

  bowl.scale.y=0.5;
  bowl.position.set(
    0.55,
    0.98,
    0
  );

  const steam=
    new THREE.Mesh(
      new THREE.TorusGeometry(0.13,0.025,6,12),
      new THREE.MeshBasicMaterial({
        color:0xb99b78,
        transparent:true,
        opacity:0.42
      })
    );

  steam.position.set(
    0.55,
    1.3,
    0
  );

  g.add(
    table,
    plate,
    bowl,
    steam
  );

  g.position.set(
    x,
    0,
    z
  );

  return g;
}

function makeRitualAltar(){
  const g=
    new THREE.Group();

  const stoneMat=
    new THREE.MeshStandardMaterial({
      color:0x30251c,
      roughness:1
    });

  const clothMat=
    new THREE.MeshStandardMaterial({
      color:0x5c1116,
      roughness:1
    });

  const altar=
    new THREE.Mesh(
      new THREE.BoxGeometry(2.8,0.7,1.25),
      stoneMat
    );

  altar.position.y=0.35;

  const cloth=
    new THREE.Mesh(
      new THREE.BoxGeometry(2.2,0.08,0.85),
      clothMat
    );

  cloth.position.y=0.76;

  const bowl=
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.34,0.28,0.25,8),
      clothMat
    );

  bowl.position.set(
    0,
    0.94,
    0
  );

  g.add(
    altar,
    cloth,
    bowl
  );

  g.position.set(
    0,
    0,
    -5.8
  );

  return g;
}

const pos4Toilet=
  makeToilet(
    -3.3,
    -78*PATH_SCALE
  );

forestGroup.add(
  pos4Toilet
);

const braceletObj=
  makeBracelet(
    -3.3,
    0.72,
    -78*PATH_SCALE+1.55
  );

forestGroup.add(
  braceletObj
);

const lampPoleGeo=
  new THREE.CylinderGeometry(
    0.07,
    0.09,
    3.2,
    7
  );

const lampPoleMat=
  new THREE.MeshStandardMaterial({
    color:0x30261b,
    roughness:1
  });

const lampGeo=
  new THREE.SphereGeometry(
    0.16,
    10,
    10
  );

const lampMat=
  new THREE.MeshStandardMaterial({
    color:0xffd48a,
    emissive:0xff9c32,
    emissiveIntensity:1.5
  });

function makeLamp(
  x,
  z
){
  const g=
    new THREE.Group();

  const pole=
    new THREE.Mesh(
      lampPoleGeo,
      lampPoleMat
    );

  pole.position.y=1.6;

  const lamp=
    new THREE.Mesh(
      lampGeo,
      lampMat
    );

  lamp.position.y=3.05;

  const light=
    new THREE.PointLight(
      0xffbd72,
      1.35,
      9,
      2
    );

  light.position.y=3;

  g.add(
    pole,
    lamp,
    light
  );

  g.position.set(
    x,
    0,
    z
  );

  return g;
}

function makeForkWarningSign(
  x,
  z
){
  const g=
    new THREE.Group();

  const postMat=
    new THREE.MeshStandardMaterial({
      color:0x2a2016,
      roughness:1
    });

  [-3.6,3.6].forEach(
    function(px){
      const p=
        new THREE.Mesh(
          new THREE.BoxGeometry(
            0.34,
            4.6,
            0.34
          ),
          postMat
        );

      p.position.set(
        px,
        2.3,
        0
      );

      g.add(
        p
      );
    }
  );

  const board=
    makeMultilineSign(
      [
        {
          text:"PERINGATAN",
          color:"#c94b3a",
          size:58
        },
        "◄ KIRI : JALAN GELAP",
        "KANAN : JALAN LAMPU ►",
        "Pilih jalanmu baik-baik."
      ],
      7.4,
      4.1,
      {
        canvasW:960,
        canvasH:560,
        titleSize:58,
        bodySize:40,
        lineGap:90
      }
    );

  board.position.set(
    0,
    4,
    0
  );

  const warnLight=
    new THREE.PointLight(
      0xff8855,
      0.6,
      6,
      2
    );

  warnLight.position.set(
    0,
    3.6,
    0.6
  );

  g.add(
    board,
    warnLight
  );

  g.position.set(
    x,
    0,
    z
  );

  return g;
}

forestGroup.add(
  makeForkWarningSign(
    0,
    -95*PATH_SCALE
  )
);

for(
  let z=-98*PATH_SCALE;
  z>-139*PATH_SCALE;
  z-=3.5*PATH_SCALE
){
  const center=
    -7-
    (z+98*PATH_SCALE)*0.10;

  forestGroup.add(
    makeTree(
      center-3-Math.random()*3,
      z,
      1.05+Math.random()*0.55
    ),

    makeTree(
      center+3+Math.random()*3,
      z,
      1.05+Math.random()*0.55
    )
  );
}

for(
  let z=-98*PATH_SCALE;
  z>-139*PATH_SCALE;
  z-=5*PATH_SCALE
){
  const center=
    7+
    (z+98*PATH_SCALE)*0.08;

  forestGroup.add(
    makeLamp(
      center-2.5,
      z
    ),

    makeLamp(
      center+2.5,
      z
    )
  );
}

const darkPathWall=
  new THREE.Mesh(
    new THREE.PlaneGeometry(
      22,
      18
    ),
    new THREE.MeshBasicMaterial({
      color:0x030201,
      transparent:true,
      opacity:0.9,
      fog:false
    })
  );

darkPathWall.position.set(
  -15,
  7,
  -140*PATH_SCALE
);

darkPathWall.rotation.y=0.15;

forestGroup.add(
  darkPathWall
);

forestGroup.add(
  makeLamp(
    3,
    -139*PATH_SCALE
  ),

  makeLamp(
    11,
    -139*PATH_SCALE
  )
);

const summitGround=
  new THREE.Mesh(
    new THREE.CylinderGeometry(
      11,
      14,
      0.5,
      10
    ),
    new THREE.MeshStandardMaterial({
      color:0x252018,
      roughness:1
    })
  );

summitGround.position.set(
  0,
  0,
  -116*PATH_SCALE
);

forestGroup.add(
  summitGround
);

const otherRealmGroup=
  new THREE.Group();

otherRealmGroup.visible=false;

scene.add(
  otherRealmGroup
);

otherRealmGroup.add(
  makeGround(
    150,
    0x100d0a
  )
);

for(
  let z=-15;
  z>-110;
  z-=3.8
){
  const side=
    7+
    Math.random()*6;

  otherRealmGroup.add(
    makeTree(
      -side-Math.random()*5,
      z,
      1+Math.random()*0.7
    ),

    makeTree(
      side+Math.random()*5,
      z,
      1+Math.random()*0.7
    )
  );
}

function makeCave(){
  const g=
    new THREE.Group();

  const rockMat=
    new THREE.MeshStandardMaterial({
      color:0x161310,
      roughness:1
    });

  const arch=
    new THREE.Mesh(
      new THREE.ConeGeometry(
        8,
        9,
        8
      ),
      rockMat
    );

  arch.position.y=4.2;

  arch.scale.set(
    1.35,
    1,
    0.75
  );

  const dark=
    new THREE.Mesh(
      new THREE.CircleGeometry(
        4.2,
        32
      ),
      new THREE.MeshBasicMaterial({
        color:0x000000
      })
    );

  dark.position.set(
    0,
    3.2,
    -5.9
  );

  dark.rotation.x=-0.05;

  g.add(
    arch,
    dark
  );

  return g;
}

const cave=
  makeCave();

cave.position.set(
  0,
  0,
  -82
);

otherRealmGroup.add(
  cave
);

const cultGroup=
  new THREE.Group();

cultGroup.position.set(
  0,
  0,
  -78
);

otherRealmGroup.add(
  cultGroup
);

cultGroup.add(
  makeRitualAltar()
);

const cultists=[];

for(let i=0;i<7;i++){
  const c=
    makeHumanoid(
      0x81766a,
      0x090909
    );

  const ang=
    (i/7)*Math.PI*2;

  c.position.set(
    Math.cos(ang)*4,
    0,
    -2+Math.sin(ang)*3
  );

  c.lookAt(
    0,
    1.2,
    -6
  );

  cultGroup.add(
    c
  );

  cultists.push(
    c
  );
}

const sariCult=
  makeHumanoid(
    0xcabfb0,
    0x171717
  );

sariCult.position.set(
  0,
  0,
  -5.5
);

sariCult.visible=false;

cultGroup.add(
  sariCult
);

const ritualLight=
  new THREE.PointLight(
    0x8c6a42,
    1.1,
    14
  );

ritualLight.position.set(
  0,
  2,
  -6
);

cultGroup.add(
  ritualLight
);

const missingFriends=[];

[
  "Eva",
  "Dani",
  "Yuda",
  "Erlina"
].forEach(
  function(name,i){
    const f=
      makeHumanoid(
        0xb5a28f,
        [
          0x53634d,
          0x66523c,
          0x404040,
          0x6b1414
        ][i]
      );

    f.userData.name=name;

    f.position.set(
      -3+i*2,
      0,
      -68
    );

    f.visible=false;

    otherRealmGroup.add(
      f
    );

    missingFriends.push(
      f
    );
  }
);

const realmVillageGroup=
  new THREE.Group();

realmVillageGroup.visible=false;

scene.add(
  realmVillageGroup
);

realmVillageGroup.add(
  makeGround(
    100,
    0x21170f
  )
);

for(let i=0;i<12;i++){
  const h=
    makeHut(
      (Math.random()-0.5)*28,
      -8-Math.random()*30,
      Math.random()*Math.PI
    );

  realmVillageGroup.add(
    h
  );
}

for(let i=0;i<14;i++){
  const vill=
    makeHumanoid(
      0x8e8172,
      [
        0x201414,
        0x171c17,
        0x171720
      ][i%3]
    );

  vill.position.set(
    (Math.random()-0.5)*32,
    0,
    -4-Math.random()*32
  );

  realmVillageGroup.add(
    vill
  );
}

const realmPos4=
  makeTrailMarker(
    "POS 4 • ALAM LAIN",
    0,
    8
  );

realmVillageGroup.add(
  realmPos4
);

for(
  let z=-4;
  z>-38;
  z-=6
){
  realmVillageGroup.add(
    makeLamp(
      -8,
      z
    ),

    makeLamp(
      8,
      z
    )
  );
}

const realmRules=[
  "PERATURAN ALAM LAIN",
  "1. Jangan keluar dari jalur.",
  "2. Jangan menjawab panggilan dari belakang.",
  "3. Ikuti semua misi yang diberikan.",
  "4. Jangan menyebut nama Sari."
];

const ruleCanvas=
  document.createElement("canvas");

ruleCanvas.width=900;
ruleCanvas.height=500;

const ruleCtx=
  ruleCanvas.getContext("2d");

ruleCtx.fillStyle="#18120d";

ruleCtx.fillRect(
  0,
  0,
  900,
  500
);

ruleCtx.fillStyle="#d7c29a";
ruleCtx.font=
  "bold 42px Georgia";

ruleCtx.fillText(
  realmRules[0],
  50,
  70
);

ruleCtx.font=
  "28px Georgia";

realmRules.slice(1).forEach(
  function(t,i){
    ruleCtx.fillText(
      t,
      50,
      145+i*75
    );
  }
);

const ruleBoard=
  new THREE.Mesh(
    new THREE.PlaneGeometry(
      6.8,
      3.8
    ),
    new THREE.MeshBasicMaterial({
      map:new THREE.CanvasTexture(
        ruleCanvas
      )
    })
  );

ruleBoard.position.set(
  0,
  2,
  -2
);

realmVillageGroup.add(
  ruleBoard
);

villageGroup.add(
  makeGround(
    120,
    0x2a2013
  )
);

const villageHutPositions=[
  [-10,-14,0.4],
  [10,-15,-0.4],
  [-14,-30,0.7],
  [14,-30,-0.7],
  [0,-40,0]
];

villageHutPositions.forEach(
  function(p){
    villageGroup.add(
      makeHut(
        p[0],
        p[1],
        p[2]
      )
    );
  }
);

const pendopoFloor=
  new THREE.Mesh(
    new THREE.CylinderGeometry(
      4.2,
      4.2,
      0.3,
      10
    ),
    new THREE.MeshStandardMaterial({
      color:0x3a2c18,
      roughness:1
    })
  );

pendopoFloor.position.set(
  0,
  0.15,
  -22
);

villageGroup.add(
  pendopoFloor
);

const pillarMat=
  new THREE.MeshStandardMaterial({
    color:0x1c1409,
    roughness:1
  });

const pillarGeo=
  new THREE.CylinderGeometry(
    0.14,
    0.14,
    3,
    6
  );

for(let i=0;i<6;i++){
  const ang=
    (i/6)*Math.PI*2;

  const pillar=
    new THREE.Mesh(
      pillarGeo,
      pillarMat
    );

  pillar.position.set(
    Math.cos(ang)*3.9,
    1.5,
    -22+Math.sin(ang)*3.9
  );

  villageGroup.add(
    pillar
  );
}

const pendopoRoof=
  new THREE.Mesh(
    new THREE.ConeGeometry(
      5,
      2.2,
      10
    ),
    new THREE.MeshStandardMaterial({
      color:0x140d06,
      roughness:1
    })
  );

pendopoRoof.position.set(
  0,
  4.1,
  -22
);

villageGroup.add(
  pendopoRoof
);

const fireLight=
  new THREE.PointLight(
    0xff8a3c,
    1.6,
    22,
    2
  );

fireLight.position.set(
  0,
  1.2,
  -22
);

villageGroup.add(
  fireLight
);

const fireMesh=
  new THREE.Mesh(
    new THREE.ConeGeometry(
      0.3,
      0.9,
      6
    ),
    new THREE.MeshStandardMaterial({
      color:0xff6a1a,
      emissive:0xff4400,
      emissiveIntensity:1
    })
  );

fireMesh.position.set(
  0,
  0.5,
  -22
);

villageGroup.add(
  fireMesh
);

villageGroup.add(
  makeFoodOffering(
    -2.2,
    -20.8
  ),
  makeFoodOffering(
    2.2,
    -20.8
  )
);

const erlinaSeated=
  makeHumanoid(
    0xcabfb0,
    0x6b1414
  );

erlinaSeated.position.set(
  0.4,
  0,
  -22.6
);

erlinaSeated.scale.set(
  1,
  0.72,
  1
);

villageGroup.add(
  erlinaSeated
);

const nenekVillage=
  makeHumanoid(
    0xcfc6b8,
    0x0a0a0a
  );

nenekVillage.position.set(
  0,
  0,
  -16
);

villageGroup.add(
  nenekVillage
);

const villagers=[];

for(let i=0;i<22;i++){
  const ang=
    Math.random()*Math.PI*2;

  const rad=
    6+
    Math.random()*10;

  const vg=
    makeHumanoid(
      0x9a8f80,
      [
        0x3a1414,
        0x1a2a1a,
        0x141a2a,
        0x2a2214
      ][i%4]
    );

  vg.position.set(
    Math.cos(ang)*rad,
    0,
    -22+Math.sin(ang)*rad
  );

  vg.lookAt(
    0,
    vg.position.y,
    -22
  );

  villageGroup.add(
    vg
  );

  villagers.push(
    vg
  );
}

for(
  let z=-5;
  z>-42;
  z-=6
){
  villageGroup.add(
    makeLamp(
      -7,
      z
    ),

    makeLamp(
      7,
      z
    )
  );
}

graveyardGroup.add(
  makeGround(
    120,
    0x151109
  )
);

for(let i=0;i<40;i++){
  graveyardGroup.add(
    makeGrave(
      (Math.random()-0.5)*50,
      -(Math.random()*45+3)
    )
  );
}

const deadTreeMat=
  new THREE.MeshStandardMaterial({
    color:0x1a140d,
    roughness:1
  });

const deadTreeGeo=
  new THREE.CylinderGeometry(
    0.15,
    0.3,
    5,
    5
  );

for(let i=0;i<10;i++){
  const dt=
    new THREE.Mesh(
      deadTreeGeo,
      deadTreeMat
    );

  dt.position.set(
    (Math.random()-0.5)*55,
    2.5,
    -(Math.random()*45+2)
  );

  dt.rotation.z=
    (Math.random()-0.5)*0.3;

  graveyardGroup.add(
    dt
  );
}

const distantFigures=[];

for(let i=0;i<7;i++){
  const f=
    makeHumanoid(
      0x8a8070,
      0x0a0a0a
    );

  f.position.set(
    -24+i*8,
    0,
    -46
  );

  graveyardGroup.add(
    f
  );

  distantFigures.push(
    f
  );
}

const nenekGraveyard=
  makeHumanoid(
    0xcfc6b8,
    0x0a0a0a
  );

nenekGraveyard.position.set(
  0,
  0,
  -44
);

graveyardGroup.add(
  nenekGraveyard
);

const erlinaEscort=
  makeHumanoid(
    0xcabfb0,
    0x6b1414
  );

erlinaEscort.visible=false;

graveyardGroup.add(
  erlinaEscort
);

const graveyardExitClue=
  makeMultilineSign(
    [
      "JANGAN TERSASAR",
      "IKUTI CAHAYA MERAH ->",
      "JALAN KELUAR"
    ],
    3.8,
    2.2,
    {
      fontSize:44,
      lineHeight:54
    }
  );

graveyardExitClue.position.set(
  0,
  2.1,
  -22
);

graveyardExitClue.rotation.y=Math.PI;
graveyardExitClue.userData.graveyardExitClue={
  read:false
};

graveyardGroup.add(
  graveyardExitClue
);

const EYE_HEIGHT=1.7;

camera.position.set(
  0,
  EYE_HEIGHT,
  24
);

let yaw=0;
let pitch=0;

const keys={};
let pointerLocked=false;
let paused=false;
let verticalVelocity=0;
let grounded=true;

const JUMP_SPEED=6.8;
const GRAVITY=20;

document.addEventListener(
  "keydown",
  function(e){
    keys[e.code]=true;

    if(
      e.code==="Space"
    ){
      e.preventDefault();

      if(
        !e.repeat&&
        !paused&&
        moveEnabled&&
        grounded
      ){
        verticalVelocity=JUMP_SPEED;
        grounded=false;
        thud();
      }
    }

    if(
      e.code==="KeyE"&&
      !paused
    ){
      tryInteract();
    }

    if(
      e.code==="KeyR"&&
      !paused&&
      stage==="eatPrompt"
    ){
      refuseFood();
    }

    if(
      e.code==="KeyF"&&
      !e.repeat
    ){
      const isOn=
        flashlight.intensity>0;

      flashlight.intensity=
        isOn?
        0:
        2.2;

      flashlightBeam.visible=
        !isOn;

      flashlightGlow.intensity=
        isOn?
        0:
        0.75;
    }
  }
);

document.addEventListener(
  "keyup",
  function(e){
    keys[e.code]=false;
  }
);

function requestLock(){
  if(!domEl){
    return;
  }

  const lock=
    domEl.requestPointerLock||
    domEl.mozRequestPointerLock;

  if(typeof lock==="function"){
    try{
      lock.call(domEl);
    }catch(error){
      console.warn(
        "Pointer Lock tidak tersedia:",
        error
      );
    }
  }
}

document.addEventListener(
  "pointerlockchange",
  function(){
    pointerLocked=
      document.pointerLockElement===
      domEl;

    if(
      !pointerLocked&&
      stage!=="intro"&&
      stage!=="ending"
    ){
      paused=true;
      pauseOverlay.style.display="flex";
      pauseOverlay.setAttribute("aria-hidden","false");
    }
  }
);

domEl.addEventListener(
  "click",
  function(){
    if(
      !pointerLocked&&
      stage!=="ending"
    ){
      requestLock();
    }
  }
);

document.addEventListener(
  "mousemove",
  function(e){
    if(!pointerLocked){
      return;
    }

    yaw-=
      e.movementX*
      0.0022;

    pitch-=
      e.movementY*
      0.0022;

    pitch=
      Math.max(
        -1.3,
        Math.min(
          1.3,
          pitch
        )
      );
  }
);

let footstepAcc=0;

const obstacles=[];

forestGroup.traverse(
  function(object){
    if(object.userData.obstacle){
      obstacles.push(
        object
      );
    }
  }
);

function collidesWithObstacle(
  x,
  z
){
  if(!grounded){
    return false;
  }

  if(
    forestGroup.visible&&
    Math.abs(x)>10
  ){
    return true;
  }

  for(
    let i=0;
    i<obstacles.length;
    i++
  ){
    const obstacle=
      obstacles[i];

    const radius=
      obstacle.userData.obstacle.radius+
      0.55;

    const dx=x-obstacle.position.x;
    const dz=z-obstacle.position.z;

    if(
      dx*dx+
      dz*dz<
      radius*radius
    ){
      return true;
    }
  }

  return false;
}

function updatePlayer(
  dt,
  moveEnabled
){
  camera.rotation.order="YXZ";

  camera.rotation.y=yaw;
  camera.rotation.x=pitch;

  if(
    flashlight.intensity>0
  ){
    const flicker=
      1+
      Math.sin(
        performance.now()*0.02
      )*
      0.03;

    flashlightGlow.intensity=
      0.75*flicker;
  }

  if(!grounded||verticalVelocity>0){
    verticalVelocity-=GRAVITY*dt;
    camera.position.y+=verticalVelocity*dt;

    if(
      camera.position.y<=EYE_HEIGHT
    ){
      camera.position.y=EYE_HEIGHT;
      verticalVelocity=0;
      grounded=true;
    }
  }

  if(!moveEnabled){
    return;
  }

  const speed=
    keys.ShiftLeft?
    7.6:
    4.8;

  let mx=0;
  let mz=0;

  if(
    keys.KeyW||
    keys.ArrowUp
  ){
    mz-=1;
  }

  if(
    keys.KeyS||
    keys.ArrowDown
  ){
    mz+=1;
  }

  if(
    keys.KeyA||
    keys.ArrowLeft
  ){
    mx-=1;
  }

  if(
    keys.KeyD||
    keys.ArrowRight
  ){
    mx+=1;
  }

  if(mx||mz){
    const len=
      Math.hypot(
        mx,
        mz
      );

    mx/=len;
    mz/=len;

    const sinY=
      Math.sin(yaw);

    const cosY=
      Math.cos(yaw);

    const dx=
      (mx*cosY-mz*sinY)*
      speed*
      dt;

    const dz=
      (mx*sinY+mz*cosY)*
      speed*
      dt;

    const nextX=
      camera.position.x+
      dx;

    const nextZ=
      camera.position.z+
      dz;

    if(
      !collidesWithObstacle(
        nextX,
        nextZ
      )
    ){
      camera.position.x=
        nextX;

      camera.position.z=
        nextZ;
    }

    footstepAcc+=
      Math.hypot(
        dx,
        dz
      );

    if(
      footstepAcc>1.6
    ){
      footstepAcc=0;
      footstep();
    }
  }

  if(grounded){
    camera.position.y=
      EYE_HEIGHT+
      Math.sin(
        performance.now()*0.006
      )*
      0.02*
      (mx||mz?1:0.3);
  }
}

const narrativeEl=
  document.getElementById(
    "narrative"
  );

const audioButton=
  document.querySelector(
    ".audio-btn"
  );

const pauseOverlay=
  document.getElementById(
    "pauseOverlay"
  );

const subtitleEl=
  document.getElementById(
    "subtitle"
  );

const promptEl=
  document.getElementById(
    "interactPrompt"
  );

const stampEl=
  document.getElementById(
    "stamp"
  );

const fadeEl=
  document.getElementById(
    "fadeOverlay"
  );

const redFlashEl=
  document.getElementById(
    "redFlash"
  );

const jumpscareEl=
  document.getElementById(
    "jumpscare"
  );

const jumpscareImg=
  document.getElementById(
    "jumpscareImg"
  );

function showNarrative(
  text,
  ms
){
  narrativeEl.textContent=text;
  narrativeEl.style.opacity=1;

  clearTimeout(
    showNarrative._t
  );

  if(ms!==0){
    showNarrative._t=
      setTimeout(
        function(){
          narrativeEl.style.opacity=0;
        },
        ms||4200
      );
  }
}

function hideNarrative(){
  narrativeEl.style.opacity=0;
}

function showSubtitle(
  text,
  ms
){
  subtitleEl.textContent=text;
  subtitleEl.style.opacity=1;

  clearTimeout(
    showSubtitle._t
  );

  showSubtitle._t=
    setTimeout(
      function(){
        subtitleEl.style.opacity=0;
      },
      ms||2600
    );
}

function showStamp(
  text
){
  stampEl.textContent=text;
  stampEl.style.opacity=1;

  clearTimeout(
    showStamp._t
  );

  showStamp._t=
    setTimeout(
      function(){
        stampEl.style.opacity=0;
      },
      3800
    );
}

function showPrompt(
  text
){
  promptEl.textContent=text;
  promptEl.style.opacity=1;
}

function hidePrompt(){
  promptEl.style.opacity=0;
}

function fadeToBlack(
  cb,
  holdMs
){
  fadeEl.style.opacity=1;

  setTimeout(
    function(){
      if(cb){
        cb();
      }

      setTimeout(
        function(){
          fadeEl.style.opacity=0;
        },
        holdMs||500
      );
    },
    1150
  );
}

function flashRed(){
  redFlashEl.style.opacity=0.55;

  setTimeout(
    function(){
      redFlashEl.style.opacity=0;
    },
    90
  );
}

function shakeCamera(
  duration,
  magnitude
){
  const start=
    performance.now();

  const origPitch=pitch;
  const origYaw=yaw;

  function step(){
    const t=
      performance.now()-
      start;

    if(t>duration){
      return;
    }

    pitch=
      origPitch+
      (Math.random()-0.5)*
      magnitude;

    yaw=
      origYaw+
      (Math.random()-0.5)*
      magnitude;

    requestAnimationFrame(
      step
    );
  }

  step();
}

function jumpscare(
  variant,
  holdMs,
  cb
){
  try{
    ensureAudio();
    stinger();
  }catch(error){
    console.warn(
      "Suara jumpscare tidak tersedia:",
      error
    );
  }

  jumpscareImg.src=
    creepyFaceDataURL(
      variant
    );

  jumpscareEl.style.display=
    "flex";

  flashlight.intensity=0;

  setTimeout(
    function(){
      flashlight.intensity=2.2;
    },
    180
  );

  shakeCamera(
    holdMs||650,
    0.12
  );

  setTimeout(
    function(){
      jumpscareEl.style.display=
        "none";

      if(cb){
        cb();
      }
    },
    holdMs||650
  );
}

let stage="intro";
let stageTimer=0;
let moveEnabled=false;
let braceletTaken=false;
let foodEaten=false;
let foodRefused=false;
let villageTwistDone=false;
let missingIndex=0;
let caveSequenceStarted=false;
let sariRevealDone=false;
let trailChallenge=null;
let trailChallenge1Triggered=false;
let trailChallenge2Triggered=false;
let trailChallenge3Triggered=false;
const posWarningsShown={};
let posWarningActive=false;
let posWarningArmed=false;
let posWarningCallback=null;

function isLookingBehind(){
  const wrappedYaw=
    Math.atan2(
      Math.sin(yaw),
      Math.cos(yaw)
    );

  return Math.abs(wrappedYaw)>2.25;
}

function triggerPosWarning(
  posLabel,
  afterWarning
){
  if(
    posWarningsShown[posLabel]||
    posWarningActive
  ){
    return false;
  }

  posWarningsShown[posLabel]=true;
  posWarningActive=true;
  posWarningArmed=true;
  posWarningCallback=afterWarning||null;
  showStamp(posLabel);
  showSubtitle("JANGAN MENENGOK KE BELAKANG",0);

  return true;
}

function activatePosWarning(){
  if(!posWarningArmed){
    return;
  }

  posWarningArmed=false;
  moveEnabled=false;
  hidePrompt();
  flashRed();
  warningRumble();

  setTimeout(
    function(){
      jumpscare(
        "nenek",
        1500,
        function(){
          posWarningActive=false;
          moveEnabled=true;
          showSubtitle(
            "Jangan menoleh... teruskan perjalanan.",
            2600
          );

          if(posWarningCallback){
            posWarningCallback();
          }

          posWarningCallback=null;
        }
      );
    },
    900
  );
}

function startTrailChallenge(
  challenge
){
  trailChallenge=challenge;
  moveEnabled=true;

  showStamp(
    challenge.stamp
  );

  showNarrative(
    challenge.narrative,
    0
  );

  showSubtitle(
    challenge.subtitle,
    0
  );

  showPrompt(
    "Tekan [E] — "+
    challenge.prompt
  );

  setStage(
    "trailChallenge"
  );
}

function completeTrailChallenge(){
  if(
    !trailChallenge||
    dist2D(
      camera.position,
      trailChallenge.target
    )>6
  ){
    showPrompt(
      "Dekati lokasi tantangan terlebih dahulu"
    );
    return;
  }

  const nextStage=trailChallenge.nextStage;

  trailChallenge=null;
  hidePrompt();
  moveEnabled=true;

  showSubtitle(
    "Tantangan selesai. Jalan di depan kembali terbuka.",
    2600
  );

  setStage(
    nextStage
  );
}

function dist2D(
  a,
  b
){
  return Math.hypot(
    a.x-b.x,
    a.z-b.z
  );
}

function setStage(
  name
){
  stage=name;
  stageTimer=0;
}

function tryInteract(){
  if(
    stage==="trailChallenge"
  ){
    completeTrailChallenge();
    return;
  }

  if(
    graveyardGroup.visible&&
    dist2D(
      camera.position,
      graveyardExitClue.position
    )<6
  ){
    graveyardExitClue.userData.graveyardExitClue.read=true;
    hidePrompt();
    showStamp("PETUNJUK KUBURAN");
    showNarrative(
      "Tulisan tua itu menunjukkan jalan keluar. Ikuti cahaya merah sampai melewati gerbang kuburan.",
      5000
    );
    showSubtitle(
      "IKUTI CAHAYA MERAH -> JALAN KELUAR",
      4200
    );
    return;
  }

  for(
    let i=0;
    i<mysteryClues.length;
    i++
  ){
    const clue=mysteryClues[i];

    if(
      !clue.userData.mysteryClue.read&&
      dist2D(
        camera.position,
        clue.position
      )<4.8
    ){
      const data=clue.userData.mysteryClue;
      data.read=true;

      hidePrompt();
      showStamp(
        "PETUNJUK "+
        (i+1)+
        " DITEMUKAN"
      );
      showNarrative(
        data.message,
        6200
      );
      showSubtitle(
        data.subtitle,
        4200
      );
      whisper();

      if(i===1){
        moveEnabled=false;

        setTimeout(
          function(){
            jumpscare(
              "crowd",
              780,
              function(){
                moveEnabled=true;
                showSubtitle(
                  "Saat cahaya kembali, foto itu sudah tidak ada.",
                  3000
                );
              }
            );
          },
          900
        );
      }

      return;
    }
  }

  if(
    stage==="pos4"&&
    dist2D(
      camera.position,
      braceletObj.position
    )<3.2
  ){
    braceletTaken=true;
    braceletObj.visible=false;

    hidePrompt();

function updateMysteryCluePrompt(){
  if(
    stage==="trailChallenge"||
    stage==="pos4"||
    stage==="eatPrompt"||
    stage==="ending"
  ){
    return;
  }

  if(
    graveyardGroup.visible&&
    dist2D(
      camera.position,
      graveyardExitClue.position
    )<6
  ){
    showPrompt(
      "Tekan [E] — baca petunjuk jalan keluar"
    );
    return;
  }

  for(
    let i=0;
    i<mysteryClues.length;
    i++
  ){
    const clue=mysteryClues[i];

    if(
      !clue.userData.mysteryClue.read&&
      dist2D(
        camera.position,
        clue.position
      )<4.8
    ){
      showPrompt(
        "Tekan [E] — periksa petunjuk"
      );
      return;
    }
  }
}

    showStamp(
      "GELANG DITEMUKAN"
    );

    showNarrative(
      "Di sudut toilet Pos 4, ada sebuah gelang yang seolah sengaja ditinggalkan.",
      4200
    );

    showSubtitle(
      '"Ini punya siapa?"',
      2600
    );

    setTimeout(
      function(){
        showSubtitle(
          'Eva: "Udah, simpan dulu. Kita lanjut cari Sari dan Erlina."',
          3200
        );

        setStage(
          "afterBracelet"
        );
      },
      2300
    );
  }

  if(
    stage==="eatPrompt"&&
    !foodEaten
  ){
    foodEaten=true;
    foodRefused=false;
    hidePrompt();
    doEatSequence();
  }
}

function refuseFood(){
  if(
    stage!=="eatPrompt"||
    foodEaten||
    foodRefused
  ){
    return;
  }

  foodRefused=true;
  hidePrompt();
  moveEnabled=false;

  showNarrative(
    "Ridwan menolak hidangan itu. Senyum nenek di depannya perlahan menghilang.",
    4800
  );

  showSubtitle(
    'Nenek: "Kalau tidak makan, jangan harap bisa pulang."',
    3400
  );

  whisper();

  setTimeout(
    function(){
      if(stage!=="eatPrompt"){
        return;
      }

      showSubtitle(
        "Dari belakang terdengar suara Sari memanggil namamu.",
        3000
      );

      moveEnabled=true;
      setStage("afterEat");
    },
    3600
  );
}

function beginGame(){
  document.getElementById(
    "menu"
  ).style.display="none";

  document.getElementById(
    "hud"
  ).style.display="block";

  renderer.domElement.style.display=
    "block";

  renderer.setSize(
    window.innerWidth,
    window.innerHeight,
    false
  );

  camera.aspect=
    window.innerWidth/
    window.innerHeight;

  camera.updateProjectionMatrix();

  try{
    ensureAudio();
    startAmbient();
  }catch(error){
    console.warn(
      "Audio tidak tersedia:",
      error
    );
  }

  requestLock();
  paused=false;

  setStage(
    "intro"
  );

  moveEnabled=false;

  partyGroup.visible=true;

  fadeEl.style.opacity=1;

  showStamp(
    "1 SURO • 02:00 DINI HARI"
  );

  showNarrative(
    "POV RIDWAN — Enam sahabat mendaki Gunung Kiwi. Dua orang hilang sebelum Pos 2, tetapi tidak ada seorang pun yang ingat kapan mereka terakhir bersama.",
    6500
  );

  setTimeout(
    function(){
      showSubtitle(
        'Ridwan: "Kita cari mereka sampai ketemu. Jangan berpencar."',
        3300
      );
    },
    900
  );

  setTimeout(
    function(){
      showSubtitle(
        'Eva: "Terakhir mereka terlihat di Pos 2... tapi kenapa foto ini punya enam bayangan?"',
        3000
      );
    },
    3000
  );

  setTimeout(
    function(){
      fadeEl.style.opacity=1;

      setTimeout(
        function(){
          introGroup.visible=false;
          partyGroup.visible=false;

          camera.position.set(
            0,
            EYE_HEIGHT,
            4
          );

          yaw=0;
          pitch=0;

          showStamp(
            "KAKI GUNUNG KIWI • 03:50"
          );

          showNarrative(
            "Pendakian dimulai. Tujuan mereka hanya satu: menemukan Erlina dan Sari.",
            3800
          );

          fadeEl.style.opacity=0;

          moveEnabled=true;

          setStage(
            "toPos2"
          );
        },
        1100
      );
    },
    6500
  );
}

function updateForestStage(
  dt
){
  const p=
    camera.position;

  if(posWarningArmed){
    if(isLookingBehind()){
      activatePosWarning();
    }

    return;
  }

  if(posWarningActive){
    return;
  }

  if(
    stage==="toPos2"&&
    p.z<-18*PATH_SCALE&&
    triggerPosWarning("POS 1")
  ){
    return;
  }

  if(
    stage==="toPos4"&&
    p.z<-58*PATH_SCALE&&
    triggerPosWarning("POS 3")
  ){
    return;
  }

  if(
    stage==="toPos2"
  ){
    if(
      p.z<-27*PATH_SCALE&&
      !trailChallenge1Triggered
    ){
      trailChallenge1Triggered=true;

      startTrailChallenge({
        stamp:"TANTANGAN 1",
        narrative:"Jalur tertutup batang pohon tumbang. Dari balik pepohonan terdengar langkah yang mengikuti ritme langkahmu.",
        subtitle:"Jangan menoleh. Singkirkan penghalangnya dan terus berjalan.",
        prompt:"loncati pohon tumbang dengan Space",
        target:{
          x:-3.4,
          z:-30*PATH_SCALE
        },
        nextStage:"toPos2"
      });
    }

    else if(
      p.z<-34*PATH_SCALE
    ){
      setStage("pos2");
      moveEnabled=false;

      showStamp(
        "POS 2"
      );

      showNarrative(
        "Pos 2. Tempat terakhir Erlina dan Sari terlihat.",
        4500
      );

      showSubtitle(
        'Ridwan: "Mereka nggak mungkin hilang begitu aja..."',
        3200
      );

      triggerPosWarning(
        "POS 2",
        function(){
          setStage(
            "toPos4"
          );
        }
      );
    }
  }

  else if(
    stage==="toPos4"
  ){
    if(
      p.z<-48*PATH_SCALE&&
      !trailChallenge2Triggered
    ){
      trailChallenge2Triggered=true;

      startTrailChallenge({
        stamp:"TANTANGAN 2",
        narrative:"Kabut menutup jalan dan suara Erlina memanggil dari arah belakang. Jalan hanya terbuka jika kamu berani mengabaikannya.",
        subtitle:"Tetap menghadap ke depan. Dengarkan suara penunjuk jalan di depanmu.",
        prompt:"abaikan panggilan dari belakang",
        target:{
          x:3.7,
          z:-49*PATH_SCALE
        },
        nextStage:"toPos4"
      });
    }

    else if(
      p.z<-73*PATH_SCALE
    ){
      setStage(
        "pos4"
      );

      showStamp(
        "POS 4"
      );

      braceletObj.visible=true;

      showNarrative(
        "Pos 4. Di belakang bangunan pos terdapat toilet tua. Mereka berhenti untuk mencari petunjuk Erlina dan Sari.",
        4200
      );

      triggerPosWarning(
        "POS 4",
        function(){
          showPrompt(
            "Tekan [E] — periksa toilet"
          );
        }
      );
    }
  }

  else if(
    stage==="pos4"
  ){
    if(
      dist2D(
        p,
        pos4Toilet.position
      )<5
    ){
      showPrompt(
        "Tekan [E] — masuk / periksa toilet"
      );
    }else{
      hidePrompt();
    }
  }

  else if(
    stage==="afterBracelet"
  ){
    if(
      p.z<-87*PATH_SCALE&&
      !trailChallenge3Triggered
    ){
      trailChallenge3Triggered=true;

      startTrailChallenge({
        stamp:"TANTANGAN 3",
        narrative:"Sebuah bungkusan merah bercahaya menghalangi jalan menuju Pos 5. Udara di sekitarnya terasa jauh lebih dingin.",
        subtitle:"Periksa bungkusan itu sebelum memilih jalan berikutnya.",
        prompt:"periksa bungkusan merah",
        target:{
          x:3.8,
          z:-88*PATH_SCALE
        },
        nextStage:"afterBracelet"
      });
    }

    else if(
      p.z<-91*PATH_SCALE
    ){
      setStage(
        "pos5"
      );

      hidePrompt();

      showStamp(
        "POS 5"
      );

      showNarrative(
        "Pos 5. Di depan berdiri sebuah plang peringatan besar dengan dua arah jalan.",
        4300
      );

      showSubtitle(
        "Kiri gelap dan dipenuhi pepohonan. Kanan diterangi lampu kuning.",
        4300
      );

      triggerPosWarning("POS 5");
    }
  }

  else if(
    stage==="pos5"
  ){
    if(
      p.z<-103*PATH_SCALE&&
      p.x<-3
    ){
      setStage(
        "darkBranch"
      );

      showNarrative(
        "Jalan kiri semakin gelap. Pepohonan menutup cahaya bulan.",
        3600
      );

      showSubtitle(
        "Sepertinya jalan ini tidak membawa ke mana-mana...",
        2600
      );
    }

    else if(
      p.z<-103*PATH_SCALE&&
      p.x>3
    ){
      setStage(
        "brightBranch"
      );

      showNarrative(
        "Jalan kanan justru terang. Lampu kuning berjejer seperti sedang menunggu kedatangan mereka.",
        5000
      );

      showSubtitle(
        "Dari kejauhan terdengar gamelan.",
        3200
      );

      startGamelan();
    }
  }

  else if(
    stage==="darkBranch"
  ){
    if(
      p.z<-112*PATH_SCALE
    ){
      showSubtitle(
        "Tidak ada jalan. Hanya hutan yang semakin rapat.",
        2600
      );

      whisper();

      camera.position.x=
        Math.max(
          -2,
          p.x+0.35
        );

      camera.position.z=
        -104*PATH_SCALE;

      setStage(
        "pos5"
      );
    }
  }

  else if(
    stage==="brightBranch"
  ){
    if(
      p.z<-137*PATH_SCALE
    ){
      enterVillage();
    }
  }

  else if(
    stage==="summit"
  ){
    if(
      stageTimer>2
    ){
      showStamp(
        "PUNCAK"
      );

      showNarrative(
        "Setelah keluar dari desa aneh itu, mereka akhirnya mencapai puncak.",
        4500
      );

      setStage(
        "summitTalk"
      );
    }
  }

  else if(
    stage==="summitTalk"&&
    stageTimer>5
  ){
    showSubtitle(
      'Ridwan: "Tunggu... Sari belum ketemu. Kita nggak bisa meninggalkan dia."',
      3500
    );

    setTimeout(
      function(){
        showSubtitle(
          'Eva: "Kita turun sekarang." — Dani: "Nggak. Kita cari Sari dulu."',
          4200
        );
      },
      2600
    );

    setTimeout(
      function(){
        showSubtitle(
          "Perdebatan memecah mereka menjadi dua kubu. Pada akhirnya mereka sepakat turun bersama sambil tetap mencari Sari.",
          3000
        );

        setStage(
          "descendingLoop"
        );

        moveEnabled=true;
      },
      7000
    );
  }

  else if(
    stage==="descendingLoop"
  ){
    if(
      p.z>-105*PATH_SCALE
    ){
      fadeToBlack(
        function(){
          camera.position.set(
            0,
            EYE_HEIGHT,
            -100*PATH_SCALE
          );

          yaw=0;
          pitch=0;

          showStamp(
            "JALUR TURUN"
          );

          showNarrative(
            "Mereka sudah melewati banyak pos. Namun papan yang sama kembali muncul di depan mata.",
            4800
          );
        },
        500
      );

      setStage(
        "loopAgain"
      );
    }
  }

  else if(
    stage==="loopAgain"
  ){
    if(
      stageTimer>5
    ){
      showSubtitle(
        'Ridwan: "Kita dari tadi turun... kenapa Pos 4 masih di sini?"',
        3600
      );

      setTimeout(
        function(){
          enterOtherRealm();
        },
        3200
      );

      setStage(
        "enterForestRealm"
      );
    }
  }
}

function enterVillage(){
  moveEnabled=false;

  stopGamelan();

  fadeToBlack(
    function(){
      forestGroup.visible=false;
      villageGroup.visible=true;

      camera.position.set(
        0,
        EYE_HEIGHT,
        6
      );

      yaw=0;
      pitch=0;

      scene.fog.color.set(
        0x241a10
      );

      scene.fog.density=0.03;
    }
  );

  setTimeout(
    function(){
      startGamelan();

      showStamp(
        "KAMPUNG"
      );

      showNarrative(
        "Di balik jalan bercahaya, mereka menemukan sebuah kampung yang ramai dan terasa anehnya hangat.",
        5600
      );

      showSubtitle(
        'Nenek berkebaya hitam: "Mari, Nak. Makan dulu. Kalian pasti lelah."',
        4300
      );

      moveEnabled=true;

      setStage(
        "villageWalk"
      );
    },
    1700
  );
}

function updateVillageStage(
  dt
){
  const p=
    camera.position;

  if(
    stage==="villageWalk"
  ){
    if(
      dist2D(
        p,
        nenekVillage.position
      )<5
    ){
      showPrompt(
        "Tekan [E] — terima hidangan"
      );

      setStage(
        "eatPrompt"
      );
    }
  }

  else if(
    stage==="eatPrompt"
  ){
    if(
      dist2D(
        p,
        nenekVillage.position
      )<5&&
      !foodEaten
    ){
      showPrompt(
        "[E] Santap hidangan  |  [R] Tolak"
      );
    }

    else if(
      !foodEaten
    ){
      hidePrompt();
    }
  }

  else if(
    stage==="afterEat"
  ){
    if(
      stageTimer>3&&
      !villageTwistDone
    ){
      villageTwistDone=true;
      moveEnabled=true;

      showNarrative(
        foodRefused?
        "Setelah menolak hidangan, mereka sadar jalan keluar dari kampung itu telah berubah. Lalu seseorang di pendopo menarik perhatian.":
        "Setelah makan, mereka sadar tujuan awal mereka terasa kabur. Lalu seseorang di pendopo menarik perhatian.",
        5000
      );

      showSubtitle(
        "Sosok itu... mirip Erlina.",
        2800
      );

      setStage(
        "meetErlina"
      );
    }
  }

  else if(
    stage==="meetErlina"
  ){
    if(
      dist2D(
        p,
        erlinaSeated.position
      )<5
    ){
      moveEnabled=false;

      showSubtitle(
        'Eva: "Er, lu ko bisa ada disini?! Lu kenapa pucet bgt?"',
        4200
      );

      setTimeout(
        function(){
          triggerGraveyardTwist();
        },
        4300
      );

      setStage(
        "twistWaiting"
      );
    }
  }
}

function doEatSequence(){
  hidePrompt();
  moveEnabled=false;

  showNarrative(
    "Mereka duduk dan menyantap hidangan yang disediakan. Hangatnya makanan membuat pikiran mereka terasa berat.",
    5200
  );

  setTimeout(
    function(){
      stopGamelan();

      showSubtitle(
        "Beberapa detik kemudian... suasana yang ramai mendadak hening.",
        3200
      );

      villagers.forEach(
        function(v){
          v.lookAt(
            camera.position.x,
            0,
            camera.position.z
          );
        }
      );

      nenekVillage.lookAt(
        camera.position.x,
        0,
        camera.position.z
      );

      thud();

      setTimeout(
        function(){
          startGamelan();

          moveEnabled=true;

          setStage(
            "afterEat"
          );
        },
        3000
      );
    },
    3000
  );
}

function triggerGraveyardTwist(){
  if(
    stage!=="twistWaiting"
  ){
    return;
  }

  moveEnabled=false;

  stopGamelan();

  showNarrative(
    "Mereka menoleh ke belakang. Kampung yang tadi penuh aktivitas sudah berubah menjadi kuburan tua.",
    5200
  );

  setTimeout(
    function(){
      thud();

      fadeToBlack(
        function(){
          villageGroup.visible=false;
          graveyardGroup.visible=true;

          scene.fog.color.set(
            0x0a0806
          );

          scene.fog.density=0.05;

          scene.background=
            new THREE.Color(
              0x030201
            );

          camera.position.set(
            0,
            EYE_HEIGHT,
            -42
          );

          yaw=0;
          pitch=0;

          showStamp(
            "KUBURAN TUA"
          );

          showNarrative(
            "Di tengah pemakaman berdiri pendopo yang sama. Erlina masih ada di sana, pucat dan lemah.",
            5000
          );
        },
        700
      );

      setTimeout(
        function(){
          showSubtitle(
            'Ridwan: "Kita keluar. Sekarang."',
            2600
          );

          startEscort();
        },
        3600
      );
    },
    1800
  );
}

function startEscort(){
  setStage(
    "escort"
  );

  erlinaEscort.visible=true;
  moveEnabled=true;

  showNarrative(
    "Mereka membawa Erlina keluar dari tempat itu tanpa menoleh lagi.",
    4200
  );
}

function updateGraveyardStage(
  dt
){
  const p=
    camera.position;

  if(
    stage==="escort"
  ){
    erlinaEscort.position.set(
      p.x+0.9,
      0,
      p.z+0.9
    );

    erlinaEscort.rotation.y=
      yaw;

    if(
      p.z>-6
    ){
      moveEnabled=false;

      fadeToBlack(
        function(){
          forestGroup.visible=true;
          graveyardGroup.visible=false;

          camera.position.set(
            0,
            EYE_HEIGHT,
            -112*PATH_SCALE
          );

          yaw=0;
          pitch=0;

          scene.fog.color.set(
            0x10100d
          );

          scene.fog.density=0.025;

          showStamp(
            "PUNCAK"
          );

          showNarrative(
            "Mereka berhasil keluar dan mencapai puncak. Baru saat itu mereka sadar: Sari masih belum ditemukan.",
            5200
          );
        },
        800
      );

      setStage(
        "summit"
      );
    }
  }
}

function enterOtherRealm(){
  fadeToBlack(
    function(){
      forestGroup.visible=false;
      graveyardGroup.visible=false;
      villageGroup.visible=false;

      otherRealmGroup.visible=true;
      realmVillageGroup.visible=false;

      camera.position.set(
        0,
        EYE_HEIGHT,
        -4
      );

      yaw=0;
      pitch=0;

      scene.background=
        new THREE.Color(
          0x020202
        );

      scene.fog.color.set(
        0x070706
      );

      scene.fog.density=0.055;

      showStamp(
        "ALAM LAIN"
      );

      showNarrative(
        "Hutan menjadi semakin sunyi. Ridwan berjalan paling depan. Satu per satu suara teman-temannya menghilang.",
        5200
      );
    },
    700
  );

  setTimeout(
    function(){
      setStage(
        "friendsDisappear"
      );

      disappearFriends(0);
    },
    2200
  );
}

function disappearFriends(
  i
){
  if(
    i>=missingFriends.length
  ){
    setTimeout(
      function(){
        showSubtitle(
          "Ridwan berbalik. Tidak ada siapa-siapa.",
          3200
        );

        setTimeout(
          function(){
            startCaveSequence();
          },
          3200
        );
      },
      500
    );

    return;
  }

  missingFriends[i].visible=true;

  showSubtitle(
    missingFriends[i].userData.name+
    "...",
    1200
  );

  setTimeout(
    function(){
      missingFriends[i].visible=false;

      whisper();

      disappearFriends(
        i+1
      );
    },
    1600
  );
}

function startCaveSequence(){
  if(
    caveSequenceStarted
  ){
    return;
  }

  caveSequenceStarted=true;
  moveEnabled=true;

  setStage(
    "toCave"
  );

  showNarrative(
    "Di antara pepohonan, Ridwan melihat sebuah goa.",
    4200
  );
}

function updateOtherRealmStage(
  dt
){
  const p=
    camera.position;

  if(
    stage==="toCave"
  ){
    if(
      p.z<-72
    ){
      moveEnabled=false;

      showNarrative(
        "Di dalam goa terdapat sekte berjubah. Teman-teman Ridwan berdiri diam di belakangnya, seperti sudah dipersiapkan sebagai tumbal.",
        5200
      );

      missingFriends.forEach(
        function(f,i){
          f.visible=true;

          f.position.set(
            -3+i*2,
            0,
            -66
          );
        }
      );

      cultists.forEach(
        function(c){
          c.visible=true;
        }
      );

      sariCult.visible=true;

      setTimeout(
        function(){
          showSubtitle(
            "Dari dalam goa, ketua sekte mulai melafalkan mantra.",
            3200
          );

          whisper();
        },
        2600
      );

      setTimeout(
        function(){
          sariCult.visible=true;

          showStamp(
            "KETUA SEKTE"
          );

          showSubtitle(
            "Ridwan membeku saat wajah ketua itu terlihat.",
            3000
          );
        },
        5200
      );

      setTimeout(
        function(){
          showNarrative(
            "Ketua sekte itu ternyata Sari, teman yang selama ini mereka cari.",
            5600
          );

          showSubtitle(
            'Sari: "Kalian akhirnya datang."',
            3000
          );

          sariRevealDone=true;

          setStage(
            "sariReveal"
          );
        },
        7600
      );
    }
  }

  else if(
    stage==="sariReveal"&&
    stageTimer>5
  ){
    moveEnabled=true;

    showSubtitle(
      "Ridwan berlari tanpa berani menoleh.",
      2800
    );

    setStage(
      "runFromCave"
    );
  }

  else if(
    stage==="runFromCave"
  ){
    if(
      p.z>-30
    ){
      fadeToBlack(
        function(){
          otherRealmGroup.visible=false;
          realmVillageGroup.visible=true;

          camera.position.set(
            0,
            EYE_HEIGHT,
            8
          );

          yaw=0;
          pitch=0;

          scene.background=
            new THREE.Color(
              0x080604
            );

          scene.fog.color.set(
            0x17110b
          );

          scene.fog.density=0.04;

          showStamp(
            "POS 4 • ALAM LAIN"
          );

          showNarrative(
            "Ridwan berlari sampai tiba di tempat yang tampak seperti Pos 4. Namun ini bukan gunung yang sama.",
            5600
          );
        },
        700
      );

      setStage(
        "alternateRealmVillage"
      );
    }
  }
}

function updateRealmVillageStage(
  dt
){
  const p=
    camera.position;

  if(
    stage==="alternateRealmVillage"
  ){
    moveEnabled=true;

    if(
      dist2D(
        p,
        ruleBoard.position
      )<7
    ){
      showPrompt(
        "Tekan [E] — baca peraturan"
      );

      setStage(
        "rules"
      );
    }
  }

  else if(
    stage==="rules"
  ){
    if(
      dist2D(
        p,
        ruleBoard.position
      )>7
    ){
      hidePrompt();
    }else{
      showPrompt(
        "Baca semua peraturan sebelum melanjutkan"
      );
    }

    if(
      stageTimer>6
    ){
      hidePrompt();

      showStamp(
        "MISI DIMULAI"
      );

      showNarrative(
        "Mereka sadar: seluruh rombongan telah masuk ke alam lain. Jika ingin bebas dari tumbal, mereka harus menyelesaikan misi dan mengikuti semua peraturan.",
        7000
      );

      setStage(
        "missionStart"
      );
    }
  }

  else if(
    stage==="missionStart"&&
    stageTimer>7
  ){
    showSubtitle(
      "Misi pertama: ikuti jalan sampai menemukan tanda berikutnya.",
      3200
    );

    setStage(
      "mission1"
    );
  }

  else if(
    stage==="mission1"&&
    p.z<-28
  ){
    showStamp(
      "MISI 1 SELESAI"
    );

    showNarrative(
      "Satu aturan sudah dipenuhi. Tapi suara langkah lain terdengar mengikuti dari belakang.",
      4300
    );

    whisper();

    setTimeout(
      function(){
        showEndingSequence();
      },
      5200
    );

    setStage(
      "ending"
    );

    moveEnabled=false;
  }
}

function showEndingSequence(){
  document.getElementById(
    "hud"
  ).style.display="none";

  const ending=
    document.getElementById(
      "ending"
    );

  const linesBox=
    document.getElementById(
      "endingLines"
    );

  const lines=[
    "Ridwan akhirnya sadar bahwa mereka tidak lagi berada di Gunung Kiwi.",
    "Sari adalah ketua sekte yang selama ini menunggu kedatangan mereka.",
    "Pos 4 yang terlihat di depan mereka bukan Pos 4 yang mereka kenal.",
    "Mereka telah masuk ke alam lain, dan nama mereka sudah dipersiapkan sebagai tumbal.",
    "Jika ingin keluar, mereka harus menyelesaikan semua misi dan mengikuti setiap peraturan.",
    "Beberapa jam kemudian, seorang pendaki menemukan Ridwan berdiri sendirian di kaki gunung.",
    "Ridwan akhirnya pulang.",
    "Tapi yang pulang bukan Ridwan."
  ];

  linesBox.innerHTML="";

  lines.forEach(
    function(t,idx){
      const d=
        document.createElement(
          "div"
        );

      d.className=
        idx===lines.length-1?
        "line final-line":
        "line";
      d.textContent=t;

      linesBox.appendChild(
        d
      );
    }
  );

  ending.style.display="flex";

  const delay=400;

  Array.prototype.forEach.call(
    linesBox.children,
    function(el,idx){
      setTimeout(
        function(){
          el.style.opacity=1;
        },
        delay+idx*1900
      );
    }
  );

  setTimeout(
    function(){
      stinger();

      document.getElementById(
        "bersambung"
      ).style.opacity=1;

      document.getElementById(
        "restartBtn"
      ).style.opacity=1;
    },
    delay+
    lines.length*1900+
    600
  );
}

document.getElementById(
  "restartBtn"
).addEventListener(
  "click",
  function(){
    window.location.reload();
  }
);

document.getElementById(
  "startBtn"
).addEventListener(
  "click",
  beginGame
);

audioButton.addEventListener(
  "click",
  toggleAudio
);

pauseOverlay.addEventListener(
  "click",
  function(){
    paused=false;
    pauseOverlay.style.display="none";
    pauseOverlay.setAttribute("aria-hidden","true");
    requestLock();
  }
);

const clock=
  new THREE.Clock();

let stageUpdateAccumulator=0;
let lastRenderTime=0;
const RENDER_INTERVAL=1000/40;

function animate(){
  requestAnimationFrame(
    animate
  );

  const dt=
    Math.min(
      clock.getDelta(),
      0.05
    );

  const now=performance.now();

  if(!paused){
    stageTimer+=dt;
  }

  stageUpdateAccumulator+=dt;

  updatePlayer(
    dt,
    !paused&&
    moveEnabled&&
    stage!=="intro"
  );

  if(
    !paused&&
    stageUpdateAccumulator>=1/30
  ){
    const stageDt=stageUpdateAccumulator;
    stageUpdateAccumulator=0;

    if(
      forestGroup.visible
    ){
      updateForestStage(
        stageDt
      );

      if(typeof updateMysteryCluePrompt === "function"){
        updateMysteryCluePrompt();
      }
    }

    if(
      villageGroup.visible
    ){
      updateVillageStage(
        stageDt
      );
    }

    if(
      graveyardGroup.visible
    ){
      updateGraveyardStage(
        stageDt
      );

      if(typeof updateMysteryCluePrompt === "function"){
        updateMysteryCluePrompt();
      }
    }

    if(
      otherRealmGroup.visible
    ){
      updateOtherRealmStage(
        stageDt
      );
    }

    if(
      realmVillageGroup.visible
    ){
      updateRealmVillageStage(
        stageDt
      );
    }
  }

  if(
    villageGroup.visible
  ){
    fireLight.intensity=
      1.45+
      Math.sin(
        now*0.012
      )*
      0.25;

    fireMesh.scale.y=
      1+
      Math.sin(
        now*0.014
      )*
      0.12;
  }

  if(
    now-lastRenderTime>=RENDER_INTERVAL
  ){
    lastRenderTime=now;
    
    renderer.render(
      scene,
      camera
    );
  }
}

animate();

})();