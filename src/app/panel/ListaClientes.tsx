'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { cifras, filtrarClientes, nombrePlan, type ClienteLista } from '@/lib/clientes-panel';
import { etiquetaEstado } from '@/lib/planes';

export function ListaClientes({ lista, avisos }: { lista: ClienteLista[]; avisos: { texto: string; href: string }[] }) {
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const filtrada = useMemo(() => filtrarClientes(lista, q, filtro), [lista, q, filtro]);
  const c = cifras(lista);
  const claseEstado = (e: string) => (e === 'por_vencer' || e === 'prueba_terminada' ? 'alerta' : e === 'vencida' ? 'venc' : 'ok');

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 16, justifyContent: 'space-between' }}>
        <h1 className="h" style={{ fontSize: 72 }}>
          Tus <em>clientes</em>
        </h1>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a className="btn2" href="/api/panel/exportar?tipo=clientes">
            Exportar a Excel
          </a>
          <a className="btn2" href="/api/panel/exportar?tipo=leads">
            Correos de la landing
          </a>
          <Link className="btn" href="/panel/clientes/nuevo">
            + Dar de alta un cliente
          </Link>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 18 }}>
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
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '18px 22px', alignItems: 'center', borderBottom: '1px solid var(--linea)' }}>
          <input className="in" placeholder="Buscar cliente" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: '1 1 260px' }} />
          {[
            ['todos', 'Todos'],
            ['por_vencer', 'Por vencer'],
            ['vencidos', 'Vencidos'],
            ['prueba', 'Prueba'],
            ['ruta', 'Ruta +1'],
            ['coaching', 'Coaching'],
          ].map(([id, label]) => (
            <button key={id} type="button" className="btn2" style={{ minHeight: 46, borderColor: filtro === id ? 'var(--tinta)' : 'var(--linea)' }} onClick={() => setFiltro(id)}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ overflowX: 'auto', padding: '0 12px' }}>
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
                    <Link href={`/panel/clientes/${cli.id}`} style={{ fontWeight: 700 }}>
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="muted" style={{ fontSize: 14 }}>
        Los dos entrenadores ven a todos los clientes. Los de Prueba y Ruta +1 no tienen entrenador a cargo.
      </p>
    </>
  );
}
