'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { kilosObjetivo } from '@/lib/kilos';
import { segundosATexto } from '@/lib/descanso';
import { plataforma } from '@/config/plataforma';
import { etiquetaEstadoRutina, type Enfoque } from '@/lib/etiquetas';
import type { InicialConstructor } from '@/lib/cargar-constructor';

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
}

const ENFOQUES: { id: Enfoque; label: string }[] = [
  { id: 'fuerza', label: 'Fuerza' },
  { id: 'hipertrofia', label: 'Hipertrofia' },
  { id: 'transicion', label: 'Transición fuerza → hipertrofia' },
  { id: 'tecnica', label: 'Técnica' },
];

export function ConstructorRutina({
  rutinaId,
  clienteNombre,
  esFase,
  faseOrden,
  faseNombre,
  inicial,
  rmEjemplo = 100,
}: {
  rutinaId: string;
  clienteNombre?: string;
  esFase?: boolean;
  faseOrden?: number | null;
  faseNombre?: string | null;
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
  const saltarAuto = useRef(true);
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
    const { data: cat } = await supabase.from('ejercicios').select('id, nombre').order('nombre');
    setCatalogo((cat ?? []) as Catalogo[]);
  }, [rutinaId, supabase]);

  useEffect(() => {
    if (!inicial) void cargar();
  }, [cargar, inicial]);

  async function guardarMeta() {
    await supabase
      .from('rutinas')
      .update({ nombre, semanas, semana_descarga: descarga, enfoque, actualizado_en: new Date().toISOString() })
      .eq('id', rutinaId);
    setMsg('Borrador guardado');
  }

  useEffect(() => {
    if (saltarAuto.current) {
      saltarAuto.current = false;
      return;
    }
    const t = setTimeout(() => void guardarMeta(), 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nombre, semanas, descarga, enfoque]);

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

  async function patchDia(id: string, patch: Partial<Dia>) {
    await supabase.from('rutina_dias').update(patch).eq('id', id);
    setDias((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  async function patchEj(id: string, patch: Partial<Ej>) {
    await supabase.from('rutina_ejercicios').update(patch).eq('id', id);
    setEjercicios((e) => e.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  async function patchPres(p: Pres, patch: Partial<Pres>) {
    const next = { ...p, ...patch };
    next.texto = armarTexto(next);
    if (p.id) await supabase.from('prescripciones').update(next).eq('id', p.id);
    setPres((xs) => xs.map((x) => (x.id === p.id ? next : x)));
  }

  function armarTexto(p: Pres): string {
    if (p.omitir) return '—';
    const seriesReps = [p.series, p.reps].filter(Boolean).join(' × ');
    const extra = p.pct ? ` · ${Math.round(p.pct * 100)} %` : p.rm ? ` · ${p.rm}RM` : '';
    return `${seriesReps}${extra}`.trim();
  }

  async function copiarSemanas() {
    if (!presActual || !editando) return;
    for (let s = 1; s <= (semanas ?? plataforma.semanasPorDefecto); s++) {
      const existente = pres.find((p) => p.rutina_ejercicio_id === editando && p.semana === s);
      const copia = { ...presActual, semana: s, id: existente?.id };
      copia.texto = armarTexto(copia);
      if (existente?.id) await supabase.from('prescripciones').update(copia).eq('id', existente.id);
      else {
        const { data } = await supabase.from('prescripciones').insert({ ...copia, id: undefined, rutina_ejercicio_id: editando }).select('*').single();
        if (data) setPres((p) => [...p.filter((x) => !(x.rutina_ejercicio_id === editando && x.semana === s)), data as Pres]);
      }
    }
    await cargar();
  }

  async function publicar() {
    const url = esFase ? null : `/api/panel/rutinas/${rutinaId}/publicar`;
    if (!url) {
      setMsg('Usa «Publicar fase» en el programa.');
      return;
    }
    const res = await fetch(url, { method: 'POST' });
    const json = await res.json();
    setMsg(json.ok ? 'Publicada' : json.mensaje);
    if (json.ok) setEstado('publicada');
  }

  async function guardarPlantilla() {
    const res = await fetch(`/api/panel/rutinas/${rutinaId}/copiar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ es_plantilla: true, nombre: `${nombre} (plantilla)` }),
    });
    const json = await res.json();
    setMsg(json.ok ? 'Guardada como plantilla' : json.mensaje);
  }

  const rm = actual ? rmMap[actual.ejercicio_id] ?? (esFase ? rmEjemplo : 0) : rmEjemplo;
  const kilos = actual && presActual?.pct != null ? kilosObjetivo(rm, presActual.pct) : null;

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
    <div className="constructor" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <p className="aviso-escritorio muted">Para armar rutinas es más cómodo en computadora.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 16, justifyContent: 'space-between' }}>
        <h1 className="h titulo-panel" style={{ fontSize: 52 }}>
          {titulo}
        </h1>
        <div className="constructor-acciones" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn2" type="button" onClick={() => void guardarPlantilla()}>
            Guardar como plantilla
          </button>
          <button className="btn2" type="button" onClick={() => void guardarMeta()}>
            Guardar borrador
          </button>
          {!esFase ? (
            <button className="btn" type="button" onClick={() => void publicar()}>
              Publicar{clienteNombre ? ` para ${clienteNombre}` : ''}
            </button>
          ) : null}
        </div>
      </div>
      {msg ? <p className="muted">{msg} · estado: {etiquetaEstadoRutina(estado)}</p> : null}

      <div className="card constructor-meta" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, alignItems: 'end' }}>
        <label className="f" style={{ gridColumn: 'span 2' }}>
          Nombre de la rutina
          <input className="in" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <label className="f">
          Semanas
          <select className="in" value={semanas ?? ''} onChange={(e) => setSemanas(e.target.value ? Number(e.target.value) : null)}>
            <option value="">[POR DEFINIR]</option>
            {[3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="f">
          Semana de descarga
          <select className="in" value={descarga ?? ''} onChange={(e) => setDescarga(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Ninguna</option>
            {Array.from({ length: semanasTabla }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                Semana {n}
              </option>
            ))}
          </select>
        </label>
        <div className="constructor-enfoques" style={{ gridColumn: 'span 4', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ENFOQUES.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setEnfoque(e.id)}
              style={{
                minHeight: 42,
                borderRadius: 999,
                border: '2px solid',
                borderColor: enfoque === e.id ? 'var(--tinta)' : 'var(--linea)',
                background: enfoque === e.id ? 'var(--tinta)' : '#fff',
                color: enfoque === e.id ? 'var(--hueso)' : 'var(--tinta)',
                fontWeight: 700,
                padding: '0 16px',
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
            onClick={() => setDiaActivo(d.id)}
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
            DÍA {d.letra}
            {d.foco ? ` · ${d.foco}` : ''}
          </button>
        ))}
        <button type="button" onClick={() => void agregarDia()} style={{ minHeight: 48, padding: '0 18px', border: 0, background: 'none', fontWeight: 700, color: 'var(--lima-tinta)' }}>
          + Agregar día
        </button>
      </div>
      {diaActivo ? (
        <label className="f" style={{ maxWidth: 480 }}>
          Foco del día
          <input
            className="in"
            defaultValue={dias.find((d) => d.id === diaActivo)?.foco ?? ''}
            key={diaActivo}
            onBlur={(e) => void patchDia(diaActivo, { foco: e.target.value || null })}
          />
        </label>
      ) : null}

      <div className="constructor-cuerpo" style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
        <div className="card constructor-tabla-card" style={{ flex: '999 1 640px', minWidth: 0, padding: 0, overflow: 'hidden' }}>
          <ul className="constructor-lista">
            {ejDelDia.map((e, i) => {
              const p = pres.find((x) => x.rutina_ejercicio_id === e.id && x.semana === 1);
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    className="constructor-lista-item"
                    onClick={() => {
                      setEditando(e.id);
                      setHojaAbierta(true);
                    }}
                  >
                    <b>
                      {e.grupo ? `${e.orden}${e.grupo}` : e.orden || i + 1}. {e.nombre}
                    </b>
                    <span className="muted">{p?.texto || '—'}</span>
                    {e.nota ? <span className="muted">{e.nota}</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="constructor-tabla-scroll" style={{ overflowX: 'auto', padding: '0 12px' }}>
            <table className="tabla constructor-tabla" style={{ fontSize: 15 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ejercicio</th>
                  {Array.from({ length: semanasTabla }, (_, i) => (
                    <th key={i} style={descarga === i + 1 ? { background: '#f1ece0' } : undefined}>
                      Sem {i + 1}
                      {descarga === i + 1 ? ' · descarga' : ''}
                    </th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ejDelDia.map((e, i) => (
                  <tr key={e.id} style={{ background: editando === e.id ? '#eef6de' : undefined }}>
                    <td>
                      <b>
                        {e.grupo ? `${e.orden}${e.grupo}` : e.orden || i + 1}
                      </b>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          setEditando(e.id);
                          setHojaAbierta(true);
                        }}
                        style={{ background: 'none', border: 0, textAlign: 'left', padding: 0, cursor: 'pointer' }}
                      >
                        <b>{e.nombre}</b>
                        {e.revisar ? <span className="est alerta">revisar</span> : null}
                      </button>
                    </td>
                    {Array.from({ length: semanasTabla }, (_, s) => {
                      const p = pres.find((x) => x.rutina_ejercicio_id === e.id && x.semana === s + 1);
                      return (
                        <td key={s} style={descarga === s + 1 ? { background: '#f7f3ea' } : undefined}>
                          {p?.texto || '—'}
                        </td>
                      );
                    })}
                    <td>
                      <button type="button" onClick={() => void borrarEjercicio(e.id)}>
                        Borrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '16px 22px', borderTop: '1px solid var(--linea)' }}>
            <button type="button" className="btn2" style={{ minHeight: 46 }} onClick={() => void agregarEjercicio()}>
              + Agregar ejercicio
            </button>
          </div>
        </div>

        {actual && presActual ? (
          <form
            className={`card editor-ejercicio${hojaAbierta ? ' abierto' : ''}`}
            style={{ flex: '1 1 360px', display: 'flex', flexDirection: 'column', gap: 14, borderColor: 'var(--tinta)' }}
            onSubmit={(e) => e.preventDefault()}
          >
            <button type="button" className="cerrar-hoja btn2" onClick={() => setHojaAbierta(false)}>
              Cerrar
            </button>
            <div className="lbl">Editando el ejercicio</div>
            <label className="f">
              Ejercicio
              <select
                className="in"
                value={actual.ejercicio_id}
                onChange={(e) => {
                  const id = e.target.value;
                  const nom = catalogo.find((c) => c.id === id)?.nombre;
                  void patchEj(actual.id, { ejercicio_id: id });
                  setEjercicios((xs) => xs.map((x) => (x.id === actual.id ? { ...x, ejercicio_id: id, nombre: nom } : x)));
                }}
              >
                {catalogo.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="f">
              Intensidad por
              <select className="in" value={actual.intensidad_tipo} onChange={(e) => void patchEj(actual.id, { intensidad_tipo: e.target.value as Intensidad })}>
                <option value="pct_1rm">% del 1RM</option>
                <option value="rm">RM</option>
                <option value="rpe">RPE</option>
                <option value="rir_fallo">RIR / al fallo</option>
                <option value="texto">Texto</option>
              </select>
            </label>
            <label className="f">
              Semana
              <select className="in" value={semanaEdit} onChange={(e) => setSemanaEdit(Number(e.target.value))}>
                {Array.from({ length: semanasTabla }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
              <label className="f">
                Series
                <input className="in" value={presActual.series ?? ''} onChange={(e) => void patchPres(presActual, { series: e.target.value })} />
              </label>
              <label className="f">
                Reps
                <input className="in" value={presActual.reps ?? ''} onChange={(e) => void patchPres(presActual, { reps: e.target.value })} />
              </label>
              <label className="f">
                % 1RM
                <input
                  className="in"
                  value={presActual.pct != null ? Math.round(presActual.pct * 1000) / 10 : ''}
                  onChange={(e) => void patchPres(presActual, { pct: e.target.value ? Number(e.target.value) / 100 : null })}
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
            {kilos != null ? (
              <div style={{ fontSize: 14, color: 'var(--gris)' }}>
                Con el 1RM ({rm} kg), esta semana sale en <b style={{ color: 'var(--tinta)' }}>{kilos} kg</b>.
              </div>
            ) : null}
            <button className="btn" type="button" onClick={() => void copiarSemanas()}>
              Copiar a todas las semanas
            </button>
          </form>
        ) : (
          <p className="muted">Elige un ejercicio para editarlo.</p>
        )}
      </div>
    </div>
  );
}
