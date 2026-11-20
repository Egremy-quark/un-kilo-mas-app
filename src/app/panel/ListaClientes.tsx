'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { cifras, filtrarClientes, nombrePlan, type ClienteLista } from '@/lib/clientes-panel';
import { etiquetaEstado, textoMensualidad } from '@/lib/planes';
import { useIdioma } from '@/components/Idioma';
import { mostrarCargando, ocultarCargando } from '@/lib/cargando-ui';
import { Icono } from '@/components/Iconos';

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
  const { t } = useIdioma();
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
  const [cerrados, setCerrados] = useState<string[]>([]);
  const grupos = [
    { id: 'ruta', nombre: 'Ruta +1', filas: filtrada.filter((cli) => cli.plan === 'ruta_mensual' || cli.plan === 'ruta_completa') },
    { id: 'prueba', nombre: 'Prueba', filas: filtrada.filter((cli) => cli.plan === 'prueba') },
    { id: 'coaching', nombre: 'Coaching', filas: filtrada.filter((cli) => cli.plan === 'coaching') },
    {
      id: 'otro',
      nombre: 'Sin plan',
      filas: filtrada.filter((cli) => !['ruta_mensual', 'ruta_completa', 'prueba', 'coaching'].includes(cli.plan)),
    },
  ].filter((g) => g.filas.length > 0);
  function cuentaEstado(id: string) {
    if (id === 'por_vencer') return lista.filter((cli) => cli.estado === 'por_vencer').length;
    if (id === 'vencidos') return lista.filter((cli) => cli.estado === 'vencida' || cli.estado === 'prueba_terminada').length;
    return lista.length;
  }
  function cuentaPlan(id: string) {
    if (id === 'prueba') return lista.filter((cli) => cli.plan === 'prueba').length;
    if (id === 'ruta') return lista.filter((cli) => cli.plan === 'ruta_mensual' || cli.plan === 'ruta_completa').length;
    if (id === 'coaching') return lista.filter((cli) => cli.plan === 'coaching').length;
    return lista.length;
  }
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
    <div className="plantillas-boceto">
      <header className="pt-cabeza">
        <div>
          <p className="pt-kicker">Panel · {t('clientes')}</p>
          <div className="pt-titulo-linea">
            <h1 className="h">{t('clientes')}</h1>
            <p>
              {lista.length} en total · {c.activos} activos
            </p>
          </div>
        </div>
        <div className="pt-cabeza-acciones">
          <Link className="btn pt-btn-principal" href="/panel/clientes/nuevo">
            + Nuevo cliente
          </Link>
          <Link className="btn2" href="/panel/leads">
            Correos de la landing
          </Link>
        </div>
      </header>
      <section className="pt-resumen parejo" aria-label="Resumen">
        <article>
          <b className="pt-num-lima">{c.activos}</b> activos
        </article>
        <article>
          <b className={c.vencenSemana > 0 ? 'pt-num-naranja' : undefined}>{c.vencenSemana}</b> vencen esta semana
        </article>
        <article>
          <b>{c.vencidos}</b> vencidos
        </article>
        <article>
          <b>{c.prueba}</b> en prueba gratis
        </article>
      </section>
      {avisos.map((a) => (
        <div key={a.href} className="pt-fila" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px' }}>
          <b>{a.texto}</b>
          <Link href={a.href} style={{ marginLeft: 'auto', fontWeight: 700 }}>
            Abrir
          </Link>
        </div>
      ))}
      <div className="pt-herramientas">
        <label className="campo-buscar">
          <Icono nombre="lupa" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente" aria-label="Buscar cliente" />
          {q ? (
            <button type="button" className="btn-icono" aria-label="Limpiar búsqueda" onClick={() => setQ('')}>
              <Icono nombre="cerrar" />
            </button>
          ) : null}
        </label>
        <div className="pt-segmento" role="group" aria-label="Estado">
          {ESTADOS.map(([id, label]) => (
            <button key={`estado-${id}`} type="button" aria-pressed={estado === id} onClick={() => setFiltro('estado', id)}>
              {label} {cuentaEstado(id)}
            </button>
          ))}
        </div>
        <div className="pt-segmento" role="group" aria-label="Plan">
          {PLANES.map(([id, label]) => (
            <button key={`plan-${id}`} type="button" aria-pressed={plan === id} onClick={() => setFiltro('plan', id)}>
              {label} {cuentaPlan(id)}
            </button>
          ))}
        </div>
      </div>
      {filtrada.length === 0 ? (
        <div className="pt-fila" style={{ padding: 16 }}>
          {lista.length === 0 ? (
            <>
              <p>Todavía no tienes clientes. Cuando alguien se registre desde la landing o lo des de alta, aparece aquí.</p>
              <Link className="btn pt-btn-principal" href="/panel/clientes/nuevo">
                + Nuevo cliente
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
        <div className="pt-lista">
          {grupos.map((grupo) => {
            const abierto = !cerrados.includes(grupo.id);
            return (
              <section key={grupo.id} className={`pt-fase${abierto ? ' abierta' : ''}`}>
                <button
                  type="button"
                  className="pt-fase-cabeza"
                  aria-expanded={abierto}
                  onClick={() => setCerrados((prev) => (abierto ? [...prev, grupo.id] : prev.filter((id) => id !== grupo.id)))}
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
                    {grupo.filas.map((cli) => (
                      <Link key={cli.id} className="pt-fila pt-fila-tope" href={`/panel/clientes/${cli.id}`}>
                        <span className="pt-fila-nombre">
                          <b>
                            {cli.nombre ?? 'Sin nombre'}
                            {cli.nombre?.startsWith('Demo') || cli.correo?.endsWith('@example.com') ? ' · Demo' : ''}
                          </b>
                          <span>
                            {cli.correo} · {cli.rutina ?? 'Sin rutina'} · {cli.semana ?? 'Sin semana'} · {t('aCargo')}: {cli.a_cargo}
                          </span>
                        </span>
                        <span className="pt-pills">
                          <span className="pt-pill">{nombrePlan(cli.plan)}</span>
                          <span className="pt-pill">{textoMensualidad(cli.plan)}</span>
                          <span className={`pt-pill${claseEstado(cli.estado) === 'ok' ? ' pt-pill-ok' : ' pt-pill-naranja'}`}>
                            {cli.solicitud ? `Eligió ${nombrePlan(cli.solicitud)}` : etiquetaEstado(cli.estado)}
                          </span>
                          <span className="pt-chevron" aria-hidden="true" />
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
      <p className="muted" style={{ fontSize: 14, margin: 0 }}>
        Los dos entrenadores ven a todos los clientes y tienen los mismos permisos. Demo Prueba está a cargo de Fred para pruebas.
      </p>
    </div>
  );
}
