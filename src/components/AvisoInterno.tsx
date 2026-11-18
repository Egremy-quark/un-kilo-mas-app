import type { ReactNode } from 'react';

export function AvisoInterno({ children }: { children?: ReactNode }) {
  return (
    <div className="aviso-interno" role="status">
      <div className="lbl">Falta completar</div>
      {children ? (
        <p style={{ margin: '6px 0 0' }}>{children}</p>
      ) : (
        <p style={{ margin: '6px 0 0' }}>
          Falta escribir este contenido. Fred o Yohan pueden llenarlo; el cliente no lo ve hasta entonces.
        </p>
      )}
    </div>
  );
}
