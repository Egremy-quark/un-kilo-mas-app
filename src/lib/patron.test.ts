import { describe, expect, it } from 'vitest';
import { clasificarMedida, clasificarPatron } from './patron';

describe('patrón y medida por nombre', () => {
  it('asigna los cuatro patrones del boceto', () => {
    expect(clasificarPatron('Sentadilla goblet')).toBe('rodilla');
    expect(clasificarPatron('Prensa 45')).toBe('rodilla');
    expect(clasificarPatron('Peso muerto rumano')).toBe('bisagra');
    expect(clasificarPatron('Press banca')).toBe('empuje');
    expect(clasificarPatron('Remo con barra')).toBe('jalon');
    expect(clasificarPatron('Dominada asistida')).toBe('jalon');
  });

  it('no marca extensión de tríceps como rodilla', () => {
    expect(clasificarPatron('Extensión de tríceps en polea')).toBe('accesorio');
  });

  it('deja vacío lo que no encaja', () => {
    expect(clasificarPatron('Movimiento raro XYZ')).toBeNull();
  });

  it('mide plancha en tiempo y lagartijas en peso corporal', () => {
    expect(clasificarMedida('Plancha frontal')).toBe('tiempo');
    expect(clasificarMedida('Lagartijas')).toBe('peso_corporal');
    expect(clasificarMedida('Crunch sin peso')).toBe('peso_corporal');
  });
});
