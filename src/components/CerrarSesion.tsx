'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { BotonPendiente } from './BotonPendiente';
import { Icono } from './Iconos';

export function CerrarSesion({ className }: { className?: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  return (
    <span className={className} style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      <BotonPendiente
        type="button"
        className="btn-salir"
        cargando={cargando}
        aria-label="Salir"
        onClick={async () => {
          setCargando(true);
          setError('');
          const { error: fallo } = await crearClienteNavegador().auth.signOut();
          if (fallo) {
            setError('No se pudo salir.');
            setCargando(false);
            return;
          }
          router.replace('/entrar');
          router.refresh();
        }}
      >
        <Icono nombre="salir" />
      </BotonPendiente>
      {error ? <span className="error">{error}</span> : null}
    </span>
  );
}
