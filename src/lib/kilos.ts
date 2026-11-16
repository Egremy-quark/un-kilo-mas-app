import { plataforma } from '@/config/plataforma';
import { redondearAlPaso } from './formato';

/** Kilos objetivo = pct × 1RM, redondeado al paso de la plataforma (2.5 kg). */
export function kilosObjetivo(rmKg: number, pct: number, paso = plataforma.redondeoKg): number {
  return redondearAlPaso(rmKg * pct, paso);
}
