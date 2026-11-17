import { plataforma } from '@/config/plataforma';

const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGO = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export function ymdEnZona(ahora: Date = new Date(), zona = plataforma.zonaHoraria): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora);
}

export function utcDesdeYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

export function hoyUtc(ahora: Date = new Date()): Date {
  return utcDesdeYmd(ymdEnZona(ahora));
}

export function ymdDeDate(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

export function formatearRangoCorto(desde: string, hasta: string): string {
  const a = utcDesdeYmd(desde);
  const b = utcDesdeYmd(hasta);
  return `del ${a.getUTCDate()} ${MESES_CORTO[a.getUTCMonth()]} al ${b.getUTCDate()} ${MESES_CORTO[b.getUTCMonth()]}`;
}

export function nombreMes(ym: string): string {
  const mes = Number(ym.slice(5, 7));
  return MESES_LARGO[(mes || 1) - 1] ?? ym;
}

export function mesActual(ahora: Date = new Date()): string {
  const ymd = ymdEnZona(ahora);
  return ymd.slice(0, 7);
}

export function finDeMes(ym: string): string {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7));
  return ymdDeDate(new Date(Date.UTC(y, m, 0)));
}
