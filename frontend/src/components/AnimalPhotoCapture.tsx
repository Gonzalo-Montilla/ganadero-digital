import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, X } from 'lucide-react';

type AnimalPhotoCaptureProps = {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  onFallback?: () => void;
};

export default function AnimalPhotoCapture({ isOpen, onClose, onCapture, onFallback }: AnimalPhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Tu navegador no permite abrir la camara directamente.');
      return;
    }

    setStarting(true);
    setError('');

    try {
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
    } catch {
      setError('No se pudo acceder a la camara. Revisa permisos o usa "Elegir imagen".');
    } finally {
      setStarting(false);
    }
  }, [facingMode, stopStream]);

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setError('');
      return;
    }

    void startCamera();
    return () => stopStream();
  }, [isOpen, startCamera, stopStream]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `animal-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        onClose();
      },
      'image/jpeg',
      0.92,
    );
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Camera className="h-5 w-5 text-brand-700" />
            Tomar foto
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar camara"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-black">
          {error ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
              <p className="text-sm text-slate-200">{error}</p>
              {onFallback ? (
                <button type="button" onClick={onFallback} className="gd-btn-secondary !bg-white">
                  Abrir selector de camara
                </button>
              ) : null}
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="aspect-[4/3] w-full object-cover"
            />
          )}
        </div>

        {!error ? (
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-4">
            <button type="button" onClick={toggleCamera} className="gd-btn-secondary !px-3 !py-2" disabled={starting}>
              <RefreshCw className="mr-1 h-4 w-4" />
              Voltear
            </button>
            <button
              type="button"
              onClick={handleCapture}
              disabled={starting}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <Camera className="h-5 w-5" />
              Capturar foto
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
