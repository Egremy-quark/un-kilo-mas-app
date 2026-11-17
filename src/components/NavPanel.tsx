'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/panel', label: 'Clientes' },
  { href: '/panel/programas/ruta-1', label: 'Ruta +1' },
  { href: '/panel/programas/prueba', label: 'Prueba' },
  { href: '/panel/plantillas', label: 'Plantillas' },
  { href: '/panel/ejercicios', label: 'Ejercicios' },
  { href: '/panel/pagos', label: 'Pagos' },
];

export function NavPanel({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const path = usePathname();
  const [pendiente, setPendiente] = useState<string | null>(null);

  useEffect(() => {
    setPendiente(null);
  }, [path]);

  return (
    <nav className={`nav-panel${className ? ` ${className}` : ''}`} aria-busy={Boolean(pendiente)}>
      {NAV.map((item) => {
        const activo = item.href === '/panel' ? path === '/panel' : path.startsWith(item.href);
        const cargando = pendiente === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[activo ? 'activo' : '', cargando ? 'pendiente' : ''].filter(Boolean).join(' ') || undefined}
            aria-current={activo ? 'page' : undefined}
            onClick={() => {
              onNavigate?.();
              if (!activo) setPendiente(item.href);
            }}
          >
            {item.label}
            {cargando ? <span className="loader-punto" aria-hidden="true" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
