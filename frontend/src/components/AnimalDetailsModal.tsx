import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { sanitariosService } from '../api/sanitarios';
import { animalesService } from '../api/animales';
import type { Animal } from '../types/animal';
import type { ControlSanitario } from '../types/sanitario';
import type { HojaVidaReproductiva } from '../types/hojaVida';
import { formatAnimalResumen, labelTipoEventoReproductivo } from '../types/hojaVida';
import { getMediaUrl } from '../utils/mediaUrl';
import AuthenticatedImage from './AuthenticatedImage';
import { Baby, Beef, ClipboardList, Download, HeartPulse, MapPin, Scale, ScrollText, Users } from 'lucide-react';

interface AnimalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  animal: Animal | null;
}

export default function AnimalDetailsModal({ isOpen, onClose, animal }: AnimalDetailsModalProps) {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [historialSanitario, setHistorialSanitario] = useState<ControlSanitario[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [hojaVidaReproductiva, setHojaVidaReproductiva] = useState<HojaVidaReproductiva | null>(null);
  const [loadingHojaVida, setLoadingHojaVida] = useState(false);

  useEffect(() => {
    if (!isOpen || !animal) {
      setHistorialSanitario([]);
      setHojaVidaReproductiva(null);
      return;
    }

    let cancelado = false;
    const cargarHistorial = async () => {
      try {
        setLoadingHistorial(true);
        const items = await sanitariosService.getHistorialAnimal(animal.id);
        if (!cancelado) {
          setHistorialSanitario(items);
        }
      } catch (error) {
        console.error('Error cargando hoja de vida sanitaria:', error);
      } finally {
        if (!cancelado) {
          setLoadingHistorial(false);
        }
      }
    };

    const cargarHojaVidaReproductiva = async () => {
      try {
        setLoadingHojaVida(true);
        const data = await animalesService.getHojaVidaReproductiva(animal.id);
        if (!cancelado) {
          setHojaVidaReproductiva(data);
        }
      } catch (error) {
        console.error('Error cargando hoja de vida reproductiva:', error);
      } finally {
        if (!cancelado) {
          setLoadingHojaVida(false);
        }
      }
    };

    void cargarHistorial();
    void cargarHojaVidaReproductiva();
    return () => {
      cancelado = true;
    };
  }, [isOpen, animal?.id]);
  
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
                <span className="inline-flex items-center gap-2">
                  <Beef className="h-6 w-6 text-brand-700" />
                  {animal.nombre || animal.numero_identificacion}
                </span>
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
          {animal.foto_url ? (
            <div className="mb-6">
              <AuthenticatedImage
                src={getMediaUrl(animal.foto_url)}
                alt={animal.nombre || animal.numero_identificacion}
                className="h-48 w-full rounded-lg object-cover"
              />
            </div>
          ) : null}

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
                <span className="inline-flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-brand-700" />
                  Información Básica
                </span>
              </h3>
              <dl className="divide-y divide-gray-200">
                <InfoRow label="Nombre" value={animal.nombre} />
                <InfoRow label="Sexo" value={animal.sexo === 'macho' ? 'Macho' : 'Hembra'} />
                <InfoRow label="Raza" value={animal.raza} />
                <InfoRow label="Color" value={animal.color} />
                <InfoRow label="Fecha de Nacimiento" value={formatDate(animal.fecha_nacimiento)} />
                <InfoRow label="Categoría" value={animal.categoria} />
                <InfoRow label="Propósito" value={animal.proposito} />
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-brand-700" />
                  Ubicación y Gestión
                </span>
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
              <span className="inline-flex items-center gap-2">
                <Scale className="h-5 w-5 text-brand-700" />
                Información de Peso
              </span>
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
          {(hojaVidaReproductiva?.madre || hojaVidaReproductiva?.padre || animal.madre_id || animal.padre_id) && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                <span className="inline-flex items-center gap-2">
                  <Users className="h-5 w-5 text-brand-700" />
                  Genealogía
                </span>
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="bg-pink-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Madre</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">
                    {hojaVidaReproductiva?.madre
                      ? formatAnimalResumen(hojaVidaReproductiva.madre)
                      : animal.madre_id
                      ? `ID: ${animal.madre_id}`
                      : '-'}
                  </dd>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500">Padre</dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">
                    {hojaVidaReproductiva?.padre
                      ? formatAnimalResumen(hojaVidaReproductiva.padre)
                      : animal.padre_id
                      ? `ID: ${animal.padre_id}`
                      : '-'}
                  </dd>
                </div>
              </div>
            </div>
          )}

          {/* Descendencia */}
          {hojaVidaReproductiva &&
            (hojaVidaReproductiva.crias_en_inventario.length > 0 ||
              hojaVidaReproductiva.progenie_como_padre.length > 0) && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <span className="inline-flex items-center gap-2">
                    <Baby className="h-5 w-5 text-brand-700" />
                    Descendencia
                  </span>
                </h3>
                <div className="space-y-4">
                  {hojaVidaReproductiva.crias_en_inventario.length > 0 && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
                      <p className="text-sm font-semibold text-emerald-900">Crías en inventario</p>
                      <ul className="mt-2 space-y-2">
                        {hojaVidaReproductiva.crias_en_inventario.map((cria) => (
                          <li key={cria.id} className="text-sm text-gray-800">
                            <span className="font-medium">{formatAnimalResumen(cria)}</span>
                            {cria.fecha_nacimiento ? (
                              <span className="text-gray-600">
                                {' '}
                                — nació el {formatDate(cria.fecha_nacimiento)}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {hojaVidaReproductiva.progenie_como_padre.length > 0 && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4">
                      <p className="text-sm font-semibold text-blue-900">Progenie como padre</p>
                      <ul className="mt-2 space-y-2">
                        {hojaVidaReproductiva.progenie_como_padre.map((cria) => (
                          <li key={cria.id} className="text-sm text-gray-800">
                            <span className="font-medium">{formatAnimalResumen(cria)}</span>
                            {cria.fecha_nacimiento ? (
                              <span className="text-gray-600">
                                {' '}
                                — nació el {formatDate(cria.fecha_nacimiento)}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Hoja de vida reproductiva */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <span className="inline-flex items-center gap-2">
                <Baby className="h-5 w-5 text-brand-700" />
                Hoja de vida reproductiva
              </span>
            </h3>
            {loadingHojaVida ? (
              <p className="text-sm text-gray-500">Cargando historial reproductivo...</p>
            ) : !hojaVidaReproductiva || hojaVidaReproductiva.eventos.length === 0 ? (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                {animal.sexo === 'hembra'
                  ? 'Sin servicios, diagnósticos o partos registrados todavía.'
                  : 'Sin participación registrada como toro en servicios o partos.'}
              </p>
            ) : (
              <div className="space-y-3">
                {hojaVidaReproductiva.eventos.map((evento) => (
                  <div key={evento.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {labelTipoEventoReproductivo(evento.tipo_evento)}
                        </p>
                        {evento.tipo_evento === 'diagnostico' && evento.diagnostico && (
                          <p className="text-sm capitalize text-green-700">{evento.diagnostico}</p>
                        )}
                        {evento.tipo_evento === 'servicio' && (
                          <p className="text-sm text-gray-700">
                            {evento.tipo_servicio?.replace(/_/g, ' ') || 'Servicio'}
                            {evento.toro_numero || evento.toro_nombre
                              ? ` · Toro: ${evento.toro_numero || evento.toro_nombre}${evento.toro_nombre && evento.toro_numero ? ` (${evento.toro_nombre})` : ''}`
                              : ''}
                          </p>
                        )}
                        {evento.tipo_evento === 'parto' && (
                          <p className="text-sm text-gray-700">
                            {evento.numero_crias ? `${evento.numero_crias} cría(s)` : 'Parto registrado'}
                            {evento.tipo_parto ? ` · ${evento.tipo_parto.replace(/_/g, ' ')}` : ''}
                          </p>
                        )}
                        {evento.hembra_numero && (
                          <p className="text-sm text-gray-700">
                            Hembra: {evento.hembra_numero}
                            {evento.hembra_nombre ? ` — ${evento.hembra_nombre}` : ''}
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-600">{formatDate(evento.fecha_evento)}</p>
                    </div>
                    {evento.crias_registradas.length > 0 && (
                      <div className="mt-3 rounded-md bg-white px-3 py-2 text-sm text-gray-800">
                        <p className="font-medium text-gray-700">Crías dadas de alta:</p>
                        <ul className="mt-1 space-y-1">
                          {evento.crias_registradas.map((cria) => (
                            <li key={cria.id}>{formatAnimalResumen(cria)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hoja de vida sanitaria */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <span className="inline-flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-brand-700" />
                Hoja de vida sanitaria
              </span>
            </h3>
            {loadingHistorial ? (
              <p className="text-sm text-gray-500">Cargando historial...</p>
            ) : historialSanitario.length === 0 ? (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                Sin registros sanitarios todavía.
              </p>
            ) : (
              <div className="space-y-3">
                {historialSanitario.map((registro) => (
                  <div key={registro.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 capitalize">{registro.tipo}</p>
                        <p className="text-sm text-gray-700">{registro.producto || 'Sin producto'}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-600">{formatDate(registro.fecha)}</p>
                    </div>
                    <div className="mt-2 grid gap-1 text-xs text-gray-600 md:grid-cols-2">
                      {registro.dosis ? <p>Dosis: {registro.dosis}</p> : null}
                      {registro.veterinario ? <p>Aplicada por: {registro.veterinario}</p> : null}
                      {registro.proxima_dosis ? (
                        <p className="text-orange-700">Próxima dosis: {formatDate(registro.proxima_dosis)}</p>
                      ) : null}
                      {registro.observaciones ? <p className="md:col-span-2">{registro.observaciones}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observaciones */}
          {animal.observaciones && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                <span className="inline-flex items-center gap-2">
                  <ScrollText className="h-5 w-5 text-brand-700" />
                  Observaciones
                </span>
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
              <Download className="h-4 w-4" />
              Descargar PDF
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
