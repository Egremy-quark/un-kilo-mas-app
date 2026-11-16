import { exigirEntrenador, jsonError, jsonOk } from '@/lib/api';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await exigirEntrenador();
  if ('error' in auth) return auth.error;
  const { id } = await params;
  const { data: rutina } = await auth.admin.from('rutinas').select('*').eq('id', id).maybeSingle();
  if (!rutina) return jsonError('No encontramos esa rutina.');
  const { count } = await auth.admin
    .from('rutina_dias')
    .select('id', { count: 'exact', head: true })
    .eq('rutina_id', id);
  if (!count) return jsonError('Agrega por lo menos un día antes de publicar.');

  const clienteId = rutina.cliente_id as string | null;
  if (clienteId) {
    await auth.admin
      .from('rutinas')
      .update({ estado: 'terminada' })
      .eq('cliente_id', clienteId)
      .eq('estado', 'publicada')
      .neq('id', id);
  }

  const { error } = await auth.admin
    .from('rutinas')
    .update({ estado: 'publicada', fecha_inicio: new Date().toISOString().slice(0, 10) })
    .eq('id', id);
  if (error) return jsonError('No se pudo publicar.');
  return jsonOk();
}
