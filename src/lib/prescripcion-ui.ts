export interface PartesPrescripcion {
  principal: string;
  detalle: string | null;
}

export function partesPrescripcion(p: {
  texto?: string | null;
  series?: string | null;
  reps?: string | null;
  pct?: number | null;
  rm?: number | null;
  omitir?: boolean;
} | null | undefined): PartesPrescripcion | null {
  if (!p || p.omitir) return null;
  const series = p.series?.trim() || '';
  const reps = p.reps?.trim() || '';
  let principal = series && reps ? `${series} × ${reps}` : '';
  let detalle: string | null = null;
  if (p.pct != null && Number.isFinite(p.pct)) {
    const pct = p.pct <= 1 ? Math.round(p.pct * 1000) / 10 : p.pct;
    detalle = `${pct} % 1RM`;
  } else if (p.rm != null && Number.isFinite(p.rm)) {
    detalle = `${p.rm} RM`;
  }

  if (!principal && p.texto?.trim()) {
    const crudo = p.texto.replace(/@/g, ' ').replace(/\s+/g, ' ').trim();
    const m = crudo.match(/^(\d+)\s*[×x]\s*([^\s]+)?\s*(?:(\d+(?:\.\d+)?)\s*%|(?:(\d+)\s*RM))?/i);
    if (m) {
      principal = [m[1], m[2]].filter(Boolean).join(' × ');
      if (!detalle && m[3]) detalle = `${m[3]} % 1RM`;
      if (!detalle && m[4]) detalle = `${m[4]} RM`;
    } else {
      principal = crudo.replace(/@/g, ' ').replace(/\s+/g, ' ').trim();
    }
  } else if (!principal) {
    principal = [series, reps].filter(Boolean).join(' × ');
  }

  if (!principal && !detalle) return null;
  return { principal, detalle };
}
