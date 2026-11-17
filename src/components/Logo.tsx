import { partesNombre, TRAZO_MAS, TRAZO_UNO } from '@/lib/marca';
import { plataforma } from '@/config/plataforma';

type Variante = 'horizontal' | 'simbolo' | 'tinta' | 'sobre-tinta';

export function Logo({
  variante = 'horizontal',
  subtitulo,
}: {
  variante?: Variante;
  subtitulo?: string;
}) {
  const { resto, clave } = partesNombre(plataforma.marca);
  const soloSimbolo = variante === 'simbolo';
  const unaTinta = variante === 'tinta';
  const sobreTinta = variante === 'sobre-tinta';
  const fondo = sobreTinta ? 'var(--hueso)' : 'var(--tinta)';
  const colorMas = unaTinta ? 'var(--hueso)' : 'var(--lima)';
  const colorUno = sobreTinta && !unaTinta ? 'var(--tinta)' : 'var(--hueso)';

  const simbolo = (
    <svg className="logo-simbolo" viewBox="0 0 100 100" aria-hidden="true">
      {soloSimbolo ? (
        <>
          <circle cx="50" cy="50" r="50" fill="var(--lima)" />
          <path d={TRAZO_MAS} fill="var(--tinta)" />
          <path d={TRAZO_UNO} fill="var(--tinta)" />
        </>
      ) : (
        <>
          <rect width="100" height="100" rx="18" fill={fondo} />
          <path d={TRAZO_MAS} fill={unaTinta ? colorUno : colorMas} />
          <path d={TRAZO_UNO} fill={colorUno} />
        </>
      )}
    </svg>
  );

  if (soloSimbolo) return simbolo;

  return (
    <span className="logo-marca">
      {simbolo}
      <span>
        {resto ? `${resto} ` : ''}
        <span className="logo-clave">{clave}</span>
        {subtitulo ? (
          <span className="logo-subtitulo" style={{ fontFamily: '"Source Sans 3", sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--gris)', textTransform: 'none', marginLeft: 8 }}>
            · {subtitulo}
          </span>
        ) : null}
      </span>
    </span>
  );
}
