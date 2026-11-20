'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function Desplegable({
  valor,
  alCambiar,
  opciones,
  etiqueta,
}: {
  valor: string;
  alCambiar: (valor: string) => void;
  opciones: { valor: string; etiqueta: string }[];
  etiqueta: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [caja, setCaja] = useState<{ top: number; left: number; width: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const listaId = useId();
  const actual = opciones.find((o) => o.valor === valor)?.etiqueta ?? '—';

  function abrir() {
    const r = ref.current?.getBoundingClientRect();
    if (r) setCaja({ top: r.bottom + 4, left: r.left, width: r.width });
    setAbierto((v) => !v);
  }

  useEffect(() => {
    if (!abierto) return;
    function cerrar(evento: MouseEvent) {
      const nodo = evento.target as Node;
      if (ref.current?.contains(nodo)) return;
      if ((nodo as HTMLElement).closest?.('.ukm-select-lista')) return;
      setAbierto(false);
    }
    function tecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setAbierto(false);
    }
    document.addEventListener('mousedown', cerrar);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', cerrar);
      document.removeEventListener('keydown', tecla);
    };
  }, [abierto]);

  return (
    <div className={`ukm-select${abierto ? ' abierto' : ''}`} ref={ref}>
      <button
        type="button"
        className="ukm-select-boton"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={listaId}
        aria-label={etiqueta}
        onClick={abrir}
      >
        <span>{actual}</span>
        <span className="pt-chevron" aria-hidden="true" />
      </button>
      {abierto && caja && typeof document !== 'undefined'
        ? createPortal(
            <ul className="ukm-select-lista" id={listaId} role="listbox" style={{ top: caja.top, left: caja.left, width: caja.width }}>
              {opciones.map((o) => (
                <li key={o.valor || 'vacio'}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={o.valor === valor}
                    className={o.valor === valor ? 'activa' : undefined}
                    onClick={() => {
                      alCambiar(o.valor);
                      setAbierto(false);
                    }}
                  >
                    {o.etiqueta}
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
