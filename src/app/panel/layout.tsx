import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { PanelShell } from '@/components/PanelShell';

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
  return (
    <PanelShell nombre={p.nombre ?? 'Entrenador'} etiqueta={p.etiqueta_publica ?? 'Entrenador'}>
      {children}
    </PanelShell>
  );
}
