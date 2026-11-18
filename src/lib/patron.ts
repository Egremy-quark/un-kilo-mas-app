import { normalizarNombre } from './normalizar';

export type Patron = 'rodilla' | 'bisagra' | 'empuje' | 'jalon' | 'accesorio';
export type MedidaEjercicio = 'kg_reps' | 'peso_corporal' | 'tiempo';

export function clasificarPatron(nombre: string): Patron | null {
  const n = normalizarNombre(nombre);
  if (/sentadilla|sissy squat|prensa|zancada|hack squat|subida a cajon/.test(n)) return 'rodilla';
  if (/extension/.test(n) && !/triceps|codo|nuca/.test(n)) return 'rodilla';
  if (/peso muerto|hiperextension|puente|curl femoral|good morning|nordic|glute ham/.test(n)) return 'bisagra';
  if (/press |press$|fondos|lagartija|apertura|pec |cruce|fly/.test(n)) return 'empuje';
  if (/remo|jalon|dominada|pull ?up|pulldown|pull over/.test(n)) return 'jalon';
  if (
    /curl(?! femoral)|elevacion|abductor|adductor|pantorrilla|gemelo|crunch|abdominal|plancha|face pull|encogimiento|rotacion|bird dog|superman|patada|triceps|codo|caminata en pared|dragon flag|lenador|salto a cajon/.test(
      n,
    )
  ) {
    return 'accesorio';
  }
  return null;
}

export function clasificarMedida(nombre: string): MedidaEjercicio {
  const n = normalizarNombre(nombre);
  if (/plancha/.test(n)) return 'tiempo';
  if (
    /lagartija|dominada|fondos|superman|bird dog/.test(n) ||
    /sin peso/.test(n) ||
    (/crunch/.test(n) && /sin peso|peso corporal/.test(n))
  ) {
    return 'peso_corporal';
  }
  return 'kg_reps';
}
