import Link from 'next/link';
import { Logo } from './Logo';
import { CerrarSesion } from './CerrarSesion';
import { MarcarAcceso } from './MarcarAcceso';

export function AppShell({ nombre, children }: { nombre: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <MarcarAcceso />
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--linea)' }}>
        <Link href="/app" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Logo />
        </Link>
        <nav style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 14, fontWeight: 700 }}>
          <Link href="/app/avance">Avance</Link>
          <Link href="/app/historial">Historial</Link>
          <CerrarSesion />
        </nav>
      </header>
      <div className="barra-lima" />
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {nombre ? <div className="lbl">Hola, {nombre}</div> : null}
        {children}
      </div>
    </div>
  );
}
