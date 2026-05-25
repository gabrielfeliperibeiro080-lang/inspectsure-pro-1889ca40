import { useRef, useState } from "react";
import { compressImage, detectConnectionQuality } from "@/lib/image";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  photos: string[];
  onChange: (photos: string[]) => void;
  max?: number;
}

export function PhotoUploader({ photos, onChange, max = 10 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setProgress(0);
    const next = [...photos];
    const quality = detectConnectionQuality() === "slow" ? 0.7 : 0.82;
    let i = 0;
    for (const f of Array.from(files)) {
      if (next.length >= max) break;
      try {
        const { dataUrl } = await compressImage(f, { quality });
        next.push(dataUrl);
      } catch (e) {
        console.error(e);
      }
      i++;
      setProgress(Math.round((i / files.length) * 100));
    }
    onChange(next);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((p, idx) => (
            <div key={idx} className="group relative aspect-square overflow-hidden rounded-md border">
              <img src={p} alt="" loading="lazy" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(photos.filter((_, i) => i !== idx))}
                className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy || photos.length >= max}
        >
          {busy ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" /> Otimizando… {progress}%
            </>
          ) : (
            <>
              <Camera className="size-4 mr-2" /> Adicionar fotos
            </>
          )}
        </Button>
        {photos.length >= max && (
          <span className="ml-2 text-xs text-muted-foreground">Limite atingido</span>
        )}
      </div>
    </div>
  );
}
