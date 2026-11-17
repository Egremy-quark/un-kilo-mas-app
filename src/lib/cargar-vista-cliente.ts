import type { Enfoque } from '@/lib/etiquetas';

export interface VistaClienteDatos {
  rutinaId: string;
  nombre: string;
  semanas: number | null;
  enfoque: Enfoque;
  faseOrden: number | null;
  faseNombre: string | null;
  programaNombre: string | null;
  programaClave: string | null;
  dias: { id: string; letra: string; foco: string | null }[];
  ejercicios: {
    id: string;
    dia_id: string;
    ejercicio_id: string;
    nombre: string;
    grupo: string | null;
    nota: string | null;
    revisar: boolean;
    pres: { texto: string; pct: number | null; descanso_seg: number | null; omitir: boolean };
    rm: number | null;
    hechoId: string;
    alternativas: { id: string; nombre: string; tipo: string }[];
  }[];
}

export async function cargarVistaCliente(
  supabase: { from: (t: string) => { select: (c: string) => any } },
  rutinaId: string,
): Promise<VistaClienteDatos | null> {
  const { data: r } = await supabase.from('rutinas').select('id, nombre, semanas, enfoque').eq('id', rutinaId).maybeSingle();
  if (!r) return null;
  const { data: fase } = await supabase
    .from('programa_fases')
    .select('orden, nombre, programas(clave, nombre)')
    .eq('rutina_id', rutinaId)
    .maybeSingle();
  const programa = fase?.programas as { clave?: string; nombre?: string } | null;
  const { data: diasBruto } = await supabase.from('rutina_dias').select('id, letra, foco').eq('rutina_id', rutinaId).order('orden');
  const dias = (diasBruto ?? []) as { id: string; letra: string; foco: string | null }[];
  const diaIds = dias.map((d) => d.id);
  const { data: ejsBruto } = diaIds.length
    ? await supabase.from('rutina_ejercicios').select('id, dia_id, ejercicio_id, grupo, nota, revisar, ejercicios(nombre)').in('dia_id', diaIds).order('orden')
    : { data: [] };
  const ejs = (ejsBruto ?? []) as {
    id: string;
    dia_id: string;
    ejercicio_id: string;
    grupo: string | null;
    nota: string | null;
    revisar: boolean;
    ejercicios: { nombre?: string } | null;
  }[];
  const ejIds = ejs.map((e) => e.id);
  const { data: presBruto } = ejIds.length
    ? await supabase.from('prescripciones').select('*').in('rutina_ejercicio_id', ejIds).eq('semana', 1)
    : { data: [] };
  const pres = (presBruto ?? []) as {
    rutina_ejercicio_id: string;
    texto: string | null;
    pct: number | null;
    descanso_seg: number | null;
    omitir: boolean;
  }[];
  const ejercicioIds = [...new Set(ejs.map((e) => e.ejercicio_id))];
  const { data: altsBruto } = ejercicioIds.length
    ? await supabase.from('ejercicio_alternativas').select('ejercicio_id, tipo, ejercicios:alternativa_id(id, nombre)').in('ejercicio_id', ejercicioIds).order('orden')
    : { data: [] };
  const alts = (altsBruto ?? []) as {
    ejercicio_id: string;
    tipo: string;
    ejercicios: { id?: string; nombre?: string } | null;
  }[];

  const ejercicios = ejs.map((e) => {
    const p = pres.find((x) => x.rutina_ejercicio_id === e.id);
    const alternativas = alts
      .filter((a) => a.ejercicio_id === e.ejercicio_id)
      .map((a) => ({
        id: a.ejercicios?.id ?? '',
        nombre: a.ejercicios?.nombre ?? '',
        tipo: a.tipo,
      }))
      .filter((a) => a.id);
    return {
      id: e.id as string,
      dia_id: e.dia_id as string,
      ejercicio_id: e.ejercicio_id as string,
      nombre: (e.ejercicios as { nombre?: string } | null)?.nombre ?? '',
      grupo: e.grupo as string | null,
      nota: e.nota as string | null,
      revisar: Boolean(e.revisar),
      pres: {
        texto: (p?.texto as string) ?? '',
        pct: (p?.pct as number | null) ?? null,
        descanso_seg: (p?.descanso_seg as number | null) ?? null,
        omitir: Boolean(p?.omitir),
      },
      rm: null,
      hechoId: e.ejercicio_id as string,
      alternativas,
    };
  });

  return {
    rutinaId,
    nombre: (r.nombre as string) ?? '',
    semanas: (r.semanas as number | null) ?? null,
    enfoque: ((r.enfoque as Enfoque) ?? 'fuerza') as Enfoque,
    faseOrden: (fase?.orden as number | undefined) ?? null,
    faseNombre: (fase?.nombre as string | undefined) ?? null,
    programaNombre: programa?.nombre ?? null,
    programaClave: programa?.clave ?? null,
    dias: (dias ?? []) as { id: string; letra: string; foco: string | null }[],
    ejercicios,
  };
}
