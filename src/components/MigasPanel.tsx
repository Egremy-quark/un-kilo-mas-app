'use client';

import Link from 'next/link';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useIdioma } from './Idioma';

export interface Miga {
  href?: string;
  label: string;
}

const MigasCtx = createContext<{ extra: Miga[]; setExtra: (items: Miga[]) => void }>({
  extra: [],
  setExtra: () => {},
});

export function MigasProvider({ children }: { children: ReactNode }) {
  const path = usePathname();
  const [extra, setExtra] = useState<Miga[]>([]);
  useEffect(() => {
    setExtra([]);
  }, [path]);
  const value = useMemo(() => ({ extra, setExtra }), [extra]);
  return <MigasCtx.Provider value={value}>{children}</MigasCtx.Provider>;
}

export function FijarMigas({ items }: { items: Miga[] }) {
  useMigas(items);
  return null;
}

export function useMigasActuales() {
  return useContext(MigasCtx).extra;
}

export function useMigas(items: Miga[]) {
  const { setExtra } = useContext(MigasCtx);
  const clave = items.map((i) => `${i.href ?? ''}|${i.label}`).join('>');
  useEffect(() => {
    setExtra(items);
    const ancla = items.find((i) => i.href?.startsWith('/panel'));
    if (ancla?.href) window.sessionStorage.setItem('ukm-nav', ancla.href);
    return () => setExtra([]);
  }, [clave, setExtra]);
}

function migasDeRuta(path: string): Miga[] {
  if (path === '/panel') return [{ label: 'Clientes' }];
  if (path.startsWith('/panel/clientes/nuevo')) return [{ href: '/panel', label: 'Clientes' }, { label: 'Alta' }];
  if (/^\/panel\/clientes\/[^/]+\/pago/.test(path)) {
    return [{ href: '/panel', label: 'Clientes' }, { label: 'Cliente' }, { label: 'Pago' }];
  }
  if (/^\/panel\/clientes\//.test(path)) return [{ href: '/panel', label: 'Clientes' }, { label: 'Cliente' }];
  if (path.startsWith('/panel/programas/ruta-1') || path.startsWith('/panel/programas/ruta-mas-1')) {
    return [{ label: 'Ruta +1' }];
  }
  if (path.startsWith('/panel/programas/prueba')) return [{ label: 'Prueba' }];
  if (path.startsWith('/panel/plantillas')) return [{ label: 'Plantillas' }];
  if (path.startsWith('/panel/ejercicios')) return [{ label: 'Ejercicios' }];
  if (path.startsWith('/panel/pagos')) return [{ label: 'Pagos' }];
  if (path.startsWith('/panel/leads')) return [{ label: 'Correos de la landing' }];
  if (path.startsWith('/panel/rutinas/')) return [{ label: 'Rutina' }];
  if (path.startsWith('/panel/vista-cliente/')) return [{ label: 'Vista de cliente' }];
  return [{ label: 'Panel' }];
}

export function MigasPanel() {
  const path = usePathname();
  const { extra } = useContext(MigasCtx);
  const { t } = useIdioma();
  const traducir = (label: string) => {
    const mapa: Record<string, string> = {
      Clientes: t('clientes'),
      Alta: t('alta'),
      Cliente: t('cliente'),
      Pago: t('pago'),
      Prueba: t('prueba'),
      Plantillas: t('plantillas'),
      Ejercicios: t('ejercicios'),
      Pagos: t('pagos'),
      Rutina: t('rutina'),
      'Vista de cliente': t('vistaCliente'),
      Panel: t('panel'),
    };
    return mapa[label] ?? label;
  };
  const base = extra.length ? extra : migasDeRuta(path);
  const items: Miga[] = [{ href: '/panel', label: 'Panel' }, ...base];

  return (
    <nav className="migas" aria-label="Recorrido">
      <ol>
        {items.map((m, i) => {
          const ultimo = i === items.length - 1;
          return (
            <li key={`${m.label}-${i}`}>
              {i > 0 ? (
                <span className="migas-sep" aria-hidden="true">
                  ›
                </span>
              ) : null}
              {ultimo || !m.href ? (
                <span aria-current={ultimo ? 'page' : undefined}>{traducir(m.label)}</span>
              ) : (
                <Link href={m.href}>{traducir(m.label)}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
