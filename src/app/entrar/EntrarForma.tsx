'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { urlCallback } from '@/lib/urls';

export function EntrarForma() {
  const router = useRouter();
  const params = useSearchParams();
  const siguiente = params.get('siguiente') ?? '';
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function conContrasena(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMensaje('');
    setCargando(true);
    const supabase = crearClienteNavegador();
    const { error: fallo } = await supabase.auth.signInWithPassword({ email: correo, password: contrasena });
    setCargando(false);
    if (fallo) {
      setError('No pudimos entrar con ese correo y contraseña.');
      return;
    }
    const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', (await supabase.auth.getUser()).data.user?.id ?? '').maybeSingle();
    const rol = (perfil as { rol?: string } | null)?.rol;
    const destino = siguiente || (rol === 'entrenador' ? '/panel' : '/app');
    router.replace(destino);
    router.refresh();
  }

  async function enlaceMagico() {
    setError('');
    setMensaje('');
    if (!correo) {
      setError('Escribe tu correo.');
      return;
    }
    setCargando(true);
    const supabase = crearClienteNavegador();
    const { error: fallo } = await supabase.auth.signInWithOtp({
      email: correo,
      options: { emailRedirectTo: urlCallback(siguiente || '/bienvenida') },
    });
    setCargando(false);
    if (fallo) {
      setError('No pudimos mandar el enlace. Intenta de nuevo.');
      return;
    }
    setMensaje('Te mandamos un enlace a tu correo.');
  }

  return (
    <>
      <form onSubmit={conContrasena} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label className="f">
          Correo
          <input className="in" type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
        </label>
        <label className="f">
          Contraseña
          <input className="in" type="password" autoComplete="current-password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
        </label>
        {error ? <p className="error">{error}</p> : null}
        {mensaje ? <p>{mensaje}</p> : null}
        <button className="btn" type="submit" disabled={cargando}>
          Entrar
        </button>
        <button className="btn2" type="button" onClick={enlaceMagico} disabled={cargando}>
          Mándame un enlace
        </button>
      </form>
      <p className="pie-auth">
        <a href="/recuperar">Olvidé mi contraseña</a>
      </p>
    </>
  );
}
