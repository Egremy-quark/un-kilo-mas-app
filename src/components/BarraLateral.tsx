'use client';

import { NavPanel } from './NavPanel';
import { CerrarSesion } from './CerrarSesion';
import { BotonIdioma, useIdioma } from './Idioma';
import type { ConteosNav } from './PanelShell';

export function BarraLateral({ nombre, etiqueta, conteos }: { nombre: string; etiqueta: string; conteos?: ConteosNav }) {
  const { t } = useIdioma();
  const inicial = (nombre || 'E').slice(0, 1).toUpperCase();
  return (
    <aside className="barra-lateral" aria-label="Navegación del panel">
      <div className="marca-lateral">
        <div className="marca-palabra">
          <span>UN KILO</span>
          <span className="marca-mas">MÁS</span>
        </div>
        <div className="marca-lateral-sub">{t('panelEntrenador')}</div>
      </div>
      <NavPanel className="nav-lateral" conteos={conteos} />
      <div className="barra-lateral-pie">
        <BotonIdioma />
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
        <CerrarSesion />
      </div>
    </aside>
  );
}
