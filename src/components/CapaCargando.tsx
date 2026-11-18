'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { mostrarCargando, ocultarCargando } from '@/lib/cargando-ui';

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
  if (url.pathname.startsWith('/api/')) return false;
  if (url.pathname === window.location.pathname && url.search === window.location.search) return false;
  return true;
}

export function CapaCargando() {
  const path = usePathname();
  const [activo, setActivo] = useState(false);
  const corte = useRef<number | undefined>(undefined);

  useEffect(() => {
    ocultarCargando();
  }, [path]);

  useEffect(() => {
    function onCargando(evento: Event) {
      const on = Boolean((evento as CustomEvent<boolean>).detail);
      window.clearTimeout(corte.current);
      setActivo(on);
      if (on) {
        document.documentElement.dataset.cargando = '1';
        corte.current = window.setTimeout(() => ocultarCargando(), 12000);
      }
    }
    function onClick(evento: MouseEvent) {
      const t = evento.target as HTMLElement | null;
      if (t?.closest('[data-chato]')) return;
      const a = t?.closest('a');
      if (a && esNavegacionInterna(a, evento)) {
        mostrarCargando();
        return;
      }
      const boton = t?.closest('button');
      if (!boton || boton.disabled) return;
      if (boton.getAttribute('data-chato-cerrar') != null) return;
      const tipo = boton.getAttribute('type');
      const enForma = Boolean(boton.closest('form'));
      const esSubmit = tipo === 'submit' || (enForma && tipo !== 'button' && tipo !== 'reset');
      const esAccion = boton.classList.contains('btn') || boton.classList.contains('btn2') || boton.classList.contains('pestana-dia');
      if (!esSubmit && !esAccion && boton.getAttribute('data-ukm-pendiente') == null) return;
      mostrarCargando();
      if (esSubmit || boton.getAttribute('data-ukm-pendiente') != null) return;
      ocultarCargando();
    }
    window.addEventListener('ukm-cargando', onCargando);
    document.addEventListener('click', onClick, true);
    return () => {
      window.removeEventListener('ukm-cargando', onCargando);
      document.removeEventListener('click', onClick, true);
      window.clearTimeout(corte.current);
    };
  }, []);

  return (
    <div
      className={`capa-cargando capa-cargando-global${activo ? ' is-on' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="cargando"
      aria-hidden={!activo}
    >
      <span className="loader-disco" aria-hidden="true" />
      <span className="h capa-cargando-texto">cargando</span>
    </div>
  );
}

export function LoaderUnico() {
  return (
    <div className="capa-cargando is-on" role="status" aria-live="polite" aria-label="cargando">
      <span className="loader-disco" aria-hidden="true" />
      <span className="h capa-cargando-texto">cargando</span>
    </div>
  );
}

export { ocultarCargando };
