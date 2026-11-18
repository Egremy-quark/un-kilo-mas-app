'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BotonPendiente } from '@/components/BotonPendiente';
import { Globo } from '@/components/Globo';
import { Icono } from '@/components/Iconos';

export function PublicarFase({ programaId, orden }: { programaId: string; orden: number }) {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  const [cargando, setCargando] = useState(false);
  return (
    <>
      <Globo texto="Publicar fase">
      <BotonPendiente
        type="button"
        className="btn-accion"
        title="Publicar fase"
        aria-label="Publicar fase"
        cargando={cargando}
        etiquetaCargando="…"
        onClick={async () => {
          setCargando(true);
          setMsg('');
          try {
            const r = await fetch(`/api/panel/programas/${programaId}/fases/${orden}/publicar`, { method: 'POST' });
            const j = await r.json();
            if (!j.ok) setMsg(j.mensaje ?? 'No se pudo publicar.');
            else router.refresh();
          } catch {
            setMsg('No se pudo publicar.');
          } finally {
            setCargando(false);
          }
        }}
      >
        <Icono nombre="publicar" />
      </BotonPendiente>
      </Globo>
      {msg ? <span className="error">{msg}</span> : null}
    </>
  );
}
