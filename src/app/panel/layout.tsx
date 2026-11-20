import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { PanelShell, type ConteosNav } from '@/components/PanelShell';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre, etiqueta_publica, rol')
    .eq('id', user.id)
    .maybeSingle();
  const p = perfil as { nombre?: string | null; etiqueta_publica?: string | null; rol?: string } | null;
  if (p?.rol !== 'entrenador') redirect('/app');
  const conteos = await conteosBarra(supabase);
  return (
    <PanelShell nombre={p.nombre ?? 'Entrenador'} etiqueta={p.etiqueta_publica ?? 'Entrenador'} conteos={conteos}>
      {children}
    </PanelShell>
  );
}

async function conteosBarra(supabase: Awaited<ReturnType<typeof crearClienteServidor>>): Promise<ConteosNav> {
  const [{ data: programas }, { data: fases }, ejercicios, rutinas] = await Promise.all([
    supabase.from('programas').select('id, clave'),
    supabase.from('programa_fases').select('programa_id, rutina_id'),
    supabase.from('ejercicios').select('id', { count: 'exact', head: true }),
    supabase.from('rutinas').select('id').eq('es_plantilla', true).is('cliente_id', null),
  ]);
  const porClave = new Map((programas ?? []).map((item) => [item.clave as string, item.id as string]));
  const listaFases = fases ?? [];
  const fasesDe = (clave: string) => listaFases.filter((f) => f.programa_id === porClave.get(clave)).length;
  const idsFase = new Set(listaFases.map((f) => f.rutina_id as string).filter(Boolean));
  const nPlantillas = (rutinas.data ?? []).filter((r) => !idsFase.has(r.id as string)).length;
  return {
    ruta: `${fasesDe('ruta-1')} fases`,
    prueba: `${fasesDe('prueba')} fases`,
    plantillas: String(nPlantillas),
    ejercicios: String(ejercicios.count ?? 0),
  };
}
