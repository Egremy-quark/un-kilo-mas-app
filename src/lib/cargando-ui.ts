const MINIMO_MS = 1000;

let visibleDesde = 0;
let ocultarTimer: ReturnType<typeof setTimeout> | undefined;

export function mostrarCargando() {
  if (typeof window === 'undefined') return;
  clearTimeout(ocultarTimer);
  ocultarTimer = undefined;
  if (document.documentElement.dataset.cargando !== '1') {
    visibleDesde = Date.now();
  }
  document.documentElement.dataset.cargando = '1';
  window.dispatchEvent(new CustomEvent('ukm-cargando', { detail: true }));
}

export function ocultarCargando() {
  if (typeof window === 'undefined') return;
  if (ocultarTimer) return;
  const falta =
    document.documentElement.dataset.cargando === '1' ? Math.max(0, MINIMO_MS - (Date.now() - visibleDesde)) : 0;
  const apagar = () => {
    ocultarTimer = undefined;
    delete document.documentElement.dataset.cargando;
    window.dispatchEvent(new CustomEvent('ukm-cargando', { detail: false }));
  };
  if (falta === 0) apagar();
  else ocultarTimer = setTimeout(apagar, falta);
}
