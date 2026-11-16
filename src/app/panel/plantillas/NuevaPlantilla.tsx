'use client';

import { useRouter } from 'next/navigation';

export function NuevaPlantilla() {
  const router = useRouter();
  return (
    <button
      className="btn"
      type="button"
      onClick={async () => {
        const r = await fetch('/api/panel/rutinas/nueva', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ es_plantilla: true, nombre: 'Plantilla nueva' }),
        });
        const j = await r.json();
        if (j.id) router.push(`/panel/rutinas/${j.id}`);
      }}
    >
      + Nueva plantilla
    </button>
  );
}
