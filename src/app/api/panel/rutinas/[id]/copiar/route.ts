import { z } from 'zod';
import { exigirEntrenador, jsonError, jsonOk } from '@/lib/api';

const Cuerpo = z.object({
  cliente_id: z.string().uuid().nullable().optional(),
  es_plantilla: z.boolean().optional(),
  nombre: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await exigirEntrenador();
  if ('error' in auth) return auth.error;
  const { id } = await params;
  let bruto: unknown = {};
  try {
    bruto = await request.json();
  } catch {
    bruto = {};
  }
  const parsed = Cuerpo.safeParse(bruto);
  if (!parsed.success) return jsonError('Revisa los datos.');
  const esPlantilla = parsed.data.es_plantilla ?? !parsed.data.cliente_id;
  const nombreCopia = parsed.data.nombre?.trim();
  if (esPlantilla && nombreCopia) {
    const { data: repetida } = await auth.admin
      .from('rutinas')
      .select('id')
      .eq('es_plantilla', true)
      .is('cliente_id', null)
      .ilike('nombre', nombreCopia)
      .limit(1);
    if (repetida?.length) return jsonError('Ya existe una plantilla con ese nombre');
  }
  const { data, error } = await auth.admin.rpc('copiar_rutina', {
    p_origen: id,
    p_cliente_id: parsed.data.cliente_id ?? null,
    p_es_plantilla: esPlantilla,
    p_estado: 'borrador',
    p_creada_por: auth.user.id,
  });
  if (error) return jsonError(error.message);
  if (parsed.data.nombre && data) {
    await auth.admin.from('rutinas').update({ nombre: parsed.data.nombre }).eq('id', data);
  }
  return jsonOk({ id: data });
}
