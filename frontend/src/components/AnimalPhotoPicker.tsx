import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';
import AnimalPhotoCapture from './AnimalPhotoCapture';

type AnimalPhotoPickerProps = {
  file: File | null;
  onChange: (file: File | null) => void;
};

export default function AnimalPhotoPicker({ file, onChange }: AnimalPhotoPickerProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, [file]);

  const applyPhotoFile = (nextFile: File | undefined) => {
    if (!nextFile) return;
    onChange(nextFile);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyPhotoFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const clearPhoto = () => {
    onChange(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">Foto del animal</label>

      {preview ? (
        <div className="relative mb-3 inline-block">
          <img
            src={preview}
            alt="Vista previa del animal"
            className="h-32 w-32 rounded-lg border-2 border-gray-300 object-cover"
          />
          <button
            type="button"
            onClick={clearPhoto}
            className="absolute -right-2 -top-2 rounded-full bg-rose-600 p-1 text-white shadow-sm hover:bg-rose-700"
            aria-label="Quitar foto seleccionada"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setCameraOpen(true)}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Camera className="h-5 w-5" />
          Tomar foto
        </button>
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-100"
        >
          <ImagePlus className="h-5 w-5" />
          Elegir imagen
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoChange}
        className="hidden"
      />

      <p className="mt-2 text-xs text-gray-500">
        Tomar foto abre la cámara del dispositivo. Elegir imagen usa galería o archivos.
      </p>

      <AnimalPhotoCapture
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={applyPhotoFile}
        onFallback={() => {
          setCameraOpen(false);
          cameraInputRef.current?.click();
        }}
      />
    </div>
  );
}
