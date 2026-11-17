export function LoaderPagina({ etiqueta = 'Cargando' }: { etiqueta?: string }) {
  return (
    <div className="loader-pagina" role="status" aria-live="polite" aria-label={etiqueta}>
      <span className="loader-disco" aria-hidden="true" />
      <span className="h" style={{ fontSize: 28 }}>
        {etiqueta}
        <em>…</em>
      </span>
    </div>
  );
}
