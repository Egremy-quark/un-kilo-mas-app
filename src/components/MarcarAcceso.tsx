'use client';

import { useEffect } from 'react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { ymdEnZona } from '@/lib/fecha';

export function MarcarAcceso() {
  useEffect(() => {
    const hoy = ymdEnZona();
    if (sessionStorage.getItem('ultimo_acceso') === hoy) return;
    const supabase = crearClienteNavegador();
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      await supabase.from('perfiles').update({ ultimo_acceso: hoy }).eq('id', data.user.id);
      sessionStorage.setItem('ultimo_acceso', hoy);
    });
  }, []);
  return null;
}
