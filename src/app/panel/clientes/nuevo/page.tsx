import { crearClienteServidor } from '@/lib/supabase/server';
import { AltaForma } from './AltaForma';

export default async function PaginaAlta() {
  const supabase = await crearClienteServidor();
  const { data: entrenadores } = await supabase.from('perfiles').select('id, nombre, correo').eq('rol', 'entrenador').order('nombre');
  return (
    <>
      <h1 className="h titulo-panel" style={{ fontSize: 60 }}>
        Dar de <em>alta</em>
      </h1>
      <AltaForma
        entrenadores={((entrenadores ?? []) as { id: string; nombre: string | null; correo: string | null }[]).filter(
          (e) => !e.correo?.endsWith('@example.com'),
        )}
      />
    </>
  );
}
