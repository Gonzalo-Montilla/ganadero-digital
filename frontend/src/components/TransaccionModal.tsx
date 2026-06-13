import { useState, useEffect, useRef } from 'react';
import { transaccionesService } from '../api/transacciones';
import { animalesService } from '../api/animales';
import AnimalPhotoPicker from './AnimalPhotoPicker';
import type { Transaccion, TransaccionCreate } from '../types/transaccion';
import type { Animal } from '../types/animal';
import { useModalFocusTrap } from '../hooks/useModalFocusTrap';
import { Coins, HandCoins, Milk, ReceiptText, ShoppingCart, SquarePen, Wallet } from 'lucide-react';
import type { RubroVenta } from '../constants/rubroVenta';
import { RUBRO_VENTA_HINTS, RUBRO_VENTA_LABELS } from '../constants/rubroVenta';
import type { RubroAfectacion } from '../constants/rubroAfectacion';
import { RUBRO_AFECTACION_HINTS, RUBRO_AFECTACION_LABELS } from '../constants/rubroAfectacion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  transaccion: Transaccion | null;
}

export default function TransaccionModal({ isOpen, onClose, onSave, transaccion }: Props) {
  const modalTitleId = 'transaccion-modal-title';
  const modalRef = useRef<HTMLDivElement>(null);
  const initialFocusRef = useRef<HTMLSelectElement>(null);
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

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
    rubro_afectacion: 'general',
    observaciones: null,
    rubro_venta: 'animal_sacrificio',
    cantidad_litros: null,
    precio_por_litro: null,
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
          rubro_afectacion: transaccion.rubro_afectacion || 'general',
          observaciones: transaccion.observaciones || null,
          rubro_venta: transaccion.rubro_venta || 'animal_sacrificio',
          cantidad_litros: transaccion.cantidad_litros || null,
          precio_por_litro: transaccion.precio_por_litro || null,
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, transaccion]);

  useModalFocusTrap(isOpen, onClose, modalRef, initialFocusRef);

  const loadAnimales = async () => {
    try {
      const response = await animalesService.getAnimalesAll({ estado: 'activo' });
      setAnimales(response.items);
    } catch (error) {
      console.error('Error cargando animales:', error);
    }
  };

  const resetAnimalCompra = () => {
    setAnimalData({
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
    setPhotoFile(null);
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
      rubro_afectacion: 'general',
      observaciones: null,
      rubro_venta: 'animal_sacrificio',
      cantidad_litros: null,
      precio_por_litro: null,
    });
    resetAnimalCompra();
  };

  const normalizePayload = (payload: TransaccionCreate): TransaccionCreate => {
    const next = { ...payload };
    if (next.tipo === 'venta' && !next.rubro_venta) {
      next.rubro_venta = next.animal_id ? 'animal_sacrificio' : 'otro';
    }
    if (next.tipo !== 'venta') {
      next.rubro_venta = null;
      next.cantidad_litros = null;
      next.precio_por_litro = null;
    }
    if (next.tipo === 'gasto' && !next.rubro_afectacion) {
      next.rubro_afectacion = 'general';
    }
    if (next.tipo !== 'gasto') {
      next.rubro_afectacion = null;
    }
    return next;
  };

  const rubroVenta = (formData.rubro_venta || 'animal_sacrificio') as RubroVenta;

  const handleRubroChange = (rubro: RubroVenta) => {
    setFormData((prev) => ({
      ...prev,
      rubro_venta: rubro,
      animal_id: rubro === 'leche' ? null : prev.animal_id,
      cantidad_litros: rubro === 'leche' ? prev.cantidad_litros : null,
      precio_por_litro: rubro === 'leche' ? prev.precio_por_litro : null,
    }));
  };

  const syncMontoLeche = (litros: number | null | undefined, precio: number | null | undefined) => {
    if (litros && precio && litros > 0 && precio > 0) {
      setFormData((prev) => ({ ...prev, monto: Math.round(litros * precio * 100) / 100 }));
    }
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
      if (!formData.concepto || formData.monto <= 0) {
        alert('Completa los campos obligatorios');
        return;
      }
      if (formData.tipo === 'venta') {
        if (rubroVenta === 'animal_sacrificio' && !formData.animal_id) {
          alert('Selecciona el animal que vendes para sacrificio/faena');
          return;
        }
        if (rubroVenta === 'leche' && formData.animal_id) {
          alert('La venta de leche no debe vincularse a un animal del inventario');
          return;
        }
      }
    }

    try {
      setLoading(true);
      
      if (transaccion) {
        await transaccionesService.updateTransaccion(transaccion.id, normalizePayload(formData));
      } else if (formData.tipo === 'compra') {
        const result = await transaccionesService.comprarAnimal({
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

        if (photoFile && result.animal_id) {
          try {
            await animalesService.uploadFoto(result.animal_id, photoFile);
          } catch (photoError) {
            console.error('Error subiendo foto del animal comprado:', photoError);
            alert('Compra registrada, pero la foto no se pudo subir. Puedes agregarla desde Inventario.');
          }
        }
      } else {
        await transaccionesService.createTransaccion(normalizePayload(formData));
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
    <div
      className="gd-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        className="gd-modal-panel gd-modal-surface max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <h2 id={modalTitleId} className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
            {transaccion ? (
              <SquarePen className="h-6 w-6 text-brand-700" />
            ) : (
              <Wallet className="h-6 w-6 text-brand-700" />
            )}
            {transaccion ? 'Editar Transacción' : 'Nueva Transacción'}
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
          {/* Tipo y Fecha */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo *
              </label>
              <select
                ref={initialFocusRef}
                value={formData.tipo}
                onChange={(e) => {
                  const tipo = e.target.value as TransaccionCreate['tipo'];
                  setFormData({
                    ...formData,
                    tipo,
                    rubro_venta: tipo === 'venta' ? 'animal_sacrificio' : null,
                    animal_id: tipo === 'venta' ? formData.animal_id : null,
                    cantidad_litros: null,
                    precio_por_litro: null,
                  });
                  if (tipo !== 'compra') {
                    setPhotoFile(null);
                  }
                }}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="venta">Venta</option>
                <option value="compra">Compra</option>
                <option value="gasto">Gasto</option>
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
                  placeholder={
                    formData.tipo === 'venta' && rubroVenta === 'leche'
                      ? 'Ej: Venta leche quincena 1 - cooperativa'
                      : formData.tipo === 'venta' && rubroVenta === 'animal_sacrificio'
                        ? 'Ej: Venta novillo para faena'
                        : 'Ej: Venta novillo, Gasto de veterinario...'
                  }
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

          {/* Rubro de venta */}
          {formData.tipo === 'venta' && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rubro de ingreso *</label>
                <select
                  value={rubroVenta}
                  onChange={(e) => handleRubroChange(e.target.value as RubroVenta)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  {(Object.keys(RUBRO_VENTA_LABELS) as RubroVenta[]).map((key) => (
                    <option key={key} value={key}>{RUBRO_VENTA_LABELS[key]}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-emerald-900">{RUBRO_VENTA_HINTS[rubroVenta]}</p>
              </div>
            </div>
          )}

          {/* VENTA DE LECHE */}
          {formData.tipo === 'venta' && rubroVenta === 'leche' && (
            <div className="bg-sky-50 p-4 rounded-lg space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-sky-900">
                <Milk className="h-4 w-4 text-brand-700" />
                Venta de leche
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Litros vendidos</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.cantidad_litros || ''}
                    onChange={(e) => {
                      const litros = e.target.value ? parseFloat(e.target.value) : null;
                      setFormData({ ...formData, cantidad_litros: litros });
                      syncMontoLeche(litros, formData.precio_por_litro);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio por litro ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio_por_litro || ''}
                    onChange={(e) => {
                      const precio = e.target.value ? parseFloat(e.target.value) : null;
                      setFormData({ ...formData, precio_por_litro: precio });
                      syncMontoLeche(formData.cantidad_litros, precio);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente / comprador</label>
                  <input
                    type="text"
                    value={formData.tercero || ''}
                    onChange={(e) => setFormData({ ...formData, tercero: e.target.value || null })}
                    placeholder="Cooperativa, planta..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <p className="text-xs text-sky-800">
                Los litros ordeñados se registran en Producción. Aquí va el ingreso recibido por la venta.
              </p>
            </div>
          )}

          {/* VENTA: Animal para sacrificio */}
          {formData.tipo === 'venta' && rubroVenta === 'animal_sacrificio' && (
            <div className="bg-green-50 p-4 rounded-lg space-y-4">
              <h3 className="flex items-center gap-2 font-semibold text-green-900">
                <HandCoins className="h-4 w-4 text-brand-700" />
                Animal para sacrificio / faena
              </h3>
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
              <h3 className="flex items-center gap-2 font-semibold text-blue-900">
                <ShoppingCart className="h-4 w-4 text-brand-700" />
                Datos del Animal que Estás Comprando
              </h3>
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
                    <option value="hembra">Hembra</option>
                    <option value="macho">Macho</option>
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

              <AnimalPhotoPicker file={photoFile} onChange={setPhotoFile} />

              <h3 className="mt-4 flex items-center gap-2 font-semibold text-blue-900">
                <Coins className="h-4 w-4 text-brand-700" />
                Detalles de la Compra
              </h3>
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
              <h3 className="flex items-center gap-2 font-semibold text-yellow-900">
                <ReceiptText className="h-4 w-4 text-brand-700" />
                Detalles del Gasto
              </h3>
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
            <>
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
                  <option value="sanidad">Sanidad</option>
                  <option value="alimentacion">Alimentación</option>
                  <option value="infraestructura">Infraestructura</option>
                  <option value="personal">Personal</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rubro al que afecta
                </label>
                <select
                  value={formData.rubro_afectacion || 'general'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rubro_afectacion: (e.target.value || 'general') as RubroAfectacion,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  {(Object.keys(RUBRO_AFECTACION_LABELS) as RubroAfectacion[]).map((key) => (
                    <option key={key} value={key}>
                      {RUBRO_AFECTACION_LABELS[key]}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {RUBRO_AFECTACION_HINTS[(formData.rubro_afectacion || 'general') as RubroAfectacion]}
                </p>
              </div>
            </>
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
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="cheque">Cheque</option>
              <option value="credito">Crédito</option>
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
              className="gd-btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="gd-btn-primary disabled:opacity-60"
            >
              {loading ? 'Guardando...' : transaccion ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
