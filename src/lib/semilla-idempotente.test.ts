import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('ruta-1.json', () => {
  const bruto = JSON.parse(readFileSync(join(process.cwd(), 'datos/ruta-1.json'), 'utf8')) as {
    fases: { orden: number; dias: { ejercicios: { revisar?: boolean }[] }[] }[];
  };

  it('tiene 8 fases', () => {
    expect(bruto.fases.map((f) => f.orden)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('deja sin publicar las fases con revisar', () => {
    const conRevisar = bruto.fases.filter((f) => f.dias.some((d) => d.ejercicios.some((e) => e.revisar))).map((f) => f.orden);
    expect(conRevisar.length).toBeGreaterThan(0);
  });
});
