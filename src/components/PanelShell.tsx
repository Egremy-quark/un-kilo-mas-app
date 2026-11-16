import { Logo } from './Logo';
import { CerrarSesion } from './CerrarSesion';
import { NavPanel } from './NavPanel';

export function PanelShell({
  nombre,
  etiqueta,
  children,
}: {
  nombre: string;
  etiqueta: string;
  children: React.ReactNode;
}) {
  const inicial = (nombre || 'E').slice(0, 1).toUpperCase();
  return (
    <div style={{ minHeight: '100vh', paddingBottom: 56 }}>
      <header style={{ borderBottom: '1px solid var(--linea)', background: 'var(--hueso)' }}>
        <div className="wrap" style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', minHeight: 72 }}>
          <Logo subtitulo="Panel del entrenador" />
          <NavPanel />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--tinta)', color: 'var(--hueso)', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
              {inicial}
            </span>
            <span style={{ fontSize: 15 }}>
              <b>{nombre}</b>
              <br />
              <span className="muted">{etiqueta}</span>
            </span>
            <CerrarSesion />
          </div>
        </div>
      </header>
      <div className="barra-lima" />
      <div className="wrap" style={{ paddingTop: 36, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {children}
      </div>
    </div>
  );
}
