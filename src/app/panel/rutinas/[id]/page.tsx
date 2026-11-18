import { crearClienteServidor } from '@/lib/supabase/server';
import { ConstructorRutina } from '@/components/ConstructorRutina';
import { cargarConstructor } from '@/lib/cargar-constructor';
import { FijarMigas } from '@/components/MigasPanel';
import { notFound } from 'next/navigation';

export default async function PaginaRutina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const inicial = await cargarConstructor(supabase, id);
  if (!inicial) notFound();
  const { data: rutina } = await supabase.from('rutinas').select('cliente_id, perfiles:cliente_id(nombre)').eq('id', id).maybeSingle();
  const { data: fase } = await supabase
    .from('programa_fases')
    .select('orden, nombre, programas(clave, nombre)')
    .eq('rutina_id', id)
    .maybeSingle();
  const programa = fase?.programas as { clave?: string; nombre?: string } | null;
  const nombreCliente = (rutina?.perfiles as { nombre?: string } | null)?.nombre;
  const migas = fase && programa?.clave
    ? [
        { href: `/panel/programas/${programa.clave}`, label: programa.clave === 'ruta-1' || programa.nombre === 'Ruta +1' ? 'Ruta +1' : (programa.nombre ?? 'Programa') },
        { label: (fase.nombre as string) || 'Rutina' },
      ]
    : nombreCliente
      ? [
          { href: '/panel', label: 'Clientes' },
          { href: `/panel/clientes/${rutina?.cliente_id}`, label: nombreCliente },
          { label: 'Rutina' },
        ]
      : [{ href: '/panel/plantillas', label: 'Plantillas' }, { label: inicial.nombre || 'Rutina' }];

  return (
    <>
      <FijarMigas items={migas} />
      <ConstructorRutina
        rutinaId={id}
        clienteNombre={nombreCliente}
        esFase={Boolean(fase)}
        faseOrden={(fase?.orden as number | undefined) ?? null}
        faseNombre={(fase?.nombre as string | undefined) ?? null}
        inicial={inicial}
      />
    </>
  );
}
