'use client';

import { useState, type ReactNode } from 'react';

export function AccionesBarra({ principal, secundarios }: { principal: ReactNode; secundarios?: ReactNode[] }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="acciones-barra">
      <div className="acciones-principal">{principal}</div>
      {secundarios && secundarios.length ? (
        <>
          <div className="acciones-secundarias">{secundarios}</div>
          <div className="acciones-mas">
            <button type="button" className="btn2" aria-expanded={abierto} onClick={() => setAbierto((v) => !v)}>
              Más ▾
            </button>
            {abierto ? <div className="acciones-mas-menu">{secundarios}</div> : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
