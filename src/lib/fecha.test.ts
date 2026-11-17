import { describe, expect, it } from 'vitest';
import { finDeMes, formatearRangoCorto, ymdEnZona } from './fecha';

describe('fechas en México', () => {
  it('a las 23:30 hora de México, hoy es el mismo día', () => {
    // 16 nov 2026 23:30 en America/Mexico_City (UTC−6) = 17 nov 05:30 UTC.
    const noche = new Date('2026-11-17T05:30:00.000Z');
    expect(ymdEnZona(noche)).toBe('2026-11-16');
    expect(noche.toISOString().slice(0, 10)).toBe('2026-11-17');
  });

  it('a las 19:00 del 16 de noviembre en México, hoy no pasa al 17', () => {
    const tarde = new Date('2026-11-17T01:00:00.000Z');
    expect(ymdEnZona(tarde)).toBe('2026-11-16');
  });

  it('escribe el rango como en el boceto', () => {
    expect(formatearRangoCorto('2026-11-16', '2026-12-16')).toBe('del 16 nov al 16 dic');
  });

  it('el último día de noviembre es el 30', () => {
    expect(finDeMes('2026-11')).toBe('2026-11-30');
  });
});
