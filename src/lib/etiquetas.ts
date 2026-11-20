export type Enfoque = 'fuerza' | 'hipertrofia' | 'transicion' | 'tecnica';

export function etiquetaEnfoque(valor: string | null | undefined): string {
  switch (valor) {
    case 'fuerza':
      return 'Fuerza';
    case 'hipertrofia':
      return 'Hipertrofia';
    case 'transicion':
      return 'Transición fuerza → hipertrofia';
    case 'tecnica':
      return 'Técnica';
    default:
      return '—';
  }
}

export function etiquetaEstadoRutina(valor: string | null | undefined): string {
  switch (valor) {
    case 'borrador':
      return 'Borrador';
    case 'publicada':
      return 'Publicada';
    case 'terminada':
      return 'Terminada';
    case 'archivada':
      return 'Archivada';
    default:
      return valor || '—';
  }
}

export function etiquetaTipoAlternativa(valor: string | null | undefined): string {
  switch (valor) {
    case 'sin_equipo':
      return 'Sin equipo';
    case 'maquina':
      return 'Con máquina';
    case 'equivalente':
      return 'Equivalente';
    default:
      return valor || '—';
  }
}

export function etiquetaPatron(valor: string | null | undefined): string {
  switch (valor) {
    case 'rodilla':
      return 'Rodilla';
    case 'bisagra':
      return 'Bisagra';
    case 'empuje':
      return 'Empuje';
    case 'jalon':
      return 'Jalón';
    case 'accesorio':
      return 'Accesorio';
    default:
      return valor || '—';
  }
}

export const PATRONES = [
  { id: 'rodilla', label: 'Rodilla' },
  { id: 'bisagra', label: 'Bisagra' },
  { id: 'empuje', label: 'Empuje' },
  { id: 'jalon', label: 'Jalón' },
  { id: 'accesorio', label: 'Accesorio' },
] as const;

export function etiquetaMedida(valor: string | null | undefined): string {
  switch (valor) {
    case 'kg_reps':
      return 'Kilos y reps';
    case 'peso_corporal':
      return 'Peso corporal';
    case 'tiempo':
      return 'Tiempo';
    default:
      return valor || '—';
  }
}

export function etiquetaVariante(campo: 'poblacion' | 'material' | 'unidades', valor: string | null | undefined): string {
  if (!valor) return '';
  if (campo === 'poblacion' && valor === 'mujeres') return 'Mujeres';
  if (campo === 'poblacion' && valor === 'hombres') return 'Hombres';
  if (campo === 'material' && valor === 'poco_material') return 'Poco material';
  if (campo === 'material' && valor === 'sin_maquinas') return 'Sin máquinas';
  if (campo === 'unidades' && valor === 'kg') return 'kg';
  if (campo === 'unidades' && valor === 'lbs') return 'lbs';
  return valor;
}

export function etiquetaSemanas(valor: number | null | undefined): string {
  return valor == null ? 'por definir' : String(valor);
}
