import { Suspense } from 'react';
import { AuthMarco } from '@/components/AuthMarco';
import { EntrarForma } from './EntrarForma';

export default function PaginaEntrar() {
  return (
    <AuthMarco titulo="Entra a tu " destacado="cuenta">
      <Suspense>
        <EntrarForma />
      </Suspense>
    </AuthMarco>
  );
}
