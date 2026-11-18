'use client';

import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { mostrarCargando, ocultarCargando } from '@/lib/cargando-ui';

export function BotonPendiente({
  cargando = false,
  etiquetaCargando,
  children,
  className = 'btn',
  onClick,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  cargando?: boolean;
  etiquetaCargando?: ReactNode;
}) {
  useEffect(() => {
    if (!cargando) return;
    mostrarCargando();
    return () => ocultarCargando();
  }, [cargando]);

  return (
    <button
      {...rest}
      className={className}
      data-ukm-pendiente="1"
      disabled={rest.disabled || cargando}
      aria-busy={cargando}
      onClick={(e) => {
        if (!cargando) mostrarCargando();
        onClick?.(e);
      }}
    >
      {cargando ? (etiquetaCargando ?? children) : children}
    </button>
  );
}
