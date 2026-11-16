import Link from 'next/link';
import { crearClienteServidor } from '@/lib/supabase/server';
import { ConstructorRutina } from '@/components/ConstructorRutina';
import { notFound } from 'next/navigation';

export default async function PaginaRutina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const { data: rutina } = await supabase.from('rutinas').select('*, perfiles:cliente_id(nombre)').eq('id', id).maybeSingle();
  if (!rutina) notFound();
  const { data: fase } = await supabase.from('programa_fases').select('id, programas(clave)').eq('rutina_id', id).maybeSingle();
  const nombreCliente = (rutina.perfiles as { nombre?: string } | null)?.nombre;
  return (
    <>
      <Link href={nombreCliente ? `/panel/clientes/${rutina.cliente_id}` : '/panel/plantillas'} style={{ fontWeight: 700 }}>
        ← Volver
      </Link>
      <ConstructorRutina rutinaId={id} clienteNombre={nombreCliente} esFase={Boolean(fase)} />
    </>
  );
}
