import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { CambiarForma } from './CambiarForma';

function uno<T>(valor: T | T[] | null | undefined): T | null {
  if (Array.isArray(valor)) return valor[0] ?? null;
  return valor ?? null;
}

export default async function PaginaCambiar({ searchParams }: { searchParams: Promise<{ sesion?: string; ejercicio?: string }> }) {
  const { sesion, ejercicio } = await searchParams;
  if (!sesion || !ejercicio) redirect('/app/sesion');
  const supabase = await crearClienteServidor();
  const { data: ej } = await supabase.from('rutina_ejercicios').select('ejercicio_id').eq('id', ejercicio).maybeSingle();
  if (!ej) redirect('/app/sesion');
  const { data: ses } = await supabase.from('sesiones').select('fecha').eq('id', sesion).maybeSingle();
  const { data: alts } = await supabase
    .from('ejercicio_alternativas')
    .select('tipo, ejercicios:alternativa_id(id, nombre)')
    .eq('ejercicio_id', ej.ejercicio_id)
    .order('orden');
  return (
    <CambiarForma
      sesionId={sesion}
      rutinaEjercicioId={ejercicio}
      fecha={(ses?.fecha as string) ?? new Date().toISOString().slice(0, 10)}
      alternativas={(alts ?? []).map((a) => {
        const ex = uno(a.ejercicios as { id: string; nombre: string } | { id: string; nombre: string }[] | null);
        return {
          id: ex?.id ?? '',
          nombre: ex?.nombre ?? '',
          tipo: a.tipo as string,
        };
      })}
    />
  );
}
