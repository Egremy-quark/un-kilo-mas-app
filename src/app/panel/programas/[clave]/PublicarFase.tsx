'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function PublicarFase({ programaId, orden }: { programaId: string; orden: number }) {
  const router = useRouter();
  const [msg, setMsg] = useState('');
  return (
    <>
      <button
        type="button"
        className="btn"
        style={{ minHeight: 40, padding: '0 12px', fontSize: 14 }}
        onClick={async () => {
          const r = await fetch(`/api/panel/programas/${programaId}/fases/${orden}/publicar`, { method: 'POST' });
          const j = await r.json();
          if (!j.ok) setMsg(j.mensaje);
          else router.refresh();
        }}
      >
        Publicar fase
      </button>
      {msg ? <span className="error">{msg}</span> : null}
    </>
  );
}
