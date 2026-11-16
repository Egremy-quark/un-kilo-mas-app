import { describe, expect, it } from 'vitest';
import { brzycki, calcular1rm, epley } from './calculos';
import { formatearNumero } from './formato';
import { kilosObjetivo } from './kilos';
import { descansoASegundos } from './descanso';
import { calcularCobertura, estadoPlan, montoCoincide } from './planes';
import { estimado1rm, volumenSerie } from './dashboard';
import { cuentasABorrar, cuentasAAvisar } from './retencion';

describe('formato', () => {
  it('usa espacio fino en los miles y punto en los decimales', () => {
    expect(formatearNumero(2450)).toBe('2\u202F450');
    expect(formatearNumero(112.5)).toBe('112.5');
  });
});

describe('1RM', () => {
  it('100 kg × 5 promedia Epley y Brzycki y redondea a 115 kg', () => {
    expect(epley(100, 5)).toBeCloseTo(116.67, 2);
    expect(brzycki(100, 5)).toBe(112.5);
    const resultado = calcular1rm({ peso: 100, repeticiones: 5, unidad: 'kg' });
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.resultado).toBe(115);
  });

  it('con 1 repetición el 1RM es el peso', () => {
    const resultado = calcular1rm({ peso: 100, repeticiones: 1, unidad: 'kg' });
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.resultado).toBe(100);
  });

  it('no calcula con más de 10 repeticiones', () => {
    const resultado = calcular1rm({ peso: 100, repeticiones: 11, unidad: 'kg' });
    expect(resultado.ok).toBe(false);
  });
});

describe('kilos objetivo', () => {
  it('1RM 120 kg al 77 % → 92.5 kg', () => {
    expect(kilosObjetivo(120, 0.77)).toBe(92.5);
  });
});

describe('descanso', () => {
  it('convierte 1\'30" y 2:00 a segundos', () => {
    expect(descansoASegundos(`1'30"`)).toBe(90);
    expect(descansoASegundos(`2'00"`)).toBe(120);
    expect(descansoASegundos('2:30')).toBe(150);
    expect(descansoASegundos('1 min')).toBe(60);
  });
});

describe('cubre_hasta', () => {
  it('mensual suma los meses', () => {
    const { cubreDesde, cubreHasta } = calcularCobertura({
      plan: 'ruta_mensual',
      fechaTransferencia: new Date('2026-01-10T00:00:00Z'),
      meses: 1,
      veniaDePrueba: true,
    });
    expect(cubreDesde.toISOString().slice(0, 10)).toBe('2026-01-10');
    expect(cubreHasta.toISOString().slice(0, 10)).toBe('2026-02-10');
  });

  it('completa cubre 37 semanas + margen 4', () => {
    const { cubreHasta } = calcularCobertura({
      plan: 'ruta_completa',
      fechaTransferencia: new Date('2026-01-01T00:00:00Z'),
      veniaDePrueba: true,
    });
    expect(cubreHasta.toISOString().slice(0, 10)).toBe('2026-10-15');
  });

  it('renovación antes de vencer sigue el vencimiento anterior', () => {
    const { cubreDesde } = calcularCobertura({
      plan: 'ruta_mensual',
      fechaTransferencia: new Date('2026-02-08T00:00:00Z'),
      meses: 1,
      cubreHastaAnterior: new Date('2026-02-10T00:00:00Z'),
    });
    expect(cubreDesde.toISOString().slice(0, 10)).toBe('2026-02-10');
  });

  it('dentro de la gracia sigue el vencimiento anterior', () => {
    const { cubreDesde } = calcularCobertura({
      plan: 'ruta_mensual',
      fechaTransferencia: new Date('2026-02-15T00:00:00Z'),
      meses: 1,
      cubreHastaAnterior: new Date('2026-02-10T00:00:00Z'),
    });
    expect(cubreDesde.toISOString().slice(0, 10)).toBe('2026-02-10');
  });

  it('fuera de la gracia empieza en la transferencia', () => {
    const { cubreDesde } = calcularCobertura({
      plan: 'ruta_mensual',
      fechaTransferencia: new Date('2026-02-20T00:00:00Z'),
      meses: 1,
      cubreHastaAnterior: new Date('2026-02-10T00:00:00Z'),
    });
    expect(cubreDesde.toISOString().slice(0, 10)).toBe('2026-02-20');
  });

  it('200 × 2 meses coincide; 250 no', () => {
    expect(montoCoincide('ruta_mensual', 400, 2)).toBe(true);
    expect(montoCoincide('ruta_mensual', 250, 1)).toBe(false);
  });
});

describe('estado del plan', () => {
  it('prueba vigente, terminada y vencida', () => {
    expect(estadoPlan({ plan: 'prueba', pruebaInicio: new Date('2026-01-01'), hoy: new Date('2026-01-15') })).toBe('prueba');
    expect(estadoPlan({ plan: 'prueba', pruebaInicio: new Date('2026-01-01'), hoy: new Date('2026-02-01') })).toBe('prueba_terminada');
    expect(estadoPlan({ plan: 'prueba', pruebaTerminada: true, hoy: new Date('2026-01-15') })).toBe('prueba_terminada');
  });

  it('por vencer a 5 días o menos', () => {
    expect(estadoPlan({ plan: 'ruta_mensual', cubreHasta: new Date('2026-01-10'), hoy: new Date('2026-01-06') })).toBe('por_vencer');
    expect(estadoPlan({ plan: 'ruta_mensual', cubreHasta: new Date('2026-01-20'), hoy: new Date('2026-01-06') })).toBe('activa');
    expect(estadoPlan({ plan: 'ruta_mensual', cubreHasta: new Date('2026-01-05'), hoy: new Date('2026-01-06') })).toBe('vencida');
  });
});

describe('dashboard', () => {
  it('estima 1RM por semana con Epley y Brzycki', () => {
    expect(estimado1rm(100, 5)).toBe(115);
  });

  it('volumen es kilos × reps', () => {
    expect(volumenSerie(80, 8)).toBe(640);
  });
});

describe('retención', () => {
  const hoy = new Date('2026-11-15T00:00:00Z');
  it('con activa false no borra ni avisa para borrar', () => {
    const cuentas = [{ id: 'a', ultimo_acceso: '2025-01-01', aviso_borrado_en: null, plan: 'sin_plan' as const }];
    expect(cuentasAAvisar(cuentas, { activa: false, mesesInactivo: 12, diasAviso: 30, smtp: true }, hoy)).toEqual([]);
    expect(cuentasABorrar(cuentas, { activa: false, mesesInactivo: 12, diasAviso: 30, smtp: true }, hoy)).toEqual([]);
  });

  it('sin SMTP no borra', () => {
    const cuentas = [{ id: 'a', ultimo_acceso: '2025-01-01', aviso_borrado_en: '2026-10-01', plan: 'sin_plan' as const }];
    expect(cuentasABorrar(cuentas, { activa: true, mesesInactivo: 12, diasAviso: 30, smtp: false }, hoy)).toEqual([]);
  });

  it('con todo activo avisa y borra solo a quien corresponde', () => {
    const inactivo = { id: 'a', ultimo_acceso: '2025-01-01', aviso_borrado_en: null, plan: 'sin_plan' as const };
    const yaAvisado = { id: 'b', ultimo_acceso: '2025-01-01', aviso_borrado_en: '2026-10-01', plan: 'sin_plan' as const };
    const activo = { id: 'c', ultimo_acceso: '2026-11-01', aviso_borrado_en: null, plan: 'ruta_mensual' as const };
    const cfg = { activa: true, mesesInactivo: 12, diasAviso: 30, smtp: true };
    expect(cuentasAAvisar([inactivo, yaAvisado, activo], cfg, hoy).map((c) => c.id)).toEqual(['a']);
    expect(cuentasABorrar([inactivo, yaAvisado, activo], cfg, hoy).map((c) => c.id)).toEqual(['b']);
  });
});
