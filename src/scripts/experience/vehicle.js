import * as THREE from 'three';

export function createVehicle() {
  const vehicle = new THREE.Group();
  vehicle.rotation.z = -.24;

  const silver = new THREE.MeshStandardMaterial({color: 0xd8dde1, metalness: .72, roughness: .3});
  const white = new THREE.MeshStandardMaterial({color: 0xf2ece3, metalness: .25, roughness: .38});
  const dark = new THREE.MeshStandardMaterial({color: 0x222b35, metalness: .7, roughness: .38});
  const orange = new THREE.MeshStandardMaterial({color: 0xff5c24, metalness: .35, roughness: .32});
  const materials = [silver, white, dark, orange];
  const mesh = (geometry, material, y, parent = vehicle) => {
    const object = new THREE.Mesh(geometry, material);
    object.position.y = y;
    parent.add(object); return object;
  };
  mesh(new THREE.CylinderGeometry(.43, .43, 4.3, 64), white, 0);
  mesh(new THREE.CylinderGeometry(.435, .435, .52, 64), dark, -1.37);
  mesh(new THREE.CylinderGeometry(.441, .441, .14, 64), orange, 1.34);
  for (const y of [-2.15, -.96, 1.44, 2.12]) mesh(new THREE.CylinderGeometry(.446, .446, .055, 64), silver, y);
  const nosePoints = [];
  for (let i = 0; i <= 32; i++) { const t = i / 32; nosePoints.push(new THREE.Vector2(.43 * Math.cos(t * Math.PI / 2), t * 1.65)); }
  mesh(new THREE.LatheGeometry(nosePoints, 64), silver, 2.15);
  mesh(new THREE.CylinderGeometry(.33, .24, .35, 48), dark, -2.3);
  mesh(new THREE.CylinderGeometry(.18, .34, .45, 48, 1, true), silver, -2.66);
  mesh(new THREE.CylinderGeometry(.19, .19, .025, 32), dark, -2.87);
  // Four thin swept stabilisers, modelled as an extruded airframe section.
  const finShape = new THREE.Shape();
  finShape.moveTo(.38, -.95); finShape.lineTo(1.04, -2.12); finShape.lineTo(1.04, -2.55); finShape.lineTo(.38, -2.05); finShape.closePath();
  const finGeometry = new THREE.ExtrudeGeometry(finShape, {depth: .055, bevelEnabled: false});
  finGeometry.translate(0, 0, -.0275);
  for (let i = 0; i < 4; i++) { const fin = mesh(finGeometry, i % 2 ? dark : orange, 0); fin.rotation.y = i * Math.PI / 2; }
  for (let i = 0; i < 8; i++) {
    const angle = i / 8 * Math.PI * 2;
    const rail = mesh(new THREE.BoxGeometry(.022, .8, .028), silver, -1.4);
    rail.position.x = Math.sin(angle) * .436; rail.position.z = Math.cos(angle) * .436; rail.rotation.y = angle;
  }
  // The texture is a vehicle marking, drawn locally without external assets.
  const labelCanvas = document.createElement('canvas'); labelCanvas.width = 512; labelCanvas.height = 1024;
  const ctx = labelCanvas.getContext('2d');
  let labelTexture;
  if (ctx) {
    ctx.fillStyle = '#f2ece3'; ctx.fillRect(0, 0, 512, 1024);
    ctx.fillStyle = '#172029'; ctx.font = 'bold 90px monospace'; ctx.textAlign = 'center';
    ['V', 'I', 'S', 'W', 'A'].forEach((letter, i) => ctx.fillText(letter, 256, 200 + i * 125));
    ctx.fillStyle = '#dd4b23'; ctx.fillRect(145, 840, 222, 10); ctx.font = '34px monospace'; ctx.fillText('VM—01', 256, 920);
    labelTexture = new THREE.CanvasTexture(labelCanvas); labelTexture.colorSpace = THREE.SRGBColorSpace;
    const marking = new THREE.MeshStandardMaterial({map: labelTexture, roughness: .38, metalness: .25}); materials.push(marking);
    const panel = mesh(new THREE.CylinderGeometry(.433, .433, 2.2, 32, 1, true, -.48, .96), marking, .1);
    panel.rotation.y = .25;
  }
  const exhaust = new THREE.Group(); vehicle.add(exhaust); exhaust.position.y = -2.86; exhaust.visible = false;
  const flameMaterial = new THREE.MeshBasicMaterial({color: 0xff7a29, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending});
  const coreMaterial = new THREE.MeshBasicMaterial({color: 0xd4eaff, transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending});
  const flame = mesh(new THREE.ConeGeometry(.32, 2.1, 32), flameMaterial, -1.05, exhaust); flame.rotation.z = Math.PI;
  const core = mesh(new THREE.ConeGeometry(.16, 1.45, 32), coreMaterial, -.72, exhaust); core.rotation.z = Math.PI;

  return { vehicle, exhaust, materials, labelTexture, flameMaterial, coreMaterial };
}
