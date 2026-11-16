import { describe, expect, it } from 'vitest';
import { normalizarNombre, tipoAlternativa } from './normalizar';

describe('nombres de ejercicios', () => {
  it('no distingue mayúsculas ni acentos', () => {
    expect(normalizarNombre('Press de Banca')).toBe(normalizarNombre('press de banca'));
    expect(normalizarNombre('Jalón al pecho')).toBe(normalizarNombre('Jalon al pecho'));
  });

  it('clasifica el tipo de alternativa', () => {
    expect(tipoAlternativa('Sin equipo')).toBe('sin_equipo');
    expect(tipoAlternativa('Equivalente')).toBe('equivalente');
    expect(tipoAlternativa('Con máquina')).toBe('maquina');
  });
});
