'use client';

import { crearClienteNavegador } from '@/lib/supabase/client';
import { useState } from 'react';

export function SugerirRm({ avisos }: { avisos: { ejercicioId: string; nombre: string; estimado: number; actual: number }[] }) {
  const [msg, setMsg] = useState('');
  return (
    <div className="card">
      <div className="lbl">¿Actualizamos tu 1RM?</div>
      {avisos.map((a) => (
        <p key={a.ejercicioId}>
          {a.nombre}: tu referencia es {a.actual} kg y la mejor serie estima {a.estimado} kg.{' '}
          <button
            type="button"
            className="btn2"
            style={{ minHeight: 40 }}
            onClick={async () => {
              const supabase = crearClienteNavegador();
              const { data } = await supabase.auth.getUser();
              await supabase.from('rm_referencia').upsert(
                {
                  cliente_id: data.user?.id,
                  ejercicio_id: a.ejercicioId,
                  kg: a.estimado,
                  origen: 'cliente',
                  actualizado_por: data.user?.id,
                },
                { onConflict: 'cliente_id,ejercicio_id' },
              );
              setMsg('Actualizado. No se cambia solo: tú lo decidiste.');
            }}
          >
            Actualizar
          </button>
        </p>
      ))}
      {msg ? <p>{msg}</p> : null}
    </div>
  );
}
