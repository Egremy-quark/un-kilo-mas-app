import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { HistorialLista } from './HistorialLista';

export default async function Historial() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');
  const { data: sesiones } = await supabase.from('sesiones').select('id, fecha').eq('cliente_id', user.id).order('fecha', { ascending: false });
  const ids = (sesiones ?? []).map((s) => s.id as string);
  const { data: series } = ids.length ? await supabase.from('series').select('id, sesion_id, kg, reps, ejercicios(nombre)').in('sesion_id', ids) : { data: [] };
  const inicial = (sesiones ?? []).map((s) => ({
    id: s.id as string,
    fecha: s.fecha as string,
    series: (series ?? [])
      .filter((x) => x.sesion_id === s.id)
      .map((x) => ({
        id: x.id as string,
        kg: x.kg as number | null,
        reps: x.reps as number | null,
        nombre: (x.ejercicios as { nombre?: string } | null)?.nombre ?? '',
      })),
  }));
  return <HistorialLista inicial={inicial} />;
}
