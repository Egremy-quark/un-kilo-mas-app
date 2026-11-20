'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { NavPanel } from './NavPanel';
import { CerrarSesion } from './CerrarSesion';
import { Icono } from './Iconos';
import { BotonIdioma, useIdioma } from './Idioma';

export function CabeceraPanel({ nombre, etiqueta }: { nombre: string; etiqueta: string }) {
  const path = usePathname();
  const [abierto, setAbierto] = useState(false);
  const { t } = useIdioma();
  const inicial = (nombre || 'E').slice(0, 1).toUpperCase();

  useEffect(() => {
    setAbierto(false);
  }, [path]);

  useEffect(() => {
    if (!abierto) return;
    const html = document.documentElement;
    const previo = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      html.style.overflow = previo;
    };
  }, [abierto]);

  const usuario = (
    <div className="usuario-panel">
      <span className="usuario-avatar" aria-hidden="true">
        {inicial}
      </span>
      <span className="usuario-datos">
        <b>{nombre}</b>
        <br />
        <span className="muted">{etiqueta}</span>
      </span>
    </div>
  );

  return (
    <header className="cabecera-panel">
      <div className="wrap cabecera-panel-inner">
        <div className="cabecera-panel-top">
          <Logo subtitulo={t('panelEntrenador')} />
          <BotonIdioma />
          <div className="usuario-escritorio" style={{ marginLeft: 'auto' }}>
            {usuario}
          </div>
          <CerrarSesion className="salir-escritorio" />
          <button
            type="button"
            className="btn-menu"
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={abierto}
            onClick={() => setAbierto((v) => !v)}
          >
            {abierto ? <Icono nombre="cerrar" /> : <Icono nombre="menu" />}
          </button>
        </div>
      </div>
      {abierto && typeof document !== 'undefined'
        ? createPortal(
            <>
              <div className="drawer-velo" onClick={() => setAbierto(false)} />
              <aside className="drawer-menu" role="dialog" aria-label="Menú">
                <button type="button" className="drawer-cerrar" aria-label="Cerrar" onClick={() => setAbierto(false)}>
                  <Icono nombre="cerrar" />
                </button>
                <NavPanel className="nav-panel-movil" onNavigate={() => setAbierto(false)} />
                {usuario}
                <CerrarSesion />
              </aside>
            </>,
            document.body,
          )
        : null}
    </header>
  );
}
