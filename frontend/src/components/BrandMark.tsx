import { useState } from 'react';

type BrandMarkProps = {
  className?: string;
  zoom?: number;
};

export default function BrandMark({ className = 'h-10 w-10', zoom = 1 }: BrandMarkProps) {
  const logoCandidates = ['/branding/logo.png', '/branding/LOGO FINCA EL PROGRESO.png', '/branding/logo-finca-el-progreso.png'];
  const [logoIndex, setLogoIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  if (!hasError) {
    return (
      <div className={className}>
        <img
          src={logoCandidates[logoIndex]}
          alt="Logo Finca El Progreso"
          className="h-full w-full object-contain"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
          onError={() => {
            if (logoIndex < logoCandidates.length - 1) {
              setLogoIndex((prev) => prev + 1);
              return;
            }
            setHasError(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className={`${className} flex items-center justify-center rounded-xl bg-brand-700 text-xs font-extrabold text-white`}>
      FP
    </div>
  );
}
