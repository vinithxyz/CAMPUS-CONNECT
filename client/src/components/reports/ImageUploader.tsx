import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { validateImages } from '../../utils/imageValidation';

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
}

export default function ImageUploader({ files, onChange }: Props) {
  const [errors, setErrors] = useState<string[]>([]);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviews(urls);

    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u.url));
    };
  }, [files]);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const incomingArr = Array.from(incoming);
    const { accepted, errors: errs } = validateImages(files, incomingArr);

    if (errs.length) {
      setErrors(errs);
    } else {
      setErrors([]);
    }

    if (accepted.length) {
      onChange([...files, ...accepted]);
    }
  };

  const handleRemove = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onChange(updated);
    setErrors([]);
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/20 rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
      >
        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
          <UploadCloud className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold text-slate-700">Click to upload or drag and drop</p>
        <p className="text-[11px] text-slate-400">(Max 5 images, JPG/PNG, up to 2MB each)</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs space-y-1">
          {errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      {/* Preview thumbnails */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-1">
          {previews.map((item, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group shadow-2xs"
            >
              <img
                src={item.url}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-1 right-1 p-1 bg-slate-900/70 hover:bg-rose-600 text-white rounded-full opacity-80 group-hover:opacity-100 transition"
                aria-label="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
