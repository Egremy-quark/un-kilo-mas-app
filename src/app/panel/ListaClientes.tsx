'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { cifras, filtrarClientes, nombrePlan, type ClienteLista } from '@/lib/clientes-panel';
import { etiquetaEstado } from '@/lib/planes';
import { mostrarCargando, ocultarCargando } from '@/lib/cargando-ui';
import { AccionIcono } from '@/components/AccionIcono';
import { AccionesBarra } from '@/components/AccionesBarra';
import { Icono } from '@/components/Iconos';
import { DescargarExcel } from '@/components/DescargarExcel';

const ESTADOS = [
  ['todos', 'Todos'],
  ['por_vencer', 'Por vencer'],
  ['vencidos', 'Vencidos'],
] as const;
const PLANES = [
  ['todos', 'Todos'],
  ['prueba', 'Prueba'],
  ['ruta', 'Ruta +1'],
  ['coaching', 'Coaching'],
] as const;

export function ListaClientes({ lista, avisos }: { lista: ClienteLista[]; avisos: { texto: string; href: string }[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState('');
  const estadoUrl = params.get('estado') || 'todos';
  const planUrl = params.get('plan') || 'todos';
  const [estado, setEstado] = useState(estadoUrl);
  const [plan, setPlan] = useState(planUrl);
  useEffect(() => {
    setEstado(estadoUrl);
    setPlan(planUrl);
  }, [estadoUrl, planUrl]);
  const filtrada = useMemo(() => filtrarClientes(lista, q, estado, plan), [lista, q, estado, plan]);
  const c = cifras(lista);
  const claseEstado = (e: string) => (e === 'por_vencer' || e === 'prueba_terminada' ? 'alerta' : e === 'vencida' ? 'venc' : 'ok');

  function setFiltro(clave: 'estado' | 'plan', valor: string) {
    mostrarCargando();
    if (clave === 'estado') setEstado(valor);
    else setPlan(valor);
    const n = new URLSearchParams(params.toString());
    if (valor === 'todos') n.delete(clave);
    else n.set(clave, valor);
    const qs = n.toString();
    router.replace(qs ? `/panel?${qs}` : '/panel');
    ocultarCargando();
  }

  function limpiarFiltros() {
    mostrarCargando();
    setQ('');
    setEstado('todos');
    setPlan('todos');
    router.replace('/panel');
    ocultarCargando();
  }

  return (
    <>
      <div className="acciones-cabeza">
        <h1 className="h titulo-panel" style={{ fontSize: 72 }}>
          Tus <em>clientes</em>
        </h1>
        <AccionesBarra
          principal={
            <Link className="btn" href="/panel/clientes/nuevo">
              + Dar de alta un cliente
            </Link>
          }
          secundarios={[
            <DescargarExcel key="excel" href="/api/panel/exportar?tipo=clientes">
              Exportar a Excel
            </DescargarExcel>,
            <Link key="leads" className="btn2" href="/panel/leads">
              Correos de la landing
            </Link>,
          ]}
        />
      </div>
      <div className="cifras-grid">
        <div className="card">
          <div className="lbl">Activos</div>
          <div className="big">{c.activos}</div>
        </div>
        <div className="card" style={c.vencenSemana > 0 ? { borderColor: 'var(--naranja)' } : undefined}>
          <div className="lbl">Vencen esta semana</div>
          <div className="big">{c.vencenSemana}</div>
        </div>
        <div className="card">
          <div className="lbl">Vencidos</div>
          <div className="big">{c.vencidos}</div>
        </div>
        <div className="card">
          <div className="lbl">En prueba gratis</div>
          <div className="big">{c.prueba}</div>
        </div>
      </div>
      {avisos.map((a) => (
        <div key={a.href} className="aviso-negro">
          <b>{a.texto}</b>
          <Link href={a.href} style={{ marginLeft: 'auto', color: 'var(--lima-clara)', fontWeight: 700 }}>
            Abrir
          </Link>
        </div>
      ))}
      <div className="card filtros-clientes">
        <label className="buscar-cliente">
          <span className="lbl">Buscar</span>
          <input className="in" placeholder="Buscar cliente" value={q} onChange={(e) => setQ(e.target.value)} />
          {q ? (
            <button type="button" className="buscar-limpiar" aria-label="Limpiar búsqueda" onClick={() => setQ('')}>
              <Icono nombre="cerrar" />
            </button>
          ) : null}
        </label>
        <div className="grupos-filtro">
          <div className="grupo-filtro" role="group" aria-label="Estado">
            <span className="lbl">Estado</span>
            <div className="chips-scroll">
              {ESTADOS.map(([id, label]) => (
                <button key={`estado-${id}`} type="button" className="chip-filtro" aria-pressed={estado === id} onClick={() => setFiltro('estado', id)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grupo-filtro" role="group" aria-label="Plan">
            <span className="lbl">Plan</span>
            <div className="chips-scroll">
              {PLANES.map(([id, label]) => (
                <button key={`plan-${id}`} type="button" className="chip-filtro" aria-pressed={plan === id} onClick={() => setFiltro('plan', id)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="card tabla-o-tarjetas" style={{ padding: 0, overflow: 'hidden' }}>
        {filtrada.length === 0 ? (
          <div className="estado-vacio">
            {lista.length === 0 ? (
              <>
                <p>Todavía no tienes clientes. Cuando alguien se registre desde la landing o lo des de alta, aparece aquí.</p>
                <Link className="btn" href="/panel/clientes/nuevo">
                  Dar de alta un cliente
                </Link>
              </>
            ) : (
              <>
                <p>Ningún cliente coincide con el filtro. Hay {lista.length} en total.</p>
                <button type="button" className="btn2" onClick={limpiarFiltros}>
                  Limpiar filtros
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="solo-escritorio" style={{ overflowX: 'auto', padding: '0 12px' }}>
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Plan</th>
                    <th>Rutina</th>
                    <th className="sin-corte">Semana</th>
                    <th className="sin-corte">Última sesión</th>
                    <th>Mensualidad</th>
                    <th className="sin-corte">A cargo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrada.map((cli) => (
                    <tr key={cli.id}>
                      <td>
                        <b>{cli.nombre ?? 'Sin nombre'}</b>
                        {cli.nombre?.startsWith('Demo') || cli.correo?.endsWith('@example.com') ? (
                          <>
                            {' '}
                            <span className="est alerta">Demo</span>
                          </>
                        ) : null}
                        <br />
                        <span className="muted" style={{ fontSize: 14 }}>
                          {cli.correo}
                        </span>
                      </td>
                      <td>
                        <span className="est ok">{nombrePlan(cli.plan)}</span>
                      </td>
                      <td>{cli.rutina ?? '—'}</td>
                      <td className="sin-corte">{cli.semana ?? '—'}</td>
                      <td className="sin-corte">{cli.ultima_sesion ?? '—'}</td>
                      <td>
                        {cli.solicitud ? (
                          <span className="est alerta">Eligió {nombrePlan(cli.solicitud)} · espera su pago</span>
                        ) : (
                          <span className={`est ${claseEstado(cli.estado)}`}>{etiquetaEstado(cli.estado)}</span>
                        )}
                      </td>
                      <td className="sin-corte">{cli.a_cargo}</td>
                      <td>
                        <div className="acciones-fila">
                          <AccionIcono href={`/panel/clientes/${cli.id}`} etiqueta="Abrir ficha">
                            <Icono nombre="lapiz" />
                          </AccionIcono>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="tarjetas-movil">
              {filtrada.map((cli) => (
                <article key={cli.id} className="tarjeta-fila">
                  <h2>{cli.nombre ?? 'Sin nombre'}</h2>
                  <span className={`est ${claseEstado(cli.estado)}`}>{etiquetaEstado(cli.estado)}</span>
                  <dl>
                    <div>
                      <dt>Plan</dt>
                      <dd>{nombrePlan(cli.plan)}</dd>
                    </div>
                    <div>
                      <dt>Rutina</dt>
                      <dd>{cli.rutina ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>Semana</dt>
                      <dd>{cli.semana ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>A cargo</dt>
                      <dd>{cli.a_cargo}</dd>
                    </div>
                  </dl>
                  <div className="acciones-fila">
                    <AccionIcono href={`/panel/clientes/${cli.id}`} etiqueta="Abrir ficha">
                      <Icono nombre="lapiz" />
                    </AccionIcono>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
      <p className="muted" style={{ fontSize: 14 }}>
        Los dos entrenadores ven a todos los clientes y tienen los mismos permisos. Demo Prueba está a cargo de Fred para pruebas.
      </p>
    </>
  );
}
