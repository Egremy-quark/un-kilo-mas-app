import { exigirEntrenador, jsonError, jsonOk } from '@/lib/api';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string; orden: string }> }) {
  const auth = await exigirEntrenador();
  if ('error' in auth) return auth.error;
  const { id, orden } = await params;
  const { data: fase } = await auth.admin
    .from('programa_fases')
    .select('*')
    .eq('programa_id', id)
    .eq('orden', Number(orden))
    .maybeSingle();
  if (!fase) return jsonError('No encontramos esa fase.');
  const rutinaId = fase.rutina_id as string | null;
  if (!rutinaId) return jsonError('Esta fase no tiene rutina.');

  const { data: dias } = await auth.admin.from('rutina_dias').select('id').eq('rutina_id', rutinaId);
  const diaIds = (dias ?? []).map((d) => d.id as string);
  if (diaIds.length) {
    const { data: ejercicios } = await auth.admin
      .from('rutina_ejercicios')
      .select('revisar')
      .in('dia_id', diaIds);
    if ((ejercicios ?? []).some((e) => e.revisar)) {
      return jsonError('No se puede publicar: hay ejercicios marcados «revisar».');
    }
  }

  await auth.admin.from('programa_fases').update({ publicada: true }).eq('id', fase.id);
  await auth.admin.from('rutinas').update({ estado: 'publicada' }).eq('id', rutinaId);
  return jsonOk();
}
