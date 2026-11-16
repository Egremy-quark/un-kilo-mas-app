import { AuthMarco } from '@/components/AuthMarco';
import { RecuperarForma } from './RecuperarForma';

export default function PaginaRecuperar() {
  return (
    <AuthMarco titulo="Recupera tu " destacado="contraseña">
      <RecuperarForma />
    </AuthMarco>
  );
}
