'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Idioma = 'es' | 'en';

const CLAVE = 'ukm-idioma';

const TEXTOS = {
  es: {
    clientes: 'Clientes',
    prueba: 'Prueba',
    plantillas: 'Plantillas',
    ejercicios: 'Ejercicios',
    pagos: 'Pagos',
    panelEntrenador: 'Panel del entrenador',
    tus: 'Tus',
    alta: 'Alta',
    cliente: 'Cliente',
    pago: 'Pago',
    rutina: 'Rutina',
    vistaCliente: 'Vista de cliente',
    panel: 'Panel',
    darDeAlta: '+ Dar de alta un cliente',
    mensualidad: 'Mensualidad',
    estado: 'Estado',
    plan: 'Plan',
    semana: 'Semana',
    ultima: 'Última sesión',
    aCargo: 'A cargo',
    acciones: 'Acciones',
    idioma: 'Idioma',
  },
  en: {
    clientes: 'Clients',
    prueba: 'Trial',
    plantillas: 'Templates',
    ejercicios: 'Exercises',
    pagos: 'Payments',
    panelEntrenador: 'Trainer panel',
    tus: 'Your',
    alta: 'New client',
    cliente: 'Client',
    pago: 'Payment',
    rutina: 'Routine',
    vistaCliente: 'Client view',
    panel: 'Panel',
    darDeAlta: '+ Add a client',
    mensualidad: 'Monthly fee',
    estado: 'Status',
    plan: 'Plan',
    semana: 'Week',
    ultima: 'Last session',
    aCargo: 'Coach',
    acciones: 'Actions',
    idioma: 'Language',
  },
} as const;

type ClaveTexto = keyof typeof TEXTOS.es;

const Ctx = createContext<{
  idioma: Idioma;
  setIdioma: (idioma: Idioma) => void;
  t: (clave: ClaveTexto) => string;
}>({
  idioma: 'es',
  setIdioma: () => {},
  t: (clave) => TEXTOS.es[clave],
});

export function IdiomaProvider({ children }: { children: ReactNode }) {
  const [idioma, setIdiomaState] = useState<Idioma>('es');

  useEffect(() => {
    const guardado = window.localStorage.getItem(CLAVE);
    if (guardado === 'en' || guardado === 'es') setIdiomaState(guardado);
  }, []);

  useEffect(() => {
    document.documentElement.lang = idioma === 'en' ? 'en' : 'es-MX';
  }, [idioma]);

  function setIdioma(siguiente: Idioma) {
    setIdiomaState(siguiente);
    window.localStorage.setItem(CLAVE, siguiente);
  }

  return (
    <Ctx.Provider value={{ idioma, setIdioma, t: (clave) => TEXTOS[idioma][clave] }}>
      {children}
    </Ctx.Provider>
  );
}

export function useIdioma() {
  return useContext(Ctx);
}

export function BotonIdioma() {
  const { idioma, setIdioma, t } = useIdioma();
  return (
    <div className="idioma-toggle" role="group" aria-label={t('idioma')}>
      <button type="button" className={idioma === 'es' ? 'activo' : ''} aria-pressed={idioma === 'es'} onClick={() => setIdioma('es')}>
        ES
      </button>
      <button type="button" className={idioma === 'en' ? 'activo' : ''} aria-pressed={idioma === 'en'} onClick={() => setIdioma('en')}>
        EN
      </button>
    </div>
  );
}
