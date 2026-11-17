'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Logo } from './Logo';
import { NavPanel } from './NavPanel';
import { CerrarSesion } from './CerrarSesion';

export function CabeceraPanel({ nombre, etiqueta }: { nombre: string; etiqueta: string }) {
  const path = usePathname();
  const [abierto, setAbierto] = useState(false);
  const inicial = (nombre || 'E').slice(0, 1).toUpperCase();

  useEffect(() => {
    setAbierto(false);
  }, [path]);

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
        <Logo subtitulo="Panel del entrenador" />
        <NavPanel className="nav-panel-escritorio" />
        <div className="usuario-escritorio">{usuario}</div>
        <CerrarSesion className="salir-escritorio" />
        <button
          type="button"
          className="btn-menu"
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={abierto}
          onClick={() => setAbierto((v) => !v)}
        >
          {abierto ? '✕' : '☰'}
        </button>
      </div>
      {abierto ? (
        <div className="menu-panel-movil wrap">
          <NavPanel className="nav-panel-movil" onNavigate={() => setAbierto(false)} />
          {usuario}
          <CerrarSesion />
        </div>
      ) : null}
    </header>
  );
}
