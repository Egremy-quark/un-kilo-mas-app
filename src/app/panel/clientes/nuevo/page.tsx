import Link from 'next/link';
import { AltaForma } from './AltaForma';

export default function PaginaAlta() {
  return (
    <>
      <Link href="/panel" style={{ fontWeight: 700 }}>
        ← Clientes
      </Link>
      <h1 className="h" style={{ fontSize: 60 }}>
        Dar de <em>alta</em>
      </h1>
      <AltaForma />
    </>
  );
}
