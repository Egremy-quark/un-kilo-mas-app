'use client';

import { useMemo, useState } from 'react';
import { kilosObjetivo } from '@/lib/kilos';
import { segundosATexto } from '@/lib/descanso';
import { etiquetaEnfoque, etiquetaTipoAlternativa } from '@/lib/etiquetas';
import { textoCliente } from '@/lib/pendiente-yohan';
import { PrescripcionVista } from './PrescripcionVista';
import { rmPorSemana } from '@/lib/dashboard';
import type { VistaClienteDatos } from '@/lib/cargar-vista-cliente';
import { GraficaRm } from './GraficaRm';
import { Logo } from './Logo';
import { BotonPendiente } from './BotonPendiente';
import { crearClienteNavegador } from '@/lib/supabase/client';

interface SerieLocal {
  id: string;
  ejercicio: string;
  kg: number;
  reps: number;
  fecha: string;
}

export function VistaClienteRutina({ datos }: { datos: VistaClienteDatos }) {
  const [diaId, setDiaId] = useState(datos.dias[0]?.id ?? '');
  const [cambiando, setCambiando] = useState<string | null>(null);
  const [pantalla, setPantalla] = useState<'inicio' | 'sesion' | 'mensualidad'>(
    datos.historial.length ? 'inicio' : 'sesion',
  );
  const [series, setSeries] = useState<SerieLocal[]>(() =>
    datos.historial.map((s) => ({ id: s.id, ejercicio: s.ejercicio, kg: s.kg, reps: s.reps, fecha: s.fecha })),
  );
  const [registrando, setRegistrando] = useState<string | null>(null);
  const [kg, setKg] = useState(20);
  const [reps, setReps] = useState(5);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const dia = datos.dias.find((d) => d.id === diaId);
  const delDia = datos.ejercicios.filter((e) => e.dia_id === diaId && !e.pres.omitir);
  const ejCambio = datos.ejercicios.find((e) => e.id === cambiando);
  const rutinaLista = datos.ejercicios.length > 0;
  const focoDia = textoCliente(dia?.foco);
  const titulo =
    datos.faseOrden && datos.faseNombre ? (
      <>
        Fase {datos.faseOrden} · <em>{datos.faseNombre}</em>
      </>
    ) : (
      datos.nombre || 'Rutina'
    );

  const puntos = useMemo(
    () =>
      rmPorSemana(
        series.map((s) => ({
          ejercicio_id: s.ejercicio,
          kg: s.kg,
          reps: s.reps,
          fecha: s.fecha,
          completada: true,
        })),
      ),
    [series],
  );

  const porFecha = useMemo(() => {
    const m = new Map<string, SerieLocal[]>();
    for (const s of series) {
      const clave = s.fecha.slice(0, 10);
      m.set(clave, [...(m.get(clave) ?? []), s]);
    }
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [series]);

  function abrirRegistro(id: string) {
    setError('');
    setRegistrando(id);
  }

  async function guardarSerie() {
    const ej = datos.ejercicios.find((e) => e.id === registrando);
    if (!ej) return;
    setGuardando(true);
    setError('');
    try {
      if (!Number.isFinite(kg) || kg <= 0 || !Number.isInteger(reps) || reps <= 0) {
        setError('Escribe kilos y repeticiones válidos.');
        return;
      }
      const fecha = new Date().toISOString();
      let id = `${Date.now()}`;
      if (datos.clienteId) {
        const supabase = crearClienteNavegador();
        const { data: sesion } = await supabase
          .from('sesiones')
          .select('id')
          .eq('cliente_id', datos.clienteId)
          .eq('estado', 'abierta')
          .maybeSingle();
        let sesionId = sesion?.id as string | undefined;
        if (!sesionId) {
          const { data: nueva, error: eSes } = await supabase
            .from('sesiones')
            .insert({
              cliente_id: datos.clienteId,
              rutina_id: datos.rutinaId,
              dia_id: diaId,
              semana: 1,
              estado: 'abierta',
            })
            .select('id')
            .single();
          if (eSes || !nueva) {
            setError(eSes?.message ?? 'No se pudo abrir la sesión.');
            return;
          }
          sesionId = nueva.id as string;
        }
        const { data: fila, error: eSerie } = await supabase
          .from('series')
          .insert({
            sesion_id: sesionId,
            rutina_ejercicio_id: ej.id,
            ejercicio_id: ej.hechoId,
            numero: series.filter((s) => s.ejercicio === ej.nombre).length + 1,
            kg,
            reps,
            completada: true,
          })
          .select('id')
          .single();
        if (eSerie) {
          setError(eSerie.message);
          return;
        }
        if (fila?.id) id = fila.id as string;
      }
      setSeries((xs) => [{ id, ejercicio: ej.nombre, kg, reps, fecha }, ...xs]);
      setRegistrando(null);
    } finally {
      setGuardando(false);
    }
  }

  const tabs: { id: typeof pantalla; label: string }[] = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'sesion', label: 'Sesión' },
    { id: 'mensualidad', label: 'Plan' },
  ];

  return (
    <div className="vista-cliente-app">
      <header className="vista-cliente-header">
        <Logo />
        <nav className="nav-app">
          {tabs.map((t) => (
            <button key={t.id} type="button" className={pantalla === t.id ? 'activo' : ''} onClick={() => setPantalla(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <div className="barra-lima" />
      <div className="vista-cliente-cuerpo">
        {pantalla === 'inicio' ? (
          <>
            <h1 className="h" style={{ fontSize: 42 }}>
              {titulo}
            </h1>
            {datos.clienteNombre ? (
              <p>
                {datos.esDemo ? <span className="est alerta">Demo / prueba</span> : null} {datos.clienteNombre}
              </p>
            ) : null}
            <p className="muted">
              Semana 1
              {datos.semanas ? ` de ${datos.semanas}` : ''} · {etiquetaEnfoque(datos.enfoque)}
            </p>
            {!rutinaLista ? (
              <div className="card">
                <p>Esta rutina aún no está lista. Cuando el entrenador la arme, aquí vas a ver tus días.</p>
              </div>
            ) : (
              <div className="card">
                {datos.dias.map((d) => {
                  const foco = textoCliente(d.foco);
                  return (
                    <p key={d.id}>
                      Día {d.letra}
                      {foco ? ` · ${foco}` : ''}
                    </p>
                  );
                })}
              </div>
            )}
            <div className="card">
              <div className="lbl">Tu progreso de carga</div>
              {puntos.length ? <GraficaRm puntos={puntos} /> : <p className="muted">Aún no hay series para graficar. Cuando registres, aquí se ve cómo va la carga.</p>}
            </div>
            <div className="card">
              <div className="lbl">Historial de entrenamientos</div>
              {porFecha.length === 0 ? (
                <p className="muted">Todavía no hay sesiones registradas.</p>
              ) : (
                porFecha.map(([fecha, ss]) => (
                  <div key={fecha} style={{ marginTop: 10 }}>
                    <b>{fecha}</b>
                    {ss.map((s) => (
                      <p key={s.id}>
                        {s.ejercicio}: {s.kg} kg × {s.reps}
                      </p>
                    ))}
                  </div>
                ))
              )}
            </div>
            <button className="btn btn-ancho" type="button" onClick={() => setPantalla('sesion')}>
              Ver la sesión de hoy
            </button>
          </>
        ) : null}

        {pantalla === 'sesion' && !ejCambio ? (
          <>
            <div className="lbl">
              Semana 1{dia ? ` · Día ${dia.letra}` : ''}
              {focoDia ? ` · ${focoDia}` : ''}
            </div>
            <h1 className="h" style={{ fontSize: 42 }}>
              Sesión de <em>hoy</em>
            </h1>
            {!rutinaLista ? (
              <div className="card">
                <p>Esta rutina aún no está lista. No hay ejercicios que registrar.</p>
              </div>
            ) : (
              <>
                {datos.dias.length > 1 ? (
                  <label className="f">
                    Día
                    <select className="in" value={diaId} onChange={(e) => setDiaId(e.target.value)}>
                      {datos.dias.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.letra}
                          {textoCliente(d.foco) ? ` ${textoCliente(d.foco)}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <h2 className="h" style={{ fontSize: 30 }}>
                  Lo que toca hoy
                </h2>
                {delDia.length === 0 ? (
                  <div className="card">
                    <p>Esta rutina aún no está lista. No hay ejercicios en este día.</p>
                  </div>
                ) : (
                  delDia.map((e, i) => {
                    const kilos = e.pres.pct != null && e.rm ? kilosObjetivo(e.rm, e.pres.pct) : null;
                    const texto = textoCliente(e.pres.texto);
                    const nota = textoCliente(e.nota);
                    const abierto = registrando === e.id;
                    return (
                      <div key={e.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div className="lbl">
                          {i + 1}
                          {e.grupo ? ` · grupo ${e.grupo}` : ''}
                        </div>
                        <div className="h" style={{ fontSize: 26 }}>
                          {e.nombre}
                        </div>
                        {texto || e.pres.series || e.pres.reps || e.pres.pct != null ? (
                          <PrescripcionVista texto={texto} series={e.pres.series} reps={e.pres.reps} pct={e.pres.pct} />
                        ) : (
                          <p className="muted">Todavía no hay prescripción para este ejercicio.</p>
                        )}
                        {nota ? <p className="muted">{nota}</p> : null}
                        {kilos != null ? (
                          <div className="h" style={{ fontSize: 30 }}>
                            {kilos} <span style={{ fontFamily: '"Source Sans 3", sans-serif', fontSize: 14 }}>kg</span>
                          </div>
                        ) : null}
                        {e.pres.descanso_seg ? <span className="chip">Descanso {segundosATexto(e.pres.descanso_seg)}</span> : null}
                        {abierto ? (
                          <>
                            <label className="f">
                              Kilos
                              <input className="in" type="number" min={0} step={0.5} value={kg} onChange={(e) => setKg(Number(e.target.value))} />
                            </label>
                            <label className="f">
                              Reps
                              <input className="in" type="number" min={1} step={1} value={reps} onChange={(e) => setReps(Number(e.target.value))} />
                            </label>
                            {error ? <p className="error">{error}</p> : null}
                            <BotonPendiente type="button" cargando={guardando} etiquetaCargando="Guardando…" onClick={() => void guardarSerie()}>
                              Guardar serie
                            </BotonPendiente>
                            <button type="button" className="btn2" onClick={() => setRegistrando(null)}>
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <button type="button" className="btn" onClick={() => abrirRegistro(e.id)}>
                            Registrar series
                          </button>
                        )}
                        {e.alternativas.length ? (
                          <button type="button" className="btn2" onClick={() => setCambiando(e.id)}>
                            Cambiar
                          </button>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </>
            )}
          </>
        ) : null}

        {pantalla === 'sesion' && ejCambio ? (
          <>
            <button type="button" className="btn2" onClick={() => setCambiando(null)}>
              ← Sesión
            </button>
            <h1 className="h" style={{ fontSize: 40 }}>
              Cambiar <em>ejercicio</em>
            </h1>
            <p className="muted">Vista previa: aquí el cliente elige, tú no registras nada en su cuenta.</p>
            {ejCambio.alternativas.map((a) => (
              <div key={a.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <b>{a.nombre}</b>
                <span className="chip">{etiquetaTipoAlternativa(a.tipo)}</span>
                <span className="btn2" style={{ opacity: 0.55, pointerEvents: 'none' }}>
                  Cambiar solo por hoy
                </span>
                <span className="btn" style={{ opacity: 0.55, pointerEvents: 'none' }}>
                  Cambiar para toda la fase
                </span>
              </div>
            ))}
          </>
        ) : null}

        {pantalla === 'mensualidad' ? (
          <>
            <h1 className="h" style={{ fontSize: 42 }}>
              Tu <em>plan</em>
            </h1>
            <div className="card">
              <p>{datos.programaNombre ?? 'Rutina'}</p>
              <p className="muted">En la app real aquí sale su mensualidad y la CLABE. Esta vista no registra pagos.</p>
            </div>
            <div className="card">
              <div className="lbl">Historial de entrenamientos</div>
              {porFecha.length === 0 ? (
                <p className="muted">Todavía no hay sesiones registradas.</p>
              ) : (
                porFecha.map(([fecha, ss]) => (
                  <div key={fecha} style={{ marginTop: 10 }}>
                    <b>{fecha}</b>
                    {ss.map((s) => (
                      <p key={s.id}>
                        {s.ejercicio}: {s.kg} kg × {s.reps}
                      </p>
                    ))}
                  </div>
                ))
              )}
            </div>
            <div className="card">
              <div className="lbl">Tu progreso de carga</div>
              {puntos.length ? <GraficaRm puntos={puntos} /> : <p className="muted">Aún no hay series para graficar.</p>}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
