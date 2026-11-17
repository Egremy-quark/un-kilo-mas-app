import Link from 'next/link';
import { crearClienteServidor } from '@/lib/supabase/server';
import { NuevaPlantilla } from './NuevaPlantilla';
import { etiquetaEnfoque, etiquetaEstadoRutina, etiquetaSemanas } from '@/lib/etiquetas';

export default async function Plantillas() {
  const supabase = await crearClienteServidor();
  const { data: fases } = await supabase.from('programa_fases').select('rutina_id');
  const idsFase = new Set((fases ?? []).map((f) => f.rutina_id as string).filter(Boolean));
  const { data } = await supabase
    .from('rutinas')
    .select('id, nombre, semanas, enfoque, estado')
    .eq('es_plantilla', true)
    .is('cliente_id', null)
    .order('actualizado_en', { ascending: false });
  const plantillas = (data ?? []).filter((r) => !idsFase.has(r.id as string));

  return (
    <>
      <div className="acciones-cabeza">
        <h1 className="h titulo-panel" style={{ fontSize: 60 }}>
          <em>Plantillas</em>
        </h1>
        <NuevaPlantilla />
      </div>
      <p className="muted">Solo plantillas de coaching. Las fases de Ruta +1 y de la prueba viven en esos programas.</p>
      <div className="card tabla-o-tarjetas" style={{ padding: 0 }}>
        {plantillas.length === 0 ? (
          <div className="estado-vacio">
            <p>Todavía no hay plantillas de coaching. Guarda una rutina como plantilla desde el constructor.</p>
          </div>
        ) : (
          <>
            <table className="tabla solo-escritorio">
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
                {plantillas.map((r) => (
                  <tr key={r.id as string}>
                    <td>
                      <b>{r.nombre as string}</b>
                    </td>
                    <td>{etiquetaSemanas(r.semanas as number | null)}</td>
                    <td>{etiquetaEnfoque(r.enfoque as string)}</td>
                    <td>{etiquetaEstadoRutina(r.estado as string)}</td>
                    <td>
                      <Link className="btn2" href={`/panel/rutinas/${r.id}`}>
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="tarjetas-movil">
              {plantillas.map((r) => (
                <article key={r.id as string} className="tarjeta-fila">
                  <h2>{r.nombre as string}</h2>
                  <dl>
                    <div>
                      <dt>Semanas</dt>
                      <dd>{etiquetaSemanas(r.semanas as number | null)}</dd>
                    </div>
                    <div>
                      <dt>Enfoque</dt>
                      <dd>{etiquetaEnfoque(r.enfoque as string)}</dd>
                    </div>
                    <div>
                      <dt>Estado</dt>
                      <dd>{etiquetaEstadoRutina(r.estado as string)}</dd>
                    </div>
                  </dl>
                  <Link className="btn2 btn-ancho" href={`/panel/rutinas/${r.id}`}>
                    Abrir
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
