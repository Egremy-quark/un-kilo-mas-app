'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearClienteNavegador } from '@/lib/supabase/client';

export function BienvenidaForma({ nombre }: { nombre: string }) {
  const router = useRouter();
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function irApp() {
    router.replace('/app');
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (contrasena && contrasena.length < 8) {
      setError('Usa al menos 8 caracteres, o déjala vacía.');
      return;
    }
    setGuardando(true);
    if (contrasena) {
      const supabase = crearClienteNavegador();
      const { error: fallo } = await supabase.auth.updateUser({ password: contrasena });
      if (fallo) {
        setGuardando(false);
        setError('No pudimos guardar la contraseña. Puedes hacerlo después.');
        return;
      }
    }
    router.replace('/app');
  }

  return (
    <form onSubmit={guardar} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p>
        Hola{nombre ? `, ${nombre}` : ''}. Ya tienes tu mes de prueba. La contraseña es opcional: también puedes
        entrar con un enlace al correo.
      </p>
      <label className="f">
        Contraseña (opcional)
        <input className="in" type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button className="btn" type="submit" disabled={guardando}>
        Entrar a la app
      </button>
      <button className="btn2" type="button" onClick={irApp}>
        Ahora no, llévame a entrenar
      </button>
    </form>
  );
}
