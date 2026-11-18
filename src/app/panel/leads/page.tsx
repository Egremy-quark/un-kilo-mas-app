import { crearClienteServidor } from '@/lib/supabase/server';
import { DescargarExcel } from '@/components/DescargarExcel';

export default async function CorreosLanding() {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from('leads').select('id, correo, origen, creado_en').order('creado_en', { ascending: false });

  return (
    <>
      <div className="acciones-cabeza">
        <h1 className="h titulo-panel" style={{ fontSize: 60 }}>
          Correos de la <em>landing</em>
        </h1>
        <DescargarExcel href="/api/panel/exportar?tipo=leads">Exportar a Excel</DescargarExcel>
      </div>
      {error ? (
        <div className="card">
          <p className="error">No pudimos cargar los correos. Recarga o intenta más tarde.</p>
          <p className="muted">{error.message}</p>
        </div>
      ) : (data ?? []).length === 0 ? (
        <div className="card estado-vacio">
          <p>Todavía no hay correos de la landing. Cuando alguien deje el suyo, aparece aquí.</p>
        </div>
      ) : (
        <div className="card tabla-o-tarjetas" style={{ padding: 0 }}>
          <table className="tabla solo-escritorio">
            <thead>
              <tr>
                <th>Correo</th>
                <th>Origen</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((l) => (
                <tr key={l.id as string}>
                  <td>{l.correo as string}</td>
                  <td>{(l.origen as string) || 'landing'}</td>
                  <td>{String(l.creado_en).slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="tarjetas-movil">
            {(data ?? []).map((l) => (
              <article key={l.id as string} className="tarjeta-fila">
                <h2>{l.correo as string}</h2>
                <dl>
                  <div>
                    <dt>Origen</dt>
                    <dd>{(l.origen as string) || 'landing'}</dd>
                  </div>
                  <div>
                    <dt>Fecha</dt>
                    <dd>{String(l.creado_en).slice(0, 10)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
