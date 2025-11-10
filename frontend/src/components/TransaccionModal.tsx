import { useState, useEffect } from 'react';
import { transaccionesService } from '../api/transacciones';
import { animalesService } from '../api/animales';
import type { Transaccion, TransaccionCreate } from '../types/transaccion';
import type { Animal } from '../types/animal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  transaccion: Transaccion | null;
}

export default function TransaccionModal({ isOpen, onClose, onSave, transaccion }: Props) {
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);

  // Datos diferentes para cada tipo
  const [formData, setFormData] = useState<TransaccionCreate>({
    tipo: 'venta',
    fecha: new Date().toISOString().split('T')[0],
    concepto: '',
    monto: 0,
    animal_id: null,
    numero_animales: null,
    peso_total: null,
    precio_por_kg: null,
    tercero: null,
    documento_tercero: null,
    metodo_pago: null,
    categoria_gasto: null,
    observaciones: null,
  });

  // Datos del animal nuevo (solo para compra)
  const [animalData, setAnimalData] = useState({
    numero_identificacion: '',
    nombre: '',
    sexo: 'hembra',
    raza: '',
    fecha_nacimiento: '',
    peso_actual: 0,
    categoria: '',
    proposito: '',
    color: '',
    observaciones: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadAnimales();
      if (transaccion) {
        setFormData({
          tipo: transaccion.tipo,
          fecha: transaccion.fecha,
          concepto: transaccion.concepto,
          monto: transaccion.monto,
          animal_id: transaccion.animal_id || null,
          numero_animales: transaccion.numero_animales || null,
          peso_total: transaccion.peso_total || null,
          precio_por_kg: transaccion.precio_por_kg || null,
          tercero: transaccion.tercero || null,
          documento_tercero: transaccion.documento_tercero || null,
          metodo_pago: transaccion.metodo_pago || null,
          categoria_gasto: transaccion.categoria_gasto || null,
          observaciones: transaccion.observaciones || null,
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, transaccion]);

  const loadAnimales = async () => {
    try {
      const response = await animalesService.getAnimales({ estado: 'activo', limit: 1000 });
      setAnimales(response.items);
    } catch (error) {
      console.error('Error cargando animales:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'venta',
      fecha: new Date().toISOString().split('T')[0],
      concepto: '',
      monto: 0,
      animal_id: null,
      numero_animales: null,
      peso_total: null,
      precio_por_kg: null,
      tercero: null,
      documento_tercero: null,
      metodo_pago: null,
      categoria_gasto: null,
      observaciones: null,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones según tipo
    if (formData.tipo === 'compra' && !transaccion) {
      // Para compra nueva, validar datos del animal
      if (!animalData.numero_identificacion || !animalData.sexo || !animalData.raza) {
        alert('Completa los datos obligatorios del animal: Número ID, Sexo y Raza');
        return;
      }
      if (formData.monto <= 0) {
        alert('El monto debe ser mayor a 0');
        return;
      }
    } else {
      // Para venta y gasto, validar campos normales
      if (!formData.concepto || formData.monto <= 0) {
        alert('Completa los campos obligatorios');
        return;
      }
    }

    try {
      setLoading(true);
      
      if (transaccion) {
        // Editando transacción existente
        await transaccionesService.updateTransaccion(transaccion.id, formData);
      } else if (formData.tipo === 'compra') {
        // Nueva compra de animal - usar endpoint especial
        await transaccionesService.comprarAnimal({
          animal: {
            numero_identificacion: animalData.numero_identificacion,
            nombre: animalData.nombre || undefined,
            sexo: animalData.sexo,
            raza: animalData.raza,
            fecha_nacimiento: animalData.fecha_nacimiento || undefined,
            peso_actual: animalData.peso_actual || undefined,
            categoria: animalData.categoria || undefined,
            proposito: animalData.proposito || undefined,
            color: animalData.color || undefined,
            observaciones: animalData.observaciones || undefined,
          },
          transaccion: {
            fecha: formData.fecha,
            monto: formData.monto,
            tercero: formData.tercero || undefined,
            documento_tercero: formData.documento_tercero || undefined,
            peso_total: formData.peso_total || undefined,
            precio_por_kg: formData.precio_por_kg || undefined,
            numero_animales: formData.numero_animales || undefined,
            metodo_pago: formData.metodo_pago || undefined,
            observaciones: formData.observaciones || undefined,
          },
        });
      } else {
        // Venta o gasto normal
        await transaccionesService.createTransaccion(formData);
      }
      
      onSave();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Error guardando transacción:', error);
      const message = error.response?.data?.detail || 'Error al guardar la transacción';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {transaccion ? 'Editar Transacción' : 'Nueva Transacción'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <span className="text-2xl">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tipo y Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="venta">💰 Venta</option>
                <option value="compra">🛒 Compra</option>
                <option value="gasto">💸 Gasto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha *
              </label>
              <input
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Concepto y Monto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Concepto solo para venta y gasto (compra se genera automáticamente) */}
            {formData.tipo !== 'compra' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Concepto *
                </label>
                <input
                  type="text"
                  value={formData.concepto}
                  onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                  required
                  placeholder="Ej: Venta de novillo, Gasto de veterinario..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* VENTA: Selector de animal existente */}
          {formData.tipo === 'venta' && (
            <div className="bg-green-50 p-4 rounded-lg space-y-4">
              <h3 className="font-semibold text-green-900">💸 Animal a Vender</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Animal *
                  </label>
                  <select
                    value={formData.animal_id || ''}
                    onChange={(e) => setFormData({ ...formData, animal_id: e.target.value ? parseInt(e.target.value) : null })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Selecciona el animal...</option>
                    {animales.map((animal) => (
                      <option key={animal.id} value={animal.id}>
                        {animal.numero_identificacion} - {animal.nombre || 'Sin nombre'} ({animal.raza})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.peso_total || ''}
                    onChange={(e) => setFormData({ ...formData, peso_total: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio/kg ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precio_por_kg || ''}
                    onChange={(e) => setFormData({ ...formData, precio_por_kg: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          )}

          {/* COMPRA: Formulario para crear animal nuevo */}
          {formData.tipo === 'compra' && !transaccion && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-4">
              <h3 className="font-semibold text-blue-900">🐄 Datos del Animal que Estás Comprando</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número ID *</label>
                  <input
                    type="text"
                    value={animalData.numero_identificacion}
                    onChange={(e) => setAnimalData({ ...animalData, numero_identificacion: e.target.value })}
                    required
                    placeholder="123, A-456, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={animalData.nombre}
                    onChange={(e) => setAnimalData({ ...animalData, nombre: e.target.value })}
                    placeholder="Opcional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexo *</label>
                  <select
                    value={animalData.sexo}
                    onChange={(e) => setAnimalData({ ...animalData, sexo: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="hembra">♀️ Hembra</option>
                    <option value="macho">♂️ Macho</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Raza *</label>
                  <input
                    type="text"
                    value={animalData.raza}
                    onChange={(e) => setAnimalData({ ...animalData, raza: e.target.value })}
                    required
                    placeholder="Holstein, Brahman, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={animalData.categoria}
                    onChange={(e) => setAnimalData({ ...animalData, categoria: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Selecciona...</option>
                    <option value="ternero">Ternero</option>
                    <option value="novillo">Novillo</option>
                    <option value="vaca">Vaca</option>
                    <option value="toro">Toro</option>
                    <option value="vaquillona">Vaquillona</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Peso Actual (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={animalData.peso_actual || ''}
                    onChange={(e) => setAnimalData({ ...animalData, peso_actual: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Nacimiento</label>
                  <input
                    type="date"
                    value={animalData.fecha_nacimiento}
                    onChange={(e) => setAnimalData({ ...animalData, fecha_nacimiento: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Propósito</label>
                  <select
                    value={animalData.proposito}
                    onChange={(e) => setAnimalData({ ...animalData, proposito: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Selecciona...</option>
                    <option value="leche">Leche</option>
                    <option value="carne">Carne</option>
                    <option value="reproduccion">Reproducción</option>
                    <option value="doble_proposito">Doble Propósito</option>
                  </select>
                </div>
              </div>

              <h3 className="font-semibold text-blue-900 mt-4">💰 Detalles de la Compra</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Peso Total (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.peso_total || ''}
                    onChange={(e) => setFormData({ ...formData, peso_total: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio/kg ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precio_por_kg || ''}
                    onChange={(e) => setFormData({ ...formData, precio_por_kg: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          )}

          {/* GASTO: Campo opcional de animal */}
          {formData.tipo === 'gasto' && (
            <div className="bg-yellow-50 p-4 rounded-lg space-y-4">
              <h3 className="font-semibold text-yellow-900">💸 Detalles del Gasto</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Animal (opcional)
                </label>
                <select
                  value={formData.animal_id || ''}
                  onChange={(e) => setFormData({ ...formData, animal_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Sin animal específico</option>
                  {animales.map((animal) => (
                    <option key={animal.id} value={animal.id}>
                      {animal.numero_identificacion} - {animal.nombre || 'Sin nombre'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Selecciona un animal solo si el gasto es específico para él (ej: tratamiento veterinario)
                </p>
              </div>
            </div>
          )}

          {/* Categoría de Gasto */}
          {formData.tipo === 'gasto' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría de Gasto
              </label>
              <select
                value={formData.categoria_gasto || ''}
                onChange={(e) => setFormData({ ...formData, categoria_gasto: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Sin categoría</option>
                <option value="sanidad">💉 Sanidad</option>
                <option value="alimentacion">🌾 Alimentación</option>
                <option value="infraestructura">🏗️ Infraestructura</option>
                <option value="personal">👷 Personal</option>
                <option value="otro">📦 Otro</option>
              </select>
            </div>
          )}

          {/* Tercero */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.tipo === 'venta' ? 'Cliente' : 'Proveedor'}
              </label>
              <input
                type="text"
                value={formData.tercero || ''}
                onChange={(e) => setFormData({ ...formData, tercero: e.target.value || null })}
                placeholder="Nombre..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Documento
              </label>
              <input
                type="text"
                value={formData.documento_tercero || ''}
                onChange={(e) => setFormData({ ...formData, documento_tercero: e.target.value || null })}
                placeholder="CC/NIT..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Método de Pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Método de Pago
            </label>
            <select
              value={formData.metodo_pago || ''}
              onChange={(e) => setFormData({ ...formData, metodo_pago: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Sin especificar</option>
              <option value="efectivo">💵 Efectivo</option>
              <option value="transferencia">🏦 Transferencia</option>
              <option value="cheque">📝 Cheque</option>
              <option value="credito">💳 Crédito</option>
            </select>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones || ''}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value || null })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              placeholder="Notas adicionales..."
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Guardando...' : transaccion ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
