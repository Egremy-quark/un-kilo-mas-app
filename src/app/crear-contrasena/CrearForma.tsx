'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { BotonPendiente } from '@/components/BotonPendiente';

function mensajeError(code?: string) {
  if (code === 'weak_password') return 'Esa contraseña es muy débil. Prueba otra más larga.';
  if (code === 'same_password') return 'Usa una contraseña distinta a la anterior.';
  if (code === 'session_not_found' || code === 'session_expired') {
    return 'El enlace ya no vale. Pide uno nuevo o abre el que te acabamos de dar.';
  }
  return 'No pudimos guardar la contraseña. Abre de nuevo el enlace.';
}

export function CrearForma() {
  const router = useRouter();
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const supabase = crearClienteNavegador();
    const hash = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    async function tomarSesion() {
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setError('Este enlace no dejó sesión. Ábrelo otra vez desde el correo o el enlace nuevo.');
        return;
      }
      setListo(true);
    }

    void tomarSesion();
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (contrasena.length < 8) {
      setError('Usa al menos 8 caracteres.');
      return;
    }
    setCargando(true);
    try {
      const supabase = crearClienteNavegador();
      const { data: sesion } = await supabase.auth.getUser();
      if (!sesion.user) {
        setError('Este enlace no dejó sesión. Ábrelo otra vez.');
        setCargando(false);
        return;
      }
      const { error: fallo } = await supabase.auth.updateUser({ password: contrasena });
      if (fallo) {
        setError(mensajeError(fallo.code));
        setCargando(false);
        return;
      }
      const { data } = await supabase.auth.getUser();
      const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', data.user?.id ?? '').maybeSingle();
      router.replace((perfil as { rol?: string } | null)?.rol === 'entrenador' ? '/panel' : '/app');
      router.refresh();
    } catch {
      setError('No pudimos guardar la contraseña. Abre de nuevo el enlace.');
      setCargando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <label className="f">
        Nueva contraseña
        <input className="in" type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} required minLength={8} />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <BotonPendiente type="submit" disabled={!listo} cargando={cargando} etiquetaCargando="Guardando…">
        Guardar y entrar
      </BotonPendiente>
    </form>
  );
}
