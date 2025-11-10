import { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Animal } from '../types/animal';

interface AnimalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  animal: Animal | null;
}

export default function AnimalDetailsModal({ isOpen, onClose, animal }: AnimalDetailsModalProps) {
  const modalContentRef = useRef<HTMLDivElement>(null);
  
  if (!isOpen || !animal) return null;

  const handleDownloadPDF = async () => {
    if (!modalContentRef.current) return;

    try {
      const canvas = await html2canvas(modalContentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`animal_${animal.numero_identificacion}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const InfoRow = ({ label, value }: { label: string; value: string | number | null }) => (
    <div className="py-3 border-b border-gray-200">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value || '-'}</dd>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6" ref={modalContentRef}>
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                🐄 {animal.nombre || animal.numero_identificacion}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                #{animal.numero_identificacion}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Foto si existe */}
          {animal.foto_url && (
            <div className="mb-6">
              <img
                src={`http://localhost:8000${animal.foto_url}`}
                alt={animal.nombre || animal.numero_identificacion}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Estado Badge */}
          <div className="mb-6">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                animal.estado === 'activo'
                  ? 'bg-green-100 text-green-800'
                  : animal.estado === 'vendido'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {animal.estado.toUpperCase()}
            </span>
          </div>

          {/* Información en Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📋 Información Básica
              </h3>
              <dl className="divide-y divide-gray-200">
                <InfoRow label="Nombre" value={animal.nombre} />
                <InfoRow label="Sexo" value={animal.sexo === 'macho' ? '♂ Macho' : '♀ Hembra'} />
                <InfoRow label="Raza" value={animal.raza} />
                <InfoRow label="Color" value={animal.color} />
                <InfoRow label="Fecha de Nacimiento" value={formatDate(animal.fecha_nacimiento)} />
                <InfoRow label="Categoría" value={animal.categoria} />
                <InfoRow label="Propósito" value={animal.proposito} />
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📍 Ubicación y Gestión
              </h3>
              <dl className="divide-y divide-gray-200">
                <InfoRow label="Lote Actual" value={animal.lote_actual} />
                <InfoRow label="Potrero Actual" value={animal.potrero_actual} />
                <InfoRow label="Tipo Adquisición" value={animal.tipo_adquisicion} />
                <InfoRow label="Fecha Ingreso" value={formatDate(animal.fecha_ingreso)} />
              </dl>
            </div>
          </div>

          {/* Pesos */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ⚖️ Información de Peso
            </h3>
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <dt className="text-sm font-medium text-gray-500">Peso Nacimiento</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900">
                  {animal.peso_nacimiento ? `${animal.peso_nacimiento} kg` : '-'}
                </dd>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <dt className="text-sm font-medium text-gray-500">Peso Actual</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900">
                  {animal.peso_actual ? `${animal.peso_actual} kg` : '-'}
                </dd>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <dt className="text-sm font-medium text-gray-500">Último Pesaje</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(animal.ultima_fecha_pesaje)}
                </dd>
                {animal.peso_actual && animal.peso_anterior && (
                  <dd className="mt-2">
                    {(() => {
                      const diferencia = animal.peso_actual - animal.peso_anterior;
                      const porcentaje = ((diferencia / animal.peso_anterior) * 100).toFixed(1);
                      const esGanancia = diferencia > 0;
                      return (
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            esGanancia
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {esGanancia ? '↑' : '↓'} {esGanancia ? '+' : ''}{diferencia.toFixed(1)} kg
                          ({esGanancia ? '+' : ''}{porcentaje}%)
                        </span>
                      );
                    })()}
                  </dd>
                )}
              </div>
            </dl>
          </div>

          {/* Genealogía */}
          {(animal.madre_id || animal.padre_id) && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                👨‍👩‍👧 Genealogía
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-pink-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Madre</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {animal.madre_id ? `ID: ${animal.madre_id}` : '-'}
                  </dd>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Padre</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {animal.padre_id ? `ID: ${animal.padre_id}` : '-'}
                  </dd>
                </div>
              </div>
            </div>
          )}

          {/* Observaciones */}
          {animal.observaciones && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                📝 Observaciones
              </h3>
              <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                {animal.observaciones}
              </p>
            </div>
          )}

          {/* Fechas de sistema */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Registrado: {formatDate(animal.created_at)} | Última actualización: {formatDate(animal.updated_at)}
            </p>
          </div>

          {/* Botones */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={handleDownloadPDF}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              💾 Descargar PDF
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
