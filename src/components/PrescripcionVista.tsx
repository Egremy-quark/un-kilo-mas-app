import { partesPrescripcion } from '@/lib/prescripcion-ui';

export function PrescripcionVista({
  texto,
  series,
  reps,
  pct,
  rm,
  omitir,
  vacio,
}: {
  texto?: string | null;
  series?: string | null;
  reps?: string | null;
  pct?: number | null;
  rm?: number | null;
  omitir?: boolean;
  vacio?: string | null;
}) {
  const partes = partesPrescripcion({ texto, series, reps, pct, rm, omitir });
  if (!partes) {
    return vacio ? <span className="muted">{vacio}</span> : null;
  }
  return (
    <span className="pres-vista">
      {partes.principal ? <b>{partes.principal}</b> : null}
      {partes.detalle ? <span className="chip pres-detalle">{partes.detalle}</span> : null}
    </span>
  );
}
