import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';

export default async function Inicio() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');
  const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).maybeSingle();
  redirect((perfil as { rol?: string } | null)?.rol === 'entrenador' ? '/panel' : '/app');
}
