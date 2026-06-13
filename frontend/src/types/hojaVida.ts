export interface AnimalResumenGenealogia {
  id: number;
  numero_identificacion: string;
  nombre?: string | null;
  sexo: string;
  fecha_nacimiento?: string | null;
}

export interface EventoHojaVidaReproductiva {
  id: number;
  tipo_evento: string;
  fecha_evento: string;
  diagnostico?: string | null;
  tipo_servicio?: string | null;
  toro_numero?: string | null;
  toro_nombre?: string | null;
  hembra_numero?: string | null;
  hembra_nombre?: string | null;
  numero_crias?: number | null;
  tipo_parto?: string | null;
  facilidad_parto?: string | null;
  vitalidad_cria?: string | null;
  crias_registradas: AnimalResumenGenealogia[];
}

export interface HojaVidaReproductiva {
  madre?: AnimalResumenGenealogia | null;
  padre?: AnimalResumenGenealogia | null;
  crias_en_inventario: AnimalResumenGenealogia[];
  progenie_como_padre: AnimalResumenGenealogia[];
  eventos: EventoHojaVidaReproductiva[];
}

export function formatAnimalResumen(animal: AnimalResumenGenealogia): string {
  const nombre = animal.nombre?.trim();
  if (nombre) {
    return `${animal.numero_identificacion} — ${nombre}`;
  }
  return animal.numero_identificacion;
}

export function labelTipoEventoReproductivo(tipo: string): string {
  const map: Record<string, string> = {
    servicio: 'Servicio / monta',
    diagnostico: 'Diagnóstico',
    parto: 'Parto',
    aborto: 'Aborto',
    secado: 'Secado',
    otro: 'Otro',
  };
  return map[tipo] || tipo;
}
