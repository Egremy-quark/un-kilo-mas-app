'use client';

import { useState, type ReactNode } from 'react';
import { BotonPendiente } from './BotonPendiente';

export function DescargarExcel({
  href,
  children,
  className = 'btn2',
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function bajar() {
    setCargando(true);
    setError('');
    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error('No se pudo descargar el archivo.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const cd = res.headers.get('Content-Disposition');
      a.href = url;
      a.download = cd?.match(/filename="([^"]+)"/)?.[1] ?? 'export.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo descargar el archivo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      <BotonPendiente type="button" className={className} cargando={cargando} etiquetaCargando="Descargando…" onClick={() => void bajar()}>
        {children}
      </BotonPendiente>
      {error ? <span className="error">{error}</span> : null}
    </span>
  );
}
