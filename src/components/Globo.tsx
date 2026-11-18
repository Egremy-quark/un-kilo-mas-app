'use client';

import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function Globo({ texto, children }: { texto: string; children: ReactNode }) {
  const [caja, setCaja] = useState<{ x: number; y: number } | null>(null);

  function mostrar(evento: React.SyntheticEvent<HTMLSpanElement>) {
    const r = evento.currentTarget.getBoundingClientRect();
    setCaja({ x: r.left + r.width / 2, y: r.top });
  }

  return (
    <span className="globo-ancla" onMouseEnter={mostrar} onMouseLeave={() => setCaja(null)} onFocus={mostrar} onBlur={() => setCaja(null)}>
      {children}
      {caja && typeof document !== 'undefined'
        ? createPortal(
            <span className="globo" style={{ left: caja.x, top: caja.y }} role="tooltip">
              {texto}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
