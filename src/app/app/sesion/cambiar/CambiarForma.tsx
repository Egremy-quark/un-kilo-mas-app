'use client';

import { useRouter } from 'next/navigation';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { etiquetaTipoAlternativa } from '@/lib/etiquetas';

export function CambiarForma({
  sesionId,
  rutinaEjercicioId,
  fecha,
  alternativas,
}: {
  sesionId: string;
  rutinaEjercicioId: string;
  fecha: string;
  alternativas: { id: string; nombre: string; tipo: string }[];
}) {
  const router = useRouter();
  const supabase = crearClienteNavegador();

  async function elegir(id: string, alcance: 'hoy' | 'fase') {
    const { data: user } = await supabase.auth.getUser();
    await supabase.from('cambios_cliente').insert({
      cliente_id: user.user?.id,
      rutina_ejercicio_id: rutinaEjercicioId,
      ejercicio_id: id,
      alcance,
      fecha_sesion: alcance === 'hoy' ? fecha : null,
    });
    router.push(`/app/sesion`);
  }

  return (
    <>
      <a href="/app/sesion">← Sesión</a>
      <h1 className="h" style={{ fontSize: 40 }}>
        Cambiar <em>ejercicio</em>
      </h1>
      <p className="muted">Las series y las reps se quedan igual.</p>
      {alternativas.map((a) => (
        <div key={a.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <b>{a.nombre}</b>
          <span className="chip">{etiquetaTipoAlternativa(a.tipo)}</span>
          <button className="btn2" type="button" onClick={() => void elegir(a.id, 'hoy')}>
            Cambiar solo por hoy
          </button>
          <button className="btn" type="button" onClick={() => void elegir(a.id, 'fase')}>
            Cambiar para toda la fase
          </button>
        </div>
      ))}
    </>
  );
}
