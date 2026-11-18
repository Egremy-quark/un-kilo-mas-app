import { describe, expect, it } from 'vitest';
import { partesPrescripcion } from './prescripcion-ui';

describe('partesPrescripcion', () => {
  it('separa series × reps y el % del 1RM, sin arroba', () => {
    const p = partesPrescripcion({ series: '8', reps: '2', pct: 0.75, texto: '8 × 2 @ 75%' });
    expect(p?.principal).toBe('8 × 2');
    expect(p?.detalle).toBe('75 % 1RM');
    expect(`${p?.principal} ${p?.detalle}`).not.toContain('@');
  });

  it('lee el texto viejo si no hay series/reps', () => {
    const p = partesPrescripcion({ texto: '8 × 3 @ 75%' });
    expect(p?.principal).toBe('8 × 3');
    expect(p?.detalle).toBe('75 % 1RM');
  });

  it('completa reps desde el texto si solo hay series', () => {
    const p = partesPrescripcion({ series: '8', texto: '8 × 2 @ 75%' });
    expect(p?.principal).toBe('8 × 2');
    expect(p?.detalle).toBe('75 % 1RM');
  });
});
