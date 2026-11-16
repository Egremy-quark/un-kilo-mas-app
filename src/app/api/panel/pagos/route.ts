import { z } from 'zod';
import { exigirEntrenador, jsonError, jsonOk } from '@/lib/api';
import { calcularCobertura, montoCoincide, precioEsperado } from '@/lib/planes';
import type { PlanPagado } from '@/config/plataforma';

const Cuerpo = z.object({
  cliente_id: z.string().uuid(),
  plan: z.enum(['ruta_mensual', 'ruta_completa', 'coaching']),
  fecha_transferencia: z.string().min(1),
  monto_mxn: z.number().nullable().optional(),
  folio: z.string().optional(),
  meses: z.number().int().positive().optional(),
  nota: z.string().optional(),
  confirmar_monto: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await exigirEntrenador();
  if ('error' in auth) return auth.error;

  let bruto: unknown;
  try {
    bruto = await request.json();
  } catch {
    return jsonError('No se pudo leer el formulario.');
  }
  const parsed = Cuerpo.safeParse(bruto);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? 'Revisa los datos.');
  const d = parsed.data;
  const plan = d.plan as PlanPagado;

  if (!d.confirmar_monto && !montoCoincide(plan, d.monto_mxn ?? null, d.meses)) {
    const esperado = precioEsperado(plan, d.meses);
    return jsonError(
      esperado == null
        ? 'El precio de coaching está [POR DEFINIR]. Puedes guardar de todos modos.'
        : `El monto no coincide con ${esperado} MXN. Puedes guardar de todos modos.`,
      409,
    );
  }

  const { data: cliente } = await auth.admin.from('perfiles').select('*').eq('id', d.cliente_id).maybeSingle();
  if (!cliente) return jsonError('No encontramos a ese cliente.');

  const { data: ultimo } = await auth.admin
    .from('pagos')
    .select('cubre_hasta')
    .eq('cliente_id', d.cliente_id)
    .order('cubre_hasta', { ascending: false })
    .limit(1)
    .maybeSingle();

  const veniaDePrueba = (cliente as { plan?: string }).plan === 'prueba';
  const { cubreDesde, cubreHasta } = calcularCobertura({
    plan,
    fechaTransferencia: new Date(d.fecha_transferencia),
    meses: d.meses,
    cubreHastaAnterior: ultimo?.cubre_hasta ? new Date(ultimo.cubre_hasta as string) : null,
    veniaDePrueba,
  });

  const { error: errorPago } = await auth.admin.from('pagos').insert({
    cliente_id: d.cliente_id,
    plan,
    fecha_transferencia: d.fecha_transferencia,
    monto_mxn: d.monto_mxn ?? null,
    folio: d.folio ?? null,
    meses: plan === 'ruta_completa' ? null : d.meses ?? 1,
    cubre_desde: cubreDesde.toISOString().slice(0, 10),
    cubre_hasta: cubreHasta.toISOString().slice(0, 10),
    registrado_por: auth.user.id,
    nota: d.nota ?? null,
  });
  if (errorPago) return jsonError('No se pudo guardar el pago.');

  await auth.admin
    .from('perfiles')
    .update({
      plan,
      entrenador_a_cargo_id: plan === 'coaching' ? auth.user.id : null,
    })
    .eq('id', d.cliente_id);

  await auth.admin
    .from('solicitudes_plan')
    .update({ atendida: true })
    .eq('cliente_id', d.cliente_id)
    .eq('atendida', false);

  if (plan === 'ruta_mensual' || plan === 'ruta_completa') {
    const { data: programa } = await auth.admin.from('programas').select('id').eq('clave', 'ruta-1').maybeSingle();
    if (programa?.id) {
      const { data: ins } = await auth.admin
        .from('inscripciones')
        .select('id')
        .eq('cliente_id', d.cliente_id)
        .eq('programa_id', programa.id)
        .maybeSingle();
      if (!ins) {
        await auth.admin.from('inscripciones').insert({
          cliente_id: d.cliente_id,
          programa_id: programa.id,
          fase_orden: 1,
          semana: 1,
          vuelta: 1,
        });
      }
    }
  }

  return jsonOk({ irARutina: plan === 'coaching' });
}
