import { useState, useEffect, useRef } from 'react';
import { produccionService } from '../api/produccion';
import { animalesService } from '../api/animales';
import type { RegistroProduccion, RegistroProduccionCreate } from '../types/produccion';
import type { Animal } from '../types/animal';
import { useModalFocusTrap } from '../hooks/useModalFocusTrap';
import { BarChart3, Milk, SquarePen, TrendingUp } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  registro: RegistroProduccion | null;
}

export default function ProduccionModal({ isOpen, onClose, onSave, registro }: Props) {
  const modalTitleId = 'produccion-modal-title';
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLSelectElement>(null);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<RegistroProduccionCreate>({
    animal_id: 0,
    tipo_produccion: 'leche',
    fecha: new Date().toISOString().split('T')[0],
    cantidad_litros: null,
    turno: null,
    peso_venta: null,
    calidad: null,
    observaciones: null,
  });

  useEffect(() => {
    if (isOpen) {
      loadAnimales();
      if (registro) {
        setFormData({
          animal_id: registro.animal_id,
          tipo_produccion: registro.tipo_produccion,
          fecha: registro.fecha,
          cantidad_litros: registro.cantidad_litros || null,
          turno: registro.turno || null,
          peso_venta: registro.peso_venta || null,
          calidad: registro.calidad || null,
          observaciones: registro.observaciones || null,
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, registro]);

  useModalFocusTrap(isOpen, onClose, modalRef, initialFocusRef);

  const loadAnimales = async () => {
    try {
      const response = await animalesService.getAnimalesAll({ estado: 'activo' });
      setAnimales(response.items);
    } catch (error) {
      console.error('Error cargando animales:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      animal_id: 0,
      tipo_produccion: 'leche',
      fecha: new Date().toISOString().split('T')[0],
      cantidad_litros: null,
      turno: null,
      peso_venta: null,
      calidad: null,
      observaciones: null,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.animal_id) {
      alert('Selecciona un animal');
      return;
    }

    try {
      setLoading(true);
      if (registro) {
        await produccionService.updateRegistro(registro.id, formData);
      } else {
        await produccionService.createRegistro(formData);
      }
      onSave();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error guardando registro:', error);
      alert('Error al guardar el registro');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="gd-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="gd-modal-panel gd-modal-surface max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <h2 id={modalTitleId} className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
            {registro ? (
              <SquarePen className="h-6 w-6 text-brand-700" />
            ) : (
              <BarChart3 className="h-6 w-6 text-brand-700" />
            )}
            {registro ? 'Editar Registro' : 'Nuevo Registro de Producción'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Cerrar modal"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="gd-modal-body p-6 space-y-6">
          {/* Animal y Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Animal *
              </label>
              <select
                ref={initialFocusRef}
                value={formData.animal_id}
                onChange={(e) => setFormData({ ...formData, animal_id: parseInt(e.target.value) })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar...</option>
                {animales.map((animal) => (
                  <option key={animal.id} value={animal.id}>
                    {animal.numero_identificacion} - {animal.nombre || 'Sin nombre'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Producción *
              </label>
              <select
                value={formData.tipo_produccion}
                onChange={(e) => setFormData({ ...formData, tipo_produccion: e.target.value as any })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="leche">Leche</option>
                <option value="carne">Carne</option>
                <option value="lana">Lana</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha *
            </label>
            <input
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Campos específicos para Leche */}
          {formData.tipo_produccion === 'leche' && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-blue-900">
                <Milk className="h-4 w-4 text-brand-700" />
                Producción Lechera
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad (litros)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.cantidad_litros || ''}
                    onChange={(e) => setFormData({ ...formData, cantidad_litros: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Turno
                  </label>
                  <select
                    value={formData.turno || ''}
                    onChange={(e) => setFormData({ ...formData, turno: e.target.value as any || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sin turno</option>
                    <option value="manana">Mañana</option>
                    <option value="tarde">Tarde</option>
                    <option value="noche">Noche</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calidad
                  </label>
                  <select
                    value={formData.calidad || ''}
                    onChange={(e) => setFormData({ ...formData, calidad: e.target.value as any || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sin especificar</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Campos específicos para Carne */}
          {formData.tipo_produccion === 'carne' && (
            <div className="bg-red-50 p-4 rounded-lg space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-red-900">
                <TrendingUp className="h-4 w-4 text-brand-700" />
                Producción Cárnica
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peso en canal (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.peso_venta || ''}
                    onChange={(e) => setFormData({ ...formData, peso_venta: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Calidad
                  </label>
                  <select
                    value={formData.calidad || ''}
                    onChange={(e) => setFormData({ ...formData, calidad: e.target.value as any || null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sin especificar</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones || ''}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value || null })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Notas adicionales..."
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="gd-btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="gd-btn-primary disabled:opacity-60"
            >
              {loading ? 'Guardando...' : registro ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
