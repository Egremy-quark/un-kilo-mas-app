import { crearClienteServidor } from '@/lib/supabase/server';
import { ListaPlantillas, type FasePlantilla, type FilaPlantilla, type VariantePlantilla } from './ListaPlantillas';

export default async function Plantillas() {
  const supabase = await crearClienteServidor();
  const { data: fases } = await supabase.from('plantilla_fases').select('id, orden, nombre').order('orden');
  const { data: fasesPrograma } = await supabase.from('programa_fases').select('rutina_id');
  const idsFase = new Set((fasesPrograma ?? []).map((f) => f.rutina_id as string).filter(Boolean));
  const conFase = await supabase
    .from('rutinas')
    .select('id, nombre, semanas, enfoque, estado, fase_plantilla_id')
    .eq('es_plantilla', true)
    .is('cliente_id', null)
    .order('actualizado_en', { ascending: false });
  const data = conFase.error
    ? (
        await supabase
          .from('rutinas')
          .select('id, nombre, semanas, enfoque, estado')
          .eq('es_plantilla', true)
          .is('cliente_id', null)
          .order('actualizado_en', { ascending: false })
      ).data?.map((r) => ({ ...r, fase_plantilla_id: null }))
    : conFase.data;
  const plantillas = ((data ?? []) as FilaPlantilla[]).filter((r) => !idsFase.has(r.id));
  const ids = plantillas.map((p) => p.id);
  const { data: variantes } = ids.length
    ? await supabase.from('plantilla_variantes').select('id, rutina_id, poblacion, material, unidades').in('rutina_id', ids)
    : { data: [] };

  return (
    <ListaPlantillas
      fasesIniciales={(fases ?? []) as FasePlantilla[]}
      plantillasIniciales={plantillas}
      variantesIniciales={(variantes ?? []) as VariantePlantilla[]}
    />
  );
}
