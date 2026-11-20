'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { etiquetaMedida, etiquetaPatron, etiquetaTipoAlternativa, PATRONES } from '@/lib/etiquetas';
import { BotonPendiente } from '@/components/BotonPendiente';
import { CamposEditor } from '@/components/CamposEditor';
import { Desplegable } from '@/components/Desplegable';
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
  const [cerradosEj, setCerradosEj] = useState<string[]>([]);

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

  const gruposEj = [...ordenPatrones.map((id) => ({ id, nombre: etiquetaPatron(id), filas: filtrada.filter((e) => e.patron === id) })), { id: 'sin', nombre: 'Sin patrón', filas: filtrada.filter((e) => !e.patron) }].filter((g) => g.filas.length > 0);

  return (
    <div className="plantillas-boceto">
      <header className="pt-cabeza">
        <div>
          <p className="pt-kicker">Panel · Ejercicios</p>
          <div className="pt-titulo-linea">
            <h1 className="h">Ejercicios</h1>
            <p>{lista.length} en el catálogo</p>
          </div>
        </div>
        <div className="pt-cabeza-acciones">
          <button
            className="btn pt-btn-principal"
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
      </header>
      <section className="pt-resumen parejo" aria-label="Resumen">
        <article>
          <b>{lista.length}</b> ejercicios
        </article>
        <article>
          <b className="pt-num-lima">{lista.filter((e) => e.patron).length}</b> con patrón
        </article>
        <article>
          <b>{lista.filter((e) => !e.patron).length}</b> sin patrón
        </article>
        <article>
          <b>{lista.filter((e) => e.video_url).length}</b> con video
        </article>
      </section>
      <div className="pt-herramientas">
        <label className="campo-buscar">
          <Icono nombre="lupa" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar ejercicio" aria-label="Buscar ejercicio" />
        </label>
        <div className="pt-segmento" role="group" aria-label="Patrón">
          <button type="button" aria-pressed={patronFiltro === 'todos'} onClick={() => setPatronFiltro('todos')}>
            Todos {lista.length}
          </button>
          {ordenPatrones.map((id) => (
            <button key={id} type="button" aria-pressed={patronFiltro === id} onClick={() => setPatronFiltro(id)}>
              {etiquetaPatron(id)} {lista.filter((e) => e.patron === id).length}
            </button>
          ))}
        </div>
      </div>
      {filtrada.length === 0 ? (
        <div className="pt-fila" style={{ padding: 16 }}>
          <p>Ningún ejercicio coincide con el filtro. Hay {lista.length} en total.</p>
          <button type="button" className="btn2" onClick={() => { setQ(''); setPatronFiltro('todos'); }}>
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="pt-lista">
          {gruposEj.map((grupo) => {
            const abierto = !cerradosEj.includes(grupo.id);
            return (
              <section key={grupo.id} className={`pt-fase${abierto ? ' abierta' : ''}`}>
                <button
                  type="button"
                  className="pt-fase-cabeza"
                  aria-expanded={abierto}
                  onClick={() => setCerradosEj((prev) => (abierto ? [...prev, grupo.id] : prev.filter((id) => id !== grupo.id)))}
                >
                  <span className="pt-num">{grupo.filas.length}</span>
                  <span className="pt-fase-nombre">
                    <b>{grupo.nombre}</b>
                  </span>
                  <span className="pt-fase-meta">
                    <span className="pt-pill">{grupo.filas.length} en total</span>
                    <span className="pt-chevron" aria-hidden="true" />
                  </span>
                </button>
                {abierto ? (
                  <div className="pt-fase-cuerpo">
                    {grupo.filas.map((e) => (
                      <button key={e.id} type="button" className="pt-fila pt-fila-tope" onClick={() => void abrir(e)}>
                        <span className="pt-fila-nombre">
                          <b>{e.nombre}</b>
                          <span>{e.patron ? etiquetaPatron(e.patron) : 'Sin patrón'}</span>
                        </span>
                        <span className="pt-pills">
                          <span className="pt-pill">{etiquetaMedida(e.medida)}</span>
                          {e.video_url ? <span className="pt-pill pt-pill-ok">Video</span> : <span className="pt-pill">Sin video</span>}
                          <span className="pt-chevron" aria-hidden="true" />
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
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
            <Desplegable
              etiqueta="Patrón"
              valor={edit.patron ?? ''}
              alCambiar={(valor) => setEdit({ ...edit, patron: valor || null })}
              opciones={[{ valor: '', etiqueta: 'Sin asignar' }, ...PATRONES.map((p) => ({ valor: p.id, etiqueta: p.label }))]}
            />
          </label>
          <label className="f">
            Se mide
            <Desplegable
              etiqueta="Se mide"
              valor={edit.medida}
              alCambiar={(valor) => setEdit({ ...edit, medida: valor })}
              opciones={MEDIDAS.map((m) => ({ valor: m.id, etiqueta: m.label }))}
            />
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
            <Desplegable
              etiqueta="Tipo de alternativa"
              valor={tipoAlt}
              alCambiar={setTipoAlt}
              opciones={TIPOS_ALT.map((t) => ({ valor: t.id, etiqueta: t.label }))}
            />
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
