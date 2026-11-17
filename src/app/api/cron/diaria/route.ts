import { NextResponse } from 'next/server';
import { cronAutorizado, jsonError } from '@/lib/api';
import { crearClienteAdmin } from '@/lib/supabase/admin';
import { plataforma } from '@/config/plataforma';
import { cuentasAAvisar, cuentasABorrar, type CuentaRetencion } from '@/lib/retencion';
import { hoyUtc, ymdEnZona } from '@/lib/fecha';

export async function GET(request: Request) {
  if (!cronAutorizado(request)) return jsonError('No autorizado.', 401);
  const admin = crearClienteAdmin();
  const { data } = await admin
    .from('perfiles')
    .select('id, rol, plan, ultimo_acceso, aviso_borrado_en')
    .eq('rol', 'cliente')
    .eq('activo', true);

  const cuentas: CuentaRetencion[] = (data ?? []).map((p) => ({
    id: p.id as string,
    ultimo_acceso: (p.ultimo_acceso as string | null) ?? null,
    aviso_borrado_en: (p.aviso_borrado_en as string | null) ?? null,
    plan: p.plan as string,
  }));

  const cfg = {
    activa: plataforma.retencion.activa,
    mesesInactivo: plataforma.retencion.mesesInactivo,
    diasAviso: plataforma.retencion.diasAviso,
    smtp: plataforma.smtpConfigurado,
  };
  const hoy = hoyUtc();
  const avisar = cuentasAAvisar(cuentas, cfg, hoy);
  const borrar = cuentasABorrar(cuentas, cfg, hoy);

  if (cfg.activa && cfg.smtp) {
    const hoyIso = ymdEnZona();
    for (const c of avisar) {
      await admin.from('perfiles').update({ aviso_borrado_en: hoyIso }).eq('id', c.id);
    }
    for (const c of borrar) {
      await admin.auth.admin.deleteUser(c.id);
    }
  }

  return NextResponse.json({
    ok: true,
    habriaAvisado: avisar.length,
    habriaBorrado: borrar.length,
    borro: cfg.activa && cfg.smtp ? borrar.length : 0,
  });
}
