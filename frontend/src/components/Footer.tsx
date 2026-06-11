import BrandMark from './BrandMark';

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-slate-500 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          <BrandMark className="h-8 w-8 border border-slate-200 bg-white" zoom={1.4} />
          FINCA EL PROGRESO
        </div>
        <p>Riosucio, Caldas · Plataforma operativa para finca</p>
      </div>
    </footer>
  );
}
