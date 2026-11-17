import { z } from 'zod';
import { exigirEntrenador, jsonError, jsonOk } from '@/lib/api';
import { urlCallback } from '@/lib/urls';
import { calcularCobertura, montoCoincide, precioEsperado } from '@/lib/planes';
import type { PlanPagado } from '@/config/plataforma';

const Cuerpo = z.object({
  nombre: z.string().min(1, 'Escribe el nombre.'),
  correo: z.string().email('Escribe un correo válido.'),
  whatsapp: z.string().optional(),
  plan: z.enum(['ruta_mensual', 'ruta_completa', 'coaching']),
  fecha_transferencia: z.string().min(1, 'Pon la fecha de la transferencia.'),
  monto_mxn: z.number().nullable().optional(),
  folio: z.string().optional(),
  meses: z.number().int().positive().optional(),
  nota: z.string().optional(),
  entrenador_a_cargo_id: z.string().uuid().nullable().optional(),
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
  if (plan === 'coaching' && !d.entrenador_a_cargo_id) {
    return jsonError('Elige el entrenador a cargo.');
  }

  if (!d.confirmar_monto && !montoCoincide(plan, d.monto_mxn ?? null, d.meses)) {
    const esperado = precioEsperado(plan, d.meses);
    return jsonError(
      esperado == null
        ? 'El precio de coaching está [POR DEFINIR]. Puedes guardar de todos modos.'
        : `El monto no coincide con ${esperado} MXN. Puedes guardar de todos modos.`,
      409,
    );
  }

  const { cubreDesde, cubreHasta } = calcularCobertura({
    plan,
    fechaTransferencia: new Date(d.fecha_transferencia),
    meses: d.meses,
    veniaDePrueba: true,
  });

  const invitacion = await auth.admin.auth.admin.inviteUserByEmail(d.correo, {
    redirectTo: urlCallback('/crear-contrasena'),
    data: { nombre: d.nombre, origen: 'alta_manual' },
  });

  let userId = invitacion.data.user?.id;
  if (invitacion.error || !userId) {
    const { data: lista } = await auth.admin.auth.admin.listUsers({ perPage: 1000 });
    const existente = lista.users.find((u) => u.email?.toLowerCase() === d.correo.toLowerCase());
    if (!existente) return jsonError(invitacion.error?.message ?? 'No se pudo crear la cuenta.');
    userId = existente.id;
  }

  const { error: errorPerfil } = await auth.admin.from('perfiles').upsert({
    id: userId,
    rol: 'cliente',
    nombre: d.nombre,
    correo: d.correo,
    whatsapp: d.whatsapp ?? null,
    plan,
    origen: 'alta_manual',
    entrenador_a_cargo_id: plan === 'coaching' ? d.entrenador_a_cargo_id ?? null : null,
    prueba_inicio: null,
    activo: true,
  });
  if (errorPerfil) {
    return jsonError('Se creó el correo pero no el perfil. Revisa e inténtalo de nuevo.');
  }

  const { error: errorPago } = await auth.admin.from('pagos').insert({
    cliente_id: userId,
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
  if (errorPago) return jsonError('No se pudo registrar el pago. El cliente quedó creado.');

  if (plan === 'ruta_mensual' || plan === 'ruta_completa') {
    const { data: programa } = await auth.admin.from('programas').select('id').eq('clave', 'ruta-1').maybeSingle();
    if (programa?.id) {
      await auth.admin.from('inscripciones').upsert({
        cliente_id: userId,
        programa_id: programa.id,
        fase_orden: 1,
        semana: 1,
        vuelta: 1,
        iniciada: false,
        terminada: false,
      });
    }
  }

  return jsonOk({ id: userId, irARutina: plan === 'coaching' });
}
