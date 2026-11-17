import { crearClienteServidor } from '@/lib/supabase/server';
import { nombrePlan } from '@/lib/clientes-panel';
import { finDeMes, formatearRangoCorto, mesActual, nombreMes } from '@/lib/fecha';
import { formatearDinero } from '@/lib/formato';

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
    const n = (p.entrenador as { nombre?: string } | null)?.nombre ?? '—';
    porEntrenador.set(n, (porEntrenador.get(n) ?? 0) + 1);
  }

  return (
    <>
      <div className="acciones-cabeza">
        <h1 className="h titulo-panel" style={{ fontSize: 60 }}>
          Pagos de <em>{nombreMes(mes)}</em>
        </h1>
        <a className="btn2" href={`/api/panel/exportar?tipo=pagos&mes=${mes}`}>
          Exportar a Excel
        </a>
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
            <div>—</div>
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
                  <th>Monto</th>
                  <th>Folio</th>
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
                    <td>{p.monto_mxn != null ? formatearDinero(Number(p.monto_mxn)) : '—'}</td>
                    <td>{(p.folio as string) || '—'}</td>
                    <td>{formatearRangoCorto(p.cubre_desde as string, p.cubre_hasta as string)}</td>
                    <td>{(p.entrenador as { nombre?: string } | null)?.nombre ?? '—'}</td>
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
                    <div>
                      <dt>Monto</dt>
                      <dd>{p.monto_mxn != null ? formatearDinero(Number(p.monto_mxn)) : '—'}</dd>
                    </div>
                    <div>
                      <dt>Cubre</dt>
                      <dd>{formatearRangoCorto(p.cubre_desde as string, p.cubre_hasta as string)}</dd>
                    </div>
                    <div>
                      <dt>Registró</dt>
                      <dd>{(p.entrenador as { nombre?: string } | null)?.nombre ?? '—'}</dd>
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
