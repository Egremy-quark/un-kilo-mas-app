'use client';

import { useState } from 'react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function MoverInscripcion({ inscripcionId, fase, semana }: { inscripcionId: string; fase: number; semana: number }) {
  const [f, setF] = useState(fase);
  const [s, setS] = useState(semana);
  const router = useRouter();
  return (
    <form
      className="card"
      style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'end' }}
      onSubmit={async (e) => {
        e.preventDefault();
        await crearClienteNavegador().from('inscripciones').update({ fase_orden: f, semana: s, iniciada: false, rutina_iniciada_id: null }).eq('id', inscripcionId);
        router.refresh();
      }}
    >
      <div className="lbl">Mover de fase o semana</div>
      <label className="f">
        Fase
        <input className="in" type="number" min={1} value={f} onChange={(e) => setF(Number(e.target.value))} />
      </label>
      <label className="f">
        Semana
        <input className="in" type="number" min={1} value={s} onChange={(e) => setS(Number(e.target.value))} />
      </label>
      <button className="btn2" type="submit">
        Guardar
      </button>
    </form>
  );
}
