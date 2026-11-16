'use client';

import Dexie, { type Table } from 'dexie';

export interface SeriePendiente {
  id?: number;
  sesion_id: string;
  payload: Record<string, unknown>;
  creado_en: number;
}

class SeriesOffline extends Dexie {
  series!: Table<SeriePendiente, number>;
  constructor() {
    super('unkilomas-series');
    this.version(1).stores({ series: '++id, sesion_id, creado_en' });
  }
}

let db: SeriesOffline | null = null;

function base(): SeriesOffline | null {
  if (typeof window === 'undefined') return null;
  db ??= new SeriesOffline();
  return db;
}

export async function guardarSerieLocal(sesion_id: string, payload: Record<string, unknown>) {
  const d = base();
  if (!d) return;
  await d.series.add({ sesion_id, payload, creado_en: Date.now() });
}

export async function pendientes(): Promise<SeriePendiente[]> {
  const d = base();
  if (!d) return [];
  return d.series.orderBy('creado_en').toArray();
}

export async function borrarPendiente(id: number) {
  const d = base();
  if (!d) return;
  await d.series.delete(id);
}

export async function subirPendientes(
  enviar: (payload: Record<string, unknown>) => Promise<boolean>,
  puedeRegistrar: boolean,
): Promise<{ subidas: number; bloqueadas: boolean }> {
  const lista = await pendientes();
  if (!lista.length) return { subidas: 0, bloqueadas: false };
  if (!puedeRegistrar) return { subidas: 0, bloqueadas: true };
  let subidas = 0;
  for (const item of lista) {
    const ok = await enviar(item.payload);
    if (!ok) break;
    if (item.id != null) await borrarPendiente(item.id);
    subidas += 1;
  }
  return { subidas, bloqueadas: false };
}
