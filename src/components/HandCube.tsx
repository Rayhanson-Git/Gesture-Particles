const CUBE_VERTICES: [number, number, number][] = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1, 1],  [1, -1, 1],  [1, 1, 1],  [-1, 1, 1],
];

const CUBE_EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

function rotatePoint(
  px: number, py: number, pz: number,
  rx: number, ry: number, rz: number
): [number, number, number] {
  const cosX = Math.cos(rx), sinX = Math.sin(rx);
  const cosY = Math.cos(ry), sinY = Math.sin(ry);
  const cosZ = Math.cos(rz), sinZ = Math.sin(rz);

  let y1 = py * cosX - pz * sinX;
  let z1 = py * sinX + pz * cosX;
  let x1 = px;

  let x2 = x1 * cosY + z1 * sinY;
  let z2 = -x1 * sinY + z1 * cosY;
  let y2 = y1;

  let x3 = x2 * cosZ - y2 * sinZ;
  let y3 = x2 * sinZ + y2 * cosZ;

  return [x3, y3, z2];
}

export function drawHandCube(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  wristPos: Vec3,
  rotation: Vec3,
  isPinching: boolean
) {
  const time = Date.now() * 0.003;
  const cubeSize = Math.min(canvasWidth, canvasHeight) * 0.06;
  const breathe = isPinching
    ? 1.0 + Math.sin(time * 3) * 0.08
    : 1.0 + Math.sin(time * 1.5) * 0.04;
  const size = cubeSize * breathe;

  const centerX = wristPos.x * canvasWidth;
  const centerY = wristPos.y * canvasHeight;

  const projected: [number, number][] = CUBE_VERTICES.map(([vx, vy, vz]) => {
    const [rx, ry, rz] = rotatePoint(vx, vy, vz, rotation.x, rotation.y, rotation.z);
    const perspective = 4 / (4 + rz * 0.5);
    return [
      centerX + rx * size * perspective,
      centerY + ry * size * perspective,
    ];
  });

  const baseColor = isPinching ? '0, 255, 170' : '74, 158, 255';
  const edgeOpacity = isPinching
    ? 0.8 + Math.sin(time * 4) * 0.2
    : 0.6 + Math.sin(time * 2) * 0.2;

  ctx.save();

  ctx.shadowColor = `rgba(${baseColor}, 0.6)`;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = `rgba(${baseColor}, ${edgeOpacity})`;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  CUBE_EDGES.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(projected[a][0], projected[a][1]);
    ctx.lineTo(projected[b][0], projected[b][1]);
    ctx.stroke();
  });

  ctx.shadowBlur = 20;
  ctx.strokeStyle = `rgba(${baseColor}, ${edgeOpacity * 0.2})`;
  ctx.lineWidth = 6;

  CUBE_EDGES.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(projected[a][0], projected[a][1]);
    ctx.lineTo(projected[b][0], projected[b][1]);
    ctx.stroke();
  });

  ctx.shadowBlur = 0;
  const dotRadius = isPinching ? 3.5 : 2.5;
  projected.forEach(([px, py]) => {
    ctx.fillStyle = `rgba(${baseColor}, 0.9)`;
    ctx.beginPath();
    ctx.arc(px, py, dotRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(255, 255, 255, 0.8)`;
    ctx.beginPath();
    ctx.arc(px, py, dotRadius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}
