export function alCompletarSemana(semana: number, semanasTotales: number): 'siguiente_semana' | 'siguiente_fase' {
  return semana < semanasTotales ? 'siguiente_semana' : 'siguiente_fase';
}

export function alCompletarFase(faseOrden: number, maxFase: number): 'siguiente_fase' | 'terminado' {
  return faseOrden < maxFase ? 'siguiente_fase' : 'terminado';
}

export function rutina01Abre02(faseOrden: number, semana: number, semanasFase: number, accion: ReturnType<typeof alCompletarSemana>): boolean {
  return faseOrden === 1 && accion === 'siguiente_fase' && semana >= semanasFase;
}
