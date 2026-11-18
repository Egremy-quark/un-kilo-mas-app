'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Globo } from './Globo';

export function AccionIcono({
  href,
  etiqueta,
  children,
}: {
  href: string;
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <Globo texto={etiqueta}>
      <Link className="btn-accion" href={href} title={etiqueta} aria-label={etiqueta}>
        {children}
      </Link>
    </Globo>
  );
}
