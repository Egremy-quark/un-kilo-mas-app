import { crearClienteServidor } from '@/lib/supabase/server';
import { nombrePlan } from '@/lib/clientes-panel';

export default async function PagosDelMes({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { mes: mesParam } = await searchParams;
  const ahora = new Date();
  const mes = mesParam ?? `${ahora.getUTCFullYear()}-${String(ahora.getUTCMonth() + 1).padStart(2, '0')}`;
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from('pagos')
    .select('*, perfiles:cliente_id(nombre, correo), entrenador:registrado_por(nombre)')
    .gte('fecha_transferencia', `${mes}-01`)
    .lte('fecha_transferencia', `${mes}-31`)
    .order('fecha_transferencia', { ascending: false });

  const total = (data ?? []).reduce((s, p) => s + Number(p.monto_mxn ?? 0), 0);
  const porEntrenador = new Map<string, number>();
  for (const p of data ?? []) {
    const n = (p.entrenador as { nombre?: string } | null)?.nombre ?? '—';
    porEntrenador.set(n, (porEntrenador.get(n) ?? 0) + 1);
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h1 className="h" style={{ fontSize: 60 }}>
          Pagos del <em>mes</em>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18 }}>
        <div className="card">
          <div className="lbl">Total</div>
          <div className="big">${total}</div>
        </div>
        <div className="card">
          <div className="lbl">Quién registró</div>
          {[...porEntrenador.entries()].map(([n, c]) => (
            <div key={n}>
              {n}: {c}
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table className="tabla">
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
                <td>{p.monto_mxn != null ? `$${p.monto_mxn}` : '—'}</td>
                <td>{p.folio as string}</td>
                <td>
                  {p.cubre_desde as string} → {p.cubre_hasta as string}
                </td>
                <td>{(p.entrenador as { nombre?: string } | null)?.nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
