import { z } from 'zod';
import { exigirEntrenador, jsonError, jsonOk } from '@/lib/api';
import { plataforma } from '@/config/plataforma';

const Cuerpo = z.object({
  cliente_id: z.string().uuid().nullable().optional(),
  es_plantilla: z.boolean().optional(),
  nombre: z.string().optional(),
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
  const { data, error } = await auth.admin
    .from('rutinas')
    .insert({
      cliente_id: parsed.data.cliente_id ?? null,
      es_plantilla: parsed.data.es_plantilla ?? false,
      nombre: parsed.data.nombre ?? 'Rutina nueva',
      enfoque: 'fuerza',
      semanas: plataforma.semanasPorDefecto,
      estado: 'borrador',
      creada_por: auth.user.id,
    })
    .select('id')
    .single();
  if (error || !data) return jsonError(error?.message ?? 'No se pudo crear la rutina.');
  await auth.admin.from('rutina_dias').insert({ rutina_id: data.id, letra: 'A', orden: 0, foco: '' });
  return jsonOk({ id: data.id });
}
