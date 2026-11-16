import { describe, expect, it } from 'vitest';

async function subirCola(
  cola: Record<string, unknown>[],
  enviar: (p: Record<string, unknown>) => Promise<boolean>,
  puedeRegistrar: boolean,
) {
  if (!puedeRegistrar) return { subidas: 0, bloqueadas: true, resto: cola };
  const resto = [...cola];
  let subidas = 0;
  while (resto.length) {
    const ok = await enviar(resto[0]);
    if (!ok) break;
    resto.shift();
    subidas += 1;
  }
  return { subidas, bloqueadas: false, resto };
}

describe('cola sin conexión', () => {
  it('una serie guardada se sube al volver la señal', async () => {
    const enviadas: Record<string, unknown>[] = [];
    const r = await subirCola([{ kg: 80, reps: 5 }], async (p) => {
      enviadas.push(p);
      return true;
    }, true);
    expect(r.subidas).toBe(1);
    expect(r.resto).toEqual([]);
    expect(enviadas[0]).toEqual({ kg: 80, reps: 5 });
  });

  it('si ya no puede registrar, no se suben', async () => {
    const r = await subirCola([{ kg: 80 }], async () => true, false);
    expect(r.bloqueadas).toBe(true);
    expect(r.subidas).toBe(0);
  });
});
