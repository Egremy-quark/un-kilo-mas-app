export function normalizarNombre(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function tipoAlternativa(texto: string): 'sin_equipo' | 'equivalente' | 'maquina' {
  const n = normalizarNombre(texto);
  if (n.includes('sin equipo')) return 'sin_equipo';
  if (n.includes('maquina')) return 'maquina';
  return 'equivalente';
}

export function letrasDias(cantidad: number): string[] {
  return Array.from({ length: cantidad }, (_, i) => String.fromCharCode(65 + i));
}
