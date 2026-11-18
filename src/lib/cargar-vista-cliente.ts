import type { Enfoque } from '@/lib/etiquetas';
import { prescripcionParaCliente } from '@/lib/pendiente-yohan';

export interface SerieVista {
  id: string;
  ejercicio: string;
  kg: number;
  reps: number;
  fecha: string;
}

export interface VistaClienteDatos {
  rutinaId: string;
  clienteId: string | null;
  clienteNombre: string | null;
  esDemo: boolean;
  nombre: string;
  semanas: number | null;
  enfoque: Enfoque;
  faseOrden: number | null;
  faseNombre: string | null;
  programaNombre: string | null;
  programaClave: string | null;
  historial: SerieVista[];
  dias: { id: string; letra: string; foco: string | null }[];
  ejercicios: {
    id: string;
    dia_id: string;
    ejercicio_id: string;
    nombre: string;
    grupo: string | null;
    nota: string | null;
    revisar: boolean;
    pres: { texto: string; series: string | null; reps: string | null; pct: number | null; descanso_seg: number | null; omitir: boolean };
    rm: number | null;
    hechoId: string;
    alternativas: { id: string; nombre: string; tipo: string }[];
  }[];
}

export async function cargarVistaCliente(
  supabase: { from: (t: string) => { select: (c: string) => any } },
  rutinaId: string,
  clienteId?: string | null,
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
    series: string | null;
    reps: string | null;
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

  let historial: SerieVista[] = [];
  let clienteNombre: string | null = null;
  let esDemo = false;
  const rms = new Map<string, number>();
  if (clienteId) {
    const { data: perfil } = await supabase.from('perfiles').select('nombre, correo').eq('id', clienteId).maybeSingle();
    clienteNombre = (perfil as { nombre?: string } | null)?.nombre ?? null;
    const correo = (perfil as { correo?: string } | null)?.correo ?? '';
    esDemo = Boolean(clienteNombre?.startsWith('Demo') || correo.endsWith('@example.com'));
    const { data: sesionesBruto } = await supabase.from('sesiones').select('id, fecha').eq('cliente_id', clienteId).order('fecha', { ascending: false });
    const sesiones = (sesionesBruto ?? []) as { id: string; fecha: string }[];
    const sesionIds = sesiones.map((s) => s.id);
    const { data: seriesBruto } = sesionIds.length
      ? await supabase.from('series').select('id, sesion_id, kg, reps, ejercicios(nombre)').in('sesion_id', sesionIds)
      : { data: [] };
    const fechaPor = new Map(sesiones.map((s) => [s.id, s.fecha]));
    historial = ((seriesBruto ?? []) as { id: string; sesion_id: string; kg: number | null; reps: number | null; ejercicios: { nombre?: string } | null }[])
      .filter((s) => s.kg != null && s.reps != null)
      .map((s) => ({
        id: s.id,
        ejercicio: s.ejercicios?.nombre ?? '',
        kg: Number(s.kg),
        reps: Number(s.reps),
        fecha: fechaPor.get(s.sesion_id) ?? '',
      }));
    const { data: rmFilas } = await supabase.from('rm_referencia').select('ejercicio_id, kg').eq('cliente_id', clienteId);
    for (const fila of rmFilas ?? []) rms.set(fila.ejercicio_id as string, Number(fila.kg));
  }

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
      pres: prescripcionParaCliente(p),
      rm: rms.get(e.ejercicio_id as string) ?? null,
      hechoId: e.ejercicio_id as string,
      alternativas,
    };
  });

  return {
    rutinaId,
    clienteId: clienteId ?? null,
    clienteNombre,
    esDemo,
    nombre: (r.nombre as string) ?? '',
    semanas: (r.semanas as number | null) ?? null,
    enfoque: ((r.enfoque as Enfoque) ?? 'fuerza') as Enfoque,
    faseOrden: (fase?.orden as number | undefined) ?? null,
    faseNombre: (fase?.nombre as string | undefined) ?? null,
    programaNombre: programa?.nombre ?? null,
    programaClave: programa?.clave ?? null,
    historial,
    dias: (dias ?? []) as { id: string; letra: string; foco: string | null }[],
    ejercicios,
  };
}
