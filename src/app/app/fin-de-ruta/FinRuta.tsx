'use client';

import { useRouter } from 'next/navigation';

export function FinRuta() {
  const router = useRouter();
  return (
    <>
      <h1 className="h" style={{ fontSize: 42 }}>
        Otra vuelta, con <em>más carga</em>
      </h1>
      <p>Terminaste las 8 fases. Puedes empezar de nuevo con tus 1RM actuales, o pasarte a coaching.</p>
      <button
        className="btn"
        type="button"
        onClick={async () => {
          await fetch('/api/app/otra-vuelta', { method: 'POST' });
          router.push('/app');
          router.refresh();
        }}
      >
        Otra vuelta
      </button>
      <a className="btn2" href="/app/sigue">
        Pasarte a coaching
      </a>
    </>
  );
}
