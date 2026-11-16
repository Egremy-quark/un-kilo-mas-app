import { redirect } from 'next/navigation';
import { AuthMarco } from '@/components/AuthMarco';
import { crearClienteServidor } from '@/lib/supabase/server';
import { BienvenidaForma } from './BienvenidaForma';

export default async function PaginaBienvenida() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');
  const { data: perfil } = await supabase.from('perfiles').select('nombre, rol').eq('id', user.id).maybeSingle();
  const p = perfil as { nombre?: string | null; rol?: string } | null;
  if (p?.rol === 'entrenador') redirect('/panel');
  return (
    <AuthMarco titulo="Bienvenida a tu " destacado="prueba">
      <BienvenidaForma nombre={p?.nombre ?? ''} />
    </AuthMarco>
  );
}
