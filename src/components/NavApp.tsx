'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/app/avance', label: 'Avance' },
  { href: '/app/historial', label: 'Historial' },
];

export function NavApp() {
  const path = usePathname();
  const [pendiente, setPendiente] = useState<string | null>(null);

  useEffect(() => {
    setPendiente(null);
  }, [path]);

  return (
    <nav className="nav-app" aria-busy={Boolean(pendiente)}>
      {NAV.map((item) => {
        const activo = path.startsWith(item.href);
        const cargando = pendiente === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[activo ? 'activo' : '', cargando ? 'pendiente' : ''].filter(Boolean).join(' ') || undefined}
            onClick={() => {
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
