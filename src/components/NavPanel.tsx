'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { mostrarCargando } from '@/lib/cargando-ui';
import { useMigasActuales } from './MigasPanel';
import type { ConteosNav } from './PanelShell';
import { useIdioma } from './Idioma';

const NAV = [
  { href: '/panel', label: 'Clientes', icono: 'clientes', cuenta: null },
  { href: '/panel/programas/ruta-1', label: 'Ruta +1', icono: 'ruta', cuenta: 'ruta' },
  { href: '/panel/programas/prueba', label: 'Prueba', icono: 'prueba', cuenta: 'prueba' },
  { href: '/panel/plantillas', label: 'Plantillas', icono: 'plantillas', cuenta: 'plantillas' },
  { href: '/panel/ejercicios', label: 'Ejercicios', icono: 'ejercicios', cuenta: 'ejercicios' },
  { href: '/panel/pagos', label: 'Pagos', icono: 'pagos', cuenta: null },
] as const;

function porPrefijo(ref: string) {
  if (ref.startsWith('/panel/programas/ruta')) return '/panel/programas/ruta-1';
  if (ref.startsWith('/panel/programas/prueba')) return '/panel/programas/prueba';
  if (ref.startsWith('/panel/plantillas')) return '/panel/plantillas';
  if (ref.startsWith('/panel/ejercicios')) return '/panel/ejercicios';
  if (ref.startsWith('/panel/pagos')) return '/panel/pagos';
  if (ref === '/panel' || ref.startsWith('/panel/clientes')) return '/panel';
  return null;
}

export function NavPanel({ className, onNavigate, conteos }: { className?: string; onNavigate?: () => void; conteos?: ConteosNav }) {
  const path = usePathname();
  const extra = useMigasActuales();
  const [pendiente, setPendiente] = useState<string | null>(null);
  const [guardado, setGuardado] = useState<string | null>(null);
  const ancla = extra.find((m) => m.href?.startsWith('/panel'))?.href ?? '';
  const lateral = className?.includes('nav-lateral');
  const { t } = useIdioma();
  const etiqueta = (href: string, label: string) => {
    if (href === '/panel') return t('clientes');
    if (href.includes('/prueba')) return t('prueba');
    if (href.includes('/plantillas')) return t('plantillas');
    if (href.includes('/ejercicios')) return t('ejercicios');
    if (href.includes('/pagos')) return t('pagos');
    return label;
  };

  useEffect(() => {
    setPendiente(null);
    setGuardado(window.sessionStorage.getItem('ukm-nav'));
  }, [path, ancla]);

  const refHija = path.startsWith('/panel/rutinas') || path.startsWith('/panel/vista-cliente') ? ancla || guardado || '' : '';
  const activoHref = refHija
    ? porPrefijo(refHija)
    : path === '/panel' || path.startsWith('/panel/clientes') || path.startsWith('/panel/leads')
      ? '/panel'
      : (porPrefijo(path) ?? null);

  return (
    <nav className={`nav-panel${className ? ` ${className}` : ''}`} aria-busy={Boolean(pendiente)}>
      {NAV.map((item) => {
        const activo = item.href === activoHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={activo ? 'activo' : undefined}
            aria-current={activo ? 'page' : undefined}
            onClick={() => {
              onNavigate?.();
              if (!activo) {
                setPendiente(item.href);
                mostrarCargando();
              }
            }}
          >
            {lateral ? <IconoNav nombre={item.icono} /> : null}
            <span>{etiqueta(item.href, item.label)}</span>
            {item.cuenta && conteos?.[item.cuenta] ? <span className="nav-cuenta">{conteos[item.cuenta]}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function IconoNav({ nombre }: { nombre: string }) {
  const comun = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, 'aria-hidden': true as const };
  if (nombre === 'clientes') {
    return (
      <svg {...comun}>
        <circle cx="8" cy="5" r="2.2" />
        <path d="M3.2 13.2c.7-2.2 2.4-3.3 4.8-3.3s4.1 1.1 4.8 3.3" />
      </svg>
    );
  }
  if (nombre === 'ruta' || nombre === 'prueba') {
    return (
      <svg {...comun}>
        <path d="M3 12.5V3.5M8 12.5V6.5M13 12.5V8.5" />
      </svg>
    );
  }
  if (nombre === 'plantillas') {
    return (
      <svg {...comun}>
        <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
        <path d="M5 6.5h6M5 9.5h4" />
      </svg>
    );
  }
  if (nombre === 'ejercicios') {
    return (
      <svg {...comun}>
        <path d="M3 8h10M5 5.5v5M11 5.5v5" />
      </svg>
    );
  }
  return (
    <svg {...comun}>
      <rect x="2.5" y="3.5" width="11" height="9" rx="1.5" />
      <path d="M2.5 6.5h11" />
    </svg>
  );
}
