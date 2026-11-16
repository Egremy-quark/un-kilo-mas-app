/** Convierte textos como `1'30"`, `2'00"` o `2:30` a segundos. */
export function descansoASegundos(texto: string | null | undefined): number | null {
  if (!texto) return null;
  const limpio = texto.trim();
  const minutoSegundo = limpio.match(/^(\d+)['′](\d{1,2})["″]?$/);
  if (minutoSegundo) {
    return Number(minutoSegundo[1]) * 60 + Number(minutoSegundo[2]);
  }
  const dosPuntos = limpio.match(/^(\d+):(\d{1,2})$/);
  if (dosPuntos) {
    return Number(dosPuntos[1]) * 60 + Number(dosPuntos[2]);
  }
  const soloSegundos = limpio.match(/^(\d+)\s*s$/i);
  if (soloSegundos) return Number(soloSegundos[1]);
  const soloMinutos = limpio.match(/^(\d+)\s*min/i);
  if (soloMinutos) return Number(soloMinutos[1]) * 60;
  if (/^\d+$/.test(limpio)) return Number(limpio);
  return null;
}

export function segundosATexto(segundos: number | null | undefined): string {
  if (segundos == null) return '';
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
