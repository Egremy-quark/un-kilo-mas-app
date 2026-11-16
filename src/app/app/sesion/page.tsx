import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { contextoCliente } from '@/lib/contexto-cliente';
import { SesionHoy } from './SesionHoy';

export default async function PaginaSesion() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');
  const ctx = await contextoCliente(supabase, user.id);
  const plan = ctx.perfil?.plan as string;
  const ins = plan === 'prueba' ? ctx.insPrueba : plan === 'coaching' ? null : ctx.insRuta;
  let rutinaId = (ctx.rutinaCoach?.id as string | undefined) ?? (ins?.rutina_iniciada_id as string | undefined) ?? null;
  if (!rutinaId && ins) {
    const { data: fase } = await supabase
      .from('programa_fases')
      .select('rutina_id, publicada')
      .eq('programa_id', ins.programa_id)
      .eq('orden', ins.fase_orden)
      .maybeSingle();
    if (fase?.publicada) rutinaId = fase.rutina_id as string;
  }
  if (!rutinaId) {
    return <p>Tu rutina se está preparando.</p>;
  }
  const { data: dias } = await supabase.from('rutina_dias').select('id, letra, foco').eq('rutina_id', rutinaId).order('orden');
  const diaIds = (dias ?? []).map((d) => d.id as string);
  const { data: ejs } = diaIds.length
    ? await supabase.from('rutina_ejercicios').select('id, dia_id, ejercicio_id, grupo, nota, revisar, ejercicios(nombre)').in('dia_id', diaIds).order('orden')
    : { data: [] };
  const semana = (ins?.semana as number | undefined) ?? 1;
  const ejIds = (ejs ?? []).map((e) => e.id as string);
  const { data: pres } = ejIds.length
    ? await supabase.from('prescripciones').select('*').in('rutina_ejercicio_id', ejIds).eq('semana', semana)
    : { data: [] };
  const { data: rms } = await supabase.from('rm_referencia').select('ejercicio_id, kg').eq('cliente_id', user.id);
  const { data: cambios } = await supabase.from('cambios_cliente').select('*').eq('cliente_id', user.id);
  const rmMap = new Map((rms ?? []).map((r) => [r.ejercicio_id as string, Number(r.kg)]));
  const ejercicios = (ejs ?? []).map((e) => {
    const cambioFase = (cambios ?? []).find((c) => c.rutina_ejercicio_id === e.id && c.alcance === 'fase');
    const hechoId = (cambioFase?.ejercicio_id as string | undefined) ?? (e.ejercicio_id as string);
    const p = (pres ?? []).find((x) => x.rutina_ejercicio_id === e.id);
    return {
      id: e.id as string,
      dia_id: e.dia_id as string,
      ejercicio_id: e.ejercicio_id as string,
      nombre: (e.ejercicios as { nombre?: string } | null)?.nombre ?? '',
      grupo: e.grupo as string | null,
      nota: e.nota as string | null,
      revisar: Boolean(e.revisar),
      pres: {
        texto: (p?.texto as string) ?? '',
        pct: (p?.pct as number | null) ?? null,
        descanso_seg: (p?.descanso_seg as number | null) ?? null,
        omitir: Boolean(p?.omitir),
      },
      rm: rmMap.get(hechoId) ?? rmMap.get(e.ejercicio_id as string) ?? null,
      hechoId,
    };
  });

  return (
    <SesionHoy
      clienteId={user.id}
      puedeRegistrar={ctx.puedeRegistrar}
      inscripcionId={(ins?.id as string | undefined) ?? null}
      rutinaId={rutinaId}
      semana={semana}
      faseOrden={(ins?.fase_orden as number | undefined) ?? null}
      vuelta={(ins?.vuelta as number | undefined) ?? null}
      esRuta={plan === 'ruta_mensual' || plan === 'ruta_completa'}
      esCoaching={plan === 'coaching'}
      dias={(dias ?? []) as { id: string; letra: string; foco: string | null }[]}
      ejercicios={ejercicios}
    />
  );
}
