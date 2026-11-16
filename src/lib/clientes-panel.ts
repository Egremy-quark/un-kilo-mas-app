import { estadoPlan, type EstadoPlan } from './planes';
import { plataforma } from '@/config/plataforma';

export interface ClienteLista {
  id: string;
  nombre: string | null;
  correo: string | null;
  plan: string;
  entrenador_a_cargo_id: string | null;
  prueba_inicio: string | null;
  cubre_hasta: string | null;
  solicitud: string | null;
  rutina: string | null;
  semana: string | null;
  ultima_sesion: string | null;
  a_cargo: string;
  estado: EstadoPlan;
}

export function filtrarClientes(
  lista: ClienteLista[],
  q: string,
  filtro: string,
): ClienteLista[] {
  const texto = q.trim().toLowerCase();
  return lista.filter((c) => {
    if (texto && !`${c.nombre ?? ''} ${c.correo ?? ''}`.toLowerCase().includes(texto)) return false;
    if (filtro === 'por_vencer') return c.estado === 'por_vencer';
    if (filtro === 'vencidos') return c.estado === 'vencida' || c.estado === 'prueba_terminada';
    if (filtro === 'prueba') return c.plan === 'prueba';
    if (filtro === 'ruta') return c.plan === 'ruta_mensual' || c.plan === 'ruta_completa';
    if (filtro === 'coaching') return c.plan === 'coaching';
    return true;
  });
}

export function cifras(lista: ClienteLista[]) {
  const hoy = new Date();
  const semana = new Date();
  semana.setUTCDate(hoy.getUTCDate() + 7);
  return {
    activos: lista.filter((c) => c.estado === 'activa' || c.estado === 'por_vencer').length,
    vencenSemana: lista.filter((c) => {
      if (!c.cubre_hasta) return false;
      const d = new Date(c.cubre_hasta);
      return d >= hoy && d <= semana;
    }).length,
    vencidos: lista.filter((c) => c.estado === 'vencida').length,
    prueba: lista.filter((c) => c.plan === 'prueba').length,
  };
}

export function estadoDeCliente(c: {
  plan: string;
  prueba_inicio: string | null;
  cubre_hasta: string | null;
  prueba_terminada?: boolean;
}): EstadoPlan {
  return estadoPlan({
    plan: c.plan,
    pruebaInicio: c.prueba_inicio ? new Date(c.prueba_inicio) : null,
    pruebaTerminada: c.prueba_terminada,
    cubreHasta: c.cubre_hasta ? new Date(c.cubre_hasta) : null,
  });
}

export function nombrePlan(plan: string): string {
  if (plan === 'ruta_mensual' || plan === 'ruta_completa') return 'Ruta +1';
  if (plan === 'coaching') return 'Coaching';
  if (plan === 'prueba') return 'Prueba';
  return 'Sin plan';
}

export function diasPrueba() {
  return plataforma.prueba.dias;
}
