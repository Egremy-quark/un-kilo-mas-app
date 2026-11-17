import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('ruta-1.json', () => {
  const bruto = JSON.parse(readFileSync(join(process.cwd(), 'datos/ruta-1.json'), 'utf8')) as {
    fases: { orden: number; nombre: string; semanas: number; dias: { dia: string; ejercicios: { revisar?: boolean }[] }[] }[];
  };

  it('tiene 8 fases, 37 semanas y 128 ejercicios', () => {
    expect(bruto.fases.map((f) => f.orden)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(bruto.fases.reduce((n, f) => n + f.semanas, 0)).toBe(37);
    expect(bruto.fases.reduce((n, f) => n + f.dias.reduce((m, d) => m + d.ejercicios.length, 0), 0)).toBe(128);
  });

  it('la fase 1 Arranque tiene días A y B', () => {
    const f1 = bruto.fases.find((f) => f.orden === 1);
    expect(f1?.nombre).toBe('Arranque');
    expect(f1?.dias.map((d) => d.dia)).toEqual(['A', 'B']);
  });

  it('deja sin publicar las fases con revisar', () => {
    const conRevisar = bruto.fases.filter((f) => f.dias.some((d) => d.ejercicios.some((e) => e.revisar))).map((f) => f.orden);
    expect(conRevisar.length).toBeGreaterThan(0);
  });
});
