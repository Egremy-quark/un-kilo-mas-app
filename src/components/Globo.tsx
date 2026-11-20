'use client';

import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function Globo({ texto, children }: { texto: string; children: ReactNode }) {
  const [caja, setCaja] = useState<{ left: number; top: number } | null>(null);

  function mostrar(evento: React.SyntheticEvent<HTMLSpanElement>) {
    const r = evento.currentTarget.getBoundingClientRect();
    const ancho = 280;
    const alto = 96;
    const margen = 8;
    const ocupados = [...document.querySelectorAll('.pt-publicadas')].map((el) => el.getBoundingClientRect());
    const choque = (left: number, top: number) => {
      const box = { left, right: left + ancho, top, bottom: top + alto };
      return ocupados.reduce((suma, o) => {
        const w = Math.max(0, Math.min(box.right, o.right) - Math.max(box.left, o.left));
        const h = Math.max(0, Math.min(box.bottom, o.bottom) - Math.max(box.top, o.top));
        return suma + w * h;
      }, 0);
    };
    const opciones = [r.top - alto - 12, r.bottom + 12, r.top].flatMap((top) =>
      [r.left - ancho - 12, Math.min(...ocupados.map((o) => o.left), r.left) - ancho - 12, 16].map((left) => ({ left, top })),
    );
    const valida = opciones.filter(
      (c) => c.left >= margen && c.top >= margen && c.left + ancho <= window.innerWidth - margen && c.top + alto <= window.innerHeight - margen,
    );
    const mejor = (valida.length ? valida : opciones).sort((a, b) => choque(a.left, a.top) - choque(b.left, b.top))[0];
    setCaja(mejor ?? { left: margen, top: margen });
  }

  return (
    <span className="globo-ancla" onMouseEnter={mostrar} onMouseLeave={() => setCaja(null)} onFocus={mostrar} onBlur={() => setCaja(null)}>
      {children}
      {caja && typeof document !== 'undefined'
        ? createPortal(
            <span className="globo globo-abajo" style={{ left: caja.left, top: caja.top }} role="tooltip">
              {texto}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
