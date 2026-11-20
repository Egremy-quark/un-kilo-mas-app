import { z } from 'zod';
import { exigirEntrenador, jsonError, jsonOk } from '@/lib/api';
import { plataforma } from '@/config/plataforma';

const Cuerpo = z.object({
  cliente_id: z.string().uuid().nullable().optional(),
  es_plantilla: z.boolean().optional(),
  nombre: z.string().optional(),
  fase_plantilla_id: z.string().uuid().nullable().optional(),
});

export async function POST(request: Request) {
  const auth = await exigirEntrenador();
  if ('error' in auth) return auth.error;
  let bruto: unknown = {};
  try {
    bruto = await request.json();
  } catch {
    bruto = {};
  }
  const parsed = Cuerpo.safeParse(bruto);
  if (!parsed.success) return jsonError('Revisa los datos.');
  const nombre = (parsed.data.nombre ?? 'Rutina nueva').trim();
  if (parsed.data.es_plantilla) {
    const { data: repetida } = await auth.admin
      .from('rutinas')
      .select('id')
      .eq('es_plantilla', true)
      .is('cliente_id', null)
      .ilike('nombre', nombre)
      .limit(1);
    if (repetida?.length) return jsonError('Ya existe una plantilla con ese nombre');
  }
  const { data, error } = await auth.admin
    .from('rutinas')
    .insert({
      cliente_id: parsed.data.cliente_id ?? null,
      es_plantilla: parsed.data.es_plantilla ?? false,
      nombre,
      enfoque: 'fuerza',
      semanas: plataforma.semanasPorDefecto,
      estado: 'borrador',
      creada_por: auth.user.id,
      fase_plantilla_id: parsed.data.es_plantilla ? (parsed.data.fase_plantilla_id ?? null) : null,
    })
    .select('id')
    .single();
  if (error || !data) return jsonError(error?.message ?? 'No se pudo crear la rutina.');
  await auth.admin.from('rutina_dias').insert({ rutina_id: data.id, letra: 'A', orden: 0, foco: '' });
  return jsonOk({ id: data.id });
}
