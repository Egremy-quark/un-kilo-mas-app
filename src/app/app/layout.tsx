import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { AppShell } from '@/components/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');
  const { data: perfil } = await supabase.from('perfiles').select('nombre, rol').eq('id', user.id).maybeSingle();
  const p = perfil as { nombre?: string | null; rol?: string } | null;
  if (p?.rol !== 'cliente') redirect('/panel');
  return <AppShell nombre={p.nombre ?? ''}>{children}</AppShell>;
}
