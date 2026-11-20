'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AccionIcono } from '@/components/AccionIcono';
import { Globo } from '@/components/Globo';
import { Icono } from '@/components/Iconos';
import { PublicarFase } from './PublicarFase';

export interface FilaFase {
  id: string;
  orden: number;
  nombre: string;
  descripcion: string;
  pendiente: boolean;
  semanas: number | null;
  dias: string;
  clientes: number;
  publicada: boolean;
  revisar: number;
  rutinaId: string | null;
  programaId: string;
}

export function ListaFases({
  kicker,
  titulo,
  subtitulo,
  resumen,
  aviso,
  filas,
  pie,
}: {
  kicker: string;
  titulo: string;
  subtitulo: string;
  resumen: { valor: string; etiqueta: string; lima?: boolean; naranja?: boolean }[];
  aviso?: string;
  filas: FilaFase[];
  pie?: ReactNode;
}) {
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState<'todas' | 'publicadas' | 'borrador'>('todas');
  const [abierta, setAbierta] = useState(true);
  const publicadas = filas.filter((f) => f.publicada).length;
  const visibles = useMemo(() => {
    const texto = q.trim().toLowerCase();
    return filas.filter((f) => {
      if (estado === 'publicadas' && !f.publicada) return false;
      if (estado === 'borrador' && f.publicada) return false;
      if (texto && !`${f.nombre} ${f.descripcion}`.toLowerCase().includes(texto)) return false;
      return true;
    });
  }, [filas, q, estado]);

  return (
    <div className="plantillas-boceto">
      <header className="pt-cabeza">
        <div>
          <p className="pt-kicker">{kicker}</p>
          <div className="pt-titulo-linea">
            <h1 className="h">{titulo}</h1>
            <p>{subtitulo}</p>
          </div>
        </div>
      </header>
      {aviso ? <p className="pt-fila" style={{ margin: 0, padding: 16 }}>{aviso}</p> : null}
      <section className="pt-resumen parejo" aria-label="Resumen">
        {resumen.map((r) => (
          <article key={r.etiqueta}>
            <b className={r.lima ? 'pt-num-lima' : r.naranja ? 'pt-num-naranja' : undefined}>{r.valor}</b> {r.etiqueta}
          </article>
        ))}
      </section>
      <div className="pt-herramientas">
        <label className="campo-buscar">
          <Icono nombre="lupa" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar fase" aria-label="Buscar fase" />
        </label>
        <div className="pt-segmento" role="group" aria-label="Estado">
          <button type="button" aria-pressed={estado === 'todas'} onClick={() => setEstado('todas')}>Todas {filas.length}</button>
          <button type="button" aria-pressed={estado === 'publicadas'} onClick={() => setEstado('publicadas')}>Publicadas {publicadas}</button>
          <button type="button" aria-pressed={estado === 'borrador'} onClick={() => setEstado('borrador')}>Borrador {filas.length - publicadas}</button>
        </div>
      </div>
      <section className={`pt-fase${abierta ? ' abierta' : ''}`}>
        <button type="button" className="pt-fase-cabeza" aria-expanded={abierta} onClick={() => setAbierta((v) => !v)}>
          <span className="pt-num">{filas.length}</span>
          <span className="pt-fase-nombre">
            <b>Fases</b>
            <span>{subtitulo}</span>
          </span>
          <span className="pt-fase-meta">
            <span className="pt-publicadas">{publicadas} publicadas</span>
            <span className="pt-pill">{filas.length} en total</span>
            <span className="pt-chevron" aria-hidden="true" />
          </span>
        </button>
        {abierta ? (
          <div className="pt-fase-cuerpo">
            {visibles.length === 0 ? <p className="muted">Ninguna fase coincide con el filtro.</p> : null}
            {visibles.map((f) => (
              <article key={f.id} className="pt-fila">
                <div className="pt-fila-tope">
                  <span className="pt-num">{f.orden}</span>
                  <span className="pt-fila-nombre">
                    <b>{f.nombre}</b>
                    <span>
                      {f.pendiente ? 'Falta descripción' : f.descripcion || 'Sin descripción'} · {f.semanas == null ? 'por definir' : `${f.semanas} sem`} · {f.dias || 'sin días'} · {f.clientes} clientes
                      {f.revisar ? ` · ${f.revisar} marcados «revisar»` : ''}
                    </span>
                  </span>
                  <span className="pt-pills">
                    <span className="pt-pill">{f.semanas == null ? 'por definir' : `${f.semanas} sem`}</span>
                    <span className="pt-pill pt-pill-naranja">{f.clientes} clientes</span>
                    {f.publicada ? (
                      <span className="pt-pill pt-pill-ok">Publicada</span>
                    ) : (
                      <Globo texto="Todavía no está publicada. Fred o Yohan pueden publicarla; las marcas no lo impiden.">
                        <span className="pt-pill">Borrador</span>
                      </Globo>
                    )}
                    {f.rutinaId ? (
                      <AccionIcono href={`/panel/rutinas/${f.rutinaId}`} etiqueta="Abrir editor">
                        <Icono nombre="lapiz" />
                      </AccionIcono>
                    ) : null}
                    {f.rutinaId ? (
                      <AccionIcono href={`/panel/vista-cliente/${f.rutinaId}`} etiqueta="Ver como cliente">
                        <Icono nombre="ojo" />
                      </AccionIcono>
                    ) : null}
                    {!f.publicada ? <PublicarFase programaId={f.programaId} orden={f.orden} /> : null}
                    {f.rutinaId ? <Link href={`/panel/rutinas/${f.rutinaId}`} aria-label={`Abrir ${f.nombre}`}><span className="pt-chevron" /></Link> : null}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
      {pie ? <p className="muted" style={{ margin: 0, fontSize: 14 }}>{pie}</p> : null}
    </div>
  );
}
