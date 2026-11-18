import { notFound } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { cargarVistaCliente } from '@/lib/cargar-vista-cliente';
import { VistaClienteRutina } from '@/components/VistaClienteRutina';
import { AvisoInterno } from '@/components/AvisoInterno';
import { esPendienteYohan } from '@/lib/pendiente-yohan';
import { FijarMigas } from '@/components/MigasPanel';

export default async function VistaClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ rutinaId: string }>;
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { rutinaId } = await params;
  const { cliente } = await searchParams;
  const supabase = await crearClienteServidor();
  const datos = await cargarVistaCliente(supabase, rutinaId, cliente);
  if (!datos) notFound();
  const migas = datos.clienteId
    ? [
        { href: '/panel', label: 'Clientes' },
        { href: `/panel/clientes/${datos.clienteId}`, label: datos.clienteNombre || 'Cliente' },
        { label: 'Vista de cliente' },
      ]
    : datos.programaClave
      ? [
          { href: `/panel/programas/${datos.programaClave}`, label: datos.programaNombre === 'Ruta +1' || datos.programaClave === 'ruta-1' ? 'Ruta +1' : (datos.programaNombre ?? 'Programa') },
          { href: `/panel/rutinas/${datos.rutinaId}`, label: datos.faseNombre || datos.nombre || 'Rutina' },
          { label: 'Vista de cliente' },
        ]
      : [{ href: '/panel/plantillas', label: 'Plantillas' }, { label: 'Vista de cliente' }];
  const pendienteYohan =
    datos.dias.some((d) => esPendienteYohan(d.foco)) || datos.ejercicios.some((e) => esPendienteYohan(e.nota));
  const vacia = datos.ejercicios.length === 0;

  return (
    <div className="vista-previa">
      <FijarMigas items={migas} />
      <div className="vista-previa-franja">
        {datos.clienteNombre
          ? `Vista de ${datos.clienteNombre}${datos.esDemo ? ' · demo / prueba' : ''}`
          : 'Vista previa · así lo ve el cliente'}
      </div>
      {vacia ? (
        <AvisoInterno>
          Esta rutina no tiene ejercicios. El cliente ve que aún no está lista, no una sesión vacía.
        </AvisoInterno>
      ) : null}
      {pendienteYohan ? (
        <AvisoInterno>
          Faltan prescripciones o el foco de algún día. Fred o Yohan pueden escribirlos en el constructor. El cliente no ve una prescripción inventada.
        </AvisoInterno>
      ) : null}
      <div className="marco-cliente">
        <VistaClienteRutina datos={datos} />
      </div>
    </div>
  );
}
