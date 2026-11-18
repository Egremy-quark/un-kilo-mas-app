import { CabeceraPanel } from './CabeceraPanel';
import { MigasPanel, MigasProvider } from './MigasPanel';

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
    <MigasProvider>
      <div className="panel-raiz" style={{ minHeight: '100vh', paddingBottom: 56 }}>
        <CabeceraPanel nombre={nombre} etiqueta={etiqueta} />
        <div className="wrap panel-cuerpo" style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <MigasPanel />
          {children}
        </div>
      </div>
    </MigasProvider>
  );
}
