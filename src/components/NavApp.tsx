'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { mostrarCargando } from '@/lib/cargando-ui';

const NAV = [
  { href: '/app/avance', label: 'Avance' },
  { href: '/app/historial', label: 'Historial' },
];

export function NavApp() {
  const path = usePathname();

  return (
    <nav className="nav-app">
      {NAV.map((item) => {
        const activo = path.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={activo ? 'activo' : undefined}
            onClick={() => {
              if (!activo) mostrarCargando();
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
