const ESPACIO_FINO = '\u202F';

/** Miles con espacio fino. Decimales con punto: 2 450, 1.6, 112.5 */
export function formatearNumero(valor: number): string {
  if (!Number.isFinite(valor)) return '';
  const negativo = valor < 0;
  const absoluto = Math.abs(valor);
  const plano = Number(absoluto.toFixed(10)).toString();
  const [entero = '0', decimal] = plano.split('.');
  const conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ESPACIO_FINO);
  const cuerpo = decimal ? `${conMiles}.${decimal}` : conMiles;
  return negativo ? `-${cuerpo}` : cuerpo;
}

export function redondearAlPaso(valor: number, paso: number): number {
  const escalado = Number((valor / paso).toFixed(8));
  const pasos = Math.round(escalado);
  const decimales = (paso.toString().split('.')[1] ?? '').length;
  return Number((pasos * paso).toFixed(decimales));
}

export function leerDecimal(texto: string): number | null {
  const limpio = texto.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(limpio)) return null;
  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : null;
}

export function leerEntero(texto: string): number | null {
  const limpio = texto.trim();
  if (!/^\d+$/.test(limpio)) return null;
  return Number(limpio);
}
