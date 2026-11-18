import Link from 'next/link';
import { notFound } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { estadoDeCliente, nombrePlan } from '@/lib/clientes-panel';
import { etiquetaEstado } from '@/lib/planes';
import { estimado1rm, rmPorSemana } from '@/lib/dashboard';
import { MoverInscripcion } from './MoverInscripcion';
import { GraficaRm } from '@/components/GraficaRm';
import { NuevaRutina } from './NuevaRutina';
import { textoFolio, textoMonto } from '@/lib/formato';
import { FijarMigas } from '@/components/MigasPanel';

export default async function FichaCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const { data: c } = await supabase.from('perfiles').select('*').eq('id', id).maybeSingle();
  if (!c) notFound();
  const { data: pagos } = await supabase.from('pagos').select('*').eq('cliente_id', id).order('fecha_transferencia', { ascending: false });
  const { data: solicitudes } = await supabase.from('solicitudes_plan').select('*').eq('cliente_id', id).eq('atendida', false);
  const { data: rutina } = await supabase.from('rutinas').select('*').eq('cliente_id', id).eq('estado', 'publicada').maybeSingle();
  const { data: inscripciones } = await supabase.from('inscripciones').select('*, programas(clave, nombre)').eq('cliente_id', id);
  const { data: rms } = await supabase.from('rm_referencia').select('*, ejercicios(nombre)').eq('cliente_id', id);
  const { data: sesiones } = await supabase.from('sesiones').select('*').eq('cliente_id', id).order('fecha', { ascending: false }).limit(12);
  const { data: series } = await supabase.from('series').select('*, sesiones(fecha, cliente_id), ejercicios(nombre)').limit(2000);
  const mias = (series ?? []).filter((s) => (s.sesiones as { cliente_id?: string } | null)?.cliente_id === id);
  const { data: cambios } = await supabase.from('cambios_cliente').select('*, ejercicios(nombre)').eq('cliente_id', id);
  const { data: entrenador } = c.entrenador_a_cargo_id
    ? await supabase.from('perfiles').select('nombre, etiqueta_publica').eq('id', c.entrenador_a_cargo_id).maybeSingle()
    : { data: null };

  const cubre = pagos?.[0]?.cubre_hasta as string | undefined;
  const estado = estadoDeCliente({
    plan: c.plan as string,
    prueba_inicio: c.prueba_inicio as string | null,
    cubre_hasta: cubre ?? null,
    prueba_terminada: Boolean((inscripciones ?? []).find((i) => (i.programas as { clave?: string } | null)?.clave === 'prueba' && i.terminada)),
  });
  const puntos = rmPorSemana(
    mias.map((s) => ({
      ejercicio_id: s.ejercicio_id as string,
      kg: s.kg as number | null,
      reps: s.reps as number | null,
      fecha: ((s.sesiones as { fecha?: string } | null)?.fecha ?? '') as string,
      completada: s.completada as boolean,
    })),
  );

  const insRuta = (inscripciones ?? []).find((i) => (i.programas as { clave?: string } | null)?.clave === 'ruta-1');
  const insPrueba = (inscripciones ?? []).find((i) => (i.programas as { clave?: string } | null)?.clave === 'prueba');
  const insVista = insRuta ?? insPrueba;
  const { data: faseActual } = insVista
    ? await supabase
        .from('programa_fases')
        .select('rutina_id')
        .eq('programa_id', insVista.programa_id as string)
        .eq('orden', insVista.fase_orden as number)
        .maybeSingle()
    : { data: null };
  let vistaRutinaId = (rutina?.id as string | undefined) ?? (faseActual?.rutina_id as string | undefined);
  if (vistaRutinaId) {
    const { data: diasV } = await supabase.from('rutina_dias').select('id').eq('rutina_id', vistaRutinaId);
    const diaV = (diasV ?? []).map((d) => d.id as string);
    const { count: ejsV } = diaV.length
      ? await supabase.from('rutina_ejercicios').select('id', { count: 'exact', head: true }).in('dia_id', diaV)
      : { count: 0 };
    if (!ejsV) {
      const { data: progRuta } = await supabase.from('programas').select('id').eq('clave', 'ruta-1').maybeSingle();
      const { data: arranque } = progRuta
        ? await supabase.from('programa_fases').select('rutina_id').eq('programa_id', progRuta.id).eq('orden', 1).maybeSingle()
        : { data: null };
      if (arranque?.rutina_id) vistaRutinaId = arranque.rutina_id as string;
    }
  }

  return (
    <>
      <FijarMigas items={[{ href: '/panel', label: 'Clientes' }, { label: (c.nombre as string) || 'Cliente' }]} />
      <h1 className="h" style={{ fontSize: 56 }}>
        {c.nombre as string}
      </h1>
      <p className="muted">{c.correo as string}</p>
      {String(c.nombre ?? '').startsWith('Demo') || String(c.correo ?? '').endsWith('@example.com') ? (
        <span className="est alerta">Demo / prueba · no es un cliente real</span>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
        <div className="card">
          <div className="lbl">Plan</div>
          <div className="h" style={{ fontSize: 36 }}>
            {nombrePlan(c.plan as string)}
          </div>
          <span className={`est ${estado === 'por_vencer' ? 'alerta' : estado === 'vencida' ? 'venc' : 'ok'}`}>{etiquetaEstado(estado)}</span>
          {cubre ? <p>Vence {cubre}</p> : null}
          {(solicitudes ?? []).map((s) => (
            <p key={s.id as string} className="est alerta">
              Eligió {nombrePlan(s.plan_elegido as string)} · espera su pago
            </p>
          ))}
          <Link className="btn" href={`/panel/clientes/${id}/pago`} style={{ marginTop: 12 }}>
            Registrar pago
          </Link>
        </div>
        <div className="card">
          <div className="lbl">A cargo</div>
          <p>
            {(entrenador as { nombre?: string } | null)?.nombre ?? 'Sin entrenador'}
            <br />
            <span className="muted">{(entrenador as { etiqueta_publica?: string } | null)?.etiqueta_publica}</span>
          </p>
        </div>
        <div className="card">
          <div className="lbl">Rutina / fase</div>
          {rutina ? (
            <>
              <p>
                <b>{rutina.nombre as string}</b>
              </p>
              <Link href={`/panel/rutinas/${rutina.id}`}>Abrir constructor</Link>
            </>
          ) : insRuta ? (
            <p>
              Ruta +1 · fase {insRuta.fase_orden as number} · semana {insRuta.semana as number}
            </p>
          ) : insPrueba ? (
            <p>
              Prueba · fase {insPrueba.fase_orden as number} · semana {insPrueba.semana as number}
            </p>
          ) : (
            <NuevaRutina clienteId={id} />
          )}
          {vistaRutinaId ? (
            <p>
              <Link className="btn" href={`/panel/vista-cliente/${vistaRutinaId}?cliente=${id}`} style={{ marginTop: 12 }}>
                Ver como cliente
              </Link>
            </p>
          ) : null}
        </div>
      </div>

      {(insRuta || insPrueba) && (
        <MoverInscripcion
          inscripcionId={(insRuta ?? insPrueba)!.id as string}
          fase={(insRuta ?? insPrueba)!.fase_orden as number}
          semana={(insRuta ?? insPrueba)!.semana as number}
        />
      )}

      {(cambios ?? []).length ? (
        <div className="card">
          <div className="lbl">Cambios de ejercicio</div>
          {(cambios ?? []).map((ch) => (
            <div key={ch.id as string}>
              {(ch.ejercicios as { nombre?: string } | null)?.nombre} · {ch.alcance as string}
            </div>
          ))}
        </div>
      ) : null}

      <div className="card">
        <div className="lbl">1RM estimado por semana</div>
        <GraficaRm puntos={puntos} />
      </div>

      <div className="card">
        <div className="lbl">1RM de referencia</div>
        {(rms ?? []).map((r) => {
          const mejor = mias.filter((s) => s.ejercicio_id === r.ejercicio_id);
          const est = mejor
            .map((s) => estimado1rm(Number(s.kg), Number(s.reps)))
            .filter((n): n is number => n != null)
            .sort((a, b) => b - a)[0];
          return (
            <p key={r.id as string}>
              {(r.ejercicios as { nombre?: string } | null)?.nombre}: {r.kg as number} kg
              {est && est > Number(r.kg) && c.plan === 'coaching' ? <span className="est alerta"> la mejor serie estima {est} kg</span> : null}
            </p>
          );
        })}
      </div>

      <div className="card">
        <div className="lbl">Pagos</div>
        <table className="tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Plan</th>
              <th>Monto</th>
              <th>Folio</th>
              <th>Cubre</th>
            </tr>
          </thead>
          <tbody>
            {(pagos ?? []).map((p) => (
              <tr key={p.id as string}>
                <td>{p.fecha_transferencia as string}</td>
                <td>{nombrePlan(p.plan as string)}</td>
                <td>{textoMonto(p.monto_mxn as number | null)}</td>
                <td>{textoFolio(p.folio as string | null)}</td>
                <td>
                  {p.cubre_desde as string} → {p.cubre_hasta as string}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="lbl">Últimas sesiones</div>
        {(sesiones ?? []).length === 0 ? (
          <p className="muted">Todavía no hay sesiones registradas.</p>
        ) : (
          (sesiones ?? []).map((s) => (
            <p key={s.id as string}>
              {s.fecha as string}
              {s.peso_corporal != null ? ` · peso ${s.peso_corporal} kg` : ''}
              {s.ganas != null ? ` · ganas ${s.ganas}` : ''}
              {s.nota_cliente ? ` · «${s.nota_cliente}»` : ''}
            </p>
          ))
        )}
      </div>
    </>
  );
}

