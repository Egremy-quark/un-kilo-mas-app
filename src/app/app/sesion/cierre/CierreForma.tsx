'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearClienteNavegador } from '@/lib/supabase/client';

export function CierreForma({
  sesionId,
  esCoaching,
  comparacion,
}: {
  sesionId: string;
  esCoaching: boolean;
  comparacion: { nombre: string; hoy: string; antes: string }[];
}) {
  const router = useRouter();
  const [nota, setNota] = useState('');
  const supabase = crearClienteNavegador();

  return (
    <>
      <h1 className="h" style={{ fontSize: 42 }}>
        Sesión <em>cerrada</em>
      </h1>
      {comparacion.map((c) => (
        <div key={c.nombre} className="card">
          <b>{c.nombre}</b>
          <p>Hoy: {c.hoy}</p>
          <p className="muted">La vez anterior: {c.antes}</p>
        </div>
      ))}
      {esCoaching ? (
        <label className="f">
          Nota para el entrenador
          <textarea className="in" value={nota} onChange={(e) => setNota(e.target.value)} />
        </label>
      ) : null}
      <button
        className="btn"
        type="button"
        onClick={async () => {
          await supabase
            .from('sesiones')
            .update({ estado: 'cerrada', hora_fin: new Date().toISOString(), nota_cliente: esCoaching ? nota : null })
            .eq('id', sesionId);
          router.push('/app');
          router.refresh();
        }}
      >
        Listo
      </button>
    </>
  );
}
