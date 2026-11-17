'use client';

import { useState } from 'react';
import { kilosObjetivo } from '@/lib/kilos';
import { segundosATexto } from '@/lib/descanso';
import { etiquetaEnfoque, etiquetaTipoAlternativa } from '@/lib/etiquetas';
import type { VistaClienteDatos } from '@/lib/cargar-vista-cliente';
import { Logo } from './Logo';

export function VistaClienteRutina({ datos }: { datos: VistaClienteDatos }) {
  const [diaId, setDiaId] = useState(datos.dias[0]?.id ?? '');
  const [cambiando, setCambiando] = useState<string | null>(null);
  const [pantalla, setPantalla] = useState<'inicio' | 'sesion' | 'mensualidad'>('sesion');
  const dia = datos.dias.find((d) => d.id === diaId);
  const delDia = datos.ejercicios.filter((e) => e.dia_id === diaId && !e.pres.omitir);
  const ejCambio = datos.ejercicios.find((e) => e.id === cambiando);

  const titulo =
    datos.faseOrden && datos.faseNombre ? (
      <>
        Fase {datos.faseOrden} · <em>{datos.faseNombre}</em>
      </>
    ) : (
      datos.nombre || 'Rutina'
    );

  return (
    <div className="vista-cliente-app">
      <header className="vista-cliente-header">
        <Logo />
        <nav className="nav-app">
          <button type="button" className={pantalla === 'inicio' ? 'activo' : ''} onClick={() => setPantalla('inicio')}>
            Inicio
          </button>
          <button type="button" className={pantalla === 'sesion' ? 'activo' : ''} onClick={() => setPantalla('sesion')}>
            Sesión
          </button>
          <button type="button" className={pantalla === 'mensualidad' ? 'activo' : ''} onClick={() => setPantalla('mensualidad')}>
            Plan
          </button>
        </nav>
      </header>
      <div className="barra-lima" />
      <div className="vista-cliente-cuerpo">
        {pantalla === 'inicio' ? (
          <>
            <h1 className="h" style={{ fontSize: 42 }}>
              {titulo}
            </h1>
            <p className="muted">
              Semana 1
              {datos.semanas ? ` de ${datos.semanas}` : ''} · {etiquetaEnfoque(datos.enfoque)}
            </p>
            <div className="card">
              {datos.dias.map((d) => (
                <p key={d.id}>
                  Día {d.letra}
                  {d.foco ? ` · ${d.foco}` : ''}
                </p>
              ))}
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
              {dia?.foco ? ` · ${dia.foco}` : ''}
            </div>
            <h1 className="h" style={{ fontSize: 42 }}>
              Sesión de <em>hoy</em>
            </h1>
            {datos.dias.length > 1 ? (
              <label className="f">
                Día
                <select className="in" value={diaId} onChange={(e) => setDiaId(e.target.value)}>
                  {datos.dias.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.letra} {d.foco ?? ''}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <h2 className="h" style={{ fontSize: 30 }}>
              Lo que toca hoy
            </h2>
            {delDia.map((e, i) => {
              const kilos = e.pres.pct != null && e.rm ? kilosObjetivo(e.rm, e.pres.pct) : null;
              return (
                <div key={e.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="lbl">
                    {i + 1}
                    {e.grupo ? ` · grupo ${e.grupo}` : ''}
                  </div>
                  <div className="h" style={{ fontSize: 26 }}>
                    {e.nombre}
                  </div>
                  <div>{e.pres.texto || '—'}</div>
                  {e.nota ? <p className="muted">{e.nota}</p> : null}
                  {kilos != null ? (
                    <div className="h" style={{ fontSize: 30 }}>
                      {kilos} <span style={{ fontFamily: '"Source Sans 3", sans-serif', fontSize: 14 }}>kg</span>
                    </div>
                  ) : null}
                  {e.pres.descanso_seg ? <span className="chip">Descanso {segundosATexto(e.pres.descanso_seg)}</span> : null}
                  <span className="btn" style={{ opacity: 0.55, pointerEvents: 'none' }}>
                    Registrar series
                  </span>
                  {e.alternativas.length ? (
                    <button type="button" className="btn2" onClick={() => setCambiando(e.id)}>
                      Cambiar
                    </button>
                  ) : null}
                </div>
              );
            })}
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
            <p className="muted">Vista previa: aquí el cliente elige, tú no registras nada.</p>
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
          </>
        ) : null}
      </div>
    </div>
  );
}
