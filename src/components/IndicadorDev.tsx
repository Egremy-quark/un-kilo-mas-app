'use client';

import { useEffect } from 'react';

/** En local, el botón de Next.js nace abajo a la izquierda y tapa «Salir». Lo sube a la esquina derecha. En producción no existe. */
export function IndicadorDev() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const colocar = () => {
      const toast = document.querySelector('nextjs-portal')?.shadowRoot?.querySelector('.nextjs-toast') as HTMLElement | null;
      if (!toast || toast.dataset.ukmLugar === '1') return;
      toast.dataset.ukmLugar = '1';
      const poner = () => {
        if (toast.style.top === '16px' && toast.style.right === '16px' && toast.style.bottom === 'auto') return;
        toast.style.top = '16px';
        toast.style.right = '16px';
        toast.style.bottom = 'auto';
        toast.style.left = 'auto';
      };
      poner();
      new MutationObserver(poner).observe(toast, { attributes: true, attributeFilter: ['style'] });
    };
    colocar();
    const obs = new MutationObserver(colocar);
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);
  return null;
}
