import Link from 'next/link';
import { notFound } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { cargarVistaCliente } from '@/lib/cargar-vista-cliente';
import { VistaClienteRutina } from '@/components/VistaClienteRutina';

export default async function VistaClientePage({ params }: { params: Promise<{ rutinaId: string }> }) {
  const { rutinaId } = await params;
  const supabase = await crearClienteServidor();
  const datos = await cargarVistaCliente(supabase, rutinaId);
  if (!datos) notFound();
  const volver = datos.programaClave ? `/panel/programas/${datos.programaClave}` : '/panel/plantillas';

  return (
    <div className="vista-previa">
      <div className="vista-previa-franja">Vista previa · así lo ve el cliente</div>
      <p>
        <Link href={volver} style={{ fontWeight: 700 }}>
          ← Volver
        </Link>
      </p>
      <div className="marco-cliente">
        <VistaClienteRutina datos={datos} />
      </div>
    </div>
  );
}
