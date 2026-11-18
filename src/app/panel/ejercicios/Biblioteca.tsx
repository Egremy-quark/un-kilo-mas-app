'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { etiquetaMedida, etiquetaPatron, etiquetaTipoAlternativa, PATRONES } from '@/lib/etiquetas';
import { BotonPendiente } from '@/components/BotonPendiente';
import { CamposEditor } from '@/components/CamposEditor';
import { Icono } from '@/components/Iconos';

interface Ej {
  id: string;
  nombre: string;
  patron: string | null;
  medida: string;
  video_url: string | null;
  nota_default: string | null;
}

interface Alt {
  id: string;
  alternativa_id: string;
  nombre: string;
  tipo: string;
  orden: number;
}

const MEDIDAS = [
  { id: 'kg_reps', label: 'Kilos y reps' },
  { id: 'peso_corporal', label: 'Peso corporal' },
  { id: 'tiempo', label: 'Tiempo' },
];

const TIPOS_ALT = [
  { id: 'sin_equipo', label: 'Sin equipo' },
  { id: 'equivalente', label: 'Equivalente' },
  { id: 'maquina', label: 'Con máquina' },
];

export function Biblioteca() {
  const supabase = crearClienteNavegador();
  const [lista, setLista] = useState<Ej[]>([]);
  const [q, setQ] = useState('');
  const [patronFiltro, setPatronFiltro] = useState('todos');
  const [edit, setEdit] = useState<Ej | null>(null);
  const [alts, setAlts] = useState<Alt[]>([]);
  const [busquedaAlt, setBusquedaAlt] = useState('');
  const [tipoAlt, setTipoAlt] = useState('equivalente');
  const [msg, setMsg] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    const { data } = await supabase.from('ejercicios').select('*').order('nombre');
    setLista((data ?? []) as Ej[]);
  }
  useEffect(() => {
    void cargar();
  }, []);

  async function abrir(e: Ej) {
    setEdit(e);
    setMsg('');
    const { data } = await supabase
      .from('ejercicio_alternativas')
      .select('id, tipo, orden, alternativa_id, ejercicios:alternativa_id(nombre)')
      .eq('ejercicio_id', e.id)
      .order('orden');
    setAlts(
      (data ?? []).map((a) => ({
        id: a.id as string,
        alternativa_id: a.alternativa_id as string,
        tipo: a.tipo as string,
        orden: Number(a.orden ?? 0),
        nombre: (a.ejercicios as { nombre?: string } | null)?.nombre ?? '',
      })),
    );
  }

  async function guardar() {
    if (!edit) return;
    if (!edit.nombre.trim()) {
      setMsg('Escribe el nombre.');
      return;
    }
    setGuardando(true);
    if (edit.id.startsWith('nuevo')) {
      const { data, error } = await supabase
        .from('ejercicios')
        .insert({
          nombre: edit.nombre.trim(),
          patron: edit.patron || null,
          medida: edit.medida,
          video_url: edit.video_url || null,
          nota_default: edit.nota_default || null,
        })
        .select('*')
        .single();
      setMsg(error ? error.message : 'Creado');
      if (data) setEdit(data as Ej);
    } else {
      const { error } = await supabase
        .from('ejercicios')
        .update({
          nombre: edit.nombre.trim(),
          patron: edit.patron || null,
          medida: edit.medida,
          video_url: edit.video_url || null,
          nota_default: edit.nota_default || null,
        })
        .eq('id', edit.id);
      setMsg(error ? (error.message.includes('duplicate') ? 'Ya hay un ejercicio con ese nombre.' : error.message) : 'Guardado');
    }
    await cargar();
    setGuardando(false);
  }

  async function agregarAlt(destino: Ej) {
    if (!edit || edit.id.startsWith('nuevo')) {
      setMsg('Guarda el ejercicio antes de agregar cambios.');
      return;
    }
    const { data, error } = await supabase
      .from('ejercicio_alternativas')
      .insert({
        ejercicio_id: edit.id,
        alternativa_id: destino.id,
        tipo: tipoAlt,
        orden: alts.length,
      })
      .select('id')
      .single();
    if (error || !data) {
      setMsg(error?.message.includes('duplicate') ? 'Esa alternativa ya está.' : (error?.message ?? 'No se pudo agregar.'));
      return;
    }
    setAlts((a) => [...a, { id: data.id as string, alternativa_id: destino.id, nombre: destino.nombre, tipo: tipoAlt, orden: alts.length }]);
    setBusquedaAlt('');
  }

  async function quitarAlt(id: string) {
    await supabase.from('ejercicio_alternativas').delete().eq('id', id);
    setAlts((a) => a.filter((x) => x.id !== id));
  }

  async function moverAlt(id: string, dir: -1 | 1) {
    const i = alts.findIndex((a) => a.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= alts.length) return;
    const copia = [...alts];
    const tmp = copia[i];
    copia[i] = copia[j];
    copia[j] = tmp;
    setAlts(copia);
    await Promise.all(copia.map((a, orden) => supabase.from('ejercicio_alternativas').update({ orden }).eq('id', a.id)));
  }

  const ordenPatrones = ['accesorio', 'empuje', 'rodilla', 'jalon', 'bisagra'] as const;
  const filtrada = lista.filter((e) => {
    const texto = q.trim().toLowerCase();
    const nombreOk = !texto || e.nombre.toLowerCase().includes(texto) || etiquetaPatron(e.patron).toLowerCase().includes(texto);
    const patronOk = patronFiltro === 'todos' || e.patron === patronFiltro;
    return nombreOk && patronOk;
  });
  const sugeridas = lista
    .filter((e) => edit && e.id !== edit.id && e.nombre.toLowerCase().includes(busquedaAlt.toLowerCase()) && !alts.some((a) => a.alternativa_id === e.id))
    .slice(0, 8);

  useEffect(() => {
    if (!edit) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prev;
    };
  }, [edit]);

  function cerrar() {
    setEdit(null);
    setMsg('');
  }

  return (
    <div>
      <div className="card tabla-o-tarjetas" style={{ padding: 0 }}>
        <div className="acciones-cabeza" style={{ padding: 16 }}>
          <input className="in" placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
          <button
            className="btn"
            type="button"
            onClick={() => {
              setEdit({ id: 'nuevo', nombre: '', patron: '', medida: 'kg_reps', video_url: '', nota_default: '' });
              setAlts([]);
              setMsg('');
            }}
          >
            + Nuevo ejercicio
          </button>
        </div>
        <div className="zona-filtros">
          <span className="lbl">Patrón</span>
          <div className="chips-scroll">
            <button type="button" className="chip-filtro" aria-pressed={patronFiltro === 'todos'} onClick={() => setPatronFiltro('todos')}>
              Todos ({lista.length})
            </button>
            {ordenPatrones.map((id) => (
              <button key={id} type="button" className="chip-filtro" aria-pressed={patronFiltro === id} onClick={() => setPatronFiltro(id)}>
                {etiquetaPatron(id)} ({lista.filter((e) => e.patron === id).length})
              </button>
            ))}
          </div>
        </div>
        {filtrada.length === 0 ? (
          <div className="estado-vacio">
            <p>Ningún ejercicio coincide con el filtro. Hay {lista.length} en total.</p>
            <button type="button" className="btn2" onClick={() => { setQ(''); setPatronFiltro('todos'); }}>
              Limpiar filtros
            </button>
          </div>
        ) : (
        <>
        <table className="tabla solo-escritorio">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Patrón</th>
              <th>Se mide</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrada.map((e) => (
              <tr key={e.id}>
                <td>
                  <b>{e.nombre}</b>
                </td>
                <td>{e.patron ? etiquetaPatron(e.patron) : '—'}</td>
                <td>{etiquetaMedida(e.medida)}</td>
                <td>
                  <div className="acciones-fila">
                    <button type="button" className="btn-accion" title="Editar ejercicio" aria-label="Editar ejercicio" onClick={() => void abrir(e)}>
                      <Icono nombre="lapiz" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="tarjetas-movil">
          {filtrada.map((e) => (
            <article key={e.id} className="tarjeta-fila">
              <h2>{e.nombre}</h2>
              <dl>
                <div>
                  <dt>Patrón</dt>
                  <dd>{e.patron ? etiquetaPatron(e.patron) : '—'}</dd>
                </div>
                <div>
                  <dt>Se mide</dt>
                  <dd>{etiquetaMedida(e.medida)}</dd>
                </div>
              </dl>
              <div className="acciones-fila">
                <button type="button" className="btn-accion" title="Editar ejercicio" aria-label="Editar ejercicio" onClick={() => void abrir(e)}>
                  <Icono nombre="lapiz" />
                </button>
              </div>
            </article>
          ))}
        </div>
        </>
        )}
      </div>
      {edit && typeof document !== 'undefined'
        ? createPortal(
        <>
        <div className="editor-velo" aria-hidden="true" onClick={cerrar} />
        <form
          className="card editor-ejercicio abierto"
          onSubmit={(e) => {
            e.preventDefault();
            void guardar();
          }}
        >
          <div className="editor-cabeza">
            <div className="lbl">{edit.id === 'nuevo' ? 'Nuevo ejercicio' : 'Editando el ejercicio'}</div>
            <button type="button" className="btn-icono cerrar-hoja" aria-label="Cerrar" onClick={cerrar}>
              <Icono nombre="cerrar" />
            </button>
          </div>
          <CamposEditor>
          <label className="f">
            Nombre
            <input className="in" value={edit.nombre} onChange={(e) => setEdit({ ...edit, nombre: e.target.value })} />
          </label>
          <label className="f">
            Patrón
            <select className="in" value={edit.patron ?? ''} onChange={(e) => setEdit({ ...edit, patron: e.target.value || null })}>
              <option value="">Sin asignar</option>
              {PATRONES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="f">
            Se mide
            <select className="in" value={edit.medida} onChange={(e) => setEdit({ ...edit, medida: e.target.value })}>
              {MEDIDAS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="f">
            Video
            <input className="in" value={edit.video_url ?? ''} onChange={(e) => setEdit({ ...edit, video_url: e.target.value })} />
          </label>
          <label className="f">
            Nota por defecto
            <input className="in" value={edit.nota_default ?? ''} onChange={(e) => setEdit({ ...edit, nota_default: e.target.value })} />
          </label>
          <div className="lbl">Cambios permitidos</div>
          {alts.map((a) => (
            <div key={a.id} className="alt-fila">
              <span>
                {a.nombre} · {etiquetaTipoAlternativa(a.tipo)}
              </span>
              <span className="alt-acciones">
                <button type="button" className="btn2" style={{ minHeight: 44, padding: '0 12px' }} onClick={() => void moverAlt(a.id, -1)} aria-label="Subir">
                  ↑
                </button>
                <button type="button" className="btn2" style={{ minHeight: 44, padding: '0 12px' }} onClick={() => void moverAlt(a.id, 1)} aria-label="Bajar">
                  ↓
                </button>
                <button type="button" className="btn2" style={{ minHeight: 44, padding: '0 12px' }} onClick={() => void quitarAlt(a.id)}>
                  Quitar
                </button>
              </span>
            </div>
          ))}
          <label className="f">
            Agregar alternativa
            <input className="in" placeholder="Buscar en el catálogo" value={busquedaAlt} onChange={(e) => setBusquedaAlt(e.target.value)} />
          </label>
          <label className="f">
            Tipo
            <select className="in" value={tipoAlt} onChange={(e) => setTipoAlt(e.target.value)}>
              {TIPOS_ALT.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          {busquedaAlt
            ? sugeridas.map((s) => (
                <button key={s.id} type="button" className="btn2" onClick={() => void agregarAlt(s)}>
                  + {s.nombre}
                </button>
              ))
            : null}
          {msg ? <p>{msg}</p> : null}
          </CamposEditor>
          <div className="editor-pie">
            <BotonPendiente type="submit" cargando={guardando} etiquetaCargando="Guardando…">
              Guardar
            </BotonPendiente>
          </div>
        </form>
        </>,
        document.body,
        )
        : null}
    </div>
  );
}
