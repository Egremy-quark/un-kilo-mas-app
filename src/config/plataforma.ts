export const plataforma = {
  marca: 'Un Kilo Más',
  planes: {
    prueba: {
      clave: 'prueba' as const,
      nombre: 'Prueba gratis',
      precio: 0,
      descripcion: 'Rutina 01 «Base articular» y Rutina 02 «Aprender a moverse».',
    },
    ruta_mensual: {
      clave: 'ruta_mensual' as const,
      nombre: 'Ruta +1 mensual',
      precio: 200,
      descripcion: 'El programa Ruta +1 completo, a tu ritmo, sin entrenador.',
    },
    ruta_completa: {
      clave: 'ruta_completa' as const,
      nombre: 'Ruta +1 completa',
      precio: 1400,
      descripcion: 'Ruta +1, pagado de una vez por todo el programa.',
    },
    coaching: {
      clave: 'coaching' as const,
      nombre: 'Coaching',
      precio: null as number | null,
      descripcion: 'Rutina personalizada armada por Yohan o Alfredo.',
    },
  },
  prueba: { dias: 30 },
  ruta: {
    semanas: 37,
    margenSemanasCompleta: 4,
    clavePrograma: 'ruta-1',
  },
  datosTransferencia: {
    banco: process.env.NEXT_PUBLIC_TRANSFERENCIA_BANCO || process.env.TRANSFERENCIA_BANCO || '[POR DEFINIR]',
    clabe: process.env.NEXT_PUBLIC_TRANSFERENCIA_CLABE || process.env.TRANSFERENCIA_CLABE || '[POR DEFINIR]',
    titular: process.env.NEXT_PUBLIC_TRANSFERENCIA_TITULAR || process.env.TRANSFERENCIA_TITULAR || '[POR DEFINIR]',
  },
  whatsappVentas: process.env.NEXT_PUBLIC_WHATSAPP_VENTAS || process.env.WHATSAPP_VENTAS || '[POR DEFINIR]',
  whatsappPorEntrenador: {
    yohan: process.env.NEXT_PUBLIC_WHATSAPP_YOHAN || process.env.WHATSAPP_YOHAN || '[POR DEFINIR]',
    alfredo: process.env.NEXT_PUBLIC_WHATSAPP_ALFREDO || process.env.WHATSAPP_ALFREDO || '[POR DEFINIR]',
  },
  diasAvisoVencimiento: 5,
  renovacion: { diasGracia: 7 },
  retencion: { activa: false, mesesInactivo: 12, diasAviso: 30 },
  redondeoKg: 2.5,
  semanasPorDefecto: 4,
  zonaHoraria: 'America/Mexico_City',
  smtpConfigurado: process.env.SMTP_CONFIGURADO === 'true',
} as const;

export type ClavePlan = keyof typeof plataforma.planes;
export type PlanPagado = 'ruta_mensual' | 'ruta_completa' | 'coaching';

export const PLANES_PAGADOS: PlanPagado[] = ['ruta_mensual', 'ruta_completa', 'coaching'];

export function esPorDefinir(valor: string | null | undefined): boolean {
  return !valor || valor.includes('[POR DEFINIR]');
}

export function textoPorDefinir(valor: string): string {
  return esPorDefinir(valor) ? '[POR DEFINIR]' : valor;
}
