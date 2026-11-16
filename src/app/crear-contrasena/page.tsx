import { AuthMarco } from '@/components/AuthMarco';
import { CrearForma } from './CrearForma';

export default function PaginaCrearContrasena() {
  return (
    <AuthMarco titulo="Elige tu " destacado="contraseña">
      <p className="muted">Llegaste desde la invitación. Puedes cambiarla después.</p>
      <CrearForma />
    </AuthMarco>
  );
}
