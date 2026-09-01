import * as THREE from "three";

const cache = new Map<string, THREE.CanvasTexture>();

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function markerTexture(code: string, bg: string, fg = "#ede6d6"): THREE.CanvasTexture {
  const key = `${code}|${bg}|${fg}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const tex = new THREE.CanvasTexture(canvas);
    cache.set(key, tex);
    return tex;
  }

  ctx.clearRect(0, 0, size, size);
  roundRect(ctx, 8, 8, 112, 112, 18);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = fg;
  ctx.stroke();

  ctx.fillStyle = fg;
  ctx.font = "700 52px 'Source Sans 3', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(code, size / 2, size / 2 + 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  cache.set(key, tex);
  return tex;
}
