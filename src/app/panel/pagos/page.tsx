import { crearClienteServidor } from '@/lib/supabase/server';
import { nombrePlan } from '@/lib/clientes-panel';
import { finDeMes, formatearRangoCorto, mesActual, nombreMes } from '@/lib/fecha';
import { formatearDinero, textoFolio, textoMonto } from '@/lib/formato';

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

  const pagos = data ?? [];
  const planes = [...new Set(pagos.map((p) => nombrePlan(p.plan as string)))];

  return (
    <div className="plantillas-boceto">
      <header className="pt-cabeza">
        <div>
          <p className="pt-kicker">Panel · Pagos</p>
          <div className="pt-titulo-linea">
            <h1 className="h">Pagos</h1>
            <p>
              {nombreMes(mes)} · {pagos.length} registros · {formatearDinero(total)}
            </p>
          </div>
        </div>
      </header>
      <section className="pt-resumen parejo" aria-label="Resumen">
        <article>
          <b className="pt-num-lima">{formatearDinero(total)}</b> total del mes
        </article>
        <article>
          <b>{pagos.length}</b> pagos
        </article>
        <article>
          <b>{porEntrenador.size}</b> quienes registraron
        </article>
      </section>
      <form className="pt-herramientas" method="get">
        <label className="campo-buscar">
          Mes
          <input type="month" name="mes" defaultValue={mes} aria-label="Mes" />
        </label>
        <button className="btn pt-btn-principal" type="submit">
          Ver
        </button>
      </form>
      {pagos.length === 0 ? (
        <div className="pt-fila" style={{ padding: 16 }}>
          <p>Sin pagos registrados en {nombreMes(mes)}.</p>
        </div>
      ) : (
        <div className="pt-lista">
          {planes.map((plan) => {
            const delPlan = pagos.filter((p) => nombrePlan(p.plan as string) === plan);
            return (
              <section key={plan} className="pt-fase abierta">
                <div className="pt-fase-cabeza">
                  <span className="pt-num">{delPlan.length}</span>
                  <span className="pt-fase-nombre">
                    <b>{plan}</b>
                  </span>
                  <span className="pt-fase-meta">
                    <span className="pt-pill">{delPlan.length} en total</span>
                  </span>
                </div>
                <div className="pt-fase-cuerpo">
                  {delPlan.map((p) => (
                    <article key={p.id as string} className="pt-fila">
                      <div className="pt-fila-tope">
                        <span className="pt-fila-nombre">
                          <b>{(p.perfiles as { nombre?: string } | null)?.nombre ?? 'Cliente'}</b>
                          <span>
                            {p.fecha_transferencia as string} · {formatearRangoCorto(p.cubre_desde as string, p.cubre_hasta as string)} ·{' '}
                            {(p.entrenador as { nombre?: string } | null)?.nombre ?? 'Sin registrar'}
                          </span>
                        </span>
                        <span className="pt-pills">
                          <span className="pt-pill">{plan}</span>
                          {hayMonto ? <span className="pt-pill pt-pill-ok">{textoMonto(p.monto_mxn as number | null)}</span> : null}
                          {hayFolio ? <span className="pt-pill pt-pill-naranja">{textoFolio(p.folio as string | null)}</span> : null}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
      {porEntrenador.size > 0 ? (
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>
          {[...porEntrenador.entries()].map(([n, c]) => `${n}: ${c}`).join(' · ')}
        </p>
      ) : (
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>Nadie registró pagos este mes.</p>
      )}
    </div>
  );
}
