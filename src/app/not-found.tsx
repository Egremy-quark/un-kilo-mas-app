import Link from 'next/link';

export default function NoEncontrado() {
  return (
    <main className="wrap" style={{ paddingTop: 64 }}>
      <h1 className="h" style={{ fontSize: 48 }}>
        No está <em>esta página</em>
      </h1>
      <p>
        <Link href="/">Ir al inicio</Link>
      </p>
    </main>
  );
}
