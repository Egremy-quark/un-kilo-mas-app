import { exigirCliente, jsonError, jsonOk } from '@/lib/api';

export async function POST() {
  const auth = await exigirCliente();
  if ('error' in auth) return auth.error;
  const { data: programa } = await auth.admin.from('programas').select('id').eq('clave', 'ruta-1').maybeSingle();
  if (!programa) return jsonError('No encontramos Ruta +1.');
  const { data: ins } = await auth.admin
    .from('inscripciones')
    .select('*')
    .eq('cliente_id', auth.user.id)
    .eq('programa_id', programa.id)
    .maybeSingle();
  if (!ins) return jsonError('Aún no estás en Ruta +1.');

  const { error } = await auth.admin
    .from('inscripciones')
    .update({
      fase_orden: 1,
      semana: 1,
      vuelta: Number(ins.vuelta ?? 1) + 1,
      iniciada: false,
      terminada: false,
      rutina_iniciada_id: null,
    })
    .eq('id', ins.id);
  if (error) return jsonError('No se pudo empezar la otra vuelta.');
  return jsonOk();
}
