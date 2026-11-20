'use client';

import Link from 'next/link';

export default function ErrorEditor({ error }: { error: Error & { digest?: string } }) {
  return (
    <div className="card" role="alert">
      <h1 className="h" style={{ fontSize: 40 }}>
        No se pudo abrir el editor
      </h1>
      <p>{error.message || 'Error desconocido al abrir esta rutina.'}</p>
      <Link className="btn2" href="/panel/plantillas">
        Volver a Plantillas
      </Link>
    </div>
  );
}
