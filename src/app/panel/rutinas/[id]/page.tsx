import { crearClienteServidor } from '@/lib/supabase/server';
import { ConstructorRutina } from '@/components/ConstructorRutina';
import { cargarConstructor } from '@/lib/cargar-constructor';
import { FijarMigas } from '@/components/MigasPanel';
import { notFound } from 'next/navigation';
import { etiquetaVariante } from '@/lib/etiquetas';

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
  const { data: propia } = await supabase
    .from('rutinas')
    .select('es_plantilla, fase_plantilla_id')
    .eq('id', id)
    .maybeSingle();
  let pertenencia: string | null = null;
  if (propia?.es_plantilla && !fase) {
    let nombreFase = 'Sin fase';
    if (propia.fase_plantilla_id) {
      const { data: carpeta } = await supabase
        .from('plantilla_fases')
        .select('nombre')
        .eq('id', propia.fase_plantilla_id as string)
        .maybeSingle();
      nombreFase = (carpeta?.nombre as string) || 'Sin fase';
    }
    const { data: variantes } = await supabase
      .from('plantilla_variantes')
      .select('poblacion, material, unidades')
      .eq('rutina_id', id);
    const etiquetas = (variantes ?? []).map((v) =>
      [etiquetaVariante('poblacion', v.poblacion as string | null), etiquetaVariante('material', v.material as string | null), etiquetaVariante('unidades', v.unidades as string | null)]
        .filter(Boolean)
        .join(' · '),
    );
    pertenencia = etiquetas.length ? `Fase: ${nombreFase}. Variantes: ${etiquetas.join(' / ')}` : `Fase: ${nombreFase}`;
  }
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
        pertenencia={pertenencia}
        inicial={inicial}
      />
    </>
  );
}
