import Link from 'next/link';
import { crearClienteServidor } from '@/lib/supabase/server';
import { NuevaPlantilla } from './NuevaPlantilla';

export default async function Plantillas() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from('rutinas').select('id, nombre, semanas, enfoque, estado').eq('es_plantilla', true).order('actualizado_en', { ascending: false });
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h1 className="h" style={{ fontSize: 60 }}>
          <em>Plantillas</em>
        </h1>
        <NuevaPlantilla />
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Semanas</th>
              <th>Enfoque</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((r) => (
              <tr key={r.id as string}>
                <td>
                  <b>{r.nombre as string}</b>
                </td>
                <td>{r.semanas as number}</td>
                <td>{r.enfoque as string}</td>
                <td>{r.estado as string}</td>
                <td>
                  <Link href={`/panel/rutinas/${r.id}`}>Abrir</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
