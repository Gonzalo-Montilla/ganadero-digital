export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Columna 1: Info de la Hacienda */}
          <div>
            <h1 className="text-2xl font-bold mb-2">🌿 HACIENDA MÁLAGA</h1>
            <h3 className="text-lg text-gray-300 mb-3">Ganadero Digital</h3>
            <p className="text-gray-400 text-sm">
              Vereda Pueblo Viejo<br />
              Río Sucio, Caldas<br />
              Colombia
            </p>
          </div>

          {/* Columna 2: Contacto */}
          <div>
            <h3 className="text-lg font-bold mb-3">Contacto</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>📱 +57 316 3882979</li>
              <li>🐄 Ganadero Digital</li>
              <li>📍 Río Sucio, Caldas</li>
            </ul>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-gray-700 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>&copy; 2025 Ganadero Digital - HACIENDA MÁLAGA. Todos los derechos reservados.</p>
            <p className="mt-2 md:mt-0">
              Versión Mark 1 | Hecho con ❤️ para ganaderos
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
