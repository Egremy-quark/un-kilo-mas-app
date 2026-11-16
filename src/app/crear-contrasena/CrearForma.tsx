'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearClienteNavegador } from '@/lib/supabase/client';

export function CrearForma() {
  const router = useRouter();
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (contrasena.length < 8) {
      setError('Usa al menos 8 caracteres.');
      return;
    }
    const supabase = crearClienteNavegador();
    const { error: fallo } = await supabase.auth.updateUser({ password: contrasena });
    if (fallo) {
      setError('No pudimos guardar la contraseña. Abre de nuevo el enlace del correo.');
      return;
    }
    const { data } = await supabase.auth.getUser();
    const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', data.user?.id ?? '').maybeSingle();
    router.replace((perfil as { rol?: string } | null)?.rol === 'entrenador' ? '/panel' : '/app');
  }

  return (
    <form onSubmit={guardar} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <label className="f">
        Nueva contraseña
        <input className="in" type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} required minLength={8} />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button className="btn" type="submit">
        Guardar y entrar
      </button>
    </form>
  );
}
