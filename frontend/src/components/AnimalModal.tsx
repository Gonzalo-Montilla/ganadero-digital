import { useState, useEffect } from 'react';
import { animalesService } from '../api/animales';
import type { Animal } from '../types/animal';

interface AnimalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  animal?: Animal | null;
}

export default function AnimalModal({ isOpen, onClose, onSave, animal }: AnimalModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<any>({
    numero_identificacion: '',
    nombre: '',
    sexo: 'hembra',
    fecha_nacimiento: new Date().toISOString().split('T')[0],
    raza: '',
    color: '',
    peso_nacimiento: undefined,
    peso_actual: undefined,
    tipo_adquisicion: 'nacimiento',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    categoria: '',
    proposito: 'carne',
    lote_actual: '',
    potrero_actual: '',
    observaciones: '',
  });

  useEffect(() => {
    if (animal) {
      // Si hay animal, estamos editando
      setFormData({
        numero_identificacion: animal.numero_identificacion,
        nombre: animal.nombre || '',
        sexo: animal.sexo,
        fecha_nacimiento: animal.fecha_nacimiento,
        raza: animal.raza,
        color: animal.color || '',
        peso_nacimiento: animal.peso_nacimiento || undefined,
        peso_actual: animal.peso_actual || undefined,
        tipo_adquisicion: animal.tipo_adquisicion,
        fecha_ingreso: animal.fecha_ingreso,
        categoria: animal.categoria || '',
        proposito: animal.proposito,
        lote_actual: animal.lote_actual || '',
        potrero_actual: animal.potrero_actual || '',
        observaciones: animal.observaciones || '',
      });
      setPhotoPreview(animal.foto_url ? `http://localhost:8000${animal.foto_url}` : null);
      setPhotoFile(null);
    } else {
      // Resetear form si es nuevo
      setFormData({
        numero_identificacion: '',
        nombre: '',
        sexo: 'hembra',
        fecha_nacimiento: new Date().toISOString().split('T')[0],
        raza: '',
        color: '',
        peso_nacimiento: undefined,
        peso_actual: undefined,
        tipo_adquisicion: 'nacimiento',
        fecha_ingreso: new Date().toISOString().split('T')[0],
        categoria: '',
        proposito: 'carne',
        lote_actual: '',
        potrero_actual: '',
        observaciones: '',
      });
      setPhotoPreview(null);
      setPhotoFile(null);
    }
  }, [animal, isOpen]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let animalId: number;
      
      if (animal) {
        // Editar: solo actualizar campos permitidos
        await animalesService.updateAnimal(animal.id, {
          nombre: formData.nombre,
          peso_actual: formData.peso_actual,
          categoria: formData.categoria,
          lote_actual: formData.lote_actual,
          potrero_actual: formData.potrero_actual,
          observaciones: formData.observaciones,
        });
        animalId = animal.id;
      } else {
        // Crear nuevo
        const response = await animalesService.createAnimal(formData);
        animalId = response.id;
      }
      
      // Subir foto si se seleccionó una
      if (photoFile) {
        await animalesService.uploadFoto(animalId, photoFile);
      }
      
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar el animal');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {animal ? 'Editar Animal' : 'Nuevo Animal'}
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
            {/* Número de Identificación */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Número de Identificación *
              </label>
              <input
                type="text"
                required
                disabled={!!animal}
                value={formData.numero_identificacion}
                onChange={(e) => setFormData({ ...formData, numero_identificacion: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                placeholder="Ej: 001, A-123"
              />
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                placeholder="Ej: Lola, Benito"
              />
            </div>

            {/* Sexo y Raza */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sexo *
                </label>
                <select
                  required
                  disabled={!!animal}
                  value={formData.sexo}
                  onChange={(e) => setFormData({ ...formData, sexo: e.target.value as 'macho' | 'hembra' })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                >
                  <option value="hembra">Hembra</option>
                  <option value="macho">Macho</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Raza *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!animal}
                  value={formData.raza}
                  onChange={(e) => setFormData({ ...formData, raza: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                  placeholder="Ej: Angus, Brahman"
                />
              </div>
            </div>

            {/* Pesos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Peso de Nacimiento (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  disabled={!!animal}
                  value={formData.peso_nacimiento || ''}
                  onChange={(e) => setFormData({ ...formData, peso_nacimiento: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                  placeholder="Ej: 35"
                />
                <p className="mt-1 text-xs text-gray-500">Opcional</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Peso Actual (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.peso_actual || ''}
                  onChange={(e) => setFormData({ ...formData, peso_actual: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: 450"
                />
                <p className="mt-1 text-xs text-gray-500">Peso al momento de registro/compra</p>
              </div>
            </div>

            {/* Fecha Nacimiento y Color */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  required
                  disabled={!!animal}
                  value={formData.fecha_nacimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Color
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: Negro, Café"
                />
              </div>
            </div>

            {/* Categoría y Propósito */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Categoría
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Seleccionar</option>
                  <option value="cria">Cría</option>
                  <option value="ternero">Ternero</option>
                  <option value="novilla">Novilla</option>
                  <option value="vaca">Vaca</option>
                  <option value="toro">Toro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Propósito *
                </label>
                <select
                  required
                  value={formData.proposito}
                  onChange={(e) => setFormData({ ...formData, proposito: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                >
                  <option value="carne">Carne</option>
                  <option value="leche">Leche</option>
                  <option value="doble_proposito">Doble Propósito</option>
                  <option value="reproduccion">Reproducción</option>
                </select>
              </div>
            </div>

            {/* Lote y Potrero */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Lote Actual
                </label>
                <input
                  type="text"
                  value={formData.lote_actual}
                  onChange={(e) => setFormData({ ...formData, lote_actual: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: A1, Lote 5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Potrero Actual
                </label>
                <input
                  type="text"
                  value={formData.potrero_actual}
                  onChange={(e) => setFormData({ ...formData, potrero_actual: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: Potrero Norte"
                />
              </div>
            </div>

            {/* Foto del Animal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📸 Foto del Animal
              </label>
              {photoPreview && (
                <div className="mb-3">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-32 w-32 object-cover rounded-lg border-2 border-gray-300"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Selecciona una imagen o toma una foto con la cámara
              </p>
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
