'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { kilosObjetivo } from '@/lib/kilos';
import { segundosATexto } from '@/lib/descanso';
import { plataforma } from '@/config/plataforma';
import { Desplegable } from '@/components/Desplegable';
import { etiquetaEstadoRutina, type Enfoque } from '@/lib/etiquetas';
import type { InicialConstructor } from '@/lib/cargar-constructor';
import { esPendienteYohan, esPrescripcionVaga, restoTrasMarca } from '@/lib/pendiente-yohan';
import { mostrarCargando, ocultarCargando } from '@/lib/cargando-ui';
import { AvisoInterno } from './AvisoInterno';
import { BotonPendiente } from './BotonPendiente';
import { Globo } from './Globo';
import { CamposEditor } from './CamposEditor';
import { Icono } from './Iconos';
import { PrescripcionVista } from './PrescripcionVista';
import { SelectorEjercicio } from './SelectorEjercicio';

type Intensidad = 'pct_1rm' | 'rm' | 'rpe' | 'rir_fallo' | 'texto';

interface Dia {
  id: string;
  letra: string;
  foco: string | null;
  orden: number;
}
interface Ej {
  id: string;
  dia_id: string;
  ejercicio_id: string;
  orden: number;
  grupo: string | null;
  intensidad_tipo: Intensidad;
  nota: string | null;
  video_url: string | null;
  revisar: boolean;
  nombre?: string;
}
interface Pres {
  id?: string;
  rutina_ejercicio_id: string;
  semana: number;
  series: string | null;
  reps: string | null;
  pct: number | null;
  rm: number | null;
  tecnica: string | null;
  descanso_seg: number | null;
  omitir: boolean;
  texto: string;
}
interface Catalogo {
  id: string;
  nombre: string;
  patron?: string | null;
}

const ENFOQUES: { id: Enfoque; label: string }[] = [
  { id: 'fuerza', label: 'Fuerza' },
  { id: 'hipertrofia', label: 'Hipertrofia' },
  { id: 'transicion', label: 'Transición fuerza → hipertrofia' },
  { id: 'tecnica', label: 'Técnica' },
];

function filtrarEntero(valor: string) {
  return valor.replace(/\D/g, '');
}

function filtrarReps(valor: string) {
  return valor.replace(/[^\d/]/g, '');
}

function filtrarDecimal(valor: string) {
  const limpio = valor.replace(/[^\d.]/g, '');
  const corte = limpio.indexOf('.');
  if (corte < 0) return limpio;
  return `${limpio.slice(0, corte + 1)}${limpio.slice(corte + 1).replace(/\./g, '')}`;
}

export function ConstructorRutina({
  rutinaId,
  clienteNombre,
  esFase,
  faseOrden,
  faseNombre,
  pertenencia,
  inicial,
  rmEjemplo = 100,
}: {
  rutinaId: string;
  clienteNombre?: string;
  esFase?: boolean;
  faseOrden?: number | null;
  faseNombre?: string | null;
  pertenencia?: string | null;
  inicial?: InicialConstructor;
  rmEjemplo?: number;
}) {
  const supabase = useMemo(() => crearClienteNavegador(), []);
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [semanas, setSemanas] = useState<number | null>(inicial?.semanas ?? null);
  const [descarga, setDescarga] = useState<number | null>(inicial?.descarga ?? null);
  const [enfoque, setEnfoque] = useState<Enfoque>(inicial?.enfoque ?? 'fuerza');
  const [dias, setDias] = useState<Dia[]>(inicial?.dias ?? []);
  const [ejercicios, setEjercicios] = useState<Ej[]>((inicial?.ejercicios as Ej[] | undefined) ?? []);
  const [pres, setPres] = useState<Pres[]>((inicial?.pres as Pres[] | undefined) ?? []);
  const [catalogo, setCatalogo] = useState<Catalogo[]>(inicial?.catalogo ?? []);
  const [diaActivo, setDiaActivo] = useState<string | null>(inicial?.dias[0]?.id ?? null);
  const [editando, setEditando] = useState<string | null>(null);
  const [semanaEdit, setSemanaEdit] = useState(1);
  const [rmMap, setRmMap] = useState<Record<string, number>>({});
  const [estado, setEstado] = useState(inicial?.estado ?? 'borrador');
  const [msg, setMsg] = useState('');
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const [avisoCierre, setAvisoCierre] = useState(false);
  const [pendiente, setPendiente] = useState<string | null>(null);
  const [pctTexto, setPctTexto] = useState<string | null>(null);
  const firma = JSON.stringify({ nombre, semanas, descarga, enfoque, dias, ejercicios, pres });
  const firmaRef = useRef(firma);
  firmaRef.current = firma;
  const [firmaGuardada, setFirmaGuardada] = useState<string | null>(null);
  const sucio = firmaGuardada != null && firma !== firmaGuardada;
  const semanasTabla = semanas ?? 0;

  const cargar = useCallback(async () => {
    const { data: r } = await supabase.from('rutinas').select('*').eq('id', rutinaId).maybeSingle();
    if (r) {
      setNombre(r.nombre as string);
      setSemanas((r.semanas as number | null) ?? null);
      setDescarga((r.semana_descarga as number | null) ?? null);
      setEnfoque((r.enfoque as Enfoque) ?? 'fuerza');
      setEstado(r.estado as string);
      if (r.cliente_id) {
        const { data: rms } = await supabase.from('rm_referencia').select('ejercicio_id, kg').eq('cliente_id', r.cliente_id);
        const m: Record<string, number> = {};
        for (const x of rms ?? []) m[x.ejercicio_id as string] = Number(x.kg);
        setRmMap(m);
      }
    }
    const { data: ds } = await supabase.from('rutina_dias').select('*').eq('rutina_id', rutinaId).order('orden');
    setDias((ds ?? []) as Dia[]);
    setDiaActivo((prev) => prev ?? ((ds?.[0]?.id as string | undefined) ?? null));
    const diaIds = (ds ?? []).map((d) => d.id);
    const { data: ejs } = diaIds.length
      ? await supabase.from('rutina_ejercicios').select('*, ejercicios(nombre)').in('dia_id', diaIds).order('orden')
      : { data: [] };
    const lista = (ejs ?? []).map((e) => ({ ...e, nombre: (e.ejercicios as { nombre?: string } | null)?.nombre }));
    setEjercicios(lista as Ej[]);
    const ejIds = lista.map((e) => e.id as string);
    const { data: ps } = ejIds.length ? await supabase.from('prescripciones').select('*').in('rutina_ejercicio_id', ejIds) : { data: [] };
    setPres((ps ?? []) as Pres[]);
    const { data: cat } = await supabase.from('ejercicios').select('id, nombre, patron').order('nombre');
    setCatalogo((cat ?? []) as Catalogo[]);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setFirmaGuardada(firmaRef.current));
    });
  }, [rutinaId, supabase]);

  useEffect(() => {
    if (!inicial) void cargar();
    else setFirmaGuardada(firmaRef.current);
  }, [cargar, inicial]);

  useEffect(() => {
    setPctTexto(null);
  }, [semanaEdit, editando]);

  async function conPendiente(id: string, fn: () => Promise<void>) {
    if (pendiente) return;
    setPendiente(id);
    setMsg('');
    try {
      await fn();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'No se pudo completar.');
    } finally {
      setPendiente(null);
    }
  }

  async function guardarTodo() {
    const antes = firmaGuardada
      ? (JSON.parse(firmaGuardada) as { dias: Dia[]; ejercicios: Ej[]; pres: Pres[] })
      : { dias: [], ejercicios: [], pres: [] };
    const { error } = await supabase
      .from('rutinas')
      .update({ nombre, semanas, semana_descarga: descarga, enfoque, actualizado_en: new Date().toISOString() })
      .eq('id', rutinaId);
    if (error) {
      setMsg(error.message);
      return false;
    }
    for (const d of dias) {
      const prev = antes.dias.find((x) => x.id === d.id);
      if (prev && prev.foco === d.foco && prev.letra === d.letra && prev.orden === d.orden) continue;
      const { error: fallo } = await supabase.from('rutina_dias').update({ foco: d.foco, letra: d.letra, orden: d.orden }).eq('id', d.id);
      if (fallo) {
        setMsg(fallo.message);
        return false;
      }
    }
    for (const e of ejercicios) {
      const prev = antes.ejercicios.find((x) => x.id === e.id);
      if (prev && JSON.stringify(prev) === JSON.stringify(e)) continue;
      const { error: fallo } = await supabase
        .from('rutina_ejercicios')
        .update({
          ejercicio_id: e.ejercicio_id,
          orden: e.orden,
          grupo: e.grupo,
          intensidad_tipo: e.intensidad_tipo,
          nota: e.nota,
          video_url: e.video_url,
          revisar: e.revisar,
        })
        .eq('id', e.id);
      if (fallo) {
        setMsg(fallo.message);
        return false;
      }
    }
    for (const p of pres) {
      if (!p.id) continue;
      const prev = antes.pres.find((x) => x.id === p.id);
      if (prev && JSON.stringify(prev) === JSON.stringify(p)) continue;
      const { error: fallo } = await supabase
        .from('prescripciones')
        .update({
          series: p.series,
          reps: p.reps,
          pct: p.pct,
          rm: p.rm,
          tecnica: p.tecnica,
          descanso_seg: p.descanso_seg,
          omitir: p.omitir,
          texto: p.texto,
          semana: p.semana,
        })
        .eq('id', p.id);
      if (fallo) {
        setMsg(fallo.message);
        return false;
      }
    }
    setFirmaGuardada(firma);
    setMsg('Borrador guardado');
    return true;
  }

  async function agregarDia() {
    const letra = String.fromCharCode(65 + dias.length);
    const { data } = await supabase
      .from('rutina_dias')
      .insert({ rutina_id: rutinaId, letra, orden: dias.length, foco: '' })
      .select('*')
      .single();
    if (data) {
      setDias((d) => [...d, data as Dia]);
      setDiaActivo(data.id as string);
      setEditando(null);
      setHojaAbierta(false);
    }
  }

  async function agregarEjercicio() {
    if (!diaActivo || !catalogo[0]) return;
    const orden = ejercicios.filter((e) => e.dia_id === diaActivo).length + 1;
    const { data } = await supabase
      .from('rutina_ejercicios')
      .insert({
        dia_id: diaActivo,
        ejercicio_id: catalogo[0].id,
        orden,
        intensidad_tipo: 'pct_1rm',
        revisar: false,
      })
      .select('*')
      .single();
    if (!data) return;
    const nuevas: Pres[] = [];
    for (let s = 1; s <= (semanas ?? plataforma.semanasPorDefecto); s++) {
      const { data: p } = await supabase
        .from('prescripciones')
        .insert({ rutina_ejercicio_id: data.id, semana: s, texto: '' })
        .select('*')
        .single();
      if (p) nuevas.push(p as Pres);
    }
    setEjercicios((e) => [...e, { ...(data as Ej), nombre: catalogo[0].nombre }]);
    setPres((p) => [...p, ...nuevas]);
    setEditando(data.id as string);
    setHojaAbierta(true);
  }

  async function borrarEjercicio(id: string) {
    if (!confirm('¿Borrar este ejercicio?')) return;
    await supabase.from('rutina_ejercicios').delete().eq('id', id);
    setEjercicios((e) => e.filter((x) => x.id !== id));
    setPres((p) => p.filter((x) => x.rutina_ejercicio_id !== id));
    if (editando === id) setEditando(null);
  }

  const ejDelDia = ejercicios.filter((e) => e.dia_id === diaActivo).sort((a, b) => a.orden - b.orden);
  const actual = ejercicios.find((e) => e.id === editando);
  const presActual = pres.find((p) => p.rutina_ejercicio_id === editando && p.semana === semanaEdit);

  function patchDia(id: string, patch: Partial<Dia>) {
    setDias((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function patchEj(id: string, patch: Partial<Ej>) {
    setEjercicios((e) => e.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function patchPres(p: Pres, patch: Partial<Pres>) {
    const next = { ...p, ...patch };
    next.texto = armarTexto(next);
    setPres((xs) => xs.map((x) => (x.id === p.id ? next : x)));
  }

  function armarTexto(p: Pres): string {
    if (p.omitir) return '—';
    const seriesReps = [p.series, p.reps].filter(Boolean).join(' × ');
    const extra = p.pct != null && Number.isFinite(p.pct) ? ` · ${Math.round(p.pct * 100)} %` : p.rm ? ` · ${p.rm}RM` : '';
    return `${seriesReps}${extra}`.trim();
  }

  async function copiarSemanas() {
    if (!presActual || !editando) return;
    setPres((actuales) => actuales.map((p) => {
      if (p.rutina_ejercicio_id !== editando) return p;
      const copia = { ...presActual, semana: p.semana, id: p.id };
      copia.texto = armarTexto(copia);
      return copia;
    }));
  }

  async function publicar() {
    const url = esFase ? null : `/api/panel/rutinas/${rutinaId}/publicar`;
    if (!url) {
      setMsg('Usa «Publicar fase» en el programa.');
      return;
    }
    const res = await fetch(url, { method: 'POST' });
    const json = await res.json();
    setMsg(json.ok ? 'Publicada' : json.mensaje ?? 'No se pudo publicar.');
    if (json.ok) setEstado('publicada');
  }

  async function guardarPlantilla() {
    const res = await fetch(`/api/panel/rutinas/${rutinaId}/copiar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ es_plantilla: true, nombre: `${nombre} (plantilla)` }),
    });
    const json = await res.json();
    setMsg(json.ok ? 'Guardada como plantilla' : json.mensaje ?? 'No se pudo guardar.');
  }

  function cambiarDia(id: string) {
    mostrarCargando();
    setDiaActivo(id);
    const sigue = ejercicios.some((e) => e.id === editando && e.dia_id === id);
    if (!sigue) {
      setEditando(null);
      setHojaAbierta(false);
    }
    requestAnimationFrame(() => ocultarCargando());
  }

  useEffect(() => {
    if (!hojaAbierta) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prev;
    };
  }, [hojaAbierta]);

  function restaurar() {
    if (!firmaGuardada) return;
    const antes = JSON.parse(firmaGuardada) as {
      nombre: string;
      semanas: number | null;
      descarga: number | null;
      enfoque: Enfoque;
      dias: Dia[];
      ejercicios: Ej[];
      pres: Pres[];
    };
    setNombre(antes.nombre);
    setSemanas(antes.semanas);
    setDescarga(antes.descarga);
    setEnfoque(antes.enfoque);
    setDias(antes.dias);
    setEjercicios(antes.ejercicios);
    setPres(antes.pres);
    setPctTexto(null);
  }

  function cerrarHoja() {
    if (sucio) {
      setAvisoCierre(true);
      return;
    }
    setHojaAbierta(false);
  }

  function descartarYCerrar() {
    restaurar();
    setAvisoCierre(false);
    setHojaAbierta(false);
  }

  async function guardarYCerrar() {
    const ok = await guardarTodo();
    if (!ok) return;
    setAvisoCierre(false);
    setHojaAbierta(false);
  }

  function abrirHoja(id: string) {
    setEditando(id);
    setHojaAbierta(true);
  }

  function portalHoja(nodo: ReactNode) {
    if (hojaAbierta && typeof document !== 'undefined') {
      return createPortal(nodo, document.body);
    }
    return null;
  }

  function presVacia(p?: Pres) {
    return !p || ((!p.texto || esPrescripcionVaga(p.texto)) && !p.series && !p.reps && p.pct == null && !p.tecnica);
  }

  const porRevisar = ejercicios.filter((e) => e.revisar).length;

  const rm = actual ? rmMap[actual.ejercicio_id] ?? (esFase ? rmEjemplo : 0) : rmEjemplo;
  const pctOk = presActual?.pct != null && Number.isFinite(presActual.pct);
  const kilosCalc = actual && pctOk ? kilosObjetivo(rm, presActual.pct as number) : null;
  const kilos = kilosCalc != null && Number.isFinite(kilosCalc) ? kilosCalc : null;

  const titulo = esFase && faseOrden && faseNombre ? (
    <>
      Fase {faseOrden} · <em>{faseNombre}</em>
    </>
  ) : clienteNombre ? (
    <>
      Rutina de <em>{clienteNombre}</em>
    </>
  ) : (
    nombre || 'Rutina'
  );

  return (
    <div className={`constructor${hojaAbierta ? ' hoja-abierta' : ''}`}>
      <p className="aviso-escritorio muted constructor-aviso">Mejor en computadora.</p>
      <div className="constructor-tope">
        <h1 className="h constructor-titulo">{titulo}</h1>
        <div className="constructor-acciones">
          <BotonPendiente className="btn2 btn-con-icono" type="button" cargando={pendiente === 'plantilla'} etiquetaCargando="Guardando…" onClick={() => void conPendiente('plantilla', guardarPlantilla)}>
            <Icono nombre="plantilla" /> Plantilla
          </BotonPendiente>
          <BotonPendiente className="btn btn-con-icono" type="button" cargando={pendiente === 'guardar'} etiquetaCargando="Guardando…" onClick={() => void conPendiente('guardar', async () => { await guardarTodo(); })}>
            <Icono nombre="borrador" /> Guardar
          </BotonPendiente>
          {!esFase ? (
            <BotonPendiente className="btn btn-con-icono" type="button" cargando={pendiente === 'publicar'} etiquetaCargando="Publicando…" onClick={() => void conPendiente('publicar', publicar)}>
              <Icono nombre="publicar" /> Publicar
            </BotonPendiente>
          ) : null}
        </div>
      </div>
      {pertenencia ? <p className="muted">{pertenencia}</p> : null}
      {msg ? <p className={`constructor-msg ${msg.toLowerCase().includes('no se') || msg.toLowerCase().includes('error') ? 'error' : 'muted'}`}>{msg} · {etiquetaEstadoRutina(estado)}</p> : null}
      {sucio ? <p className="muted">Cambios sin guardar</p> : null}
      {porRevisar ? (
        <p className="leyenda-revisar">
          {porRevisar} ejercicio{porRevisar === 1 ? '' : 's'} marcado{porRevisar === 1 ? '' : 's'} «revisar» (etiqueta naranja). Es solo informativo: Fred y Yohan pueden quitarla y publicar igual; no bloquea editar.
        </p>
      ) : null}
      <p className="leyenda-revisar">
        «Falta prescripción» significa que todavía no hay series y repeticiones escritas. Fred o Yohan pueden llenarlas en el ejercicio. Si nadie las escribe, el cliente no ve una prescripción inventada.
      </p>
      <details className="constructor-leyendas">
        <summary>Qué significan las marcas</summary>
        {porRevisar ? (
          <p>
            {porRevisar} ejercicio{porRevisar === 1 ? '' : 's'} «revisar». Fred o Yohan pueden quitarla; no bloquea publicar.
          </p>
        ) : null}
        <p>
          «Falta prescripción»: aún no hay series y reps. Fred o Yohan pueden escribirlas. Si nadie las llena, el cliente no ve un texto inventado.
        </p>
      </details>

      <div className="card constructor-meta" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, alignItems: 'end' }}>
        <label className="f" style={{ gridColumn: 'span 2' }}>
          Nombre de la rutina
          <input className="in" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <label className="f">
          Semanas
          <Desplegable
            etiqueta="Semanas"
            valor={semanas == null ? '' : String(semanas)}
            alCambiar={(valor) => setSemanas(valor ? Number(valor) : null)}
            opciones={[{ valor: '', etiqueta: 'por definir' }, ...[3, 4, 5, 6, 7, 8].map((n) => ({ valor: String(n), etiqueta: String(n) }))]}
          />
        </label>
        <label className="f">
          Semana de descarga
          <Desplegable
            etiqueta="Semana de descarga"
            valor={descarga == null ? '' : String(descarga)}
            alCambiar={(valor) => setDescarga(valor ? Number(valor) : null)}
            opciones={[{ valor: '', etiqueta: 'Ninguna' }, ...Array.from({ length: semanasTabla }, (_, i) => ({ valor: String(i + 1), etiqueta: `Semana ${i + 1}` }))]}
          />
        </label>
        <div className="constructor-enfoques" style={{ gridColumn: 'span 4', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ENFOQUES.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setEnfoque(e.id)}
              style={{
                minHeight: 42,
                borderRadius: 6,
                border: '1px solid',
                borderColor: enfoque === e.id ? '#d7e4b4' : 'var(--card-borde)',
                background: enfoque === e.id ? '#eef6de' : '#fff',
                color: 'var(--tinta)',
                fontWeight: 700,
                padding: '0 16px',
                boxShadow: '0 1px 2px rgba(28, 30, 26, 0.06)',
              }}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '2px solid var(--linea)' }}>
        {dias.map((d) => (
          <button
            key={d.id}
            type="button"
            className="pestana-dia"
            onClick={() => cambiarDia(d.id)}
            style={{
              minHeight: 48,
              padding: '0 22px',
              border: 0,
              borderBottom: diaActivo === d.id ? '5px solid var(--lima)' : '5px solid transparent',
              background: 'none',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 800,
              fontSize: 24,
              color: diaActivo === d.id ? 'var(--tinta)' : 'var(--gris)',
            }}
          >
            Día {d.letra}
          </button>
        ))}
        <button type="button" className="pestana-dia btn-con-icono" onClick={() => void conPendiente('dia', agregarDia)}>
          {pendiente === 'dia' ? 'Agregando…' : (
            <>
              <Icono nombre="mas" /> Día
            </>
          )}
        </button>
      </div>
      {diaActivo ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 480 }}>
          {esPendienteYohan(dias.find((d) => d.id === diaActivo)?.foco) ? (
            <AvisoInterno>
              Falta el foco de este día (qué músculos o el propósito). Fred o Yohan pueden escribirlo aquí. Si nadie lo llena, el cliente no ve esa marca.
              {restoTrasMarca(dias.find((d) => d.id === diaActivo)?.foco) ? ` ${restoTrasMarca(dias.find((d) => d.id === diaActivo)?.foco)}` : ''}
            </AvisoInterno>
          ) : null}
          <label className="f">
            Foco del día
            <input
              className="in"
              defaultValue={esPendienteYohan(dias.find((d) => d.id === diaActivo)?.foco) ? '' : (dias.find((d) => d.id === diaActivo)?.foco ?? '')}
              key={diaActivo}
              placeholder={esPendienteYohan(dias.find((d) => d.id === diaActivo)?.foco) ? 'Falta el foco' : ''}
              onBlur={(e) => void patchDia(diaActivo, { foco: e.target.value || null })}
            />
          </label>
        </div>
      ) : null}

      <div className="constructor-cuerpo" style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
        {ejDelDia.length === 0 ? <p className="constructor-sin-ejercicios">Sin ejercicios todavía</p> : null}
        <div className="card constructor-tabla-card" style={{ flex: '999 1 640px', minWidth: 0, padding: 0, overflow: 'hidden' }}>
          <ul className="constructor-lista">
            {ejDelDia.map((e, i) => {
              const p = pres.find((x) => x.rutina_ejercicio_id === e.id && x.semana === 1);
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    className="constructor-lista-item"
                    onClick={() => abrirHoja(e.id)}
                  >
                    <span className="constructor-lista-texto">
                      <b>
                        {e.grupo ? `${e.orden}${e.grupo}` : e.orden || i + 1}. {e.nombre}
                      </b>
                      <span className="muted">
                        {esPendienteYohan(e.nota) || esPrescripcionVaga(p?.texto) || presVacia(p) ? (
                          'Falta prescripción'
                        ) : (
                          <PrescripcionVista texto={p?.texto} series={p?.series} reps={p?.reps} pct={p?.pct} rm={p?.rm} />
                        )}
                      </span>
                    </span>
                    <Icono nombre="flecha" className="icono lista-flecha" />
                  </button>
                </li>
              );
            })}
            </ul>
          <div className="constructor-tabla-scroll" style={{ overflowX: 'auto', padding: '0 12px' }}>
            <table className="tabla constructor-tabla" style={{ fontSize: 15 }}>
              <thead>
                <tr>
                  <th rowSpan={2}>#</th>
                  <th rowSpan={2}>Ejercicio</th>
                  {semanasTabla ? (
                    <th colSpan={semanasTabla} className="th-semana">
                      Semana
                    </th>
                  ) : null}
                  <th rowSpan={2} />
                </tr>
                <tr>
                  {Array.from({ length: semanasTabla }, (_, i) => (
                    <th key={i} className="th-sem-num" style={descarga === i + 1 ? { background: '#f1ece0' } : undefined}>
                      {i + 1}
                      {descarga === i + 1 ? <span className="muted"> ↓</span> : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ejDelDia.map((e, i) => (
                  <tr
                    key={e.id}
                    className={`fila-ejercicio${editando === e.id ? ' seleccionada' : ''}`}
                    onClick={() => abrirHoja(e.id)}
                  >
                    <td>
                      <b>
                        {e.grupo ? `${e.orden}${e.grupo}` : e.orden || i + 1}
                      </b>
                    </td>
                    <td>
                      <b>{e.nombre}</b>
                      {e.revisar ? <span className="est alerta">revisar · principal</span> : null}
                      {esPendienteYohan(e.nota) || Array.from({ length: semanasTabla }, (_, s) => pres.find((x) => x.rutina_ejercicio_id === e.id && x.semana === s + 1)).every((p) => presVacia(p) || esPrescripcionVaga(p?.texto)) ? (
                        <span className="est alerta">Falta prescripción</span>
                      ) : null}
                    </td>
                    {Array.from({ length: semanasTabla }, (_, s) => {
                      const p = pres.find((x) => x.rutina_ejercicio_id === e.id && x.semana === s + 1);
                      return (
                        <td key={s} style={descarga === s + 1 ? { background: '#f7f3ea' } : undefined}>
                          {esPendienteYohan(e.nota) || esPrescripcionVaga(p?.texto) || presVacia(p) ? (
                            ''
                          ) : (
                            <PrescripcionVista texto={p?.texto} series={p?.series} reps={p?.reps} pct={p?.pct} rm={p?.rm} />
                          )}
                        </td>
                      );
                    })}
                    <td>
                      <div className="acciones-fila">
                        <Globo texto="Editar ejercicio">
                          <button
                            type="button"
                            className="btn-fantasma"
                            title="Editar ejercicio"
                            aria-label={`Editar ${e.nombre}`}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              abrirHoja(e.id);
                            }}
                          >
                            <Icono nombre="lapiz" />
                          </button>
                        </Globo>
                        <Globo texto="Borrar ejercicio">
                          <button
                            type="button"
                            className="btn-fantasma"
                            title="Borrar ejercicio"
                            aria-label={`Borrar ${e.nombre}`}
                            onClick={(ev) => {
                              ev.stopPropagation();
                              void borrarEjercicio(e.id);
                            }}
                          >
                            <Icono nombre="basura" />
                          </button>
                        </Globo>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '16px 22px', borderTop: '1px solid var(--linea)' }}>
            <BotonPendiente className="btn2 btn-con-icono" type="button" cargando={pendiente === 'ej'} etiquetaCargando="Agregando…" onClick={() => void conPendiente('ej', agregarEjercicio)}>
              <Icono nombre="mas" /> Ejercicio
            </BotonPendiente>
          </div>
        </div>

        {portalHoja(
        <>
        {hojaAbierta ? <div className="editor-velo" aria-hidden="true" onClick={cerrarHoja} /> : null}
        {avisoCierre ? (
          <div className="aviso-app" role="dialog" aria-labelledby="aviso-cierre-titulo">
            <h2 id="aviso-cierre-titulo" className="h" style={{ fontSize: 32 }}>Cambios sin guardar</h2>
            <p>Hay cambios que todavía no se enviaron. Puedes guardarlos, descartarlos o seguir editando.</p>
            <div className="aviso-app-acciones">
              <button type="button" className="btn" onClick={() => void guardarYCerrar()}>Guardar</button>
              <button type="button" className="btn2" onClick={descartarYCerrar}>Descartar</button>
              <button type="button" className="btn2" onClick={() => setAvisoCierre(false)}>Seguir editando</button>
            </div>
          </div>
        ) : null}
        {actual && presActual ? (
          <form
            className={`card editor-ejercicio${hojaAbierta ? ' abierto' : ''}`}
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="editor-cabeza">
              <div className="lbl">{sucio ? 'Cambios sin guardar' : 'Editando el ejercicio'}</div>
              <button type="button" className="btn-icono cerrar-hoja" aria-label="Cerrar" onClick={cerrarHoja}>
                <Icono nombre="cerrar" />
              </button>
            </div>
            <CamposEditor>
            <SelectorEjercicio
              valor={actual.ejercicio_id}
              catalogo={catalogo}
              onChange={(id, nom) => {
                void patchEj(actual.id, { ejercicio_id: id });
                setEjercicios((xs) => xs.map((x) => (x.id === actual.id ? { ...x, ejercicio_id: id, nombre: nom } : x)));
              }}
            />
            <label className="f">
              Intensidad por
              <Desplegable
                etiqueta="Intensidad"
                valor={actual.intensidad_tipo}
                alCambiar={(valor) => void patchEj(actual.id, { intensidad_tipo: valor as Intensidad })}
                opciones={[
                  { valor: 'pct_1rm', etiqueta: '% del 1RM' },
                  { valor: 'rm', etiqueta: 'RM' },
                  { valor: 'rpe', etiqueta: 'RPE' },
                  { valor: 'rir_fallo', etiqueta: 'RIR / al fallo' },
                  { valor: 'texto', etiqueta: 'Texto' },
                ]}
              />
            </label>
            <label className="f">
              Semana
              <Desplegable
                etiqueta="Semana"
                valor={String(semanaEdit)}
                alCambiar={(valor) => setSemanaEdit(Number(valor))}
                opciones={Array.from({ length: Math.max(semanasTabla, 1) }, (_, i) => ({ valor: String(i + 1), etiqueta: String(i + 1) }))}
              />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
              <label className="f">
                Series
                <input
                  className="in"
                  inputMode="numeric"
                  value={presActual.series ?? ''}
                  onBeforeInput={(e) => {
                    const data = (e.nativeEvent as InputEvent).data;
                    if (data && /\D/.test(data)) e.preventDefault();
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    patchPres(presActual, { series: filtrarEntero(e.clipboardData.getData('text')) || null });
                  }}
                  onChange={(e) => patchPres(presActual, { series: filtrarEntero(e.target.value) || null })}
                />
              </label>
              <label className="f">
                Reps
                <input
                  className="in"
                  inputMode="numeric"
                  value={presActual.reps ?? ''}
                  onBeforeInput={(e) => {
                    const data = (e.nativeEvent as InputEvent).data;
                    if (data && /[^\d/]/.test(data)) e.preventDefault();
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    patchPres(presActual, { reps: filtrarReps(e.clipboardData.getData('text')) || null });
                  }}
                  onChange={(e) => patchPres(presActual, { reps: filtrarReps(e.target.value) || null })}
                />
              </label>
              <label className="f">
                % 1RM
                <input
                  className="in"
                  inputMode="decimal"
                  value={pctTexto ?? (pctOk ? String(Math.round((presActual.pct as number) * 1000) / 10) : '')}
                  onBeforeInput={(e) => {
                    const data = (e.nativeEvent as InputEvent).data;
                    if (data && /[^\d.]/.test(data)) e.preventDefault();
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const texto = filtrarDecimal(e.clipboardData.getData('text'));
                    setPctTexto(texto);
                    const n = texto === '' || texto === '.' ? null : Number(texto);
                    patchPres(presActual, { pct: n != null && Number.isFinite(n) ? n / 100 : null });
                  }}
                  onChange={(e) => {
                    const texto = filtrarDecimal(e.target.value);
                    setPctTexto(texto);
                    const n = texto === '' || texto === '.' ? null : Number(texto);
                    patchPres(presActual, { pct: n != null && Number.isFinite(n) ? n / 100 : null });
                  }}
                />
              </label>
            </div>
            <label className="f">
              Técnica
              <input className="in" value={presActual.tecnica ?? ''} onChange={(e) => void patchPres(presActual, { tecnica: e.target.value })} />
            </label>
            <label className="f">
              Descanso
              <input className="in" value={segundosATexto(presActual.descanso_seg)} onChange={(e) => {
                const [m, s] = e.target.value.split(':').map(Number);
                void patchPres(presActual, { descanso_seg: (m || 0) * 60 + (s || 0) });
              }} />
            </label>
            <label className="f">
              Grupo
              <input className="in" value={actual.grupo ?? ''} onChange={(e) => void patchEj(actual.id, { grupo: e.target.value || null })} />
            </label>
            <label className="f">
              Nota
              <input className="in" value={actual.nota ?? ''} onChange={(e) => void patchEj(actual.id, { nota: e.target.value })} />
            </label>
            <label className="f">
              Video
              <input className="in" value={actual.video_url ?? ''} onChange={(e) => void patchEj(actual.id, { video_url: e.target.value })} />
            </label>
            <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontWeight: 600 }}>
              <input type="checkbox" checked={actual.revisar} onChange={(e) => void patchEj(actual.id, { revisar: e.target.checked })} style={{ width: 22, height: 22, accentColor: 'var(--lima)' }} />
              Marcar «revisar»
            </label>
            {pctOk ? (
              <div style={{ fontSize: 14, color: 'var(--gris)' }}>
                Con el 1RM ({rm} kg), esta semana sale en <b style={{ color: 'var(--tinta)' }}>{kilos != null ? `${kilos} kg` : '—'}</b>.
              </div>
            ) : null}
            {esPendienteYohan(actual.nota) || presVacia(presActual) ? (
              <AvisoInterno>
                Faltan series y repeticiones de este ejercicio. Fred o Yohan pueden escribirlas aquí. Si nadie las llena, el cliente no ve una prescripción inventada. No copies un texto genérico a las demás semanas.
              </AvisoInterno>
            ) : null}
            </CamposEditor>
            <div className="editor-pie">
              <BotonPendiente className="btn btn-con-icono" type="button" cargando={pendiente === 'guardar'} etiquetaCargando="Guardando…" onClick={() => void conPendiente('guardar', async () => { await guardarTodo(); })}>
                Guardar
              </BotonPendiente>
              <BotonPendiente className="btn btn-con-icono" type="button" cargando={pendiente === 'copiar'} etiquetaCargando="Copiando…" onClick={() => void conPendiente('copiar', copiarSemanas)}>
                <Icono nombre="copiar" /> Copiar a todas las semanas
              </BotonPendiente>
            </div>
          </form>
        ) : (
          <p className="muted editor-vacio">Elige un ejercicio para editarlo.</p>
        )}
        </>,
        )}
      </div>
    </div>
  );
}
