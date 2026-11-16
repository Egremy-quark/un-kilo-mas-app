'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/panel', label: 'Clientes' },
  { href: '/panel/programas/ruta-1', label: 'Ruta +1' },
  { href: '/panel/programas/prueba', label: 'Prueba' },
  { href: '/panel/plantillas', label: 'Plantillas' },
  { href: '/panel/ejercicios', label: 'Ejercicios' },
  { href: '/panel/pagos', label: 'Pagos' },
];

export function NavPanel() {
  const path = usePathname();
  return (
    <nav className="nav-panel">
      {NAV.map((item) => {
        const activo = item.href === '/panel' ? path === '/panel' : path.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={activo ? 'activo' : ''}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
