import { crearClienteServidor } from '@/lib/supabase/server';

export default async function CorreosLanding() {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from('leads').select('id, correo, origen, creado_en').order('creado_en', { ascending: false });

  const correos = data ?? [];
  return (
    <div className="plantillas-boceto">
      <header className="pt-cabeza">
        <div>
          <p className="pt-kicker">Panel · Correos</p>
          <div className="pt-titulo-linea">
            <h1 className="h">Correos</h1>
            <p>{correos.length} de la landing</p>
          </div>
        </div>
      </header>
      <section className="pt-resumen parejo" aria-label="Resumen">
        <article>
          <b>{correos.length}</b> correos
        </article>
      </section>
      {error ? (
        <div className="pt-fila" style={{ padding: 16 }}>
          <p>No pudimos cargar los correos. Recarga o intenta más tarde.</p>
          <p className="muted">{error.message}</p>
        </div>
      ) : correos.length === 0 ? (
        <div className="pt-fila" style={{ padding: 16 }}>
          <p>Todavía no hay correos de la landing. Cuando alguien deje el suyo, aparece aquí.</p>
        </div>
      ) : (
        <section className="pt-fase abierta">
          <div className="pt-fase-cabeza">
            <span className="pt-num">{correos.length}</span>
            <span className="pt-fase-nombre">
              <b>Landing</b>
            </span>
            <span className="pt-fase-meta">
              <span className="pt-pill">{correos.length} en total</span>
            </span>
          </div>
          <div className="pt-fase-cuerpo">
            {correos.map((l) => (
              <article key={l.id as string} className="pt-fila">
                <div className="pt-fila-tope">
                  <span className="pt-fila-nombre">
                    <b>{l.correo as string}</b>
                    <span>{String(l.creado_en).slice(0, 10)}</span>
                  </span>
                  <span className="pt-pill">{(l.origen as string) || 'landing'}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
