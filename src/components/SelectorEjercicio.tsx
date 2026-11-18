'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { etiquetaPatron, PATRONES } from '@/lib/etiquetas';
import { Icono } from './Iconos';

export interface EjCatalogo {
  id: string;
  nombre: string;
  patron?: string | null;
}

export function SelectorEjercicio({
  valor,
  catalogo,
  onChange,
}: {
  valor: string;
  catalogo: EjCatalogo[];
  onChange: (id: string, nombre: string) => void;
}) {
  const actual = catalogo.find((c) => c.id === valor);
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState('');
  const caja = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!abierto) setQ('');
  }, [abierto]);

  useEffect(() => {
    function fuera(evento: MouseEvent) {
      if (!caja.current?.contains(evento.target as Node)) setAbierto(false);
    }
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, []);

  const grupos = useMemo(() => {
    const texto = q.trim().toLowerCase();
    const filtrados = texto ? catalogo.filter((c) => c.nombre.toLowerCase().includes(texto)) : catalogo;
    const patronActual = actual?.patron ?? null;
    const orden = [
      ...(patronActual ? PATRONES.filter((p) => p.id === patronActual) : []),
      ...PATRONES.filter((p) => p.id !== patronActual),
    ];
    const porPatron = new Map<string, EjCatalogo[]>();
    const sinPatron: EjCatalogo[] = [];
    for (const ej of filtrados) {
      if (ej.patron && PATRONES.some((p) => p.id === ej.patron)) {
        const lista = porPatron.get(ej.patron) ?? [];
        lista.push(ej);
        porPatron.set(ej.patron, lista);
      } else {
        sinPatron.push(ej);
      }
    }
    const gruposListos: { id: string; label: string; items: EjCatalogo[] }[] = orden
      .map((p) => ({ id: p.id, label: p.label, items: (porPatron.get(p.id) ?? []).slice().sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')) }))
      .filter((g) => g.items.length);
    if (sinPatron.length) {
      gruposListos.push({
        id: 'sin-patron',
        label: 'Sin patrón',
        items: sinPatron.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
      });
    }
    return gruposListos;
  }, [catalogo, q, actual?.patron]);

  return (
    <div className="selector-ej" ref={caja}>
      <label className="f">
        Ejercicio
        <span className="selector-ej-campo">
          <Icono nombre="lupa" />
          <input
            className="in"
            value={abierto ? q : (actual?.nombre ?? '')}
            placeholder="Buscar ejercicio"
            onFocus={() => setAbierto(true)}
            onChange={(e) => {
              setAbierto(true);
              setQ(e.target.value);
            }}
            aria-expanded={abierto}
            aria-controls="lista-ejercicios"
            autoComplete="off"
          />
        </span>
      </label>
      {abierto ? (
        <div className="selector-ej-lista" id="lista-ejercicios" role="listbox">
          {grupos.length === 0 ? <p className="muted">Ningún ejercicio coincide.</p> : null}
          {grupos.map((g) => (
            <section key={g.id}>
              <h3>
                {g.label} <span className="muted">({g.items.length})</span>
              </h3>
              {g.items.map((ej) => (
                <button
                  key={ej.id}
                  type="button"
                  role="option"
                  aria-selected={ej.id === valor}
                  className={ej.id === valor ? 'activo' : undefined}
                  onClick={() => {
                    onChange(ej.id, ej.nombre);
                    setAbierto(false);
                  }}
                >
                  {ej.nombre}
                  {ej.patron ? <span className="muted">{etiquetaPatron(ej.patron)}</span> : null}
                </button>
              ))}
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
