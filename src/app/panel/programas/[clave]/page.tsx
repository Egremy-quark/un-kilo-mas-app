import Link from 'next/link';
import { notFound } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { AccionIcono } from '@/components/AccionIcono';
import { Globo } from '@/components/Globo';
import { Icono } from '@/components/Iconos';
import { PublicarFase } from './PublicarFase';
import { plataforma } from '@/config/plataforma';
import { AvisoInterno } from '@/components/AvisoInterno';
import { esPendienteYohan, restoTrasMarca } from '@/lib/pendiente-yohan';

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
  const { data: ejs } = diaIds.length
    ? await supabase.from('rutina_ejercicios').select('dia_id, revisar, ejercicios(nombre)').in('dia_id', diaIds)
    : { data: [] };
  const { data: ins } = await supabase
    .from('inscripciones')
    .select('fase_orden, cliente_id, perfiles:cliente_id(plan)')
    .eq('programa_id', programa.id)
    .eq('terminada', false);
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
  const ejsRevisar = (ejs ?? []).filter((e) => e.revisar);
  const porRevisar = ejsRevisar.length;
  const nombresRevisar = [
    ...new Set(
      ejsRevisar
        .map((e) => (e.ejercicios as { nombre?: string } | null)?.nombre)
        .filter((n): n is string => Boolean(n)),
    ),
  ];
  const esRuta = claveDb === 'ruta-1';
  const esPrueba = claveDb === 'prueba';
  const semanasTotales = (rutinas ?? []).reduce((n, r) => n + (Number(r.semanas) || 0), 0);
  const remate = (fases ?? []).find((f) => (f.nombre as string) === 'Remate');
  const descripcionPublica = restoTrasMarca(programa.descripcion as string);
  const pendientePrograma = esPendienteYohan(programa.descripcion as string);

  function clientesDeFase(orden: number) {
    return (ins ?? []).filter((i) => {
      if (i.fase_orden !== orden) return false;
      const plan = (i.perfiles as { plan?: string } | null)?.plan;
      if (esPrueba) return plan === 'prueba';
      return true;
    }).length;
  }

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
      {pendientePrograma ? (
        <AvisoInterno>
          Falta el texto de este programa. Fred o Yohan pueden escribirlo. El cliente no ve esta marca.
          {descripcionPublica ? ` ${descripcionPublica}` : ''}
        </AvisoInterno>
      ) : (
        <p className="muted">{programa.descripcion as string}</p>
      )}
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
          {porRevisar ? (
            <div className="card" style={{ borderColor: 'var(--naranja)' }}>
              <div className="lbl">Marcados «revisar»</div>
              <div className="big">{porRevisar}</div>
              <p className="muted" style={{ fontSize: 14 }}>
                {porRevisar} ejercicio{porRevisar === 1 ? '' : 's'} marcado{porRevisar === 1 ? '' : 's'} «revisar» en Remate
                {nombresRevisar.length ? `: ${nombresRevisar.join(', ')}` : ''}. Marca informativa: Fred y Yohan pueden quitarla y publicar igual.
              </p>
              {remate?.rutina_id ? (
                <Link href={`/panel/rutinas/${remate.rutina_id}`} style={{ fontWeight: 700, fontSize: 15 }}>
                  Abrir Remate
                </Link>
              ) : (
                <Link href="/panel/ejercicios" style={{ fontWeight: 700, fontSize: 15 }}>
                  Ver ejercicios
                </Link>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="card tabla-o-tarjetas" style={{ padding: 0 }}>
        <table className="tabla tabla-fases solo-escritorio">
          <thead>
            <tr>
              <th>Fase</th>
              <th>Semanas</th>
              <th>Días</th>
              <th>Clientes</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(fases ?? []).map((f) => {
              const diasFase = (dias ?? []).filter((d) => d.rutina_id === f.rutina_id);
              const ejsFase = (ejs ?? []).filter((e) => diasFase.some((d) => d.id === e.dia_id));
              const revisar = ejsFase.filter((e) => e.revisar).length;
              const clientes = clientesDeFase(f.orden as number);
              const semanas = f.rutina_id ? semanasMap.get(f.rutina_id as string) : null;
              const descFase = f.descripcion as string;
              return (
                <tr key={f.id as string}>
                  <td>
                    <b>
                      {f.orden}. {f.nombre}
                    </b>
                    <br />
                    {esPendienteYohan(descFase) ? (
                      <span className="est-falta">Falta descripción · Fred o Yohan pueden escribirla</span>
                    ) : (
                      <span className="muted">{descFase}</span>
                    )}
                    {revisar ? (
                      <>
                        <br />
                        <span className="est-revisar">
                          {revisar} marcados «revisar» · no impide publicar
                        </span>
                      </>
                    ) : null}
                  </td>
                  <td>{semanas == null ? <span className="por-definir">por definir</span> : semanas}</td>
                  <td>{diasFase.map((d) => d.letra).join(', ') || 'sin días'}</td>
                  <td>{clientes}</td>
                  <td>
                    {f.publicada ? (
                      <span className="est ok">Publicada</span>
                    ) : (
                      <Globo texto="Todavía no está publicada. Fred o Yohan pueden publicarla; las marcas no lo impiden.">
                        <span className="est-borrador" title="Todavía no está publicada. Fred o Yohan pueden publicarla; las marcas no lo impiden.">
                          Borrador
                        </span>
                      </Globo>
                    )}
                  </td>
                  <td>
                    <div className="acciones-fila">
                      {f.rutina_id ? (
                        <AccionIcono href={`/panel/rutinas/${f.rutina_id}`} etiqueta="Abrir editor">
                          <Icono nombre="lapiz" />
                        </AccionIcono>
                      ) : null}
                      {f.rutina_id ? (
                        <AccionIcono href={`/panel/vista-cliente/${f.rutina_id}`} etiqueta="Ver como cliente">
                          <Icono nombre="ojo" />
                        </AccionIcono>
                      ) : null}
                      {!f.publicada ? <PublicarFase programaId={programa.id as string} orden={f.orden as number} /> : null}
                    </div>
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
            const clientes = clientesDeFase(f.orden as number);
            const semanas = f.rutina_id ? semanasMap.get(f.rutina_id as string) : null;
            const descFase = f.descripcion as string;
            return (
              <article key={f.id as string} className="tarjeta-fila">
                <h2>
                  {f.orden}. {f.nombre as string}
                </h2>
                <dl>
                  <div>
                    <dt>Semanas</dt>
                    <dd>{semanas == null ? <span className="por-definir">por definir</span> : semanas}</dd>
                  </div>
                  <div>
                    <dt>Días</dt>
                    <dd>{diasFase.map((d) => d.letra).join(', ') || 'sin días'}</dd>
                  </div>
                  <div>
                    <dt>Clientes</dt>
                    <dd>{clientes}</dd>
                  </div>
                  <div>
                    <dt>Estado</dt>
                    <dd>
                      {f.publicada ? (
                        <span className="est ok">Publicada</span>
                      ) : (
                        <Globo texto="Todavía no está publicada. Fred o Yohan pueden publicarla; las marcas no lo impiden.">
                          <span className="est-borrador" title="Todavía no está publicada. Fred o Yohan pueden publicarla; las marcas no lo impiden.">
                            Borrador
                          </span>
                        </Globo>
                      )}
                    </dd>
                  </div>
                </dl>
                {esPendienteYohan(descFase) ? <span className="est-falta">Falta descripción · Fred o Yohan pueden escribirla</span> : null}
                {revisar ? (
                  <span className="est-revisar">
                    {revisar} marcados «revisar» · no impide publicar
                  </span>
                ) : null}
                <div className="acciones-fila">
                  {f.rutina_id ? (
                    <AccionIcono href={`/panel/rutinas/${f.rutina_id}`} etiqueta="Abrir editor">
                      <Icono nombre="lapiz" />
                    </AccionIcono>
                  ) : null}
                  {f.rutina_id ? (
                    <AccionIcono href={`/panel/vista-cliente/${f.rutina_id}`} etiqueta="Ver como cliente">
                      <Icono nombre="ojo" />
                    </AccionIcono>
                  ) : null}
                  {!f.publicada ? <PublicarFase programaId={programa.id as string} orden={f.orden as number} /> : null}
                </div>
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
