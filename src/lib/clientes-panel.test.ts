import { describe, expect, it } from 'vitest';
import { filtrarClientes, type ClienteLista } from './clientes-panel';

function cli(parcial: Partial<ClienteLista> & Pick<ClienteLista, 'id' | 'plan' | 'estado'>): ClienteLista {
  return {
    nombre: 'Ana',
    correo: 'ana@test.com',
    entrenador_a_cargo_id: null,
    prueba_inicio: null,
    cubre_hasta: null,
    solicitud: null,
    rutina: null,
    semana: null,
    ultima_sesion: null,
    a_cargo: '—',
    ...parcial,
  };
}

describe('filtros de clientes', () => {
  const lista = [
    cli({ id: '1', plan: 'prueba', estado: 'prueba' }),
    cli({ id: '2', plan: 'ruta_mensual', estado: 'por_vencer', nombre: 'Beto' }),
    cli({ id: '3', plan: 'coaching', estado: 'vencida' }),
  ];

  it('combina estado y plan', () => {
    expect(filtrarClientes(lista, '', 'por_vencer', 'ruta').map((c) => c.id)).toEqual(['2']);
    expect(filtrarClientes(lista, '', 'todos', 'ruta').map((c) => c.id)).toEqual(['2']);
    expect(filtrarClientes(lista, '', 'vencidos', 'todos').map((c) => c.id)).toEqual(['3']);
  });
});
