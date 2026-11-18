'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';

export function CamposEditor({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const contenido = lista.current;
    if (!el || !contenido) return;
    let propio = false;

    const ajustar = () => {
      if (propio) return;
      propio = true;
      el.style.maxHeight = '';
      const pie = el.parentElement?.querySelector(':scope > .editor-pie');
      if (pie instanceof HTMLElement) {
        const borde = Math.min(el.getBoundingClientRect().bottom, pie.getBoundingClientRect().top) - 12;
        const caja = el.getBoundingClientRect();
        let corte: number | null = null;
        for (const n of contenido.children) {
          if (!(n instanceof HTMLElement) || n.getBoundingClientRect().height < 1) continue;
          const r = n.getBoundingClientRect();
          if (r.top < borde && r.bottom > borde + 1) {
            corte = r.top;
            break;
          }
        }
        if (corte != null) {
          el.style.maxHeight = `${Math.max(160, Math.round(corte - caja.top - 8))}px`;
        }
      }
      requestAnimationFrame(() => {
        propio = false;
      });
    };

    ajustar();
    const obs = new ResizeObserver(ajustar);
    obs.observe(contenido);
    window.addEventListener('resize', ajustar);
    return () => {
      obs.disconnect();
      window.removeEventListener('resize', ajustar);
    };
  }, []);

  return (
    <div ref={ref} className="editor-campos">
      <div ref={lista} className="editor-campos-lista">
        {children}
      </div>
    </div>
  );
}
