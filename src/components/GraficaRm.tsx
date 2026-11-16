export function GraficaRm({ puntos }: { puntos: { semana: string; kg: number }[] }) {
  if (!puntos.length) return <p className="muted">Aún no hay series para graficar.</p>;
  const max = Math.max(...puntos.map((p) => p.kg), 1);
  const w = 640;
  const h = 180;
  const step = puntos.length > 1 ? (w - 40) / (puntos.length - 1) : 0;
  const d = puntos
    .map((p, i) => {
      const x = 20 + i * step;
      const y = h - 20 - (p.kg / max) * (h - 40);
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="180" role="img" aria-label="1RM estimado por semana">
      <path d={d} fill="none" stroke="#7CB518" strokeWidth="4" />
      {puntos.map((p, i) => {
        const x = 20 + i * step;
        const y = h - 20 - (p.kg / max) * (h - 40);
        return <circle key={p.semana} cx={x} cy={y} r="5" fill="#1C1E1A" />;
      })}
    </svg>
  );
}
