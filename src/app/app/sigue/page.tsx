import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { SigueForma } from './SigueForma';

export default async function PaginaSigue() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');
  const { data: perfil } = await supabase.from('perfiles').select('nombre').eq('id', user.id).single();
  return <SigueForma nombre={(perfil?.nombre as string) ?? ''} />;
}
