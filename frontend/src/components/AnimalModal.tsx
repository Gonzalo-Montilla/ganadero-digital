import { useState, useEffect, useRef } from 'react';
import { animalesService } from '../api/animales';
import { isOfflineQueued } from '../types';
import type { Animal } from '../types/animal';
import { Beef, Camera, ImagePlus, SquarePen, X } from 'lucide-react';
import { getMediaUrl } from '../utils/mediaUrl';
import AnimalPhotoCapture from './AnimalPhotoCapture';
import AuthenticatedImage from './AuthenticatedImage';

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
  const [cameraOpen, setCameraOpen] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
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
      setPhotoPreview(getMediaUrl(animal.foto_url));
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

  const applyPhotoFile = (file: File | undefined) => {
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyPhotoFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(getMediaUrl(animal?.foto_url));
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
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
        const response = await animalesService.createAnimal(formData);
        if (isOfflineQueued(response)) {
          if (photoFile) {
            setError('Animal guardado sin conexión. La foto se subirá cuando vuelva internet.');
          }
          onSave();
          onClose();
          return;
        }
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
            <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
              {animal ? (
                <SquarePen className="h-6 w-6 text-brand-700" />
              ) : (
                <Beef className="h-6 w-6 text-brand-700" />
              )}
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
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Foto del Animal
              </label>

              {photoPreview ? (
                <div className="relative mb-3 inline-block">
                  <AuthenticatedImage
                    src={photoPreview}
                    alt="Vista previa del animal"
                    className="h-32 w-32 rounded-lg border-2 border-gray-300 object-cover"
                  />
                  {photoFile ? (
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="absolute -right-2 -top-2 rounded-full bg-rose-600 p-1 text-white shadow-sm hover:bg-rose-700"
                      aria-label="Quitar foto seleccionada"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setCameraOpen(true)}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  <Camera className="h-5 w-5" />
                  Tomar foto
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-100"
                >
                  <ImagePlus className="h-5 w-5" />
                  Elegir imagen
                </button>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />

              <p className="mt-2 text-xs text-gray-500">
                Tomar foto abre la camara del dispositivo. Elegir imagen usa galeria o archivos.
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

      <AnimalPhotoCapture
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={applyPhotoFile}
        onFallback={() => {
          setCameraOpen(false);
          cameraInputRef.current?.click();
        }}
      />
    </div>
  );
}
