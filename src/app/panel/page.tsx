import { Suspense } from 'react';
import { crearClienteServidor } from '@/lib/supabase/server';
import { estadoDeCliente, type ClienteLista } from '@/lib/clientes-panel';
import { ListaClientes } from './ListaClientes';

export default async function PanelClientes() {
  const supabase = await crearClienteServidor();
  const { data: perfiles } = await supabase.from('perfiles').select('*').eq('rol', 'cliente').order('creado_en', { ascending: false });
  const ids = (perfiles ?? []).map((p) => p.id as string);
  const { data: pagos } = ids.length
    ? await supabase.from('pagos').select('cliente_id, cubre_hasta').in('cliente_id', ids).order('cubre_hasta', { ascending: false })
    : { data: [] };
  const { data: solicitudes } = ids.length
    ? await supabase.from('solicitudes_plan').select('cliente_id, plan_elegido').eq('atendida', false).in('cliente_id', ids)
    : { data: [] };
  const { data: entrenadores } = await supabase.from('perfiles').select('id, nombre').eq('rol', 'entrenador');
  const { data: inscripciones } = ids.length
    ? await supabase.from('inscripciones').select('cliente_id, fase_orden, semana, terminada, programas(nombre), rutinas:rutina_iniciada_id(nombre)')
    : { data: [] };
  const { data: sesiones } = ids.length
    ? await supabase.from('sesiones').select('cliente_id, fecha').in('cliente_id', ids).order('fecha', { ascending: false })
    : { data: [] };
  const { data: rutinas } = ids.length
    ? await supabase.from('rutinas').select('cliente_id, nombre, estado').eq('estado', 'publicada').in('cliente_id', ids)
    : { data: [] };

  const ultimoPago = new Map<string, string>();
  for (const p of pagos ?? []) {
    if (!ultimoPago.has(p.cliente_id as string)) ultimoPago.set(p.cliente_id as string, p.cubre_hasta as string);
  }
  const solMap = new Map((solicitudes ?? []).map((s) => [s.cliente_id as string, s.plan_elegido as string]));
  const entMap = new Map((entrenadores ?? []).map((e) => [e.id as string, e.nombre as string]));
  const ultSesion = new Map<string, string>();
  for (const s of sesiones ?? []) {
    if (!ultSesion.has(s.cliente_id as string)) ultSesion.set(s.cliente_id as string, s.fecha as string);
  }

  const lista: ClienteLista[] = (perfiles ?? []).map((p) => {
    const ins = (inscripciones ?? []).find((i) => i.cliente_id === p.id);
    const rutinaCoach = (rutinas ?? []).find((r) => r.cliente_id === p.id);
    const cubre = ultimoPago.get(p.id as string) ?? null;
    const pruebaTerminada = Boolean(ins && (ins as { terminada?: boolean }).terminada && p.plan === 'prueba');
    return {
      id: p.id as string,
      nombre: p.nombre as string | null,
      correo: p.correo as string | null,
      plan: p.plan as string,
      entrenador_a_cargo_id: p.entrenador_a_cargo_id as string | null,
      prueba_inicio: p.prueba_inicio as string | null,
      cubre_hasta: cubre,
      solicitud: solMap.get(p.id as string) ?? null,
      rutina: (rutinaCoach?.nombre as string | undefined) ?? ((ins as { programas?: { nombre?: string } } | undefined)?.programas?.nombre ?? null),
      semana: ins ? `Fase ${(ins as { fase_orden: number }).fase_orden} · sem ${(ins as { semana: number }).semana}` : null,
      ultima_sesion: ultSesion.get(p.id as string) ?? null,
      a_cargo: p.entrenador_a_cargo_id ? (entMap.get(p.entrenador_a_cargo_id as string) ?? '—') : '—',
      estado: estadoDeCliente({
        plan: p.plan as string,
        prueba_inicio: p.prueba_inicio as string | null,
        cubre_hasta: cubre,
        prueba_terminada: pruebaTerminada,
      }),
    };
  });

  const avisos: { texto: string; href: string }[] = [];
  for (const c of lista) {
    if (c.solicitud) avisos.push({ texto: `${c.nombre} eligió plan y espera su pago.`, href: `/panel/clientes/${c.id}/pago` });
    if (c.plan === 'coaching' && !c.rutina) avisos.push({ texto: `${c.nombre} no tiene rutina publicada.`, href: `/panel/clientes/${c.id}` });
  }

  return (
    <Suspense>
      <ListaClientes lista={lista} avisos={avisos} />
    </Suspense>
  );
}
