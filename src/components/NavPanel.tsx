'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { mostrarCargando } from '@/lib/cargando-ui';
import { useMigasActuales } from './MigasPanel';

const NAV = [
  { href: '/panel', label: 'Clientes' },
  { href: '/panel/programas/ruta-1', label: 'Ruta +1' },
  { href: '/panel/programas/prueba', label: 'Prueba' },
  { href: '/panel/plantillas', label: 'Plantillas' },
  { href: '/panel/ejercicios', label: 'Ejercicios' },
  { href: '/panel/pagos', label: 'Pagos' },
];

function porPrefijo(ref: string) {
  if (ref.startsWith('/panel/programas/ruta')) return '/panel/programas/ruta-1';
  if (ref.startsWith('/panel/programas/prueba')) return '/panel/programas/prueba';
  if (ref.startsWith('/panel/plantillas')) return '/panel/plantillas';
  if (ref.startsWith('/panel/ejercicios')) return '/panel/ejercicios';
  if (ref.startsWith('/panel/pagos')) return '/panel/pagos';
  if (ref === '/panel' || ref.startsWith('/panel/clientes')) return '/panel';
  return null;
}

export function NavPanel({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const path = usePathname();
  const extra = useMigasActuales();
  const [pendiente, setPendiente] = useState<string | null>(null);
  const [guardado, setGuardado] = useState<string | null>(null);
  const ancla = extra.find((m) => m.href?.startsWith('/panel'))?.href ?? '';

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
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
