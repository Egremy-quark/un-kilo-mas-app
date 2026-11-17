import type { Enfoque } from '@/lib/etiquetas';

export interface DiaConstructor {
  id: string;
  letra: string;
  foco: string | null;
  orden: number;
}

export interface EjConstructor {
  id: string;
  dia_id: string;
  ejercicio_id: string;
  orden: number;
  grupo: string | null;
  intensidad_tipo: 'pct_1rm' | 'rm' | 'rpe' | 'rir_fallo' | 'texto';
  nota: string | null;
  video_url: string | null;
  revisar: boolean;
  nombre?: string;
}

export interface PresConstructor {
  id?: string;
  rutina_ejercicio_id: string;
  semana: number;
  series: string | null;
  reps: string | null;
  pct: number | null;
  rm: number | null;
  tecnica: string | null;
  descanso_seg: number | null;
  omitir: boolean;
  texto: string;
}

export interface CatalogoConstructor {
  id: string;
  nombre: string;
}

export interface InicialConstructor {
  nombre: string;
  semanas: number | null;
  descarga: number | null;
  enfoque: Enfoque;
  estado: string;
  dias: DiaConstructor[];
  ejercicios: EjConstructor[];
  pres: PresConstructor[];
  catalogo: CatalogoConstructor[];
}

export async function cargarConstructor(
  supabase: { from: (t: string) => { select: (c: string) => any } },
  rutinaId: string,
): Promise<InicialConstructor | null> {
  const { data: r } = await supabase.from('rutinas').select('*').eq('id', rutinaId).maybeSingle();
  if (!r) return null;
  const { data: ds } = await supabase.from('rutina_dias').select('*').eq('rutina_id', rutinaId).order('orden');
  const dias = (ds ?? []) as DiaConstructor[];
  const diaIds = dias.map((d) => d.id);
  const { data: ejs } = diaIds.length
    ? await supabase.from('rutina_ejercicios').select('*, ejercicios(nombre)').in('dia_id', diaIds).order('orden')
    : { data: [] };
  const ejercicios = ((ejs ?? []) as Record<string, unknown>[]).map((e) => ({
    ...e,
    nombre: (e.ejercicios as { nombre?: string } | null)?.nombre,
  })) as EjConstructor[];
  const ejIds = ejercicios.map((e) => e.id);
  const { data: ps } = ejIds.length
    ? await supabase.from('prescripciones').select('*').in('rutina_ejercicio_id', ejIds)
    : { data: [] };
  const { data: cat } = await supabase.from('ejercicios').select('id, nombre').order('nombre');
  return {
    nombre: (r.nombre as string) ?? '',
    semanas: (r.semanas as number | null) ?? null,
    descarga: (r.semana_descarga as number | null) ?? null,
    enfoque: ((r.enfoque as Enfoque) ?? 'fuerza') as Enfoque,
    estado: (r.estado as string) ?? 'borrador',
    dias,
    ejercicios,
    pres: (ps ?? []) as PresConstructor[],
    catalogo: (cat ?? []) as CatalogoConstructor[],
  };
}
