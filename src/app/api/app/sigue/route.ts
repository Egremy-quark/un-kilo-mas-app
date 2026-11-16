import { z } from 'zod';
import { exigirCliente, jsonError, jsonOk } from '@/lib/api';
import { plataforma } from '@/config/plataforma';

const Cuerpo = z.object({
  plan_elegido: z.enum(['ruta_mensual', 'ruta_completa', 'coaching']),
});

export async function POST(request: Request) {
  const auth = await exigirCliente();
  if ('error' in auth) return auth.error;
  let bruto: unknown;
  try {
    bruto = await request.json();
  } catch {
    return jsonError('No se pudo leer la solicitud.');
  }
  const parsed = Cuerpo.safeParse(bruto);
  if (!parsed.success) return jsonError('Elige un plan.');

  const { error } = await auth.admin.from('solicitudes_plan').insert({
    cliente_id: auth.user.id,
    plan_elegido: parsed.data.plan_elegido,
  });
  if (error) return jsonError('No se pudo guardar tu elección.');

  return jsonOk({
    transferencia: plataforma.datosTransferencia,
    plan: parsed.data.plan_elegido,
  });
}
