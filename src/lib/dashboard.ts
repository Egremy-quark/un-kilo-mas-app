import { calcular1rm } from './calculos';

export function estimado1rm(kg: number, reps: number): number | null {
  if (!Number.isFinite(kg) || kg <= 0) return null;
  if (!Number.isInteger(reps) || reps < 1 || reps > 10) return null;
  const r = calcular1rm({ peso: kg, repeticiones: reps, unidad: 'kg' });
  return r.ok ? r.resultado : null;
}

export function volumenSerie(kg: number | null | undefined, reps: number | null | undefined): number {
  if (kg == null || reps == null) return 0;
  return kg * reps;
}

export interface SerieHecha {
  ejercicio_id: string;
  kg: number | null;
  reps: number | null;
  fecha: string;
  completada?: boolean;
}

export function mejorSerie(series: SerieHecha[]): SerieHecha | null {
  const validas = series.filter((s) => s.completada !== false && s.kg != null && s.reps != null);
  if (!validas.length) return null;
  return validas.reduce((mejor, actual) => {
    const eMejor = estimado1rm(mejor.kg ?? 0, mejor.reps ?? 0) ?? 0;
    const eActual = estimado1rm(actual.kg ?? 0, actual.reps ?? 0) ?? 0;
    if (eActual > eMejor) return actual;
    if (eActual === 0 && eMejor === 0 && (actual.kg ?? 0) * (actual.reps ?? 0) > (mejor.kg ?? 0) * (mejor.reps ?? 0)) {
      return actual;
    }
    return mejor;
  });
}

export function rmPorSemana(series: SerieHecha[]): { semana: string; kg: number }[] {
  const por: Record<string, SerieHecha[]> = {};
  for (const s of series) {
    const d = new Date(s.fecha);
    const lunes = new Date(d);
    const day = (d.getUTCDay() + 6) % 7;
    lunes.setUTCDate(d.getUTCDate() - day);
    const clave = lunes.toISOString().slice(0, 10);
    (por[clave] ??= []).push(s);
  }
  return Object.entries(por)
    .map(([semana, ss]) => {
      const mejor = mejorSerie(ss);
      const kg = mejor ? estimado1rm(mejor.kg ?? 0, mejor.reps ?? 0) : null;
      return kg ? { semana, kg } : null;
    })
    .filter((x): x is { semana: string; kg: number } => x != null)
    .sort((a, b) => a.semana.localeCompare(b.semana));
}

export function tendencia(valores: number[]): 'sube' | 'baja' | 'igual' | null {
  if (valores.length < 2) return null;
  const a = valores[0];
  const b = valores[valores.length - 1];
  if (b > a) return 'sube';
  if (b < a) return 'baja';
  return 'igual';
}
