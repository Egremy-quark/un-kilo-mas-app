export interface CuentaRetencion {
  id: string;
  ultimo_acceso: string | null;
  aviso_borrado_en: string | null;
  plan: string;
}

export interface CfgRetencion {
  activa: boolean;
  mesesInactivo: number;
  diasAviso: number;
  smtp: boolean;
}

function mesesAntes(hoy: Date, meses: number): Date {
  const d = new Date(hoy);
  d.setUTCMonth(d.getUTCMonth() - meses);
  return d;
}

function sinPlanActivo(plan: string): boolean {
  return plan === 'prueba' || plan === 'sin_plan' || plan === '';
}

export function cuentasAAvisar(cuentas: CuentaRetencion[], cfg: CfgRetencion, hoy: Date): CuentaRetencion[] {
  if (!cfg.activa) return [];
  const limite = mesesAntes(hoy, cfg.mesesInactivo);
  return cuentas.filter((c) => {
    if (!sinPlanActivo(c.plan)) return false;
    if (c.aviso_borrado_en) return false;
    const ultimo = c.ultimo_acceso ? new Date(c.ultimo_acceso) : new Date(0);
    return ultimo < limite;
  });
}

export function cuentasABorrar(cuentas: CuentaRetencion[], cfg: CfgRetencion, hoy: Date): CuentaRetencion[] {
  if (!cfg.activa || !cfg.smtp) return [];
  const limiteAviso = new Date(hoy);
  limiteAviso.setUTCDate(limiteAviso.getUTCDate() - cfg.diasAviso);
  return cuentas.filter((c) => {
    if (!sinPlanActivo(c.plan)) return false;
    if (!c.aviso_borrado_en) return false;
    return new Date(c.aviso_borrado_en) <= limiteAviso;
  });
}
