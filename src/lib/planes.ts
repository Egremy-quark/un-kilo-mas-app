import { plataforma, type PlanPagado } from '@/config/plataforma';
import { hoyUtc } from './fecha';
import { formatearDinero } from './formato';

export type EstadoPlan =
  | 'prueba'
  | 'activa'
  | 'por_vencer'
  | 'vencida'
  | 'prueba_terminada'
  | 'sin_plan';

export interface CoberturaEntrada {
  plan: PlanPagado;
  fechaTransferencia: Date;
  meses?: number | null;
  cubreHastaAnterior?: Date | null;
  veniaDePrueba?: boolean;
}

export function addDays(fecha: Date, dias: number): Date {
  const copia = new Date(fecha);
  copia.setUTCDate(copia.getUTCDate() + dias);
  return copia;
}

export function addWeeks(fecha: Date, semanas: number): Date {
  return addDays(fecha, semanas * 7);
}

function soloFecha(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}

export function calcularCobertura(entrada: CoberturaEntrada): { cubreDesde: Date; cubreHasta: Date } {
  const transferencia = soloFecha(entrada.fechaTransferencia);
  let cubreDesde = transferencia;

  if (entrada.veniaDePrueba) {
    cubreDesde = transferencia;
  } else if (entrada.cubreHastaAnterior) {
    const anterior = soloFecha(entrada.cubreHastaAnterior);
    const diasAtraso = Math.floor((transferencia.getTime() - anterior.getTime()) / 86400000);
    if (diasAtraso <= plataforma.renovacion.diasGracia) {
      cubreDesde = anterior;
    }
  }

  let cubreHasta: Date;
  if (entrada.plan === 'ruta_completa') {
    cubreHasta = addWeeks(cubreDesde, plataforma.ruta.semanas + plataforma.ruta.margenSemanasCompleta);
  } else {
    const meses = entrada.meses && entrada.meses > 0 ? entrada.meses : 1;
    cubreHasta = new Date(cubreDesde);
    cubreHasta.setUTCMonth(cubreHasta.getUTCMonth() + meses);
  }

  return { cubreDesde, cubreHasta };
}

/** Importe del plan. Coaching no tiene precio: devuelve «Sin monto». */
export function textoMensualidad(plan: string): string {
  if (plan === 'ruta_mensual') return formatearDinero(plataforma.planes.ruta_mensual.precio);
  if (plan === 'ruta_completa') return formatearDinero(plataforma.planes.ruta_completa.precio);
  if (plan === 'prueba') return formatearDinero(plataforma.planes.prueba.precio);
  return 'Sin monto';
}

export function precioEsperado(plan: PlanPagado, meses?: number | null): number | null {
  if (plan === 'ruta_mensual') return plataforma.planes.ruta_mensual.precio * (meses && meses > 0 ? meses : 1);
  if (plan === 'ruta_completa') return plataforma.planes.ruta_completa.precio;
  return plataforma.planes.coaching.precio;
}

export function montoCoincide(plan: PlanPagado, monto: number | null | undefined, meses?: number | null): boolean {
  const esperado = precioEsperado(plan, meses);
  if (esperado == null || monto == null) return true;
  return Number(monto) === Number(esperado);
}

export function estadoPlan(entrada: {
  plan: string;
  pruebaInicio?: Date | null;
  pruebaTerminada?: boolean;
  cubreHasta?: Date | null;
  hoy?: Date;
}): EstadoPlan {
  const hoy = soloFecha(entrada.hoy ?? hoyUtc());
  if (entrada.plan === 'prueba') {
    if (entrada.pruebaTerminada) return 'prueba_terminada';
    if (!entrada.pruebaInicio) return 'prueba';
    const fin = addDays(soloFecha(entrada.pruebaInicio), plataforma.prueba.dias);
    if (hoy >= fin) return 'prueba_terminada';
    return 'prueba';
  }
  if (entrada.plan === 'sin_plan') return 'sin_plan';
  if (!entrada.cubreHasta) return 'vencida';
  const hasta = soloFecha(entrada.cubreHasta);
  if (hoy > hasta) return 'vencida';
  const dias = Math.floor((hasta.getTime() - hoy.getTime()) / 86400000);
  if (dias <= plataforma.diasAvisoVencimiento) return 'por_vencer';
  return 'activa';
}

export function etiquetaEstado(estado: EstadoPlan): string {
  switch (estado) {
    case 'prueba':
      return 'Prueba';
    case 'activa':
      return 'Activa';
    case 'por_vencer':
      return 'Por vencer';
    case 'vencida':
      return 'Vencida';
    case 'prueba_terminada':
      return 'Prueba terminada';
    default:
      return 'Sin plan';
  }
}
