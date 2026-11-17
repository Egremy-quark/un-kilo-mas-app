'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LoaderPagina } from './LoaderPagina';

function esNavegacionInterna(a: HTMLAnchorElement, evento: MouseEvent) {
  if (evento.defaultPrevented) return false;
  if (evento.button !== 0) return false;
  if (evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return false;
  if (a.target && a.target !== '_self') return false;
  if (a.hasAttribute('download')) return false;
  const href = a.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  if (url.pathname === window.location.pathname && url.search === window.location.search) return false;
  return true;
}

export function BarraNavegacion() {
  const path = usePathname();
  const [activo, setActivo] = useState(false);
  const espera = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(espera.current);
    setActivo(false);
  }, [path]);

  useEffect(() => {
    function onClick(evento: MouseEvent) {
      const a = (evento.target as HTMLElement | null)?.closest('a');
      if (!a || !esNavegacionInterna(a, evento)) return;
      window.clearTimeout(espera.current);
      espera.current = window.setTimeout(() => setActivo(true), 40);
    }
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.clearTimeout(espera.current);
    };
  }, []);

  if (!activo) return null;
  return (
    <>
      <div className="barra-carga" role="progressbar" aria-label="Cargando página" />
      <div className="capa-carga" role="status" aria-live="polite">
        <LoaderPagina />
      </div>
    </>
  );
}
