/**
 * The player avatar, drawn from a character map so it stays a real pixel sprite.
 * `.` = transparent, other keys index into the palette below.
 */
const FACE = [
  '....hhhhhhhh....',
  '..hhhhhhhhhhhh..',
  '.hhhhhhhhhhhhhh.',
  '.hhsssssssssssh.',
  '.hsssssssssssssh',
  '.sssssssssssssss',
  '.sskksssssskksss',
  '.sskksssssskksss',
  '.sssssssssssssss',
  '.sssssrrrrssssss',
  '..ssssrrrrsssss.',
  '...sssssssssss..',
  '....ssssssss....',
  '......ssss......',
  '....cccccccc....',
  '..cccccccccccc..',
];

const PALETTE: Record<string, string> = {
  h: '#a06cd5',
  s: '#f7cea4',
  k: '#241f3d',
  r: '#ff5d73',
  c: '#ffd23f',
};

/** Render the avatar at an integer scale that fits `size`. */
export function drawAvatar(canvas: HTMLCanvasElement, size: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const cols = FACE[0].length;
  const rows = FACE.length;
  const scale = Math.max(1, Math.floor(size / Math.max(cols, rows)));
  const w = cols * scale;
  const h = rows * scale;
  canvas.width = size;
  canvas.height = size;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, size, size);
  const ox = Math.floor((size - w) / 2);
  const oy = Math.floor((size - h) / 2);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const c = PALETTE[FACE[y][x]];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
    }
  }
}

/** A tiny 32×32 avatar for the HUD, with a blink frame. */
export function drawHudAvatar(canvas: HTMLCanvasElement, blink = false): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const scale = 2;
  canvas.width = 32;
  canvas.height = 32;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 32, 32);
  const ox = Math.floor((32 - FACE[0].length * scale) / 2);
  const oy = Math.floor((32 - FACE.length * scale) / 2);
  for (let y = 0; y < FACE.length; y++) {
    for (let x = 0; x < FACE[y].length; x++) {
      const ch = FACE[y][x];
      let c = PALETTE[ch];
      if (!c) continue;
      if (blink && ch === 'k') c = PALETTE.s;
      ctx.fillStyle = c;
      ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
    }
  }
}
