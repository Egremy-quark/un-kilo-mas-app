import { Logo } from './Logo';

export function AuthMarco({
  titulo,
  destacado,
  children,
}: {
  titulo: string;
  destacado?: string;
  children: React.ReactNode;
}) {
  const partes = destacado ? titulo.split(destacado) : [titulo];
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="barra-lima" />
      <div className="wrap" style={{ maxWidth: 480, paddingTop: 48, paddingBottom: 64 }}>
        <Logo />
        <h1 className="h" style={{ fontSize: 48, marginTop: 28 }}>
          {partes[0]}
          {destacado ? <em>{destacado}</em> : null}
          {partes[1] ?? ''}
        </h1>
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
      </div>
    </main>
  );
}
