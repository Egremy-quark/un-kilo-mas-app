'use client';

import { esPorDefinir } from '@/config/plataforma';

export function CopiarClabe({ clabe }: { clabe: string }) {
  if (esPorDefinir(clabe)) return null;
  return (
    <button className="btn2" type="button" onClick={() => void navigator.clipboard.writeText(clabe)}>
      Copiar la CLABE
    </button>
  );
}
