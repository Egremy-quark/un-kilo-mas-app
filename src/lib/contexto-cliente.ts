import type { SupabaseClient } from '@supabase/supabase-js';
import { estadoPlan, type EstadoPlan } from './planes';

export async function contextoCliente(supabase: SupabaseClient, userId: string) {
  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', userId).single();
  const { data: pagos } = await supabase.from('pagos').select('*').eq('cliente_id', userId).order('cubre_hasta', { ascending: false });
  const { data: puede } = await supabase.rpc('puede_registrar', { p_cliente: userId });
  const { data: inscripciones } = await supabase.from('inscripciones').select('*, programas(id, clave, nombre)').eq('cliente_id', userId);
  const { data: rutinaCoach } = await supabase.from('rutinas').select('*').eq('cliente_id', userId).eq('estado', 'publicada').maybeSingle();
  const cubre = pagos?.[0]?.cubre_hasta as string | undefined;
  const insPrueba = (inscripciones ?? []).find((i) => (i.programas as { clave?: string } | null)?.clave === 'prueba');
  const insRuta = (inscripciones ?? []).find((i) => (i.programas as { clave?: string } | null)?.clave === 'ruta-1');
  const estado: EstadoPlan = estadoPlan({
    plan: perfil?.plan as string,
    pruebaInicio: perfil?.prueba_inicio ? new Date(perfil.prueba_inicio as string) : null,
    pruebaTerminada: Boolean(insPrueba?.terminada),
    cubreHasta: cubre ? new Date(cubre) : null,
  });
  return {
    perfil,
    pagos: pagos ?? [],
    puedeRegistrar: Boolean(puede),
    insPrueba,
    insRuta,
    rutinaCoach,
    estado,
    cubreHasta: cubre ?? null,
  };
}

export async function rutinaDeInscripcion(supabase: SupabaseClient, ins: { id: string; rutina_iniciada_id: string | null; programa_id: string; fase_orden: number } | null) {
  if (!ins) return null;
  if (ins.rutina_iniciada_id) {
    const { data } = await supabase.from('rutinas').select('*').eq('id', ins.rutina_iniciada_id).maybeSingle();
    return data;
  }
  const { data: fase } = await supabase
    .from('programa_fases')
    .select('*, rutinas(*)')
    .eq('programa_id', ins.programa_id)
    .eq('orden', ins.fase_orden)
    .maybeSingle();
  return (fase as { rutinas?: unknown } | null)?.rutinas ?? null;
}
