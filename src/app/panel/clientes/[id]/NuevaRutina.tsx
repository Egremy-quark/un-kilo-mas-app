'use client';

import { useRouter } from 'next/navigation';

export function NuevaRutina({ clienteId }: { clienteId: string }) {
  const router = useRouter();
  return (
    <button
      className="btn"
      type="button"
      onClick={async () => {
        const r = await fetch('/api/panel/rutinas/nueva', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cliente_id: clienteId, nombre: 'Rutina nueva' }),
        });
        const j = await r.json();
        if (j.id) router.push(`/panel/rutinas/${j.id}`);
      }}
    >
      Armar rutina
    </button>
  );
}
