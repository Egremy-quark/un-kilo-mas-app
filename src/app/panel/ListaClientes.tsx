'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { cifras, filtrarClientes, nombrePlan, type ClienteLista } from '@/lib/clientes-panel';
import { etiquetaEstado } from '@/lib/planes';
import { AccionesBarra } from '@/components/AccionesBarra';

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
  const estado = params.get('estado') || 'todos';
  const plan = params.get('plan') || 'todos';
  const filtrada = useMemo(() => filtrarClientes(lista, q, estado, plan), [lista, q, estado, plan]);
  const c = cifras(lista);
  const claseEstado = (e: string) => (e === 'por_vencer' || e === 'prueba_terminada' ? 'alerta' : e === 'vencida' ? 'venc' : 'ok');

  function setFiltro(clave: 'estado' | 'plan', valor: string) {
    const n = new URLSearchParams(params.toString());
    if (valor === 'todos') n.delete(clave);
    else n.set(clave, valor);
    const qs = n.toString();
    router.replace(qs ? `/panel?${qs}` : '/panel');
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
            <a key="excel" className="btn2" href="/api/panel/exportar?tipo=clientes">
              Exportar a Excel
            </a>,
            <a key="leads" className="btn2" href="/api/panel/exportar?tipo=leads">
              Correos de la landing
            </a>,
          ]}
        />
      </div>
      <div className="cifras-grid">
        <div className="card">
          <div className="lbl">Activos</div>
          <div className="big">{c.activos}</div>
        </div>
        <div className="card" style={{ borderColor: 'var(--naranja)' }}>
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
      <div className="card tabla-o-tarjetas" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="filtros-panel">
          <input className="in" placeholder="Buscar cliente" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="chips-scroll" role="group" aria-label="Estado">
            {ESTADOS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className="chip-filtro"
                aria-pressed={estado === id}
                onClick={() => setFiltro('estado', id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="chips-scroll" role="group" aria-label="Plan">
            {PLANES.map(([id, label]) => (
              <button
                key={id}
                type="button"
                className="chip-filtro"
                aria-pressed={plan === id}
                onClick={() => setFiltro('plan', id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {filtrada.length === 0 ? (
          <div className="estado-vacio">
            <p>Todavía no tienes clientes. Cuando alguien se registre desde la landing o lo des de alta, aparece aquí.</p>
            <Link className="btn" href="/panel/clientes/nuevo">
              Dar de alta un cliente
            </Link>
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
                    <th>Semana</th>
                    <th>Última sesión</th>
                    <th>Mensualidad</th>
                    <th>A cargo</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrada.map((cli) => (
                    <tr key={cli.id}>
                      <td>
                        <b>{cli.nombre ?? 'Sin nombre'}</b>
                        <br />
                        <span className="muted" style={{ fontSize: 14 }}>
                          {cli.correo}
                        </span>
                      </td>
                      <td>
                        <span className="est ok">{nombrePlan(cli.plan)}</span>
                      </td>
                      <td>{cli.rutina ?? '—'}</td>
                      <td>{cli.semana ?? '—'}</td>
                      <td>{cli.ultima_sesion ?? '—'}</td>
                      <td>
                        {cli.solicitud ? (
                          <span className="est alerta">Eligió {nombrePlan(cli.solicitud)} · espera su pago</span>
                        ) : (
                          <span className={`est ${claseEstado(cli.estado)}`}>{etiquetaEstado(cli.estado)}</span>
                        )}
                      </td>
                      <td>{cli.a_cargo}</td>
                      <td>
                        <Link className="btn2" href={`/panel/clientes/${cli.id}`}>
                          Abrir
                        </Link>
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
                  <Link className="btn2 btn-ancho" href={`/panel/clientes/${cli.id}`}>
                    Abrir
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
      <p className="muted" style={{ fontSize: 14 }}>
        Los dos entrenadores ven a todos los clientes. Los de Prueba y Ruta +1 no tienen entrenador a cargo.
      </p>
    </>
  );
}
