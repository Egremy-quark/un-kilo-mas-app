'use client';

import { useState } from 'react';
import { crearClienteNavegador } from '@/lib/supabase/client';

interface Serie {
  id: string;
  kg: number | null;
  reps: number | null;
  nombre: string;
}

interface Ses {
  id: string;
  fecha: string;
  series: Serie[];
}

export function HistorialLista({ inicial }: { inicial: Ses[] }) {
  const [lista, setLista] = useState(inicial);
  const supabase = crearClienteNavegador();

  async function borrar(id: string, sesionId: string) {
    await supabase.from('series').delete().eq('id', id);
    setLista((ls) => ls.map((s) => (s.id === sesionId ? { ...s, series: s.series.filter((x) => x.id !== id) } : s)));
  }

  async function corregir(id: string, kg: number, reps: number) {
    await supabase.from('series').update({ kg, reps }).eq('id', id);
  }

  return (
    <>
      <h1 className="h" style={{ fontSize: 42 }}>
        Tu <em>historial</em>
      </h1>
      {lista.length === 0 ? <p className="muted">Todavía no hay sesiones registradas.</p> : null}
      {lista.map((s) => (
        <div key={s.id} className="card">
          <b>{s.fecha}</b>
          {s.series.map((se) => (
            <p key={se.id}>
              {se.nombre}: {se.kg} × {se.reps}{' '}
              <button type="button" onClick={() => void borrar(se.id, s.id)}>
                Borrar
              </button>
              <button
                type="button"
                onClick={() => {
                  const kg = Number(prompt('Kilos', String(se.kg ?? '')) ?? se.kg);
                  const reps = Number(prompt('Reps', String(se.reps ?? '')) ?? se.reps);
                  if (Number.isFinite(kg) && Number.isFinite(reps)) void corregir(se.id, kg, reps);
                }}
              >
                Corregir
              </button>
            </p>
          ))}
        </div>
      ))}
    </>
  );
}
