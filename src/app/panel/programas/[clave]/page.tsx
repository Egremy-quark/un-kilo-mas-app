import Link from 'next/link';
import { notFound } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { PublicarFase } from './PublicarFase';
import { plataforma } from '@/config/plataforma';
import { etiquetaSemanas } from '@/lib/etiquetas';

export default async function ProgramaPage({ params }: { params: Promise<{ clave: string }> }) {
  const { clave } = await params;
  const supabase = await crearClienteServidor();
  const claveDb = clave === 'ruta-1' || clave === 'ruta-mas-1' ? 'ruta-1' : clave === 'prueba' ? 'prueba' : clave;
  const { data: programa } = await supabase.from('programas').select('*').eq('clave', claveDb).maybeSingle();
  if (!programa) notFound();
  const { data: fases } = await supabase.from('programa_fases').select('*').eq('programa_id', programa.id).order('orden');
  const rutinaIds = (fases ?? []).map((f) => f.rutina_id).filter(Boolean) as string[];
  const { data: rutinas } = rutinaIds.length
    ? await supabase.from('rutinas').select('id, semanas').in('id', rutinaIds)
    : { data: [] };
  const semanasMap = new Map((rutinas ?? []).map((r) => [r.id as string, r.semanas as number | null]));
  const { data: dias } = rutinaIds.length ? await supabase.from('rutina_dias').select('id, rutina_id, letra').in('rutina_id', rutinaIds) : { data: [] };
  const diaIds = (dias ?? []).map((d) => d.id as string);
  const { data: ejs } = diaIds.length ? await supabase.from('rutina_ejercicios').select('dia_id, revisar').in('dia_id', diaIds) : { data: [] };
  const { data: ins } = await supabase.from('inscripciones').select('fase_orden').eq('programa_id', programa.id).eq('terminada', false);
  const { count: clientesRuta } = await supabase
    .from('perfiles')
    .select('id', { count: 'exact', head: true })
    .eq('rol', 'cliente')
    .in('plan', ['ruta_mensual', 'ruta_completa']);
  const { count: clientesPrueba } = await supabase
    .from('perfiles')
    .select('id', { count: 'exact', head: true })
    .eq('rol', 'cliente')
    .eq('plan', 'prueba');
  const porRevisar = (ejs ?? []).filter((e) => e.revisar).length;
  const esRuta = claveDb === 'ruta-1';
  const semanasTotales = (rutinas ?? []).reduce((n, r) => n + (Number(r.semanas) || 0), 0);

  return (
    <>
      <div className="lbl">{esRuta ? 'Programa del plan sencillo' : 'Programa de la prueba gratis'}</div>
      <h1 className="h titulo-panel" style={{ fontSize: 60 }}>
        {(programa.nombre as string) === 'Ruta +1' ? (
          <>
            Ruta <em>+1</em>
          </>
        ) : (
          (programa.nombre as string) ?? 'Programa'
        )}
      </h1>
      <p className="muted">{programa.descripcion as string}</p>
      {esRuta ? (
        <div className="cifras-grid">
          <div className="card">
            <div className="lbl">Duración</div>
            <div className="big">{plataforma.ruta.semanas} sem.</div>
            <div className="muted" style={{ fontSize: 14 }}>
              Unos 9 meses
            </div>
          </div>
          <div className="card">
            <div className="lbl">Clientes en Ruta +1</div>
            <div className="big">{clientesRuta ?? 0}</div>
          </div>
          <div className="card">
            <div className="lbl">En prueba gratis</div>
            <div className="big">{clientesPrueba ?? 0}</div>
            <div className="muted" style={{ fontSize: 14 }}>
              Rutina 01 y 02
            </div>
          </div>
          <div className="card" style={{ borderColor: 'var(--naranja)' }}>
            <div className="lbl">Por revisar antes de publicar</div>
            <div className="big">{porRevisar}</div>
            <Link href="/panel/ejercicios" style={{ fontWeight: 700, fontSize: 15 }}>
              Ver ejercicios
            </Link>
          </div>
        </div>
      ) : null}
      <div className="card tabla-o-tarjetas" style={{ padding: 0 }}>
        <table className="tabla solo-escritorio">
          <thead>
            <tr>
              <th>Fase</th>
              <th>Semanas</th>
              <th>Días</th>
              <th>Clientes</th>
              <th>Revisar</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(fases ?? []).map((f) => {
              const diasFase = (dias ?? []).filter((d) => d.rutina_id === f.rutina_id);
              const ejsFase = (ejs ?? []).filter((e) => diasFase.some((d) => d.id === e.dia_id));
              const revisar = ejsFase.filter((e) => e.revisar).length;
              const clientes = (ins ?? []).filter((i) => i.fase_orden === f.orden).length;
              const semanas = f.rutina_id ? semanasMap.get(f.rutina_id as string) : null;
              return (
                <tr key={f.id as string}>
                  <td>
                    <b>
                      {f.orden}. {f.nombre}
                    </b>
                    <br />
                    <span className="muted">{f.descripcion as string}</span>
                  </td>
                  <td>{etiquetaSemanas(semanas)}</td>
                  <td>{diasFase.map((d) => d.letra).join(', ') || '—'}</td>
                  <td>{clientes}</td>
                  <td>{revisar ? <span className="est alerta">{revisar} por revisar</span> : '—'}</td>
                  <td>{f.publicada ? <span className="est ok">Publicada</span> : <span className="est alerta">Borrador</span>}</td>
                  <td style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {f.rutina_id ? (
                      <Link className="btn2" href={`/panel/rutinas/${f.rutina_id}`}>
                        Abrir
                      </Link>
                    ) : null}
                    {f.rutina_id ? <Link href={`/panel/vista-cliente/${f.rutina_id}`}>Ver como cliente</Link> : null}
                    {!f.publicada ? <PublicarFase programaId={programa.id as string} orden={f.orden as number} /> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="tarjetas-movil">
          {(fases ?? []).map((f) => {
            const diasFase = (dias ?? []).filter((d) => d.rutina_id === f.rutina_id);
            const ejsFase = (ejs ?? []).filter((e) => diasFase.some((d) => d.id === e.dia_id));
            const revisar = ejsFase.filter((e) => e.revisar).length;
            const clientes = (ins ?? []).filter((i) => i.fase_orden === f.orden).length;
            const semanas = f.rutina_id ? semanasMap.get(f.rutina_id as string) : null;
            return (
              <article key={f.id as string} className="tarjeta-fila">
                <h2>
                  {f.orden}. {f.nombre as string}
                </h2>
                <dl>
                  <div>
                    <dt>Semanas</dt>
                    <dd>{etiquetaSemanas(semanas)}</dd>
                  </div>
                  <div>
                    <dt>Días</dt>
                    <dd>{diasFase.map((d) => d.letra).join(', ') || '—'}</dd>
                  </div>
                  <div>
                    <dt>Clientes</dt>
                    <dd>{clientes}</dd>
                  </div>
                  <div>
                    <dt>Estado</dt>
                    <dd>{f.publicada ? <span className="est ok">Publicada</span> : <span className="est alerta">Borrador</span>}</dd>
                  </div>
                </dl>
                {revisar ? <span className="est alerta">{revisar} por revisar</span> : null}
                {f.rutina_id ? (
                  <Link className="btn2 btn-ancho" href={`/panel/rutinas/${f.rutina_id}`}>
                    Abrir
                  </Link>
                ) : null}
                {f.rutina_id ? <Link href={`/panel/vista-cliente/${f.rutina_id}`}>Ver como cliente</Link> : null}
              </article>
            );
          })}
        </div>
      </div>
      {esRuta ? (
        <p className="muted" style={{ fontSize: 14 }}>
          Duración real de las fases: {semanasTotales} semanas.
        </p>
      ) : null}
    </>
  );
}
