import { describe, expect, it } from 'vitest';
import { alCompletarFase, alCompletarSemana, rutina01Abre02 } from './avance-programa';

describe('avance', () => {
  it('completar los días de la semana pasa de semana', () => {
    expect(alCompletarSemana(2, 4)).toBe('siguiente_semana');
  });

  it('la última semana pasa de fase', () => {
    expect(alCompletarSemana(4, 4)).toBe('siguiente_fase');
  });

  it('la última fase termina el programa', () => {
    expect(alCompletarFase(8, 8)).toBe('terminado');
    expect(alCompletarFase(1, 2)).toBe('siguiente_fase');
  });

  it('terminar la Rutina 01 abre la 02', () => {
    expect(rutina01Abre02(1, 4, 4, 'siguiente_fase')).toBe(true);
  });
});
