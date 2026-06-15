// Client-side image compression: resize to max 1920px, encode WebP, strip EXIF
// (canvas re-encoding drops EXIF), produce sub-1MB output when possible.

export interface CompressOptions {
  maxDimension?: number;
  quality?: number; // 0..1
  mimeType?: string;
}

export async function compressImage(
  file: File | Blob,
  opts: CompressOptions = {},
): Promise<{ dataUrl: string; blob: Blob; width: number; height: number; sizeKB: number }> {
  const maxDim = opts.maxDimension ?? 1280;
  const mimeType = opts.mimeType ?? "image/webp";
  const initialQuality = opts.quality ?? 0.7;

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  // Target ~400KB to keep the inspection JSONB row small
  let q = initialQuality;
  let blob = await canvasToBlob(canvas, mimeType, q);
  while (blob.size > 400 * 1024 && q > 0.4) {
    q -= 0.08;
    blob = await canvasToBlob(canvas, mimeType, q);
  }

  const dataUrl = await blobToDataUrl(blob);
  return { dataUrl, blob, width, height, sizeKB: Math.round(blob.size / 1024) };
}


export async function makeThumbnail(file: File | Blob): Promise<string> {
  const { dataUrl } = await compressImage(file, {
    maxDimension: 320,
    quality: 0.75,
  });
  return dataUrl;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, q: number): Promise<Blob> {
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b ?? new Blob()), type, q),
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(blob);
  });
}

export function detectConnectionQuality(): "slow" | "fast" {
  // @ts-expect-error - navigator.connection is non-standard
  const c = navigator.connection ?? navigator.mozConnection ?? navigator.webkitConnection;
  if (!c) return "fast";
  if (c.saveData) return "slow";
  if (["slow-2g", "2g", "3g"].includes(c.effectiveType)) return "slow";
  return "fast";
}
