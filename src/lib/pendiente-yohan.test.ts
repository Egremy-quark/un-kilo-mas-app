import { describe, expect, it } from 'vitest';
import { esPendienteYohan, restoTrasMarca, textoCliente } from './pendiente-yohan';

describe('contenido pendiente de Yohan', () => {
  it('el cliente no ve la marca', () => {
    expect(textoCliente('[CONTENIDO POR YOHAN]')).toBe('');
    expect(textoCliente('Hombro · Bíceps')).toBe('Hombro · Bíceps');
  });

  it('el entrenador distingue aviso interno', () => {
    expect(esPendienteYohan('DÍA A · [CONTENIDO POR YOHAN]')).toBe(true);
    expect(restoTrasMarca('Rutina 01. [CONTENIDO POR YOHAN] Empieza en casa')).toBe('Rutina 01. Empieza en casa');
  });
});

describe('prescripciones vagas', () => {
  it('no se muestran al cliente', async () => {
    const { esPrescripcionVaga, textoCliente } = await import('./pendiente-yohan');
    expect(esPrescripcionVaga('2 × (igual que el primero del bloque)')).toBe(true);
    expect(textoCliente('2 × (igual que el primero del bloque)')).toBe('');
    expect(textoCliente('3 × 15/12/10')).toBe('3 × 15/12/10');
  });

  it('limpia series sueltas cuando el texto es vago', async () => {
    const { prescripcionParaCliente } = await import('./pendiente-yohan');
    const p = prescripcionParaCliente({
      texto: '2 × (igual que el primero del bloque)',
      series: '2',
      reps: null,
      pct: null,
    });
    expect(p.texto).toBe('');
    expect(p.series).toBeNull();
    expect(p.reps).toBeNull();
  });
});
