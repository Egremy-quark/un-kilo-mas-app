'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { AccionIcono } from '@/components/AccionIcono';
import { Desplegable } from '@/components/Desplegable';
import { Globo } from '@/components/Globo';
import { Icono } from '@/components/Iconos';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { mostrarCargando, ocultarCargando } from '@/lib/cargando-ui';
import { etiquetaEnfoque, etiquetaEstadoRutina, etiquetaVariante } from '@/lib/etiquetas';

export type FasePlantilla = { id: string; orden: number; nombre: string; descripcion?: string | null };
export type FilaPlantilla = {
  id: string;
  nombre: string;
  semanas: number | null;
  enfoque: string | null;
  estado: string;
  fase_plantilla_id: string | null;
};
export type VariantePlantilla = {
  id: string;
  rutina_id: string;
  poblacion: string | null;
  material: string | null;
  unidades: string | null;
};

const SIN_FASE = 'sin-fase';

const ENFOQUES = [
  { id: 'todos', label: 'Todos' },
  { id: 'fuerza', label: 'Fuerza' },
  { id: 'hipertrofia', label: 'Hipertrofia' },
  { id: 'transicion', label: 'Transición' },
  { id: 'tecnica', label: 'Técnica' },
] as const;

const ETIQUETAS = [
  { id: 'todas', label: 'Todas' },
  { id: 'mujeres', label: 'Mujeres' },
  { id: 'hombres', label: 'Hombres' },
  { id: 'poco_material', label: 'Poco material' },
  { id: 'sin_maquinas', label: 'Sin máquinas' },
  { id: 'kg', label: 'kg' },
  { id: 'lbs', label: 'lbs' },
] as const;

function textoVariante(v: VariantePlantilla) {
  return [etiquetaVariante('poblacion', v.poblacion), etiquetaVariante('material', v.material), etiquetaVariante('unidades', v.unidades)]
    .filter(Boolean)
    .join(' · ');
}

function coincideEtiqueta(v: VariantePlantilla, etiqueta: string) {
  return v.poblacion === etiqueta || v.material === etiqueta || v.unidades === etiqueta;
}

function numeroVisible(nombre: string) {
  const coincidencia = nombre.match(/^(\d+)/);
  return coincidencia ? coincidencia[1] : '';
}

function nombreVisible(nombre: string) {
  return nombre.replace(/^\d+\s*/, '').trim() || nombre;
}

export function ListaPlantillas({
  fasesIniciales,
  plantillasIniciales,
  variantesIniciales,
}: {
  fasesIniciales: FasePlantilla[];
  plantillasIniciales: FilaPlantilla[];
  variantesIniciales: VariantePlantilla[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => crearClienteNavegador(), []);
  const [fases, setFases] = useState(fasesIniciales);
  const [plantillas, setPlantillas] = useState(plantillasIniciales);
  const [variantes, setVariantes] = useState(variantesIniciales);
  const [abiertas, setAbiertas] = useState<string[]>(() => (fasesIniciales[0] ? [fasesIniciales[0].id] : [SIN_FASE]));
  const [abiertaPlantilla, setAbiertaPlantilla] = useState<string | null>(null);
  const [elegida, setElegida] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [enfoque, setEnfoque] = useState('todos');
  const [etiqueta, setEtiqueta] = useState('todas');
  const [estadoFiltro, setEstadoFiltro] = useState<'todas' | 'publicada' | 'borrador'>('todas');
  const [vista, setVista] = useState<'fases' | 'plana'>('fases');
  const [aviso, setAviso] = useState('');
  const [modal, setModal] = useState<null | { tipo: 'fase' | 'renombrar' | 'variante'; faseId?: string; rutinaId?: string }>(null);
  const [nombreFase, setNombreFase] = useState('');
  const [poblacion, setPoblacion] = useState('');
  const [material, setMaterial] = useState('');
  const [unidades, setUnidades] = useState('');

  useEffect(() => {
    if (!modal) return;
    const html = document.documentElement;
    const previo = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      html.style.overflow = previo;
    };
  }, [modal]);

  const texto = q.trim().toLowerCase();
  const filtrando = Boolean(texto) || enfoque !== 'todos' || etiqueta !== 'todas' || estadoFiltro !== 'todas';
  const total = plantillas.length;
  const enSinFase = plantillas.filter((p) => p.fase_plantilla_id == null).length;
  const deBuho = total - enSinFase;
  const publicadas = plantillas.filter((p) => p.estado === 'publicada').length;
  const borradores = plantillas.filter((p) => p.estado === 'borrador').length;

  function pasa(p: FilaPlantilla, nombreFase: string) {
    const faseCoincide = Boolean(texto) && nombreFase.toLowerCase().includes(texto);
    if (texto && !faseCoincide && !p.nombre.toLowerCase().includes(texto)) return false;
    if (enfoque !== 'todos' && p.enfoque !== enfoque) return false;
    if (estadoFiltro !== 'todas' && p.estado !== estadoFiltro) return false;
    if (etiqueta !== 'todas') {
      const suyas = variantes.filter((v) => v.rutina_id === p.id);
      if (!suyas.some((v) => coincideEtiqueta(v, etiqueta))) return false;
    }
    return true;
  }

  function visiblesDe(faseId: string | null, nombreFase: string) {
    return plantillas.filter((p) => {
      const enFase = faseId == null ? p.fase_plantilla_id == null : p.fase_plantilla_id === faseId;
      return enFase && pasa(p, nombreFase);
    });
  }

  const grupos = [
    ...[...fases].sort((a, b) => a.orden - b.orden).map((f) => ({
      id: f.id,
      nombre: f.nombre,
      orden: f.orden,
      descripcion: f.descripcion?.trim() || '',
      real: true,
      filas: visiblesDe(f.id, f.nombre),
      total: plantillas.filter((p) => p.fase_plantilla_id === f.id).length,
      publicadas: plantillas.filter((p) => p.fase_plantilla_id === f.id && p.estado === 'publicada').length,
    })),
    {
      id: SIN_FASE,
      nombre: 'Sin fase',
      orden: 999,
      descripcion: '',
      real: false,
      filas: visiblesDe(null, 'Sin fase'),
      total: enSinFase,
      publicadas: plantillas.filter((p) => p.fase_plantilla_id == null && p.estado === 'publicada').length,
    },
  ].filter((g) => !filtrando || g.filas.length > 0);

  const planas = plantillas.filter((p) => {
    const fase = fases.find((f) => f.id === p.fase_plantilla_id);
    return pasa(p, fase?.nombre ?? 'Sin fase');
  });

  const varianteElegida = variantes.find((v) => v.id === elegida) ?? null;
  const plantillaElegida = varianteElegida ? plantillas.find((p) => p.id === varianteElegida.rutina_id) ?? null : null;
  const faseElegida = plantillaElegida
    ? fases.find((f) => f.id === plantillaElegida.fase_plantilla_id)?.nombre ?? 'Sin fase'
    : '';

  function toggle(id: string) {
    setAbiertas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function faseParaNueva() {
    const abierta = fases.find((f) => abiertas.includes(f.id));
    return abierta?.id ?? null;
  }

  async function crearFase() {
    const nombre = nombreFase.trim();
    if (!nombre) {
      setAviso('Escribe el nombre de la fase.');
      return;
    }
    mostrarCargando();
    const orden = (fases.reduce((m, f) => Math.max(m, f.orden), 0) || 0) + 1;
    const { data, error } = await supabase.from('plantilla_fases').insert({ nombre, orden }).select('id, orden, nombre').single();
    ocultarCargando();
    if (error || !data) {
      setAviso('No se pudo crear la fase.');
      return;
    }
    setFases((prev) => [...prev, data as FasePlantilla].sort((a, b) => a.orden - b.orden));
    setAbiertas((prev) => [...prev, data.id as string]);
    setModal(null);
    setNombreFase('');
    router.refresh();
  }

  async function renombrar() {
    const nombre = nombreFase.trim();
    const id = modal?.faseId;
    if (!id || !nombre) return;
    mostrarCargando();
    const { error } = await supabase.from('plantilla_fases').update({ nombre }).eq('id', id);
    ocultarCargando();
    if (error) {
      setAviso('No se pudo renombrar la fase.');
      return;
    }
    setFases((prev) => prev.map((f) => (f.id === id ? { ...f, nombre } : f)));
    setModal(null);
    setNombreFase('');
    router.refresh();
  }

  async function moverOrden(fase: FasePlantilla, dir: -1 | 1) {
    const ordenadas = [...fases].sort((a, b) => a.orden - b.orden);
    const i = ordenadas.findIndex((f) => f.id === fase.id);
    const otra = ordenadas[i + dir];
    if (!otra) return;
    mostrarCargando();
    const temporal = -1 - fase.orden;
    const a = await supabase.from('plantilla_fases').update({ orden: temporal }).eq('id', fase.id);
    const b = await supabase.from('plantilla_fases').update({ orden: fase.orden }).eq('id', otra.id);
    const c = await supabase.from('plantilla_fases').update({ orden: otra.orden }).eq('id', fase.id);
    ocultarCargando();
    if (a.error || b.error || c.error) {
      setAviso('No se pudo reordenar.');
      return;
    }
    setFases((prev) =>
      prev
        .map((f) => {
          if (f.id === fase.id) return { ...f, orden: otra.orden };
          if (f.id === otra.id) return { ...f, orden: fase.orden };
          return f;
        })
        .sort((x, y) => x.orden - y.orden),
    );
    router.refresh();
  }

  async function eliminarFase(fase: FasePlantilla) {
    const ocupadas = plantillas.filter((p) => p.fase_plantilla_id === fase.id).length;
    if (ocupadas > 0) {
      setAviso('Esta fase tiene plantillas. Muévelas a otra fase antes de eliminarla.');
      return;
    }
    mostrarCargando();
    const { error } = await supabase.from('plantilla_fases').delete().eq('id', fase.id);
    ocultarCargando();
    if (error) {
      setAviso('No se pudo eliminar la fase. Si todavía tiene plantillas, muévelas primero.');
      return;
    }
    setFases((prev) => prev.filter((f) => f.id !== fase.id));
    router.refresh();
  }

  async function moverPlantilla(id: string, faseId: string) {
    const valor = faseId === SIN_FASE ? null : faseId;
    mostrarCargando();
    const { error } = await supabase.from('rutinas').update({ fase_plantilla_id: valor }).eq('id', id);
    ocultarCargando();
    if (error) {
      setAviso('No se pudo mover la plantilla.');
      return;
    }
    setPlantillas((prev) => prev.map((p) => (p.id === id ? { ...p, fase_plantilla_id: valor } : p)));
    router.refresh();
  }

  async function crearPlantilla(faseId: string | null) {
    if (plantillas.some((p) => p.nombre.trim().toLowerCase() === 'plantilla nueva')) {
      setAviso('Ya existe una plantilla con ese nombre');
      return;
    }
    mostrarCargando();
    const r = await fetch('/api/panel/rutinas/nueva', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ es_plantilla: true, nombre: 'Plantilla nueva', fase_plantilla_id: faseId }),
    });
    const j = await r.json();
    ocultarCargando();
    if (j.id) router.push(`/panel/rutinas/${j.id}`);
    else setAviso(j.mensaje || 'No se pudo crear la plantilla.');
  }

  async function crearVariante() {
    const rutinaId = modal?.rutinaId;
    if (!rutinaId) return;
    if (!poblacion && !material && !unidades) {
      setAviso('Elige al menos una etiqueta: población, material o unidades.');
      return;
    }
    mostrarCargando();
    const { data, error } = await supabase
      .from('plantilla_variantes')
      .insert({
        rutina_id: rutinaId,
        poblacion: poblacion || null,
        material: material || null,
        unidades: unidades || null,
      })
      .select('id, rutina_id, poblacion, material, unidades')
      .single();
    ocultarCargando();
    if (error || !data) {
      setAviso('No se pudo crear la variante.');
      return;
    }
    setVariantes((prev) => [...prev, data as VariantePlantilla]);
    setModal(null);
    setPoblacion('');
    setMaterial('');
    setUnidades('');
    router.refresh();
  }

  function fila(r: FilaPlantilla) {
    const suyas = variantes.filter((v) => v.rutina_id === r.id);
    const abierta = abiertaPlantilla === r.id;
    const semanasTxt = r.semanas == null ? 'por definir' : `${r.semanas} semanas`;
    return (
      <article key={r.id} className={`pt-fila${abierta ? ' abierta' : ''}`}>
        <button type="button" className="pt-fila-tope" aria-expanded={abierta} onClick={() => setAbiertaPlantilla(abierta ? null : r.id)}>
          <span className="pt-fila-nombre">
            <b>{r.nombre}</b>
            <span>{semanasTxt} · {etiquetaEnfoque(r.enfoque)} · {etiquetaEstadoRutina(r.estado)}</span>
          </span>
          <span className="pt-pills">
            <span className="pt-pill">{etiquetaEnfoque(r.enfoque)}</span>
            <span className="pt-pill">{r.semanas == null ? 'por definir' : `${r.semanas} sem`}</span>
            <span className="pt-pill pt-pill-naranja">{suyas.length} variantes</span>
            {r.estado === 'borrador' ? (
              <Globo texto="Todavía no está publicada. Fred o Yohan pueden publicarla; las marcas no lo impiden.">
                <span className="pt-pill">{etiquetaEstadoRutina(r.estado)}</span>
              </Globo>
            ) : (
              <span className={`pt-pill${r.estado === 'publicada' ? ' pt-pill-ok' : ''}`}>{etiquetaEstadoRutina(r.estado)}</span>
            )}
            <span className="pt-chevron" aria-hidden="true" />
          </span>
        </button>
        <div className="pt-fila-herramientas">
          <label>
            Fase
            <Desplegable
              etiqueta={`Mover ${r.nombre}`}
              valor={r.fase_plantilla_id ?? SIN_FASE}
              alCambiar={(valor) => void moverPlantilla(r.id, valor)}
              opciones={[{ valor: SIN_FASE, etiqueta: 'Sin fase' }, ...fases.map((f) => ({ valor: f.id, etiqueta: f.nombre }))]}
            />
          </label>
          <AccionIcono href={`/panel/rutinas/${r.id}`} etiqueta="Abrir editor">
            <Icono nombre="lapiz" />
          </AccionIcono>
        </div>
        {abierta ? (
          <div className="pt-desplegable">
            <p className="pt-rotulo">Variantes de esta plantilla — elige una para asignar</p>
            {suyas.length === 0 ? <p className="muted">Sin variantes. La base no se duplica.</p> : null}
            {suyas.length ? (
              <div className="pt-variantes">
                {suyas.map((v) => {
                  const activa = elegida === v.id;
                  const partes = [etiquetaVariante('poblacion', v.poblacion), etiquetaVariante('material', v.material), etiquetaVariante('unidades', v.unidades)].filter(Boolean);
                  return (
                    <article key={v.id} className={`pt-variante${activa ? ' elegida' : ''}`}>
                      <b>{partes[0] || 'Variante'}</b>
                      <span className="pt-pills">
                        {partes.map((parte) => (
                          <span key={parte} className="pt-pill pt-pill-mini">{parte}</span>
                        ))}
                      </span>
                      {activa ? (
                        <span className="pt-elegida">✓ Seleccionada — lista para asignar</span>
                      ) : (
                        <button type="button" className="pt-usar" onClick={() => setElegida(v.id)}>Usar esta variante →</button>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : null}
            <button
              type="button"
              className="btn2"
              onClick={() => {
                setPoblacion('');
                setMaterial('');
                setUnidades('');
                setModal({ tipo: 'variante', rutinaId: r.id });
              }}
            >
              Nueva variante
            </button>
            <p className="pt-rotulo">Estructura · {r.semanas == null ? 'semanas por definir' : `${r.semanas} semanas`}</p>
            {r.semanas != null && r.semanas > 0 ? (
              <div className="pt-semanas">
                {Array.from({ length: r.semanas }, (_, i) => (
                  <article key={i} className="pt-semana">Semana {i + 1}</article>
                ))}
              </div>
            ) : (
              <p className="muted">por definir</p>
            )}
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <div className="plantillas-boceto">
      <header className="pt-cabeza">
        <div>
          <p className="pt-kicker">Panel · Entrenamiento</p>
          <div className="pt-titulo-linea">
            <h1 className="h">Plantillas</h1>
            <p>
              {total} plantillas en total · {deBuho} de Buho Way 2026, sin duplicados
            </p>
          </div>
        </div>
        <div className="pt-cabeza-acciones">
          <button className="btn pt-btn-principal" type="button" onClick={() => void crearPlantilla(faseParaNueva())}>
            + Nueva plantilla
          </button>
          <button className="btn2" type="button" onClick={() => { setNombreFase(''); setModal({ tipo: 'fase' }); }}>
            Nueva fase
          </button>
        </div>
      </header>

      <section className="pt-resumen" aria-label="Resumen">
        <article><b className="pt-num-lima">{fases.length}</b> fases de Buho Way 2026</article>
        <article><b>{total}</b> plantillas en total</article>
        <article><b className="pt-num-naranja">{variantes.length}</b> variantes dentro de ellas</article>
        <article><b>{publicadas}</b> publicadas</article>
        <article><b>{borradores}</b> en borrador</article>
      </section>

      <div className="pt-herramientas">
        <label className="campo-buscar">
          <Icono nombre="lupa" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar plantilla o fase…" aria-label="Buscar plantilla o fase" />
          {q ? (
            <button type="button" className="btn-icono" aria-label="Limpiar búsqueda" onClick={() => setQ('')}>
              <Icono nombre="cerrar" />
            </button>
          ) : null}
        </label>
        <div className="pt-segmento" role="group" aria-label="Estado">
          <button type="button" aria-pressed={estadoFiltro === 'todas'} onClick={() => setEstadoFiltro('todas')}>Todas {total}</button>
          <button type="button" aria-pressed={estadoFiltro === 'publicada'} onClick={() => setEstadoFiltro('publicada')}>Publicadas {publicadas}</button>
          <button type="button" aria-pressed={estadoFiltro === 'borrador'} onClick={() => setEstadoFiltro('borrador')}>Borrador {borradores}</button>
        </div>
        <div className="pt-vista" role="group" aria-label="Vista">
          <button type="button" aria-pressed={vista === 'fases'} onClick={() => setVista('fases')}>Por fases</button>
          <button type="button" aria-pressed={vista === 'plana'} onClick={() => setVista('plana')}>Lista plana (hoy)</button>
        </div>
      </div>

      <div className="pt-filtros-extra">
        <div className="filtro-linea">
          <span>Enfoque</span>
          <div className="chips-scroll">
            {ENFOQUES.map((op) => (
              <button key={op.id} type="button" className="chip-filtro" aria-pressed={enfoque === op.id} onClick={() => setEnfoque(op.id)}>{op.label}</button>
            ))}
          </div>
        </div>
        <div className="filtro-linea">
          <span>Variante</span>
          <div className="chips-scroll">
            {ETIQUETAS.map((op) => (
              <button key={op.id} type="button" className="chip-filtro" aria-pressed={etiqueta === op.id} onClick={() => setEtiqueta(op.id)}>{op.label}</button>
            ))}
          </div>
        </div>
      </div>

      {aviso ? <p className="constructor-msg error">{aviso}</p> : null}

      {vista === 'plana' ? (
        <div className="pt-lista">
          {planas.length === 0 ? <p className="muted">Ninguna plantilla coincide con el filtro.</p> : planas.map(fila)}
        </div>
      ) : grupos.length === 0 ? (
        <p className="muted">Ninguna plantilla coincide con el filtro.</p>
      ) : (
        grupos.map((g) => {
          const abierta = abiertas.includes(g.id) || filtrando;
          const numero = g.real ? numeroVisible(g.nombre) || String(g.orden) : '—';
          const faseReal = g.real ? fases.find((f) => f.id === g.id) : null;
          return (
            <section key={g.id} className={`pt-fase${abierta ? ' abierta' : ''}`}>
              <button type="button" className="pt-fase-cabeza" aria-expanded={abierta} onClick={() => toggle(g.id)}>
                <span className={`pt-num${g.real ? '' : ' guion'}`}>{numero}</span>
                <span className="pt-fase-nombre">
                  <b>{g.real ? nombreVisible(g.nombre) : g.nombre}</b>
                  {g.descripcion ? <span>{g.descripcion}</span> : null}
                </span>
                <span className="pt-fase-meta">
                  <span className="pt-publicadas">{g.publicadas} publicadas</span>
                  <span className="pt-pill">{g.total} plantillas</span>
                  <span className="pt-chevron" aria-hidden="true" />
                </span>
              </button>
              {abierta ? (
                <div className="pt-fase-cuerpo">
                  {faseReal ? (
                    <div className="pt-fase-gestion">
                      <button type="button" className="btn2" onClick={() => moverOrden(faseReal, -1)}>Subir</button>
                      <button type="button" className="btn2" onClick={() => moverOrden(faseReal, 1)}>Bajar</button>
                      <button type="button" className="btn2" onClick={() => { setNombreFase(faseReal.nombre); setModal({ tipo: 'renombrar', faseId: faseReal.id }); }}>Renombrar</button>
                      <button type="button" className="btn2" onClick={() => void eliminarFase(faseReal)}>Eliminar</button>
                    </div>
                  ) : null}
                  {g.filas.length === 0 ? <p className="muted">Esta fase no tiene plantillas.</p> : g.filas.map(fila)}
                </div>
              ) : null}
            </section>
          );
        })
      )}

      {modal ? createPortal(
        <div className="editor-velo" role="presentation" onClick={() => setModal(null)}>
          <form
            className="card modal-fase"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (modal.tipo === 'fase') void crearFase();
              else if (modal.tipo === 'renombrar') void renombrar();
              else void crearVariante();
            }}
          >
            <h2>{modal.tipo === 'variante' ? 'Nueva variante' : modal.tipo === 'renombrar' ? 'Renombrar fase' : 'Nueva fase'}</h2>
            {modal.tipo === 'variante' ? (
              <>
                <p className="muted">Solo se guardan las etiquetas. Los días se quedan en la plantilla base.</p>
                <label>Población<Desplegable etiqueta="Población" valor={poblacion} alCambiar={setPoblacion} opciones={[{ valor: '', etiqueta: 'Sin cambio' }, { valor: 'mujeres', etiqueta: 'Mujeres' }, { valor: 'hombres', etiqueta: 'Hombres' }]} /></label>
                <label>Material<Desplegable etiqueta="Material" valor={material} alCambiar={setMaterial} opciones={[{ valor: '', etiqueta: 'Sin cambio' }, { valor: 'poco_material', etiqueta: 'Poco material' }, { valor: 'sin_maquinas', etiqueta: 'Sin máquinas' }]} /></label>
                <label>Unidades<Desplegable etiqueta="Unidades" valor={unidades} alCambiar={setUnidades} opciones={[{ valor: '', etiqueta: 'Sin cambio' }, { valor: 'kg', etiqueta: 'kg' }, { valor: 'lbs', etiqueta: 'lbs' }]} /></label>
              </>
            ) : (
              <label>Nombre<input value={nombreFase} onChange={(e) => setNombreFase(e.target.value)} autoFocus /></label>
            )}
            <div className="editor-pie">
              <button type="button" className="btn2" onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" className="btn">Guardar</button>
            </div>
          </form>
        </div>,
        document.body,
      ) : null}

      {varianteElegida && plantillaElegida ? createPortal(
        <div className="pt-asignar" role="status">
          <p>Asignar {plantillaElegida.nombre} · variante {textoVariante(varianteElegida)} · de la fase {faseElegida}. Solo falta el cliente.</p>
          <div>
            <a className="btn pt-btn-principal" href="/panel" onClick={() => mostrarCargando()}>Elegir cliente…</a>
            <button type="button" className="pt-cancelar" onClick={() => setElegida(null)}>Cancelar</button>
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
