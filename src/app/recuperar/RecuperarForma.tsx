'use client';

import { useState } from 'react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { urlCallback } from '@/lib/urls';
import { BotonPendiente } from '@/components/BotonPendiente';

export function RecuperarForma() {
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const supabase = crearClienteNavegador();
      const { error: fallo } = await supabase.auth.resetPasswordForEmail(correo, {
        redirectTo: urlCallback('/crear-contrasena'),
      });
      if (fallo) {
        setError('No pudimos mandar el correo. Intenta de nuevo.');
        return;
      }
      setMensaje('Si hay una cuenta con ese correo, te mandamos el enlace.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <label className="f">
        Correo
        <input className="in" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
      </label>
      {error ? <p className="error">{error}</p> : null}
      {mensaje ? <p>{mensaje}</p> : null}
      <BotonPendiente type="submit" cargando={cargando} etiquetaCargando="Enviando…">
        Mandar enlace
      </BotonPendiente>
      <a href="/entrar">Volver a entrar</a>
    </form>
  );
}
