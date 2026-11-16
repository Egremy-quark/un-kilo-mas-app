import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { kilosObjetivo } from '@/lib/kilos';
import { SerieForma } from './SerieForma';

export default async function PaginaSerie({ searchParams }: { searchParams: Promise<{ sesion?: string; ejercicio?: string }> }) {
  const { sesion, ejercicio } = await searchParams;
  if (!sesion || !ejercicio) redirect('/app/sesion');
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');
  const { data: ej } = await supabase.from('rutina_ejercicios').select('*, ejercicios(nombre)').eq('id', ejercicio).single();
  const { data: ses } = await supabase.from('sesiones').select('*').eq('id', sesion).single();
  const { data: pres } = await supabase
    .from('prescripciones')
    .select('*')
    .eq('rutina_ejercicio_id', ejercicio)
    .eq('semana', ses?.semana ?? 1)
    .maybeSingle();
  const { data: cambio } = await supabase
    .from('cambios_cliente')
    .select('ejercicio_id')
    .eq('cliente_id', user.id)
    .eq('rutina_ejercicio_id', ejercicio)
    .order('creado_en', { ascending: false })
    .limit(1)
    .maybeSingle();
  const ejercicioId = (cambio?.ejercicio_id as string | undefined) ?? (ej.ejercicio_id as string);
  const { data: rm } = await supabase.from('rm_referencia').select('kg').eq('cliente_id', user.id).eq('ejercicio_id', ejercicioId).maybeSingle();
  const { data: ant } = await supabase
    .from('series')
    .select('kg, reps, sesiones!inner(cliente_id, fecha)')
    .eq('ejercicio_id', ejercicioId)
    .eq('sesiones.cliente_id', user.id)
    .order('creado_en', { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: puede } = await supabase.rpc('puede_registrar', { p_cliente: user.id });
  const kilos = pres?.pct != null && rm?.kg != null ? kilosObjetivo(Number(rm.kg), Number(pres.pct)) : null;

  return (
    <SerieForma
      sesionId={sesion}
      rutinaEjercicioId={ejercicio}
      ejercicioId={ejercicioId}
      nombre={(ej.ejercicios as { nombre?: string } | null)?.nombre ?? ''}
      objetivo={(pres?.texto as string) ?? ''}
      descansoSeg={(pres?.descanso_seg as number | null) ?? null}
      anterior={ant ? { kg: ant.kg as number | null, reps: ant.reps as number | null } : null}
      kilosObjetivo={kilos}
      puedeRegistrar={Boolean(puede)}
    />
  );
}
