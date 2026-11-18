import { crearClienteServidor } from '@/lib/supabase/server';
import { nombrePlan } from '@/lib/clientes-panel';
import { finDeMes, formatearRangoCorto, mesActual, nombreMes } from '@/lib/fecha';
import { formatearDinero, textoFolio, textoMonto } from '@/lib/formato';
import { DescargarExcel } from '@/components/DescargarExcel';

export default async function PagosDelMes({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { mes: mesParam } = await searchParams;
  const mes = mesParam ?? mesActual();
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from('pagos')
    .select('*, perfiles:cliente_id(nombre, correo), entrenador:registrado_por(nombre)')
    .gte('fecha_transferencia', `${mes}-01`)
    .lte('fecha_transferencia', finDeMes(mes))
    .order('fecha_transferencia', { ascending: false });

  const total = (data ?? []).reduce((s, p) => s + Number(p.monto_mxn ?? 0), 0);
  const porEntrenador = new Map<string, number>();
  for (const p of data ?? []) {
    const n = (p.entrenador as { nombre?: string } | null)?.nombre;
    if (!n) continue;
    porEntrenador.set(n, (porEntrenador.get(n) ?? 0) + 1);
  }
  const hayFolio = true;
  const hayMonto = true;

  return (
    <>
      <div className="acciones-cabeza">
        <h1 className="h titulo-panel" style={{ fontSize: 60 }}>
          Pagos de <em>{nombreMes(mes)}</em>
        </h1>
        <DescargarExcel href={`/api/panel/exportar?tipo=pagos&mes=${mes}`}>Exportar a Excel</DescargarExcel>
      </div>
      <form method="get" style={{ display: 'flex', gap: 12, alignItems: 'end' }}>
        <label className="f" style={{ maxWidth: 220 }}>
          Mes
          <input className="in" type="month" name="mes" defaultValue={mes} />
        </label>
        <button className="btn2" type="submit">
          Ver
        </button>
      </form>
      <div className="cifras-grid cifras-2">
        <div className="card">
          <div className="lbl">Total</div>
          <div className="big">{formatearDinero(total)}</div>
        </div>
        <div className="card">
          <div className="lbl">Quién registró</div>
          {porEntrenador.size === 0 ? (
            <div className="muted">Nadie registró pagos este mes.</div>
          ) : (
            [...porEntrenador.entries()].map(([n, c]) => (
              <div key={n}>
                {n}: {c}
              </div>
            ))
          )}
        </div>
      </div>
      <div className="card tabla-o-tarjetas" style={{ padding: 0 }}>
        {(data ?? []).length === 0 ? (
          <div className="estado-vacio">
            <p>Sin pagos registrados en {nombreMes(mes)}.</p>
          </div>
        ) : (
          <>
            <table className="tabla solo-escritorio">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Plan</th>
                  <th>Fecha</th>
                  {hayMonto ? <th>Monto</th> : null}
                  {hayFolio ? <th>Folio</th> : null}
                  <th>Cubre</th>
                  <th>Registró</th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((p) => (
                  <tr key={p.id as string}>
                    <td>{(p.perfiles as { nombre?: string } | null)?.nombre}</td>
                    <td>{nombrePlan(p.plan as string)}</td>
                    <td>{p.fecha_transferencia as string}</td>
                    {hayMonto ? <td>{textoMonto(p.monto_mxn as number | null)}</td> : null}
                    {hayFolio ? <td>{textoFolio(p.folio as string | null)}</td> : null}
                    <td>{formatearRangoCorto(p.cubre_desde as string, p.cubre_hasta as string)}</td>
                    <td>{(p.entrenador as { nombre?: string } | null)?.nombre ?? 'Sin registrar'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="tarjetas-movil">
              {(data ?? []).map((p) => (
                <article key={p.id as string} className="tarjeta-fila">
                  <h2>{(p.perfiles as { nombre?: string } | null)?.nombre ?? 'Cliente'}</h2>
                  <span className="est ok">{nombrePlan(p.plan as string)}</span>
                  <dl>
                    <div>
                      <dt>Fecha</dt>
                      <dd>{p.fecha_transferencia as string}</dd>
                    </div>
                    {hayMonto ? (
                      <div>
                        <dt>Monto</dt>
                        <dd>{textoMonto(p.monto_mxn as number | null)}</dd>
                      </div>
                    ) : null}
                    {hayFolio ? (
                      <div>
                        <dt>Folio</dt>
                        <dd>{textoFolio(p.folio as string | null)}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt>Cubre</dt>
                      <dd>{formatearRangoCorto(p.cubre_desde as string, p.cubre_hasta as string)}</dd>
                    </div>
                    <div>
                      <dt>Registró</dt>
                      <dd>{(p.entrenador as { nombre?: string } | null)?.nombre ?? 'Sin registrar'}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
