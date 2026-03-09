
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const S = 0.01; // 1mm = 0.01 three units

// ══════════════════════════════════════════════════════════
//  MACHINE PARAMETERS (mm)
// ══════════════════════════════════════════════════════════
const P = {
  cardL: 85.6, cardW: 53.98, cardT: 0.76,

  // Frame
  frameL: 380, frameW: 90, baseT: 4, legH: 35, sideH: 50,
  sideT: 3, frameT: 4,

  // Belt conveyor
  beltW: 58, beltT: 1.5,
  rollerD: 28,   // idler & drive roller diameter
  rollerGap: 8,  // roller inset from frame ends

  // Feeder
  magInL: 88, magInW: 56, magWall: 3, magH: 75,
  feedD: 14, feedW: 40,                                // mini belt roller diameter
  feedBeltLen: 60,                                      // mini belt length
  sepL: 22, sepW: 38,

  // Label head
  labelPostH: 130, labelRollD: 80, labelRollW: 56,
  peelL: 35, peelT: 2, pressD: 16,

  // Motors
  nema: 42, nemaD: 47,

  // Exit
  exitLen: 55, exitDrop: 18,

  // Sensors
  sensorD: 4,
};

// ── Derived geometry ─────────────────────────────────────
const CY = P.frameW / 2;           // center-line Y

// Feeder magazine (fixed position at left end of machine)
const magOuterW = P.magInW + 2 * P.magWall;
const magOuterL = P.magInL + 2 * P.magWall;
const magX0 = 3;                                       // magazine left edge X (fixed)
const magX1 = magX0 + magOuterL;                       // ≈97

// Roller dimensions → belt height
const rollerCZ = P.legH + P.baseT + P.rollerD / 2;    // roller center Z
const beltTopZ = rollerCZ + P.rollerD / 2;             // top surface of belt

// Feeder derived
const magInX0 = magX0 + P.magWall;
const magInY0 = CY - P.magInW / 2;
const magBZ = beltTopZ + P.beltT;                      // magazine floor = belt level
const feedCX = magInX0 + P.magInL * 0.5;               // center of mini belt X
const feedR1X = feedCX - P.feedBeltLen / 2;             // rear roller X (left)
const feedR2X = feedCX + P.feedBeltLen / 2;             // front roller X (right, near exit)
const feedCZ = magBZ - P.feedD / 2 + 1;                // roller center Z (protrudes into card slot)

// Transition zone: feeder exit → main belt start
const transStartX = magX1;                              // transition starts at magazine exit edge
const transEndX = magX1 + 25;                           // transition plate ends here

// Main belt rollers (start AFTER feeder + transition zone → separate motor M2)
const idlerX = transEndX + P.rollerD / 2;               // main belt left roller
const driveX = P.frameL - P.rollerGap - P.rollerD / 2;  // main belt right roller

// Guide walls along belt (keep cards straight)
const guideY0 = CY - P.cardW / 2 - 2;
const guideY1 = CY + P.cardW / 2 + 2;

// Sensors positions
const s1X = transStartX + 22;                          // S1 in transition zone (feeder exit sensor)
const s2X = idlerX + (driveX - idlerX) * 0.42;          // mid-belt, label zone
const s3X = driveX - 30;                                // near exit

// Label head
const lhCX = s2X;
const lhX0 = lhCX - 32;
const lhX1 = lhCX + 32;

// Exit
const exitX0 = driveX + P.rollerD / 2 + 2;

// ── Three.js setup ───────────────────────────────────────
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.6;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe8ecf0);
scene.fog = new THREE.Fog(0xe8ecf0, 18, 50);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.01, 100);
camera.position.set(3.5, 2.6, 2.5);
const ctrl = new OrbitControls(camera, canvas);
ctrl.enableDamping = true; ctrl.dampingFactor = 0.08;
ctrl.target.set(1.9, 0.5, 0.45);
ctrl.update();

// Lighting — bright and even
scene.add(new THREE.AmbientLight(0xc8c8d0, 1.4));
const dL = new THREE.DirectionalLight(0xffffff, 1.6);
dL.position.set(5, 8, 4); dL.castShadow = true;
dL.shadow.mapSize.set(2048, 2048);
dL.shadow.camera.left = -5; dL.shadow.camera.right = 5;
dL.shadow.camera.top = 5; dL.shadow.camera.bottom = -5;
scene.add(dL);
const fillL = new THREE.DirectionalLight(0xffffff, 0.6);
fillL.position.set(-4, 5, -3); scene.add(fillL);
scene.add(new THREE.DirectionalLight(0x88aaff, 0.4).translateX(-3).translateY(4));
const ptL = new THREE.PointLight(0xffffff, 0.4, 10);
ptL.position.set(2.5, 1.8, 0.45); scene.add(ptL);

// Ground
const gnd = new THREE.Mesh(new THREE.PlaneGeometry(18, 18),
  new THREE.MeshStandardMaterial({ color: 0xd5dae0, roughness: 0.85 }));
gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = true; scene.add(gnd);
scene.add(new THREE.GridHelper(10, 50, 0xaaaaaa, 0xcccccc));

// ── Materials ────────────────────────────────────────────
const M = {
  frame: new THREE.MeshStandardMaterial({ color: 0xa0a0a5, roughness: 0.35, metalness: 0.55 }),
  frameSide: new THREE.MeshStandardMaterial({ color: 0xa0a0a5, roughness: 0.35, metalness: 0.55, transparent: true, opacity: 1.0, side: THREE.DoubleSide }),
  frameT: new THREE.MeshStandardMaterial({ color: 0xa0a0a5, roughness: 0.35, metalness: 0.55, transparent: true, opacity: 0.12 }),
  belt: new THREE.MeshStandardMaterial({ color: 0x2ca52c, roughness: 0.7, metalness: 0.05 }),
  roller: new THREE.MeshStandardMaterial({ color: 0x6098c8, roughness: 0.3, metalness: 0.5 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0xd4a830, roughness: 0.8, metalness: 0.05 }),
  wall: new THREE.MeshStandardMaterial({ color: 0xb0b0b0, roughness: 0.4, metalness: 0.35 }),
  sep:  new THREE.MeshStandardMaterial({ color: 0xFF7060, roughness: 0.7, metalness: 0.1 }),
  motor: new THREE.MeshStandardMaterial({ color: 0x606060, roughness: 0.55, metalness: 0.4 }),
  shaft: new THREE.MeshStandardMaterial({ color: 0xdcdcdc, roughness: 0.15, metalness: 0.85 }),
  card:  new THREE.MeshStandardMaterial({ color: 0x6eded0, roughness: 0.3, metalness: 0.2 }),
  sticker: new THREE.MeshStandardMaterial({ color: 0xf06070, roughness: 0.4, metalness: 0.1 }),
  labelRoll: new THREE.MeshStandardMaterial({ color: 0xf06070, roughness: 0.5, transparent: true, opacity: 0.7 }),
  peel: new THREE.MeshStandardMaterial({ color: 0xe8c040, roughness: 0.25, metalness: 0.55 }),
  press: new THREE.MeshStandardMaterial({ color: 0x8878d8, roughness: 0.35, metalness: 0.3 }),
  sensor: new THREE.MeshStandardMaterial({ color: 0x30ff30, roughness: 0.3, emissive: 0x00ff00, emissiveIntensity: 0.4 }),
  sensorOn: new THREE.MeshStandardMaterial({ color: 0xf06070, roughness: 0.3, emissive: 0xe94560, emissiveIntensity: 0.8 }),
  sensorBody: new THREE.MeshStandardMaterial({ color: 0x404040, roughness: 0.7 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x99bbff, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.15, side: THREE.DoubleSide }),
  exit: new THREE.MeshStandardMaterial({ color: 0x40e080, roughness: 0.5, transparent: true, opacity: 0.5 }),
  magWall: new THREE.MeshStandardMaterial({ color: 0x808085, roughness: 0.5, metalness: 0.3 }),
  exitSlot: new THREE.MeshStandardMaterial({ color: 0xf5d020, emissive: 0xf1c40f, emissiveIntensity: 0.4, transparent: true, opacity: 0.5 }),
  liner: new THREE.MeshStandardMaterial({ color: 0xdea860, roughness: 0.55, transparent: true, opacity: 0.55 }),
  labelStrip: new THREE.MeshStandardMaterial({ color: 0x2ca52c, roughness: 0.55, transparent: true, opacity: 0.6 }),
  rubberRing: new THREE.MeshStandardMaterial({ color: 0xa06020, roughness: 0.9 }),
  // Bearing materials — open ball bearing (chrome + brass cage)
  bearingOuter: new THREE.MeshStandardMaterial({ color: 0xe0e0e8, roughness: 0.06, metalness: 0.96 }),   // polished chrome outer ring
  bearingInner: new THREE.MeshStandardMaterial({ color: 0xd5d5de, roughness: 0.08, metalness: 0.94 }),   // chrome inner ring
  bearingBall: new THREE.MeshStandardMaterial({ color: 0xf0f0f5, roughness: 0.02, metalness: 0.99 }),    // mirror-polished steel balls
  bearingCage: new THREE.MeshStandardMaterial({ color: 0xc8a020, roughness: 0.35, metalness: 0.6 }),     // brass/bronze cage (golden)
  bearingChamfer: new THREE.MeshStandardMaterial({ color: 0xd0d0d8, roughness: 0.12, metalness: 0.92 }), // chamfer edge
  bearingHousing: new THREE.MeshStandardMaterial({ color: 0x707880, roughness: 0.6, metalness: 0.4 }),   // cast iron housing
  bearingFlange: new THREE.MeshStandardMaterial({ color: 0x858d95, roughness: 0.45, metalness: 0.5 }),   // machined flange
  bearingBolt: new THREE.MeshStandardMaterial({ color: 0xb8b8c0, roughness: 0.18, metalness: 0.88 }),    // zinc bolt
  bearingGrease: new THREE.MeshStandardMaterial({ color: 0xc8a830, roughness: 0.5, metalness: 0.4 }),    // brass grease nipple
  bearingSeat: new THREE.MeshStandardMaterial({ color: 0x252530, roughness: 0.9, metalness: 0.1 }),       // dark bore hole in frame
  bearingSeatRim: new THREE.MeshStandardMaterial({ color: 0x909098, roughness: 0.35, metalness: 0.5 }),   // reinforcement ring around seat
};

// ── Helpers ──────────────────────────────────────────────
function mm(x, y, z) { return new THREE.Vector3(x * S, z * S, y * S); }

function addBox(g, m, x, y, z, w, d, h) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w*S, h*S, d*S), m);
  mesh.position.copy(mm(x+w/2, y+d/2, z+h/2));
  mesh.castShadow = true; mesh.receiveShadow = true;
  g.add(mesh); return mesh;
}

function addCyl(g, m, cx, cy, cz, dia, len, axis) {
  const geo = new THREE.CylinderGeometry(dia/2*S, dia/2*S, len*S, 32);
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.copy(mm(cx, cy, cz));
  if (axis === 'x') mesh.rotation.z = Math.PI / 2;
  if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  mesh.castShadow = true; g.add(mesh); return mesh;
}

// ── Open ball bearing (visible balls + brass cage) ──
// Like the reference images: chrome outer ring, chrome inner ring,
// polished steel balls visible between them, brass cage holding balls.
function createBearingAtY(group, cx, cz, shaftD, yPos, bOD, bW) {
  const iR = (shaftD + 1) / 2;  // inner ring inner radius
  const oR = bOD / 2;           // outer ring outer radius
  const raceW = (oR - iR) * 0.28; // race wall thickness
  const midR = (iR + raceW + oR - raceW) / 2; // ball pitch circle radius
  const ballD = (oR - raceW - iR - raceW) * 0.88; // ball diameter
  const numBalls = Math.max(6, Math.round(Math.PI * 2 * midR / (ballD * 1.4)));
  
  // ── Outer ring (thick chrome cylinder) ──
  addCyl(group, M.bearingOuter, cx, yPos, cz, bOD, bW, 'z');
  // Outer ring inner bore (darker groove where balls sit)
  addCyl(group, M.bearingChamfer, cx, yPos, cz, (oR - raceW) * 2, bW * 0.6, 'z');
  // Outer chamfer edges
  addCyl(group, M.bearingChamfer, cx, yPos - bW / 2 + 0.25, cz, bOD + 0.3, 0.5, 'z');
  addCyl(group, M.bearingChamfer, cx, yPos + bW / 2 - 0.25, cz, bOD + 0.3, 0.5, 'z');
  
  // ── Inner ring (narrower chrome cylinder on shaft) ──
  addCyl(group, M.bearingInner, cx, yPos, cz, (iR + raceW) * 2, bW, 'z');
  // Inner ring bore
  addCyl(group, M.bearingChamfer, cx, yPos, cz, shaftD + 0.5, bW * 1.02, 'z');
  // Inner chamfer edges
  addCyl(group, M.bearingChamfer, cx, yPos - bW / 2 + 0.2, cz, (iR + raceW) * 2 + 0.3, 0.4, 'z');
  addCyl(group, M.bearingChamfer, cx, yPos + bW / 2 - 0.2, cz, (iR + raceW) * 2 + 0.3, 0.4, 'z');
  
  // ── Steel balls (chrome, highly reflective, visible between races) ──
  const ballGeo = new THREE.SphereGeometry(ballD / 2 * S, 16, 16);
  for (let i = 0; i < numBalls; i++) {
    const angle = (i / numBalls) * Math.PI * 2;
    const bx = cx + Math.cos(angle) * midR;
    const bz = cz + Math.sin(angle) * midR;
    const ball = new THREE.Mesh(ballGeo, M.bearingBall);
    ball.position.copy(mm(bx, yPos, bz));
    ball.castShadow = true;
    group.add(ball);
  }
  
  // ── Brass cage (retainer — connects ball pockets) ──
  // Cage side rings (two thin brass rings on each side of balls)
  const cageR = midR;
  const cageT = 0.6;  // cage ring thickness
  addCyl(group, M.bearingCage, cx, yPos - ballD / 2 * 0.55, cz, cageR * 2 + ballD * 0.3, cageT, 'z');
  addCyl(group, M.bearingCage, cx, yPos + ballD / 2 * 0.55, cz, cageR * 2 + ballD * 0.3, cageT, 'z');
  // Cage inner rings
  addCyl(group, M.bearingCage, cx, yPos - ballD / 2 * 0.55, cz, cageR * 2 - ballD * 0.3, cageT, 'z');
  addCyl(group, M.bearingCage, cx, yPos + ballD / 2 * 0.55, cz, cageR * 2 - ballD * 0.3, cageT, 'z');
  // Cage bridges (brass bars between each ball pocket)
  for (let i = 0; i < numBalls; i++) {
    const angle = (i + 0.5) / numBalls * Math.PI * 2;
    const bx = cx + Math.cos(angle) * midR;
    const bz = cz + Math.sin(angle) * midR;
    addBox(group, M.bearingCage, bx - 0.5, yPos - ballD / 2 * 0.55, bz - 0.5, 1, ballD * 0.55, 1);
  }
}

// Pillow-block bearing housing (UCP type — cast iron, bolted to frame)
function addBearing(group, cx, cz, shaftD, y1, y2) {
  const bOD = shaftD + 10;
  const bW = 6;
  const hW = bOD + 8;
  const hH = bOD + 4;
  const hD = bW + 4;
  const footW = hW + 8;
  const footH = 3;
  
  [y1, y2].forEach(yPos => {
    createBearingAtY(group, cx, cz, shaftD, yPos, bOD, bW);
    // Housing body + rounded top
    addBox(group, M.bearingHousing, cx - hW / 2, yPos - hD / 2, cz - hH / 2, hW, hD, hH);
    addCyl(group, M.bearingHousing, cx, yPos, cz, hW * 0.92, hD, 'z');
    // Flange faces
    addCyl(group, M.bearingFlange, cx, yPos - hD / 2 - 0.2, cz, bOD + 3, 0.5, 'z');
    addCyl(group, M.bearingFlange, cx, yPos + hD / 2 + 0.2, cz, bOD + 3, 0.5, 'z');
    // Base foot
    addBox(group, M.bearingHousing, cx - footW / 2, yPos - hD / 2, cz - hH / 2 - footH, footW, hD, footH);
    // Mounting bolts
    const bx1 = cx - footW / 2 + 3, bx2 = cx + footW / 2 - 3;
    const bz = cz - hH / 2 - footH / 2;
    addCyl(group, M.bearingBolt, bx1, yPos, bz, 4, hD + 1, 'z');
    addCyl(group, M.bearingBolt, bx2, yPos, bz, 4, hD + 1, 'z');
    addCyl(group, M.bearingBolt, bx1, yPos - hD / 2 - 0.5, bz, 6, 1.5, 'z');
    addCyl(group, M.bearingBolt, bx2, yPos - hD / 2 - 0.5, bz, 6, 1.5, 'z');
    // Grease nipple
    addCyl(group, M.bearingGrease, cx, yPos, cz + hH / 2 + 1, 2.5, 3, 'y');
    addCyl(group, M.bearingGrease, cx, yPos, cz + hH / 2 + 3.5, 3.5, 1, 'y');
  });
}

// Flanged open bearing (F-type, smaller)
function addSmallBearing(group, cx, cz, shaftD, y1, y2) {
  const bOD = shaftD + 6;
  const bW = 4;
  [y1, y2].forEach(yPos => {
    createBearingAtY(group, cx, cz, shaftD, yPos, bOD, bW);
    addCyl(group, M.bearingFlange, cx, yPos, cz, bOD + 4, 1.0, 'z');
  });
}

// ── Bearing seat (bore hole in frame side panel) ──
// Dark cylindrical hole + reinforcement rim on the frame wall,
// showing where the bearing is press-fit into the 3D-printed frame.
function addBearingSeat(group, cx, cz, boreDia, yWall, wallT) {
  // Dark bore hole (slightly recessed into the wall)
  addCyl(group, M.bearingSeat, cx, yWall + wallT / 2, cz, boreDia, wallT + 0.5, 'z');
  // Inner chamfer (lead-in for bearing insertion)
  addCyl(group, M.bearingSeat, cx, yWall + wallT * 0.05, cz, boreDia + 2, 0.8, 'z');
  addCyl(group, M.bearingSeat, cx, yWall + wallT * 0.95, cz, boreDia + 2, 0.8, 'z');
  // Reinforcement rim (raised ring around bore — 3D printed boss)
  addCyl(group, M.bearingSeatRim, cx, yWall + wallT / 2, cz, boreDia + 6, wallT + 1.5, 'z');
  // Outer rim highlight
  addCyl(group, M.bearingSeatRim, cx, yWall - 0.2, cz, boreDia + 8, 0.5, 'z');
  addCyl(group, M.bearingSeatRim, cx, yWall + wallT + 0.2, cz, boreDia + 8, 0.5, 'z');
}

function makeLabel(text, pos, color, sz) {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 128;
  const cx = cv.getContext('2d');
  cx.fillStyle = color || '#00d4ff';
  cx.font = 'bold 48px Arial';
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.fillText(text, 256, 64);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false }));
  sp.position.copy(pos);
  sp.scale.set((sz || 0.1) * 4, sz || 0.1, 1);
  scene.add(sp); return sp;
}

// ── Module groups ────────────────────────────────────────
const machine = new THREE.Group();
scene.add(machine);
const modA = new THREE.Group(); // Feeder
const modB = new THREE.Group(); // Belt conveyor
const modC = new THREE.Group(); // Label Head
const modD = new THREE.Group(); // Exit
const motorsGrp = new THREE.Group();
machine.add(modB, modA, modC, modD, motorsGrp);

const feederParts = { housing: new THREE.Group(), feedWheel: new THREE.Group(), sepPad: new THREE.Group(), cards: new THREE.Group(), motor: new THREE.Group() };
Object.values(feederParts).forEach(g => modA.add(g));

const beltParts = { frame: new THREE.Group(), rollers: new THREE.Group(), belt: new THREE.Group(), guides: new THREE.Group() };
Object.values(beltParts).forEach(g => modB.add(g));

const labelParts = { frame: new THREE.Group(), roll: new THREE.Group(), peel: new THREE.Group(), press: new THREE.Group(), strips: new THREE.Group() };
Object.values(labelParts).forEach(g => modC.add(g));

const ex = { all: false, A: false, B: false, C: false, D: false };

// ══════════════════════════════════════════════════════════
//  MODULE B — BELT CONVEYOR (רצועת הנעה)
// ══════════════════════════════════════════════════════════

// Side frame plates (semi-transparent to see belt mechanism)
addBox(beltParts.frame, M.frameSide, 0, 0, 0, P.frameL, P.sideT, P.legH + P.baseT + P.rollerD + 8);
addBox(beltParts.frame, M.frameSide, 0, P.frameW - P.sideT, 0, P.frameL, P.sideT, P.legH + P.baseT + P.rollerD + 8);

// Base plate
addBox(beltParts.frame, M.frame, 0, 0, 0, P.frameL, P.frameW, P.baseT);

// Legs
const legPos = [[15, 5], [15, P.frameW - P.sideT - 5],
                [P.frameL - 20, 5], [P.frameL - 20, P.frameW - P.sideT - 5]];
legPos.forEach(([lx, ly]) => addBox(beltParts.frame, M.frame, lx, ly, P.baseT, 8, 8, P.legH));

// Cross braces
[50, P.frameL / 2, P.frameL - 60].forEach(bx => {
  addBox(beltParts.frame, M.frame, bx, P.sideT, P.legH * 0.4, P.frameT, P.frameW - 2 * P.sideT, P.frameT);
});

// ── Idler roller (left, feeder end) ──────────────────────
const idlerMesh = addCyl(beltParts.rollers, M.roller, idlerX, CY, rollerCZ, P.rollerD, P.frameW - 2 * P.sideT - 4, 'z');
addCyl(beltParts.rollers, M.shaft, idlerX, CY, rollerCZ, 6, P.frameW + 8, 'z');

// ── Drive roller (right, exit end) ───────────────────────
const driveMesh = addCyl(beltParts.rollers, M.roller, driveX, CY, rollerCZ, P.rollerD, P.frameW - 2 * P.sideT - 4, 'z');
addCyl(beltParts.rollers, M.shaft, driveX, CY, rollerCZ, 6, P.frameW + 8, 'z');

// Bearing mounts + bearings + bearing seats in frame
[idlerX, driveX].forEach(rx => {
  addBox(beltParts.rollers, M.frame, rx - 8, 0, rollerCZ - P.rollerD / 2 - 2, 16, P.sideT + 3, P.rollerD + 4);
  addBox(beltParts.rollers, M.frame, rx - 8, P.frameW - P.sideT - 3, rollerCZ - P.rollerD / 2 - 2, 16, P.sideT + 3, P.rollerD + 4);
  addBearing(beltParts.rollers, rx, rollerCZ, 6, P.sideT + 1, P.frameW - P.sideT - 1);
  // Bearing seats (bore holes in frame side panels)
  addBearingSeat(beltParts.frame, rx, rollerCZ, 16, 0, P.sideT);
  addBearingSeat(beltParts.frame, rx, rollerCZ, 16, P.frameW - P.sideT, P.sideT);
});

// ── Belt (flat on top, flat on bottom, wraps around rollers) ──
// Top run (the working surface)
const topBeltLen = driveX - idlerX;
addBox(beltParts.belt, M.belt, idlerX, CY - P.beltW / 2, beltTopZ, topBeltLen, P.beltW, P.beltT);
// Bottom return
addBox(beltParts.belt, M.belt, idlerX, CY - P.beltW / 2, rollerCZ - P.rollerD / 2 - P.beltT, topBeltLen, P.beltW, P.beltT);

// Belt wraps around rollers (semicircles)
function addBeltWrap(cx) {
  const r = P.rollerD / 2 + P.beltT;
  const startA = (cx === idlerX) ? Math.PI / 2 : -Math.PI / 2;
  const endA = (cx === idlerX) ? 3 * Math.PI / 2 : Math.PI / 2;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, r * S, startA, endA, false);
  shape.absarc(0, 0, P.rollerD / 2 * S, endA, startA, true);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: P.beltW * S, bevelEnabled: false });
  const mesh = new THREE.Mesh(geo, M.belt);
  mesh.position.set(cx * S, rollerCZ * S, (CY - P.beltW / 2) * S);
  mesh.castShadow = true;
  beltParts.belt.add(mesh);
}
addBeltWrap(idlerX);
addBeltWrap(driveX);

// ── Belt arrows (black chevrons on belt surface to show motion) ──
const arrowMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
const beltArrows = [];
const arrowSpacing = 35; // mm between arrows
const numArrows = Math.ceil(topBeltLen / arrowSpacing) + 2;

function makeArrowShape() {
  // Chevron arrow shape ▶ pointing right (+X)
  const s = new THREE.Shape();
  const aw = 12, ah = 18; // arrow width and height (in mm)
  s.moveTo(-aw / 2 * S, -ah / 2 * S);
  s.lineTo(aw / 2 * S, 0);
  s.lineTo(-aw / 2 * S, ah / 2 * S);
  s.lineTo(-aw / 4 * S, 0);
  s.closePath();
  return s;
}

for (let i = 0; i < numArrows; i++) {
  const shape = makeArrowShape();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.3 * S, bevelEnabled: false });
  const mesh = new THREE.Mesh(geo, arrowMat);
  const startX = idlerX + i * arrowSpacing;
  mesh.position.set(startX * S, (beltTopZ + P.beltT + 0.2) * S, CY * S);
  mesh.rotation.x = -Math.PI / 2;
  beltParts.belt.add(mesh);
  beltArrows.push({ mesh, baseX: i * arrowSpacing });
}

// Bottom belt arrows (moving in opposite direction ←)
const beltArrowsBot = [];
const botBeltZ = rollerCZ - P.rollerD / 2 - P.beltT;
for (let i = 0; i < numArrows; i++) {
  const shape = makeArrowShape();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.3 * S, bevelEnabled: false });
  const mesh = new THREE.Mesh(geo, arrowMat);
  const startX = idlerX + i * arrowSpacing;
  mesh.position.set(startX * S, (botBeltZ - 0.2) * S, CY * S);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.y = Math.PI; // flip for opposite direction
  beltParts.belt.add(mesh);
  beltArrowsBot.push({ mesh, baseX: i * arrowSpacing });
}

// ── Roller rotation arrows (chevrons on circumference) ──
function addRollerArrow(group, cx, cz, dia, yPos) {
  // Arrow on the circumference, pointing in rotation direction
  const r = dia / 2;
  const arrowGrp = new THREE.Group();
  arrowGrp.position.set(cx * S, cz * S, yPos * S);
  
  // Place 4 arrows evenly around the roller
  for (let a = 0; a < 4; a++) {
    const angle = (a * Math.PI / 2);
    const shape = new THREE.Shape();
    const aw = 5, ah = 6;
    shape.moveTo(-aw / 2 * S, -ah / 2 * S);
    shape.lineTo(aw / 2 * S, 0);
    shape.lineTo(-aw / 2 * S, ah / 2 * S);
    shape.lineTo(-aw / 4 * S, 0);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.3 * S, bevelEnabled: false });
    const mesh = new THREE.Mesh(geo, arrowMat);
    mesh.position.set(0, Math.cos(angle) * (r + 0.5) * S, 0);
    mesh.rotation.x = -angle;
    mesh.rotation.z = -Math.PI / 2; // arrow points in rotation direction (clockwise viewed from +Z)
    arrowGrp.add(mesh);
  }
  group.add(arrowGrp);
  return arrowGrp;
}

// Arrows on both side faces of each roller
const idlerArrowL = addRollerArrow(beltParts.rollers, idlerX, rollerCZ, P.rollerD, CY - P.beltW / 2 + 2);
const idlerArrowR = addRollerArrow(beltParts.rollers, idlerX, rollerCZ, P.rollerD, CY + P.beltW / 2 - 2);
const driveArrowL = addRollerArrow(beltParts.rollers, driveX, rollerCZ, P.rollerD, CY - P.beltW / 2 + 2);
const driveArrowR = addRollerArrow(beltParts.rollers, driveX, rollerCZ, P.rollerD, CY + P.beltW / 2 - 2);

// ── Transition zone plate + feeder platform ─────────────
// Feeder platform (supports magazine at belt-top height)
addBox(beltParts.frame, M.frame, magX0 - 2, CY - P.beltW / 2, beltTopZ - 2, transStartX - magX0 + 4, P.beltW, 3);
// Transition plate (flat surface from feeder exit to belt start, top = beltTopZ)
addBox(beltParts.frame, M.wall, transStartX, CY - P.beltW / 2, beltTopZ - 1.5, transEndX - transStartX + P.rollerD / 2 + 2, P.beltW, P.beltT + 1.5);
// Small feed rollers at feeder exit (driven by M1, grip card as it exits)
const exitRollerX = transStartX + 12;
const exitRollerTopZ = beltTopZ + P.beltT + P.cardT + 2;
const exitRollerBotMesh = addCyl(feederParts.feedWheel, M.roller, exitRollerX, CY, beltTopZ - 1, 14, P.cardW + 4, 'z');
const exitRollerTopMesh = addCyl(feederParts.feedWheel, M.rubber, exitRollerX, CY, exitRollerTopZ, 12, P.cardW, 'z');
addCyl(feederParts.feedWheel, M.shaft, exitRollerX, CY, beltTopZ - 1, 4, P.frameW - 2 * P.sideT, 'z');
addCyl(feederParts.feedWheel, M.shaft, exitRollerX, CY, exitRollerTopZ, 4, P.frameW - 2 * P.sideT, 'z');
// Roller mount brackets
addBox(feederParts.feedWheel, M.frame, exitRollerX - 5, P.sideT, beltTopZ - 8, 10, 4, exitRollerTopZ - beltTopZ + 14);
addBox(feederParts.feedWheel, M.frame, exitRollerX - 5, P.frameW - P.sideT - 4, beltTopZ - 8, 10, 4, exitRollerTopZ - beltTopZ + 14);
// Exit roller bearings
addSmallBearing(feederParts.feedWheel, exitRollerX, beltTopZ - 1, 4, P.sideT + 2, P.frameW - P.sideT - 2);
// Exit roller bearing seats
addBearingSeat(beltParts.frame, exitRollerX, beltTopZ - 1, 10, 0, P.sideT);
addBearingSeat(beltParts.frame, exitRollerX, beltTopZ - 1, 10, P.frameW - P.sideT, P.sideT);
addSmallBearing(feederParts.feedWheel, exitRollerX, exitRollerTopZ, 4, P.sideT + 2, P.frameW - P.sideT - 2);
addBearingSeat(beltParts.frame, exitRollerX, exitRollerTopZ, 10, 0, P.sideT);
addBearingSeat(beltParts.frame, exitRollerX, exitRollerTopZ, 10, P.frameW - P.sideT, P.sideT);

// ── Guide walls (keep cards straight) ────────────────────
const guideH = 6;
// Transition zone guides
addBox(beltParts.guides, M.wall, transStartX + 22, guideY0 - P.sideT, beltTopZ + P.beltT, transEndX - transStartX - 18, P.sideT, guideH);
addBox(beltParts.guides, M.wall, transStartX + 22, guideY1, beltTopZ + P.beltT, transEndX - transStartX - 18, P.sideT, guideH);
// Main belt guides
const guideStartX = idlerX;
const guideEndX = driveX - P.rollerD / 2;
addBox(beltParts.guides, M.wall, guideStartX, guideY0 - P.sideT, beltTopZ + P.beltT, guideEndX - guideStartX, P.sideT, guideH);
addBox(beltParts.guides, M.wall, guideStartX, guideY1, beltTopZ + P.beltT, guideEndX - guideStartX, P.sideT, guideH);

// ── M2 motor (drives the drive roller) ──────────────────
addBox(motorsGrp, M.motor, driveX - P.nema / 2, P.frameW + 8, rollerCZ - P.nema / 2, P.nema, P.nemaD, P.nema);
addCyl(motorsGrp, M.shaft, driveX, P.frameW + 5, rollerCZ, 5, 14, 'z');

// ══════════════════════════════════════════════════════════
//  MODULE A — FEEDER (פידר כרטיסים — יושב על קצה הרצועה)
// ══════════════════════════════════════════════════════════
// Magazine sits ON TOP of the belt, at the far left (idler end).
// Cards stack vertically. Bottom card is flush with the belt surface.
// Feed wheel pushes bottom card horizontally (to the right, along belt).

// Magazine walls
// Back wall (closed)
addBox(feederParts.housing, M.magWall, magX0, magInY0 - P.magWall, magBZ, P.magWall, magOuterW, P.magH);
// Front wall — exit slot at bottom (card exits onto belt)
addBox(feederParts.housing, M.magWall, magX1 - P.magWall, magInY0 - P.magWall, magBZ + P.cardT + 1.0, P.magWall, magOuterW, P.magH - P.cardT - 1.0);
// Exit slot highlight — just tall enough for ONE card
addBox(feederParts.housing, M.exitSlot, magX1 - P.magWall - 1, magInY0, magBZ, P.magWall + 2, P.magInW, P.cardT + 1.0);
// Side walls (transparent — see cards)
addBox(feederParts.housing, M.glass, magInX0, magInY0 - P.magWall, magBZ, P.magInL, P.magWall, P.magH);
addBox(feederParts.housing, M.glass, magInX0, magInY0 + P.magInW, magBZ, P.magInL, P.magWall, P.magH);
// Floor — with slot for mini belt
const floorSlotL = feedR1X - P.feedD / 2 - 1;
const floorSlotR = feedR2X + P.feedD / 2 + 1;
addBox(feederParts.housing, M.magWall, magInX0, magInY0, magBZ - 2, floorSlotL - magInX0, P.magInW, 2);
addBox(feederParts.housing, M.magWall, floorSlotR, magInY0, magBZ - 2, magInX0 + P.magInL - floorSlotR, P.magInW, 2);
// Top frame (open center for card loading)
addBox(feederParts.housing, M.magWall, magX0, magInY0 - P.magWall, magBZ + P.magH, P.magWall, magOuterW, P.magWall);
addBox(feederParts.housing, M.magWall, magX1 - P.magWall, magInY0 - P.magWall, magBZ + P.magH, P.magWall, magOuterW, P.magWall);
addBox(feederParts.housing, M.magWall, magX0, magInY0 - P.magWall, magBZ + P.magH, magOuterL, P.magWall, P.magWall);
addBox(feederParts.housing, M.magWall, magX0, magInY0 + P.magInW, magBZ + P.magH, magOuterL, P.magWall, P.magWall);

// Mini friction belt (מסוע קטן בתחתית המחסנית — חיכוך גומי)
const feedBeltMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.95, metalness: 0.02 });
// Rear roller (left, drive)
const feedRollerRear = addCyl(feederParts.feedWheel, M.rubber, feedR1X, CY, feedCZ, P.feedD, P.feedW, 'z');
addCyl(feederParts.feedWheel, M.shaft, feedR1X, CY, feedCZ, 4, P.frameW + 8, 'z');
// Front roller (right, near exit, idler)
const feedRollerFront = addCyl(feederParts.feedWheel, M.rubber, feedR2X, CY, feedCZ, P.feedD, P.feedW, 'z');
addCyl(feederParts.feedWheel, M.shaft, feedR2X, CY, feedCZ, 4, P.frameW + 8, 'z');
// Mini belt roller bearings (at frame side walls)
addSmallBearing(feederParts.feedWheel, feedR1X, feedCZ, 4, P.sideT + 1, P.frameW - P.sideT - 1);
addSmallBearing(feederParts.feedWheel, feedR2X, feedCZ, 4, P.sideT + 1, P.frameW - P.sideT - 1);
// Feeder bearing seats in frame side panels
addBearingSeat(beltParts.frame, feedR1X, feedCZ, 10, 0, P.sideT);
addBearingSeat(beltParts.frame, feedR1X, feedCZ, 10, P.frameW - P.sideT, P.sideT);
addBearingSeat(beltParts.frame, feedR2X, feedCZ, 10, 0, P.sideT);
addBearingSeat(beltParts.frame, feedR2X, feedCZ, 10, P.frameW - P.sideT, P.sideT);
// Mini belt — top run (friction surface touching bottom card)
const feedBeltTopZ = feedCZ + P.feedD / 2;
addBox(feederParts.feedWheel, feedBeltMat, feedR1X, CY - P.feedW / 2, feedBeltTopZ, feedR2X - feedR1X, P.feedW, 1.2);
// Mini belt — bottom return
addBox(feederParts.feedWheel, feedBeltMat, feedR1X, CY - P.feedW / 2, feedCZ - P.feedD / 2 - 1.2, feedR2X - feedR1X, P.feedW, 1.2);
// Mini belt wraps around rollers
function addFeedBeltWrap(cx, side) {
  const r = P.feedD / 2 + 1.2;
  const startA = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
  const endA = side === 'left' ? 3 * Math.PI / 2 : Math.PI / 2;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, r * S, startA, endA, false);
  shape.absarc(0, 0, P.feedD / 2 * S, endA, startA, true);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: P.feedW * S, bevelEnabled: false });
  const mesh = new THREE.Mesh(geo, feedBeltMat);
  mesh.position.set(cx * S, feedCZ * S, (CY - P.feedW / 2) * S);
  mesh.castShadow = true;
  feederParts.feedWheel.add(mesh);
}
addFeedBeltWrap(feedR1X, 'left');
addFeedBeltWrap(feedR2X, 'right');
// Rubber grip texture lines on belt surface
for (let i = 0; i < 6; i++) {
  const gx = feedR1X + (feedR2X - feedR1X) * (i + 0.5) / 6;
  addBox(feederParts.feedWheel, M.rubberRing, gx - 0.5, CY - P.feedW / 2 + 2, feedBeltTopZ + 1.0, 1, P.feedW - 4, 0.4);
}
// Mini belt arrows (show movement direction →)
const feedArrows = [];
const feedArrowSpacing = 15;
const numFeedArrows = Math.ceil(P.feedBeltLen / feedArrowSpacing) + 1;
for (let i = 0; i < numFeedArrows; i++) {
  const shape = makeArrowShape();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.3 * S, bevelEnabled: false });
  const mesh = new THREE.Mesh(geo, arrowMat);
  mesh.position.set((feedR1X + i * feedArrowSpacing) * S, (feedBeltTopZ + 1.5) * S, CY * S);
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.set(0.6, 0.6, 0.6);
  feederParts.feedWheel.add(mesh);
  feedArrows.push({ mesh, baseX: i * feedArrowSpacing });
}

// Separation pad (high friction, next to exit slot, prevents double feed)
addBox(feederParts.sepPad, M.sep, feedCX + P.feedD / 2 + 1, CY - P.sepW / 2, magBZ - 0.5, P.sepL, P.sepW, 1.5);
for (let i = 0; i < 4; i++) {
  addBox(feederParts.sepPad, new THREE.MeshStandardMaterial({ color: 0xCC3030 }),
    feedCX + P.feedD / 2 + 3 + i * 5, CY - P.sepW / 2 + 2, magBZ + 1, 3, P.sepW - 4, 0.3);
}

// Rounded rectangle helper (for realistic credit card shape)
function makeRoundedRectShape(w, h, r) {
  const shape = new THREE.Shape();
  shape.moveTo(-w/2 + r, -h/2);
  shape.lineTo(w/2 - r, -h/2);
  shape.quadraticCurveTo(w/2, -h/2, w/2, -h/2 + r);
  shape.lineTo(w/2, h/2 - r);
  shape.quadraticCurveTo(w/2, h/2, w/2 - r, h/2);
  shape.lineTo(-w/2 + r, h/2);
  shape.quadraticCurveTo(-w/2, h/2, -w/2, h/2 - r);
  shape.lineTo(-w/2, -h/2 + r);
  shape.quadraticCurveTo(-w/2, -h/2, -w/2 + r, -h/2);
  return shape;
}

// Card stack (rounded corners like real credit cards)
const cardStackMeshes = [];
const stackShape = makeRoundedRectShape(P.cardL * S, P.cardW * S, 3 * S);
const stackGeo = new THREE.ExtrudeGeometry(stackShape, { depth: P.cardT * S, bevelEnabled: false });
stackGeo.rotateX(-Math.PI / 2);
stackGeo.translate(0, P.cardT * S / 2, 0);
for (let i = 0; i < 12; i++) {
  const cm = new THREE.MeshStandardMaterial({
    color: 0x4ecdc4, transparent: true,
    opacity: i === 0 ? 0.9 : 0.2 + (i / 12) * 0.45, roughness: 0.3
  });
  const c = new THREE.Mesh(stackGeo, cm);
  const cardZ = magBZ + 0.5 + i * (P.cardT + 0.3);
  c.position.copy(mm(magInX0 + P.magInL / 2, CY, cardZ + P.cardT / 2));
  feederParts.cards.add(c);
  cardStackMeshes.push(c);
}

const sensorMeshes = {};

// ── SICK photoelectric sensor (עין פשוטה — זיהוי כרטיסים במחסנית) ──
// Mounted on back wall of magazine, detects if cards exist in stack.
// 40×40mm rectangular sensor body, like SICK WTB4-3 series.
const sickSz = 40;              // sensor body 40×40mm
const sickD = 25;               // sensor depth
const sickX = magX0 - sickD;    // flush against back wall outer face
const sickY = CY - sickSz / 2;  // centered on magazine
const sickZ = magBZ + 5;        // near bottom of stack (detects last card)

// SICK body materials
const sickBodyMat = new THREE.MeshStandardMaterial({ color: 0x1a3a5c, roughness: 0.5, metalness: 0.3 });  // dark blue/navy
const sickFaceMat = new THREE.MeshStandardMaterial({ color: 0x0d2840, roughness: 0.3, metalness: 0.35 }); // darker face
const sickLensMat = new THREE.MeshStandardMaterial({ color: 0x882020, roughness: 0.2, metalness: 0.15, emissive: 0x660000, emissiveIntensity: 0.3 }); // red/dark lens
const sickLabelMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.4, metalness: 0.05 }); // white label area
const sickIndMat = new THREE.MeshStandardMaterial({ color: 0x33cc33, roughness: 0.3, emissive: 0x00ff00, emissiveIntensity: 0.5 }); // green indicator LED
const sickIndOffMat = new THREE.MeshStandardMaterial({ color: 0x225522, roughness: 0.5 }); // indicator OFF

// Main body (rectangular block)
addBox(feederParts.housing, sickBodyMat, sickX, sickY, sickZ, sickD, sickSz, sickSz);
// Front face (slightly darker, flush with back wall)
addBox(feederParts.housing, sickFaceMat, sickX + sickD - 1, sickY + 2, sickZ + 2, 1.5, sickSz - 4, sickSz - 4);
// Lens window (red circular, center of face — this is the optical eye)
const sickLensMesh = addCyl(feederParts.housing, sickLensMat, sickX + sickD + 0.3, CY, sickZ + sickSz * 0.55, 12, 2, 'x');
// Lens ring (chrome bezel)
addCyl(feederParts.housing, M.bearingOuter, sickX + sickD + 0.5, CY, sickZ + sickSz * 0.55, 14, 1, 'x');
// SICK logo area (white rectangle at top of sensor)
addBox(feederParts.housing, sickLabelMat, sickX + 1, sickY + 4, sickZ + sickSz - 10, sickD - 3, sickSz - 8, 7);
// Status indicator LED (green dot, top corner of front face)
const sickLED = addCyl(feederParts.housing, sickIndOffMat, sickX + sickD + 0.3, sickY + sickSz - 6, sickZ + sickSz - 6, 3, 1.5, 'x');
sensorMeshes['SFEED'] = { led: sickLED, lens: sickLensMesh };
// Potentiometer (small adjustable screw on top face)
addCyl(feederParts.housing, M.bearingBolt, sickX + sickD / 2, sickY + sickSz - 4, sickZ + sickSz + 0.3, 4, 1, 'y');
// Cable exit (rear of sensor — orange cable)
const cableMat = new THREE.MeshStandardMaterial({ color: 0xe87020, roughness: 0.7 });
addCyl(feederParts.housing, cableMat, sickX - 0.5, CY, sickZ + sickSz / 2, 4, 5, 'x');
// Cable run (going down and along frame)
addCyl(feederParts.housing, cableMat, sickX - 3, CY, sickZ + sickSz / 2 - 15, 3, 30, 'y');
// Mounting bracket (L-shaped, bolted to magazine wall)
addBox(feederParts.housing, M.frame, sickX + sickD - 3, sickY - 3, sickZ, 3, 3, sickSz);
addBox(feederParts.housing, M.frame, sickX + sickD - 3, sickY + sickSz, sickZ, 3, 3, sickSz);
// Mounting screws through bracket into magazine wall
addCyl(feederParts.housing, M.bearingBolt, magX0 + 1, sickY - 1.5, sickZ + 10, 3, P.magWall + 4, 'x');
addCyl(feederParts.housing, M.bearingBolt, magX0 + 1, sickY - 1.5, sickZ + sickSz - 10, 3, P.magWall + 4, 'x');
addCyl(feederParts.housing, M.bearingBolt, magX0 + 1, sickY + sickSz + 1.5, sickZ + 10, 3, P.magWall + 4, 'x');
addCyl(feederParts.housing, M.bearingBolt, magX0 + 1, sickY + sickSz + 1.5, sickZ + sickSz - 10, 3, P.magWall + 4, 'x');

// M1 motor — drives feed wheel (same side as M2, M3)
addBox(feederParts.motor, M.motor, feedCX - P.nema / 2, P.frameW + 8, feedCZ - P.nema / 2, P.nema, P.nemaD, P.nema);
addCyl(feederParts.motor, M.shaft, feedCX, P.frameW + 5, feedCZ, 5, 14, 'z');

// ══════════════════════════════════════════════════════════
//  MODULE C — LABEL HEAD (ראש הדבקה)
// ══════════════════════════════════════════════════════════
const postH = P.labelPostH;
const postW = 6;
const lhBaseZ = beltTopZ + P.beltT;

// Pillars
[[lhX0, guideY0 - 10], [lhX0, guideY1 + 4], [lhX1, guideY0 - 10], [lhX1, guideY1 + 4]].forEach(([px, py]) => {
  addBox(labelParts.frame, M.frame, px, py, lhBaseZ, postW, postW, postH);
});
// Top beams
addBox(labelParts.frame, M.frame, lhX0, guideY0 - 10, lhBaseZ + postH - postW, lhX1 - lhX0 + postW, postW, postW);
addBox(labelParts.frame, M.frame, lhX0, guideY1 + 4, lhBaseZ + postH - postW, lhX1 - lhX0 + postW, postW, postW);
addBox(labelParts.frame, M.frame, lhX0, guideY0 - 10, lhBaseZ + postH - postW, postW, guideY1 - guideY0 + 20, postW);
addBox(labelParts.frame, M.frame, lhX1, guideY0 - 10, lhBaseZ + postH - postW, postW, guideY1 - guideY0 + 20, postW);

// Label roll
const rollZ = lhBaseZ + postH - 35;
const rollX = lhCX;
const labelRollGroup = new THREE.Group();
labelRollGroup.position.set(rollX * S, rollZ * S, CY * S);
labelParts.roll.add(labelRollGroup);

for (let i = 0; i < 6; i++) {
  const innerD = 28 + i * ((P.labelRollD - 28) / 6);
  const outerD = innerD + (P.labelRollD - 28) / 6;
  const lm = (i % 2 === 0) ? M.labelRoll : M.sticker.clone();
  if (i % 2 !== 0) { lm.transparent = true; lm.opacity = 0.4; }
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outerD / 2 * S, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, innerD / 2 * S, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: P.labelRollW * S, bevelEnabled: false });
  const mesh = new THREE.Mesh(geo, lm);
  mesh.position.set(0, 0, -P.labelRollW / 2 * S);
  labelRollGroup.add(mesh);
}
addCyl(labelParts.roll, M.shaft, rollX, CY, rollZ, 8, P.frameW, 'z');
addCyl(labelParts.roll, M.frame, rollX, guideY0 - 6, rollZ, P.labelRollD + 6, 1.5, 'z');
addCyl(labelParts.roll, M.frame, rollX, guideY1 + 6, rollZ, P.labelRollD + 6, 1.5, 'z');
// Label roll bearings
addBearing(labelParts.roll, rollX, rollZ, 8, guideY0 - 8, guideY1 + 8);
// Rotation indicator line on roll
const rlGeo = new THREE.BoxGeometry(P.labelRollD / 2 * S, 2 * S, 2 * S);
const rlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.2 });
[P.labelRollW / 2 + 1, -P.labelRollW / 2 - 1].forEach(zz => {
  const rl = new THREE.Mesh(rlGeo, rlMat);
  rl.position.set(P.labelRollD / 4 * S, 0, zz * S);
  labelRollGroup.add(rl);
});

// Guide rollers
const g1X = rollX + 5, g1Z = rollZ - P.labelRollD / 2 - 8;
addCyl(labelParts.strips, M.shaft, g1X, CY, g1Z, 10, P.labelRollW + 4, 'z');
addSmallBearing(labelParts.strips, g1X, g1Z, 10, CY - P.labelRollW / 2 - 3, CY + P.labelRollW / 2 + 3);
const g2X = lhCX - 10, g2Z = lhBaseZ + 8;
addCyl(labelParts.strips, M.shaft, g2X, CY, g2Z, 10, P.labelRollW + 4, 'z');
addSmallBearing(labelParts.strips, g2X, g2Z, 10, CY - P.labelRollW / 2 - 3, CY + P.labelRollW / 2 + 3);

// Peel plate
const peelX = lhCX - 5;
const peelZ = lhBaseZ + P.cardT + 3;
addBox(labelParts.peel, M.peel, peelX, guideY0 + 5, peelZ, P.peelL, P.cardW - 2, P.peelT);
// Peel plate tip (sharp)
const tipGeo = new THREE.BufferGeometry();
const tipVerts = new Float32Array([
  (peelX + P.peelL) * S, (peelZ + P.peelT) * S, (guideY0 + 5) * S,
  (peelX + P.peelL) * S, peelZ * S, (guideY0 + 5) * S,
  (peelX + P.peelL + 10) * S, (peelZ + 1) * S, (guideY0 + 5) * S,
  (peelX + P.peelL) * S, (peelZ + P.peelT) * S, (guideY1 - 5) * S,
  (peelX + P.peelL + 10) * S, (peelZ + 1) * S, (guideY1 - 5) * S,
  (peelX + P.peelL) * S, peelZ * S, (guideY1 - 5) * S,
  (peelX + P.peelL) * S, (peelZ + P.peelT) * S, (guideY0 + 5) * S,
  (peelX + P.peelL + 10) * S, (peelZ + 1) * S, (guideY0 + 5) * S,
  (peelX + P.peelL + 10) * S, (peelZ + 1) * S, (guideY1 - 5) * S,
  (peelX + P.peelL) * S, (peelZ + P.peelT) * S, (guideY0 + 5) * S,
  (peelX + P.peelL + 10) * S, (peelZ + 1) * S, (guideY1 - 5) * S,
  (peelX + P.peelL) * S, (peelZ + P.peelT) * S, (guideY1 - 5) * S,
]);
tipGeo.setAttribute('position', new THREE.BufferAttribute(tipVerts, 3));
tipGeo.computeVertexNormals();
labelParts.peel.add(new THREE.Mesh(tipGeo, M.peel));

// Press roller (below belt surface — pushes card up against label)
const pressLZ = beltTopZ - P.pressD / 2 + 3;
const pressRoller = addCyl(labelParts.press, M.press, lhCX + 8, CY, pressLZ, P.pressD, P.beltW - 4, 'z');
addCyl(labelParts.press, M.shaft, lhCX + 8, CY, pressLZ, 5, P.frameW - 2 * P.sideT, 'z');
// Press roller bearings
addSmallBearing(labelParts.press, lhCX + 8, pressLZ, 5, P.sideT + 2, P.frameW - P.sideT - 2);
// Press roller bearing seats in frame
addBearingSeat(beltParts.frame, lhCX + 8, pressLZ, 11, 0, P.sideT);
addBearingSeat(beltParts.frame, lhCX + 8, pressLZ, 11, P.frameW - P.sideT, P.sideT);
// Press brackets
addBox(labelParts.press, M.frame, lhCX + 8 - 5, P.sideT, pressLZ - 10, 10, 4, 18);
addBox(labelParts.press, M.frame, lhCX + 8 - 5, P.frameW - P.sideT - 4, pressLZ - 10, 10, 4, 18);

// Ribbon paths
function addRibbon(x1, z1, x2, z2, mat, width) {
  const dx = x2 - x1, dz = z2 - z1;
  const len = Math.sqrt(dx * dx + dz * dz);
  const a = Math.atan2(dz, dx);
  const geo = new THREE.BoxGeometry(len * S, 0.4 * S, width * S);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set((x1 + x2) / 2 * S, (z1 + z2) / 2 * S, CY * S);
  mesh.rotation.z = a;
  labelParts.strips.add(mesh); return mesh;
}
addRibbon(rollX, rollZ - P.labelRollD / 2, g1X, g1Z, M.labelStrip, P.labelRollW);
addRibbon(g1X, g1Z, g2X, g2Z, M.labelStrip, P.labelRollW);
addRibbon(g2X, g2Z, peelX, peelZ + 1, M.labelStrip, P.labelRollW);
// Free sticker edge hanging from peel tip (30×30mm, visible protruding downward toward card)
const stkSize = 30; // sticker size in mm
const peelTipXPos = peelX + P.peelL + 10;
const stickerEdgeMat = new THREE.MeshStandardMaterial({ color: 0xf06070, roughness: 0.3, metalness: 0.05, side: THREE.DoubleSide });
const stickerEdge = new THREE.Mesh(
  new THREE.BoxGeometry(stkSize * S, stkSize * 0.5 * S, stkSize * S),
  stickerEdgeMat
);
stickerEdge.position.set(peelTipXPos * S, (peelZ + 1 - stkSize * 0.2) * S, CY * S);
labelParts.peel.add(stickerEdge);
// Liner return
const lsMat = M.liner.clone();
const g3X = lhX1 - 6, g3Z = lhBaseZ + 22;
addCyl(labelParts.strips, M.shaft, g3X, CY, g3Z, 10, P.labelRollW + 4, 'z');
addSmallBearing(labelParts.strips, g3X, g3Z, 10, CY - P.labelRollW / 2 - 3, CY + P.labelRollW / 2 + 3);
addRibbon(peelX + P.peelL + 10, peelZ + 1, g3X, g3Z, lsMat, P.labelRollW);
const g4X = lhX1 - 3, g4Z = rollZ - 18;
addCyl(labelParts.strips, M.shaft, g4X, CY, g4Z, 10, P.labelRollW + 4, 'z');
addSmallBearing(labelParts.strips, g4X, g4Z, 10, CY - P.labelRollW / 2 - 3, CY + P.labelRollW / 2 + 3);
addRibbon(g3X, g3Z, g4X, g4Z, lsMat, P.labelRollW);
// Liner collection spool
addCyl(labelParts.strips, M.liner, g4X + 5, CY, g4Z + 8, 34, P.labelRollW, 'z');
addCyl(labelParts.strips, M.shaft, g4X + 5, CY, g4Z + 8, 8, P.labelRollW + 4, 'z');
addSmallBearing(labelParts.strips, g4X + 5, g4Z + 8, 8, CY - P.labelRollW / 2 - 3, CY + P.labelRollW / 2 + 3);
addRibbon(g4X, g4Z, g4X + 5, g4Z + 8 - 17, lsMat, P.labelRollW);

// Sticker marks on strip (30×30mm stickers with gaps)
const stkGap = 3;   // gap between stickers
const stripAngle = Math.atan2(peelZ + 1 - g2Z, peelX - g2X);
for (let i = 0; i < 4; i++) {
  const t = 0.15 + i * 0.22;
  const sx = g2X + (peelX - g2X) * t;
  const sz = g2Z + (peelZ + 1 - g2Z) * t;
  const sGeo = new THREE.BoxGeometry(stkSize * S, 0.6 * S, stkSize * S);
  const sm = new THREE.Mesh(sGeo, M.sticker);
  sm.position.set(sx * S, sz * S, CY * S);
  sm.rotation.z = stripAngle;
  labelParts.strips.add(sm);
}

// Stickers visible on roll surface (wrapped around the cylinder)
for (let a = 0; a < 8; a++) {
  const angle = (a / 8) * Math.PI * 2;
  const sr = P.labelRollD / 2 + 0.5;
  const sGeo = new THREE.BoxGeometry(stkSize * S * 0.7, 0.5 * S, stkSize * S);
  const sm = new THREE.Mesh(sGeo, M.sticker);
  sm.position.set(Math.cos(angle) * sr * S, Math.sin(angle) * sr * S, 0);
  sm.rotation.z = angle + Math.PI / 2;
  labelRollGroup.add(sm);
}

// M3 motor
addBox(motorsGrp, M.motor, rollX - P.nema / 2, P.frameW + 8, rollZ - P.nema / 2, P.nema, P.nemaD, P.nema);
addCyl(motorsGrp, M.shaft, rollX, P.frameW + 5, rollZ, 5, 14, 'z');

// ══════════════════════════════════════════════════════════
//  MODULE D — EXIT TRAY
// ══════════════════════════════════════════════════════════
const exitBeltZ = beltTopZ + P.beltT;
const exitGeo = new THREE.BufferGeometry();
exitGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
  exitX0 * S, exitBeltZ * S, guideY0 * S,
  exitX0 * S, exitBeltZ * S, guideY1 * S,
  (exitX0 + P.exitLen) * S, (exitBeltZ - P.exitDrop) * S, guideY0 * S,
  (exitX0 + P.exitLen) * S, (exitBeltZ - P.exitDrop) * S, guideY0 * S,
  exitX0 * S, exitBeltZ * S, guideY1 * S,
  (exitX0 + P.exitLen) * S, (exitBeltZ - P.exitDrop) * S, guideY1 * S,
]), 3));
exitGeo.computeVertexNormals();
modD.add(new THREE.Mesh(exitGeo, M.exit));
addBox(modD, M.frame, exitX0 + P.exitLen, guideY0, exitBeltZ - P.exitDrop, 4, guideY1 - guideY0, 10);

// ══════════════════════════════════════════════════════════
//  SENSORS
// ══════════════════════════════════════════════════════════
function addSensor(group, xPos, name) {
  addBox(group, M.sensorBody, xPos - 1.5, guideY0 - P.sideT, exitBeltZ, 3, guideY1 - guideY0 + 2 * P.sideT, 10);
  const left = addCyl(group, M.sensor, xPos, guideY0 + 4, exitBeltZ + 5, P.sensorD, 8, 'y');
  const right = addCyl(group, M.sensor, xPos, guideY1 - 4, exitBeltZ + 5, P.sensorD, 8, 'y');
  sensorMeshes[name] = { l: left, r: right };
}

// S0 — Height sensor at feeder exit (rectangular 40×30mm, 2 screws, height adjustable)
const s0X = magX1 + 1;                                 // flush against outer front wall
const s0W = 40;                                         // sensor width (Y)
const s0H = 30;                                         // sensor height (Z)
const s0D = 8;                                          // sensor depth/thickness (X)
const s0BaseZ = magBZ + 2;                              // bottom of adjustment range
const s0AdjRange = 35;                                  // vertical adjustment range
const s0CurrZ = magBZ + 5;                              // current sensor Z position (adjustable)
const screwMat = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, roughness: 0.2, metalness: 0.9 });
const slotMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.4 });
const knobMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });

// ── Mounting bracket (fixed to feeder front wall) ──
const bracketX = s0X;
const bracketY0 = CY - s0W / 2 - 4;
const bracketW = s0W + 8;
const bracketH = s0AdjRange + s0H + 10;
// Bracket plate (aluminum vertical plate)
addBox(feederParts.housing, M.frame, bracketX, bracketY0, s0BaseZ, 4, bracketW, bracketH);
// 2 mounting screws — fix bracket to feeder wall
const scrZ1 = s0BaseZ + 6;
const scrZ2 = s0BaseZ + bracketH - 6;
addCyl(feederParts.housing, screwMat, magX1, CY - 12, scrZ1, 4, P.magWall + 6, 'x');
addCyl(feederParts.housing, screwMat, magX1, CY + 12, scrZ1, 4, P.magWall + 6, 'x');
// Screw heads
addCyl(feederParts.housing, screwMat, bracketX + 3, CY - 12, scrZ1, 7, 2, 'x');
addCyl(feederParts.housing, screwMat, bracketX + 3, CY + 12, scrZ1, 7, 2, 'x');
// Upper screws
addCyl(feederParts.housing, screwMat, magX1, CY - 12, scrZ2, 4, P.magWall + 6, 'x');
addCyl(feederParts.housing, screwMat, magX1, CY + 12, scrZ2, 4, P.magWall + 6, 'x');
addCyl(feederParts.housing, screwMat, bracketX + 3, CY - 12, scrZ2, 7, 2, 'x');
addCyl(feederParts.housing, screwMat, bracketX + 3, CY + 12, scrZ2, 7, 2, 'x');

// ── Vertical slots (show adjustability — 2 slots) ──
addBox(feederParts.housing, slotMat, bracketX + 1, CY - 10, s0BaseZ + 8, 2, 3.5, s0AdjRange - 2);
addBox(feederParts.housing, slotMat, bracketX + 1, CY + 7, s0BaseZ + 8, 2, 3.5, s0AdjRange - 2);
// Hash marks (height scale)
for (let i = 0; i < 6; i++) {
  const hz = s0BaseZ + 8 + i * (s0AdjRange - 6) / 5;
  addBox(feederParts.housing, screwMat, bracketX + 0.5, CY - 14, hz, 0.6, 4, 0.4);
  addBox(feederParts.housing, screwMat, bracketX + 0.5, CY + 10, hz, 0.6, 4, 0.4);
}

// ── Sliding carriage (moves up/down on bracket) ──
const carrZ = s0CurrZ;
addBox(feederParts.housing, M.wall, bracketX - 1, CY - s0W / 2 - 2, carrZ, 6, s0W + 4, 10);
// 2 locking bolts through slots (tighten to fix height)
addCyl(feederParts.housing, screwMat, bracketX + 3, CY - 10, carrZ + 5, 3, 8, 'x');
addCyl(feederParts.housing, screwMat, bracketX + 3, CY + 8.5, carrZ + 5, 3, 8, 'x');
// Locking knobs (hand-tightenable)
addCyl(feederParts.housing, knobMat, bracketX + 8, CY - 10, carrZ + 5, 10, 4, 'x');
addCyl(feederParts.housing, knobMat, bracketX + 8, CY + 8.5, carrZ + 5, 10, 4, 'x');

// ── Lead screw mechanism (fine height adjustment) ──
// Vertical threaded rod
addCyl(feederParts.housing, screwMat, bracketX + 2, CY, s0BaseZ + 2, 4, bracketH - 4, 'y');
// Top bearing block
addBox(feederParts.housing, M.frame, bracketX, CY - 5, s0BaseZ + bracketH - 5, 5, 10, 5);
// Adjustment wheel at top (turn to raise/lower sensor)
addCyl(feederParts.housing, knobMat, bracketX + 2, CY, s0BaseZ + bracketH + 1, 14, 5, 'y');
// Wheel grip lines
for (let a = 0; a < 8; a++) {
  const ang = a * Math.PI / 4;
  const gx = bracketX + 2 + Math.cos(ang) * 7;
  const gz = s0BaseZ + bracketH + 1 + Math.sin(ang) * 7;
  addBox(feederParts.housing, screwMat, gx - 0.5, CY - 3, gz - 0.5, 1, 6, 1);
}

// ── Rectangular sensor body (40×30mm) ──
const sensorBodyMat = new THREE.MeshStandardMaterial({ color: 0x1a4a1a, roughness: 0.4, metalness: 0.3 });
// Sensor body — U-shape fork (emitter top, receiver bottom, gap in middle for card)
const sensorArmX = bracketX - s0D;
const sensorY0 = CY - s0W / 2;
// Sensor back plate (vertical, attached to carriage)
addBox(feederParts.housing, sensorBodyMat, sensorArmX, sensorY0, carrZ - 2, s0D, s0W, s0H);
// Upper jaw (emitter arm — extends inward over card path)
addBox(feederParts.housing, sensorBodyMat, sensorArmX - 12, sensorY0 + 4, carrZ + s0H - 8, 12, s0W - 8, 6);
// Lower jaw (receiver arm — extends inward below card)
addBox(feederParts.housing, sensorBodyMat, sensorArmX - 12, sensorY0 + 4, carrZ - 2, 12, s0W - 8, 6);
// Emitter lens (green LED on top jaw, facing down)
const s0Top = addCyl(feederParts.housing, M.sensor, sensorArmX - 8, CY, carrZ + s0H - 3, 5, 3, 'y');
// Receiver lens (green LED on bottom jaw, facing up)
const s0Bot = addCyl(feederParts.housing, M.sensor, sensorArmX - 8, CY, carrZ + 1, 5, 3, 'y');
// Cable exit (rear of sensor)
addCyl(feederParts.housing, slotMat, bracketX, CY, carrZ + s0H / 2, 4, 5, 'x');
sensorMeshes['S0'] = { l: s0Top, r: s0Bot };

addSensor(beltParts.guides, s1X, 'S1');
addSensor(beltParts.guides, s2X, 'S2');
addSensor(beltParts.guides, s3X, 'S3');

// ══════════════════════════════════════════════════════════
//  ANIMATED OBJECTS
// ══════════════════════════════════════════════════════════
// ── Realistic credit card (ISO/IEC 7810 ID-1) ──
const cardShape = makeRoundedRectShape(P.cardL * S, P.cardW * S, 3 * S); // 3mm radius corners
const cardExtrudeSettings = { depth: P.cardT * S, bevelEnabled: false };
const cardGeo = new THREE.ExtrudeGeometry(cardShape, cardExtrudeSettings);
cardGeo.rotateX(-Math.PI / 2);
cardGeo.translate(0, P.cardT * S / 2, 0);

// Card material — gradient-like PVC plastic (light blue/white)
const cardBaseMat = new THREE.MeshStandardMaterial({ color: 0xeef4f8, roughness: 0.25, metalness: 0.08 });
const cardBackMat = new THREE.MeshStandardMaterial({ color: 0xe0e8f0, roughness: 0.3, metalness: 0.05 });
const activeCard = new THREE.Group();
const cardBody = new THREE.Mesh(cardGeo, cardBaseMat);
cardBody.castShadow = true;
activeCard.add(cardBody);

// Card edge highlight (thin side border, visible PVC layers)
const edgeMat = new THREE.MeshStandardMaterial({ color: 0xd0d8e0, roughness: 0.3, metalness: 0.1 });
const edgeTop = new THREE.Mesh(new THREE.BoxGeometry(P.cardL * S * 0.98, 0.15 * S, 0.3 * S), edgeMat);
edgeTop.position.set(0, P.cardT * S * 0.5, -P.cardW * S * 0.49);
activeCard.add(edgeTop);
const edgeBot = edgeTop.clone(); edgeBot.position.z = P.cardW * S * 0.49; activeCard.add(edgeBot);

// EMV chip (gold rectangle with contact pads pattern)
const chipMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.15, metalness: 0.85 });
const chipW = 12 * S, chipH = 10 * S;
const chipMesh = new THREE.Mesh(new THREE.BoxGeometry(chipW, 0.4 * S, chipH), chipMat);
chipMesh.position.set(-P.cardL * S * 0.22, P.cardT * S + 0.2 * S, -P.cardW * S * 0.1);
activeCard.add(chipMesh);
// Chip contact pad grid (8 contacts like real EMV)
const padMat = new THREE.MeshStandardMaterial({ color: 0xC8A030, roughness: 0.2, metalness: 0.75 });
for (let r = 0; r < 2; r++) {
  for (let c = 0; c < 4; c++) {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(2.2 * S, 0.15 * S, 2 * S), padMat);
    pad.position.set((-P.cardL * 0.22 - 4 + c * 2.8) * S, P.cardT * S + 0.45 * S, (-P.cardW * 0.1 - 2 + r * 4) * S);
    activeCard.add(pad);
  }
}
// Chip border
const chipBorder = new THREE.Mesh(new THREE.BoxGeometry((chipW + 1 * S), 0.1 * S, (chipH + 1 * S)), 
  new THREE.MeshStandardMaterial({ color: 0xB89830, roughness: 0.3, metalness: 0.6 }));
chipBorder.position.set(-P.cardL * S * 0.22, P.cardT * S + 0.15 * S, -P.cardW * S * 0.1);
activeCard.add(chipBorder);

// Contactless NFC symbol (three arcs, top right of chip)
const nfcMat = new THREE.MeshStandardMaterial({ color: 0xb0b8c0, roughness: 0.4, metalness: 0.2 });
for (let i = 0; i < 3; i++) {
  const arcR = (3 + i * 2.5) * S;
  const arcGeo = new THREE.TorusGeometry(arcR, 0.25 * S, 4, 12, Math.PI * 0.4);
  const arc = new THREE.Mesh(arcGeo, nfcMat);
  arc.position.set(-P.cardL * S * 0.09, P.cardT * S + 0.3 * S, -P.cardW * S * 0.12);
  arc.rotation.x = Math.PI / 2;
  arc.rotation.z = -Math.PI * 0.3;
  activeCard.add(arc);
}

// Magnetic stripe (dark band on back)
const stripeMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.5, metalness: 0.35 });
const stripeMesh = new THREE.Mesh(new THREE.BoxGeometry(P.cardL * S * 0.95, 0.25 * S, 10 * S), stripeMat);
stripeMesh.position.set(0, -0.12 * S, -P.cardW * S * 0.28);
activeCard.add(stripeMesh);
// Signature strip (white rectangle on back, below mag stripe)
const sigMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.6, metalness: 0.02 });
const sigStrip = new THREE.Mesh(new THREE.BoxGeometry(30 * S, 0.15 * S, 6 * S), sigMat);
sigStrip.position.set(5 * S, -0.12 * S, -P.cardW * S * 0.1);
activeCard.add(sigStrip);

// Card number area (4 groups of 4 digits — embossed)
const embossMat = new THREE.MeshStandardMaterial({ color: 0xd0d8dc, roughness: 0.15, metalness: 0.15 });
for (let g = 0; g < 4; g++) {
  const numBlock = new THREE.Mesh(new THREE.BoxGeometry(14 * S, 0.25 * S, 3.5 * S), embossMat);
  numBlock.position.set((-22 + g * 16) * S, P.cardT * S + 0.18 * S, 5 * S);
  activeCard.add(numBlock);
}
// Cardholder name line
const nameLine = new THREE.Mesh(new THREE.BoxGeometry(40 * S, 0.15 * S, 2.5 * S), embossMat);
nameLine.position.set(-5 * S, P.cardT * S + 0.15 * S, 14 * S);
activeCard.add(nameLine);
// Expiry date
const expLine = new THREE.Mesh(new THREE.BoxGeometry(12 * S, 0.15 * S, 2 * S), embossMat);
expLine.position.set(-15 * S, P.cardT * S + 0.15 * S, 10 * S);
activeCard.add(expLine);

// Card brand logo (two overlapping circles — Mastercard style)
const logoMat1 = new THREE.MeshStandardMaterial({ color: 0xEB001B, roughness: 0.4, metalness: 0.1 });
const logoMat2 = new THREE.MeshStandardMaterial({ color: 0xF79E1B, roughness: 0.4, metalness: 0.1 });
const circGeo = new THREE.CircleGeometry(3.5 * S, 16);
const circ1 = new THREE.Mesh(circGeo, logoMat1);
circ1.position.set(P.cardL * S * 0.30, P.cardT * S + 0.2 * S, -P.cardW * S * 0.32);
circ1.rotation.x = -Math.PI / 2;
activeCard.add(circ1);
const circ2 = new THREE.Mesh(circGeo, logoMat2);
circ2.position.set(P.cardL * S * 0.30 + 4 * S, P.cardT * S + 0.2 * S, -P.cardW * S * 0.32);
circ2.rotation.x = -Math.PI / 2;
activeCard.add(circ2);

// Hologram patch (iridescent small square)
const holoMat = new THREE.MeshStandardMaterial({ color: 0x88ddcc, roughness: 0.1, metalness: 0.7, transparent: true, opacity: 0.6 });
const holoPatch = new THREE.Mesh(new THREE.BoxGeometry(6 * S, 0.2 * S, 6 * S), holoMat);
holoPatch.position.set(P.cardL * S * 0.32, P.cardT * S + 0.2 * S, -P.cardW * S * 0.05);
activeCard.add(holoPatch);

activeCard.visible = false;
scene.add(activeCard);

// Sticker 30×30mm
const stickerSize = 30;
const stickerGeo = new THREE.BoxGeometry(stickerSize * S, 0.5 * S, stickerSize * S);
const stickerOnCard = new THREE.Mesh(stickerGeo, M.sticker);
stickerOnCard.visible = false; scene.add(stickerOnCard);

const exitCards = new THREE.Group(); scene.add(exitCards);

// ══════════════════════════════════════════════════════════
//  LABELS
// ══════════════════════════════════════════════════════════
makeLabel('A — פידר כרטיסים (M1)', mm(magInX0 + P.magInL / 2, CY, magBZ + P.magH + 16), '#4ecdc4', 0.08);
makeLabel('B — מסוע ראשי (M2)', mm((idlerX + driveX) / 2, CY, beltTopZ + 20), '#228B22', 0.08);
makeLabel('איזור מעבר', mm((transStartX + transEndX) / 2, CY, beltTopZ + 15), '#f39c12', 0.06);
makeLabel('C — ראש הדבקה', mm(lhCX, CY, lhBaseZ + postH + 10), '#e94560', 0.08);
makeLabel('D — יציאה', mm(exitX0 + P.exitLen / 2, CY, exitBeltZ + 12), '#2ecc71', 0.08);

makeLabel('M1 פידר', mm(feedCX, P.frameW + P.nemaD / 2 + 8, feedCZ + 28), '#777', 0.05);
makeLabel('M2 מסוע', mm(driveX, P.frameW + P.nemaD / 2 + 8, rollerCZ + 28), '#777', 0.05);
makeLabel('M3 מדבקות', mm(rollX, P.frameW + P.nemaD / 2 + 8, rollZ + 28), '#777', 0.05);

makeLabel('S0 גובה', mm(s0X, CY + s0W / 2 + 8, s0CurrZ + s0H + 6), '#0f0', 0.04);
makeLabel('S1 מעבר', mm(s1X, guideY0 - 8, exitBeltZ + 16), '#0f0', 0.05);
makeLabel('S2', mm(s2X, guideY0 - 8, exitBeltZ + 16), '#0f0', 0.05);
makeLabel('S3', mm(s3X, guideY0 - 8, exitBeltZ + 16), '#0f0', 0.05);

makeLabel('מסוע חיכוך', mm(feedCX, CY, feedCZ - 14), '#8B4513', 0.04);
makeLabel('חריץ יציאה →', mm(magX1 + 3, CY, magBZ + 6), '#f1c40f', 0.04);
makeLabel('רולרי הזנה (M1)', mm(exitRollerX, CY, exitRollerTopZ + 10), '#4682B4', 0.04);
makeLabel('→→→ M1 מזין | S1 מזהה | M2 מסיע →→→', mm((transStartX + driveX) / 2, CY, beltTopZ - 8), '#555', 0.06);
makeLabel('פלטת קילוף', mm(peelX + P.peelL / 2, CY, peelZ + 8), '#DAA520', 0.04);
makeLabel('רולר לחיצה ↑', mm(lhCX + 8, CY, pressLZ - 13), '#6A5ACD', 0.04);

// ══════════════════════════════════════════════════════════
//  SIMULATION
// ══════════════════════════════════════════════════════════
const SIM = {
  speed: 5, running: false, single: false,
  state: 'IDLE', cardX: 0, cardVis: false, mag: 12, cyc: 0,
  m1: false, m2: false, m3: false,
  sFeed: false, s0: false, s1: false, s2: false, s3: false,
  lblProg: 0, stkOn: false,
  feedAngle: 0, beltAngle: 0,
  feedTimer: 0,
  FEED_TICKS: 70,                           // M1 runs for this many ticks (timed feed)

  CARD_START: magInX0 + P.magInL / 2,
  FEED_EXIT: magX1 + 10,
  TRANS_MID: (transStartX + transEndX) / 2,  // mid transition zone
  S1_POS: s1X,
  BELT_ENTRY: idlerX,                        // where main belt grabs card
  S2_POS: s2X,
  LABEL_POS: lhCX + 8,
  S3_POS: s3X,
  EXIT_END: exitX0 + P.exitLen - 10,
};

function setState(s) { SIM.state = s; document.getElementById('vState').textContent = s; }

function updateSensors() {
  // SICK feed sensor — detects cards in magazine (active as long as cards exist)
  SIM.sFeed = SIM.mag > 0;
  const feedS = sensorMeshes['SFEED'];
  if (feedS) {
    feedS.led.material = SIM.sFeed ? sickIndMat : sickIndOffMat;
    feedS.lens.material = SIM.sFeed ? sickLensMat : 
      new THREE.MeshStandardMaterial({ color: 0x442222, roughness: 0.4, metalness: 0.15 });
  }
  document.getElementById('dF').className = 'sd' + (SIM.sFeed ? ' on' : '');

  // Card position sensors
  if (!SIM.cardVis) { SIM.s0 = SIM.s1 = SIM.s2 = SIM.s3 = false; }
  else {
    const lead = SIM.cardX + P.cardL / 2;
    const trail = SIM.cardX - P.cardL / 2;
    SIM.s0 = lead >= s0X - 5 && trail <= s0X + 10;
    SIM.s1 = lead >= s1X && trail <= s1X + 12;
    SIM.s2 = lead >= s2X && trail <= s2X + 12;
    SIM.s3 = lead >= s3X && trail <= s3X + 25;
  }
  ['S0','S1','S2','S3'].forEach((n, i) => {
    const on = [SIM.s0, SIM.s1, SIM.s2, SIM.s3][i];
    document.getElementById('d' + i).className = 'sd' + (on ? ' on' : '');
    const s = sensorMeshes[n];
    if (s) { s.l.material = on ? M.sensorOn : M.sensor; s.r.material = on ? M.sensorOn : M.sensor; }
  });
}

function updateUI() {
  const mo = [[SIM.m1,'M1 פידר'],[SIM.m2,'M2 מסוע'],[SIM.m3,'M3 מדבקות']];
  mo.forEach(([on, label], i) => {
    const el = document.getElementById('vM' + (i + 1));
    el.textContent = label + ': ' + (on ? '▶ פעיל' : '⏸');
    el.style.color = on ? '#2ecc71' : '#777';
  });
}

function tick() {
  const spd = SIM.speed * 0.5;
  switch (SIM.state) {
    case 'IDLE':
      SIM.m1 = SIM.m2 = SIM.m3 = false;
      if (SIM.sFeed && (SIM.running || SIM.single)) {
        SIM.mag--;
        document.getElementById('vCards').textContent = SIM.mag;
        SIM.cardX = SIM.CARD_START;
        SIM.cardVis = true; SIM.stkOn = false; SIM.lblProg = 0;
        SIM.feedTimer = 0;
        cardStackMeshes.forEach((c, i) => c.visible = i < SIM.mag);
        setState('FEEDING');
      }
      break;
    case 'FEEDING':
      // M1 pushes card out of magazine for a DEFINED TIME
      SIM.m1 = true; SIM.m2 = false; SIM.m3 = false;
      SIM.feedTimer++;
      SIM.cardX += spd * 0.4;
      if (SIM.feedTimer >= SIM.FEED_TICKS) {
        // Timed feed complete → card should be in transition zone
        setState('WAIT_S1');
      }
      break;
    case 'WAIT_S1':
      // M1 exit rollers still push card toward S1
      SIM.m1 = true; SIM.m2 = false; SIM.m3 = false;
      SIM.cardX += spd * 0.3;
      if (SIM.s1) {
        // S1 detected card → transfer to main belt
        setState('TRANSFER');
      }
      break;
    case 'TRANSFER':
      // Card entering main belt zone, M1 stops, M2 starts
      SIM.m1 = false; SIM.m2 = true; SIM.m3 = false;
      SIM.cardX += spd * 0.7;
      if (SIM.cardX >= SIM.BELT_ENTRY + 20) setState('ON_BELT');
      break;
    case 'ON_BELT':
      // Card fully on main belt, belt carries to label zone
      SIM.m1 = false; SIM.m2 = true; SIM.m3 = false;
      SIM.cardX += spd;
      if (SIM.cardX >= SIM.LABEL_POS) setState('STOP_LABEL');
      break;
    case 'STOP_LABEL':
      SIM.m1 = false; SIM.m2 = false; SIM.m3 = false;
      setState('LABELING');
      break;
    case 'LABELING':
      SIM.m1 = false; SIM.m2 = false; SIM.m3 = true;
      SIM.lblProg += 0.02 * SIM.speed;
      if (SIM.lblProg >= 1) {
        SIM.lblProg = 1; SIM.stkOn = true;
        setState('POST_LABEL');
      }
      break;
    case 'POST_LABEL':
      SIM.m1 = false; SIM.m2 = true; SIM.m3 = false;
      SIM.cardX += spd;
      if (SIM.cardX >= SIM.EXIT_END) setState('DONE');
      break;
    case 'DONE':
      SIM.m1 = SIM.m2 = SIM.m3 = false;
      SIM.cardVis = false; SIM.cyc++;
      document.getElementById('vCyc').textContent = SIM.cyc;
      addExitCard();
      if (SIM.single) { SIM.single = false; SIM.running = false; updateGoBtn(); }
      setState('IDLE');
      break;
  }

  // Animate feed mini belt + exit rollers rotation
  if (SIM.m1) {
    SIM.feedAngle += 0.08 * SIM.speed;
    feedRollerRear.rotation.y = SIM.feedAngle;
    feedRollerFront.rotation.y = SIM.feedAngle;
    exitRollerBotMesh.rotation.y = SIM.feedAngle * 0.7;
    exitRollerTopMesh.rotation.y = -SIM.feedAngle * 0.7;
  }
  // Animate mini belt arrows
  const feedBeltTotal = P.feedBeltLen + feedArrowSpacing;
  feedArrows.forEach(a => {
    const scrollOff = (SIM.feedAngle * P.feedD / 2) % feedBeltTotal;
    let x = feedR1X + ((a.baseX + scrollOff) % feedBeltTotal);
    if (x > feedR2X + 5) x -= feedBeltTotal;
    a.mesh.position.x = x * S;
    a.mesh.visible = (x >= feedR1X - 3 && x <= feedR2X + 3);
  });
  // Animate belt rollers + arrows
  if (SIM.m2) {
    SIM.beltAngle += 0.05 * SIM.speed;
    idlerMesh.rotation.y = SIM.beltAngle;
    driveMesh.rotation.y = SIM.beltAngle;
    // Rotate roller arrows
    idlerArrowL.rotation.z = SIM.beltAngle;
    idlerArrowR.rotation.z = SIM.beltAngle;
    driveArrowL.rotation.z = SIM.beltAngle;
    driveArrowR.rotation.z = SIM.beltAngle;
  }
  // Animate belt surface arrows (scroll along belt)
  const beltTotalLen = topBeltLen + arrowSpacing;
  beltArrows.forEach(a => {
    const scrollOff = SIM.m2 ? (SIM.beltAngle * P.rollerD / 2) % beltTotalLen : 0;
    let x = idlerX + ((a.baseX + scrollOff) % beltTotalLen);
    if (x > driveX) x -= beltTotalLen;
    a.mesh.position.x = x * S;
    a.mesh.visible = (x >= idlerX - 5 && x <= driveX + 5);
  });
  beltArrowsBot.forEach(a => {
    const scrollOff = SIM.m2 ? (SIM.beltAngle * P.rollerD / 2) % beltTotalLen : 0;
    let x = idlerX + ((a.baseX - scrollOff + beltTotalLen * 10) % beltTotalLen);
    if (x > driveX) x -= beltTotalLen;
    a.mesh.position.x = x * S;
    a.mesh.visible = (x >= idlerX - 5 && x <= driveX + 5);
  });
  // Animate label roll
  if (SIM.m3) {
    labelRollGroup.rotation.z += 0.03 * SIM.speed;
    pressRoller.rotation.y += 0.04 * SIM.speed;
  }

  // Card position — rides on top of belt
  if (SIM.cardVis) {
    activeCard.visible = true;
    activeCard.position.set(SIM.cardX * S, (beltTopZ + P.beltT + 0.2) * S, CY * S);
  } else {
    activeCard.visible = false;
  }

  // Sticker peeling animation — sticker comes from peel plate tip, sticks to card
  const peelTipX = peelX + P.peelL + 10;  // peel plate tip X
  const stkZ = beltTopZ + P.beltT + P.cardT + 0.3;
  if (SIM.stkOn && SIM.cardVis) {
    // Sticker fully applied on card
    stickerOnCard.visible = true; stickerOnCard.scale.x = 1;
    stickerOnCard.position.set(SIM.cardX * S, stkZ * S, CY * S);
    stickerEdge.visible = false;
  } else if (SIM.lblProg > 0 && !SIM.stkOn && SIM.cardVis) {
    // Sticker peeling — leading edge on card, trailing edge still at peel tip
    stickerOnCard.visible = true;
    stickerOnCard.scale.x = SIM.lblProg;
    const leadX = SIM.cardX;
    const trailX = peelTipX;
    const visX = trailX + (leadX - trailX) * SIM.lblProg;
    stickerOnCard.position.set(visX * S, stkZ * S, CY * S);
    stickerEdge.visible = false;  // hide static edge while peeling
  } else {
    stickerOnCard.visible = false;
    stickerEdge.visible = true;   // show protruding sticker edge when idle
  }

  updateSensors();
  updateUI();
}

function addExitCard() {
  const i = exitCards.children.length;
  const cm = new THREE.Mesh(cardGeo, M.card.clone());
  cm.material.opacity = 0.6; cm.material.transparent = true;
  const xOff = exitX0 + 12 + (i % 5) * 3;
  const zOff = exitBeltZ - P.exitDrop / 2 + (i % 5);
  cm.position.copy(mm(xOff, CY, zOff));
  cm.rotation.z = -P.exitDrop / P.exitLen * 0.3;
  exitCards.add(cm);
  const sm = new THREE.Mesh(stickerGeo, M.sticker.clone());
  sm.material.opacity = 0.7; sm.material.transparent = true;
  sm.position.copy(mm(xOff, CY, zOff + 1));
  sm.rotation.z = cm.rotation.z;
  exitCards.add(sm);
  if (exitCards.children.length > 14) { exitCards.remove(exitCards.children[0]); exitCards.remove(exitCards.children[0]); }
}

// ══════════════════════════════════════════════════════════
//  VIEWS
// ══════════════════════════════════════════════════════════
const views = {
  perspective: { p: [3.5, 2.6, 2.5], t: [1.9, 0.5, 0.45] },
  top:   { p: [1.9, 5, 0.45], t: [1.9, 0.5, 0.45] },
  side:  { p: [1.9, 1, -2.5], t: [1.9, 0.5, 0.45] },
  front: { p: [-1.5, 1.2, 0.45], t: [1.9, 0.5, 0.45] },
  feeder:{ p: [0.4, 1.4, -0.3], t: [0.45, 0.6, 0.45] },
  label: { p: [2.5, 2.2, 0.8], t: [2.4, 1.2, 0.45] },
};
let tPos = null, tTgt = null;
let xray = false;

window.setView = function(n) {
  const v = views[n]; if (!v) return;
  tPos = new THREE.Vector3(...v.p);
  tTgt = new THREE.Vector3(...v.t);
  document.querySelectorAll('.vb').forEach(b => b.classList.remove('ac'));
  if (event && event.target) event.target.classList.add('ac');
};

window.toggleXray = function() {
  xray = !xray;
  document.getElementById('bXray').classList.toggle('ac', xray);
  [modA, modB, modC, modD].forEach(mod => {
    mod.traverse(ch => {
      if (ch.isMesh) {
        if (ch.material === M.frame || ch.material === M.magWall || ch.material === M.wall)
          ch.material = xray ? M.frameT : M.frame;
        if (ch.material === M.glass) ch.material.opacity = xray ? 0.05 : 0.15;
      }
    });
  });
};

// Frame side panel opacity control
window.setFrameOp = function() {
  const v = parseInt(document.getElementById('frameOpR').value) / 100;
  M.frameSide.opacity = v;
  M.frameSide.transparent = true;
  M.frameSide.needsUpdate = true;
};

// ── Explode ──────────────────────────────────────────────
const feederExp = { housing: [0, 0.4, 0], feedWheel: [0, -0.25, -0.35], sepPad: [0, -0.15, 0.3], cards: [0, 0.25, 0], motor: [0, -0.45, -0.4] };
const beltExp = { frame: [0, -0.25, 0], rollers: [0, 0.15, -0.3], belt: [0, 0.3, 0], guides: [0, 0.1, 0.25] };
const labelExp = { frame: [0, 0.5, 0], roll: [0, 0.75, 0], peel: [0, -0.1, -0.25], press: [0, -0.35, 0], strips: [0, 0.25, 0.25] };
const allOff = { A: [-0.5, 0.25, 0], B: [0, 0, 0], C: [0, 0.7, 0], D: [0.4, 0, 0], motors: [0, -0.4, 0.4] };
const z3 = new THREE.Vector3();

window.toggleExplode = function() { ex.all = !ex.all; document.getElementById('bExAll').classList.toggle('ex', ex.all); };
window.toggleMod = function(m) {
  ex[m] = !ex[m];
  document.getElementById('bEx' + m).classList.toggle('ex', ex[m]);
  if (ex[m]) { if (m === 'A') setView('feeder'); if (m === 'C') setView('label'); }
};

window.showInfo = function() { document.getElementById('infoP').classList.add('vis'); };
window.hideInfo = function() { document.getElementById('infoP').classList.remove('vis'); };

// ── Controls ─────────────────────────────────────────────
window.toggleRun = function() { SIM.running = !SIM.running; SIM.single = false; updateGoBtn(); };
window.stepOnce = function() { SIM.single = true; SIM.running = false; updateGoBtn(); };
window.resetAll = function() {
  SIM.running = false; SIM.single = false; SIM.state = 'IDLE';
  SIM.cardVis = false; SIM.mag = 12; SIM.cyc = 0;
  SIM.lblProg = 0; SIM.stkOn = false; SIM.feedTimer = 0;
  SIM.m1 = SIM.m2 = SIM.m3 = false;
  activeCard.visible = false; stickerOnCard.visible = false;
  cardStackMeshes.forEach(c => c.visible = true);
  while (exitCards.children.length) exitCards.remove(exitCards.children[0]);
  document.getElementById('vState').textContent = 'IDLE';
  document.getElementById('vCyc').textContent = '0';
  document.getElementById('vCards').textContent = '12';
  updateGoBtn(); updateUI(); updateSensors();
};
function updateGoBtn() {
  const b = document.getElementById('bGo');
  if (SIM.running) { b.textContent = '⏸ עצור'; b.classList.add('on'); }
  else { b.textContent = '▶ הפעל'; b.classList.remove('on'); }
}
window.setSpd = function() {
  SIM.speed = parseInt(document.getElementById('spdR').value);
  document.getElementById('spdV').textContent = SIM.speed + '×';
};

// ── Animation loop ───────────────────────────────────────
function lerp3(obj, target, t) {
  const tv = target instanceof THREE.Vector3 ? target : new THREE.Vector3(...target);
  obj.position.lerp(tv, t);
}

function animate() {
  requestAnimationFrame(animate);

  if (tPos) {
    camera.position.lerp(tPos, 0.05);
    ctrl.target.lerp(tTgt, 0.05);
    if (camera.position.distanceTo(tPos) < 0.01) { tPos = null; tTgt = null; }
  }

  // Global explode
  if (ex.all) {
    lerp3(modA, allOff.A, 0.05);
    lerp3(modC, allOff.C, 0.05);
    lerp3(modD, allOff.D, 0.05);
    lerp3(motorsGrp, allOff.motors, 0.05);
  } else if (!ex.A && !ex.B && !ex.C && !ex.D) {
    lerp3(modA, z3, 0.05);
    lerp3(modC, z3, 0.05);
    lerp3(modD, z3, 0.05);
    lerp3(motorsGrp, z3, 0.05);
  }

  // Per-module explode
  if (ex.A) Object.keys(feederParts).forEach(k => lerp3(feederParts[k], feederExp[k], 0.04));
  else Object.values(feederParts).forEach(g => lerp3(g, z3, 0.06));

  if (ex.B) Object.keys(beltParts).forEach(k => lerp3(beltParts[k], beltExp[k], 0.04));
  else Object.values(beltParts).forEach(g => lerp3(g, z3, 0.06));

  if (ex.C) Object.keys(labelParts).forEach(k => lerp3(labelParts[k], labelExp[k], 0.04));
  else Object.values(labelParts).forEach(g => lerp3(g, z3, 0.06));

  // Simulation
  if (SIM.running || SIM.single || SIM.state !== 'IDLE') tick();

  ctrl.update();
  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

animate();

