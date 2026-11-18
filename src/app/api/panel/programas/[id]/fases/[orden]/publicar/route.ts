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

  await auth.admin.from('programa_fases').update({ publicada: true }).eq('id', fase.id);
  await auth.admin.from('rutinas').update({ estado: 'publicada' }).eq('id', rutinaId);
  return jsonOk();
}
