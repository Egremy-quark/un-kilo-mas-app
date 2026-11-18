const MARCA = '[CONTENIDO POR YOHAN]';

export function esPendienteYohan(valor: string | null | undefined): boolean {
  return Boolean(valor?.includes(MARCA));
}

export function esPrescripcionVaga(valor: string | null | undefined): boolean {
  if (!valor?.trim()) return false;
  return /igual que el primero|series libres|al máximo|^\s*bombeo\s*$|descendente/i.test(valor);
}

export function textoCliente(valor: string | null | undefined): string {
  if (!valor || esPendienteYohan(valor) || esPrescripcionVaga(valor)) return '';
  return valor;
}

export function restoTrasMarca(valor: string | null | undefined): string {
  if (!valor) return '';
  return valor.replaceAll(MARCA, '').replace(/\s+/g, ' ').trim();
}

export function prescripcionParaCliente(p: {
  texto?: string | null;
  series?: string | null;
  reps?: string | null;
  pct?: number | null;
  descanso_seg?: number | null;
  omitir?: boolean;
} | null | undefined): {
  texto: string;
  series: string | null;
  reps: string | null;
  pct: number | null;
  descanso_seg: number | null;
  omitir: boolean;
} {
  const textoCrudo = p?.texto ?? '';
  const texto = textoCliente(textoCrudo);
  const vaga = esPendienteYohan(textoCrudo) || esPrescripcionVaga(textoCrudo) || !texto;
  const sinDato = vaga && !(p?.series && p?.reps);
  return {
    texto,
    series: sinDato ? null : (p?.series ?? null),
    reps: sinDato ? null : (p?.reps ?? null),
    pct: sinDato ? null : (p?.pct ?? null),
    descanso_seg: p?.descanso_seg ?? null,
    omitir: Boolean(p?.omitir),
  };
}
