'use client';

import { useState } from 'react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { urlCallback } from '@/lib/urls';

export function RecuperarForma() {
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const supabase = crearClienteNavegador();
    const { error: fallo } = await supabase.auth.resetPasswordForEmail(correo, {
      redirectTo: urlCallback('/crear-contrasena'),
    });
    if (fallo) {
      setError('No pudimos mandar el correo. Intenta de nuevo.');
      return;
    }
    setMensaje('Si hay una cuenta con ese correo, te mandamos el enlace.');
  }

  return (
    <form onSubmit={enviar} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <label className="f">
        Correo
        <input className="in" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
      </label>
      {error ? <p className="error">{error}</p> : null}
      {mensaje ? <p>{mensaje}</p> : null}
      <button className="btn" type="submit">
        Mandar enlace
      </button>
      <a href="/entrar">Volver a entrar</a>
    </form>
  );
}
