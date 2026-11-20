'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const CLAVE = 'ukm-chato-cerrado';

export function Chato() {
  const [cerrado, setCerrado] = useState(true);
  const [texto, setTexto] = useState('Pasa el cursor o pulsa un botón. Te digo qué estás tocando.');
  const [pos, setPos] = useState({ x: 0, y: 0, bottom: 24, right: 24 });
  const arrastre = useRef<{ dx: number; dy: number } | null>(null);
  const nodo = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCerrado(window.localStorage.getItem(CLAVE) === '1');
    setPos({ x: 0, y: 0, bottom: 24, right: 24 });
  }, []);

  useEffect(() => {
    function describir(evento: Event) {
      const el = (evento.target as HTMLElement | null)?.closest('a, button, [role="button"]');
      if (!el || el.closest('[data-chato]')) return;
      const label =
        el.getAttribute('aria-label') ||
        (el as HTMLElement).innerText?.replace(/\s+/g, ' ').trim() ||
        el.getAttribute('title');
      if (label) setTexto(label);
    }
    document.addEventListener('pointerover', describir, true);
    document.addEventListener('click', describir, true);
    return () => {
      document.removeEventListener('pointerover', describir, true);
      document.removeEventListener('click', describir, true);
    };
  }, []);

  const onPointerDown = useCallback((evento: React.PointerEvent) => {
    if ((evento.target as HTMLElement).closest('[data-chato-cerrar]')) return;
    const caja = nodo.current?.getBoundingClientRect();
    if (!caja) return;
    arrastre.current = { dx: evento.clientX - caja.left, dy: evento.clientY - caja.top };
    (evento.currentTarget as HTMLElement).setPointerCapture(evento.pointerId);
  }, []);

  const onPointerMove = useCallback((evento: React.PointerEvent) => {
    if (!arrastre.current) return;
    const nav = document.querySelector('.cabecera-panel')?.getBoundingClientRect();
    const minY = (nav?.bottom ?? 96) + 12;
    const x = Math.min(window.innerWidth - 228, Math.max(8, evento.clientX - arrastre.current.dx));
    const y = Math.min(window.innerHeight - 96, Math.max(minY, evento.clientY - arrastre.current.dy));
    setPos({ x, y, bottom: 0, right: 0 });
  }, []);

  const onPointerUp = useCallback(() => {
    arrastre.current = null;
  }, []);

  function cortar(evento: React.SyntheticEvent) {
    evento.stopPropagation();
  }

  function cerrar(evento: React.MouseEvent) {
    evento.preventDefault();
    evento.stopPropagation();
    setCerrado(true);
    window.localStorage.setItem(CLAVE, '1');
  }

  if (cerrado) return null;

  const ancladoAbajo = pos.bottom > 0 && pos.y === 0;

  return (
    <div
      ref={nodo}
      data-chato="1"
      className="chato"
      role="dialog"
      aria-modal="false"
      aria-label="Chato, narrador de la interfaz"
      style={
        ancladoAbajo
          ? { right: pos.right || 24, left: 'auto', bottom: pos.bottom, top: 'auto' }
          : { left: pos.x, top: pos.y }
      }
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown(e);
      }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="chato-cabeza">
        <b>Chato</b>
        <button
          type="button"
          data-chato-cerrar="1"
          className="btn-icono chato-cerrar"
          aria-label="Cerrar Chato"
          onClick={cerrar}
          onMouseDown={cortar}
          onPointerDown={cortar}
          onPointerUp={cortar}
        >
          ×
        </button>
      </div>
      <p>{texto}</p>
      <span className="chato-hint">Arrástrame. La X me cierra.</span>
    </div>
  );
}
