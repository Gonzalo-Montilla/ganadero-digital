import { useState, useEffect } from 'react';
import { sanitariosService } from '../api/sanitarios';
import { animalesService } from '../api/animales';
import type { ControlSanitario, ControlSanitarioCreate } from '../types/sanitario';
import type { Animal } from '../types/animal';

interface ControlSanitarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  control?: ControlSanitario | null;
}

export default function ControlSanitarioModal({ isOpen, onClose, onSave, control }: ControlSanitarioModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [animales, setAnimales] = useState<Animal[]>([]);
  
  const [formData, setFormData] = useState<any>({
    animal_id: '',
    tipo: 'vacuna',
    fecha: new Date().toISOString().split('T')[0],
    producto: '',
    dosis: '',
    via_administracion: '',
    lote_producto: '',
    fecha_vencimiento: '',
    veterinario: '',
    diagnostico: '',
    peso_animal: '',
    temperatura: '',
    costo: '',
    proxima_dosis: '',
    dias_retiro_leche: '',
    dias_retiro_carne: '',
    observaciones: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadAnimales();
    }
  }, [isOpen]);

  useEffect(() => {
    if (control) {
      setFormData({
        animal_id: control.animal_id,
        tipo: control.tipo,
        fecha: control.fecha,
        producto: control.producto || '',
        dosis: control.dosis || '',
        via_administracion: control.via_administracion || '',
        lote_producto: control.lote_producto || '',
        fecha_vencimiento: control.fecha_vencimiento || '',
        veterinario: control.veterinario || '',
        diagnostico: control.diagnostico || '',
        peso_animal: control.peso_animal || '',
        temperatura: control.temperatura || '',
        costo: control.costo || '',
        proxima_dosis: control.proxima_dosis || '',
        dias_retiro_leche: control.dias_retiro_leche || '',
        dias_retiro_carne: control.dias_retiro_carne || '',
        observaciones: control.observaciones || '',
      });
    } else {
      setFormData({
        animal_id: '',
        tipo: 'vacuna',
        fecha: new Date().toISOString().split('T')[0],
        producto: '',
        dosis: '',
        via_administracion: '',
        lote_producto: '',
        fecha_vencimiento: '',
        veterinario: '',
        diagnostico: '',
        peso_animal: '',
        temperatura: '',
        costo: '',
        proxima_dosis: '',
        dias_retiro_leche: '',
        dias_retiro_carne: '',
        observaciones: '',
      });
    }
  }, [control, isOpen]);

  const loadAnimales = async () => {
    try {
      const response = await animalesService.getAnimales({ estado: 'activo', limit: 1000 });
      setAnimales(response.items);
    } catch (err) {
      console.error('Error cargando animales:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data: ControlSanitarioCreate = {
        animal_id: parseInt(formData.animal_id),
        tipo: formData.tipo,
        fecha: formData.fecha,
        producto: formData.producto || undefined,
        dosis: formData.dosis || undefined,
        via_administracion: formData.via_administracion || undefined,
        lote_producto: formData.lote_producto || undefined,
        fecha_vencimiento: formData.fecha_vencimiento || undefined,
        veterinario: formData.veterinario || undefined,
        diagnostico: formData.diagnostico || undefined,
        peso_animal: formData.peso_animal ? parseFloat(formData.peso_animal) : undefined,
        temperatura: formData.temperatura ? parseFloat(formData.temperatura) : undefined,
        costo: formData.costo ? parseFloat(formData.costo) : undefined,
        proxima_dosis: formData.proxima_dosis || undefined,
        dias_retiro_leche: formData.dias_retiro_leche ? parseInt(formData.dias_retiro_leche) : undefined,
        dias_retiro_carne: formData.dias_retiro_carne ? parseInt(formData.dias_retiro_carne) : undefined,
        observaciones: formData.observaciones || undefined,
      };

      if (control) {
        await sanitariosService.updateControlSanitario(control.id, data);
      } else {
        await sanitariosService.createControlSanitario(data);
      }
      
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar el registro');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {control ? 'Editar Registro Sanitario' : 'Nuevo Registro Sanitario'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Animal y Tipo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Animal *
                </label>
                <select
                  required
                  value={formData.animal_id}
                  onChange={(e) => setFormData({ ...formData, animal_id: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Seleccionar animal</option>
                  {animales.map((animal) => (
                    <option key={animal.id} value={animal.id}>
                      {animal.numero_identificacion} - {animal.nombre || 'Sin nombre'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de Evento *
                </label>
                <select
                  required
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="vacuna">💉 Vacuna</option>
                  <option value="desparasitacion">🪱 Desparasitación</option>
                  <option value="tratamiento">💊 Tratamiento</option>
                  <option value="cirugia">🏥 Cirugía</option>
                  <option value="otro">📋 Otro</option>
                </select>
              </div>
            </div>

            {/* Fecha y Producto */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Aplicación *
                </label>
                <input
                  type="date"
                  required
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Producto/Medicamento
                </label>
                <input
                  type="text"
                  value={formData.producto}
                  onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: Ivermectina, Brucelina"
                />
              </div>
            </div>

            {/* Dosis y Vía */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Dosis
                </label>
                <input
                  type="text"
                  value={formData.dosis}
                  onChange={(e) => setFormData({ ...formData, dosis: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: 5ml, 2cc"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vía de Administración
                </label>
                <select
                  value={formData.via_administracion}
                  onChange={(e) => setFormData({ ...formData, via_administracion: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Seleccionar</option>
                  <option value="intramuscular">Intramuscular</option>
                  <option value="subcutanea">Subcutánea</option>
                  <option value="oral">Oral</option>
                  <option value="topica">Tópica</option>
                  <option value="intravenosa">Intravenosa</option>
                  <option value="intramamaria">Intramamaria</option>
                </select>
              </div>
            </div>

            {/* Lote y Vencimiento */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Lote del Producto
                </label>
                <input
                  type="text"
                  value={formData.lote_producto}
                  onChange={(e) => setFormData({ ...formData, lote_producto: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: L20231015"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  value={formData.fecha_vencimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Veterinario y Diagnóstico */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Veterinario
                </label>
                <input
                  type="text"
                  value={formData.veterinario}
                  onChange={(e) => setFormData({ ...formData, veterinario: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Nombre del veterinario"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Diagnóstico/Motivo
                </label>
                <input
                  type="text"
                  value={formData.diagnostico}
                  onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: Prevención brucelosis"
                />
              </div>
            </div>

            {/* Peso, Temperatura y Costo */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Peso del Animal (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.peso_animal}
                  onChange={(e) => setFormData({ ...formData, peso_animal: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="450"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Temperatura (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperatura}
                  onChange={(e) => setFormData({ ...formData, temperatura: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="38.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Costo ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.costo}
                  onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="50000"
                />
              </div>
            </div>

            {/* Próxima Dosis */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha de Próxima Dosis/Refuerzo
              </label>
              <input
                type="date"
                value={formData.proxima_dosis}
                onChange={(e) => setFormData({ ...formData, proxima_dosis: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
              <p className="mt-1 text-xs text-gray-500">Para vacunas que requieren refuerzo</p>
            </div>

            {/* Días de Retiro */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Días de Retiro de Leche
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.dias_retiro_leche}
                  onChange={(e) => setFormData({ ...formData, dias_retiro_leche: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Días de Retiro de Carne
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.dias_retiro_carne}
                  onChange={(e) => setFormData({ ...formData, dias_retiro_carne: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                placeholder="Notas adicionales..."
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
