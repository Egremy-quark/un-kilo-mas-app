import { CabeceraPanel } from './CabeceraPanel';

export function PanelShell({
  nombre,
  etiqueta,
  children,
}: {
  nombre: string;
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel-raiz" style={{ minHeight: '100vh', paddingBottom: 56 }}>
      <CabeceraPanel nombre={nombre} etiqueta={etiqueta} />
      <div className="barra-lima" />
      <div className="wrap panel-cuerpo" style={{ paddingTop: 36, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {children}
      </div>
    </div>
  );
}
