import { esPorDefinir } from '@/config/plataforma';

export function urlWhatsApp(numero: string, texto: string): string | null {
  if (esPorDefinir(numero)) return null;
  const limpio = numero.replace(/\D/g, '');
  if (!limpio) return null;
  return `https://wa.me/${limpio}?text=${encodeURIComponent(texto)}`;
}

export function mensajeComprobante(nombre: string, plan: string): string {
  return `Hola, soy ${nombre || 'cliente'} de Un Kilo Más. Elegí ${plan} y te mando el comprobante de la transferencia.`;
}
