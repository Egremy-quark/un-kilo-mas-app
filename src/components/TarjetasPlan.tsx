'use client';

import { plataforma, type PlanPagado } from '@/config/plataforma';
import { formatearDinero } from '@/lib/formato';

const PLANES: PlanPagado[] = ['ruta_mensual', 'ruta_completa', 'coaching'];

export function TarjetasPlan({
  valor,
  onChange,
}: {
  valor: PlanPagado;
  onChange: (plan: PlanPagado) => void;
}) {
  return (
    <div className="tarjetas-plan">
      {PLANES.map((p) => {
        const activo = valor === p;
        const precio = plataforma.planes[p].precio;
        return (
          <label key={p} className={`tarjeta-plan${activo ? ' activa' : ''}`}>
            <span className="tarjeta-plan-tope">
              <b>{plataforma.planes[p].nombre}</b>
              <input type="radio" name="plan" checked={activo} onChange={() => onChange(p)} aria-label={plataforma.planes[p].nombre} />
            </span>
            <span className="big" style={{ fontSize: 36 }}>
              {precio == null ? <span className="por-definir">[POR DEFINIR]</span> : formatearDinero(precio)}
            </span>
            <span className="muted" style={{ fontSize: 14 }}>
              {plataforma.planes[p].descripcion}
            </span>
          </label>
        );
      })}
    </div>
  );
}
