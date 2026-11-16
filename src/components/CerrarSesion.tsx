'use client';

import { useRouter } from 'next/navigation';
import { crearClienteNavegador } from '@/lib/supabase/client';

export function CerrarSesion() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn2"
      style={{ minHeight: 40, padding: '0 12px', fontSize: 14 }}
      onClick={async () => {
        await crearClienteNavegador().auth.signOut();
        router.replace('/entrar');
        router.refresh();
      }}
    >
      Salir
    </button>
  );
}
