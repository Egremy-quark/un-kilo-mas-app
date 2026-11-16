import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { CierreForma } from './CierreForma';

export default async function PaginaCierre({ searchParams }: { searchParams: Promise<{ sesion?: string }> }) {
  const { sesion } = await searchParams;
  if (!sesion) redirect('/app/sesion');
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');
  const { data: perfil } = await supabase.from('perfiles').select('plan').eq('id', user.id).single();
  const { data: seriesHoy } = await supabase.from('series').select('ejercicio_id, kg, reps, ejercicios(nombre)').eq('sesion_id', sesion);
  const comparacion = await Promise.all(
    (seriesHoy ?? []).map(async (s) => {
      const { data: ant } = await supabase
        .from('series')
        .select('kg, reps, sesiones!inner(cliente_id, id)')
        .eq('ejercicio_id', s.ejercicio_id)
        .eq('sesiones.cliente_id', user.id)
        .neq('sesion_id', sesion)
        .order('creado_en', { ascending: false })
        .limit(1)
        .maybeSingle();
      return {
        nombre: (s.ejercicios as { nombre?: string } | null)?.nombre ?? '',
        hoy: `${s.kg ?? '—'} × ${s.reps ?? '—'}`,
        antes: ant ? `${ant.kg ?? '—'} × ${ant.reps ?? '—'}` : 'sin registro previo',
      };
    }),
  );
  const unicos = Array.from(new Map(comparacion.map((c) => [c.nombre, c])).values());
  return <CierreForma sesionId={sesion} esCoaching={perfil?.plan === 'coaching'} comparacion={unicos} />;
}
