import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { clasificarMedida, clasificarPatron } from '../src/lib/patron';
import { normalizarNombre } from '../src/lib/normalizar';

config({ path: '.env.local' });

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });

const CARPETA = 'data/buho-way';
const MARCA = 'Importado de Buho Way — por revisar';
const NOTA_CLIENTE = 'Programa de cliente — revisar con Yohan antes de publicar';

const FASES: { orden: number; nombre: string }[] = [
  { orden: 1, nombre: 'En Casa' },
  { orden: 2, nombre: 'Aprender a Moverse' },
  { orden: 3, nombre: 'Aprendiendo Fuerza' },
  { orden: 4, nombre: 'Introducción a la Fuerza' },
  { orden: 5, nombre: 'BIIO Evolucionado' },
  { orden: 6, nombre: 'EL CAMINO' },
  { orden: 7, nombre: 'Bloques de Power' },
];

const ENFOQUES: Record<string, string> = {
  fuerza: 'fuerza',
  hipertrofia: 'hipertrofia',
  transicion: 'transicion',
  tecnica: 'tecnica',
};

type Pres = {
  semana: number;
  series: string | null;
  reps: string | null;
  metodo: string | null;
  prescripcion_texto: string | null;
  porcentaje_rm: string | number | null;
  carga_kg_fuente: string | number | null;
  carga_texto: string | null;
  descanso: string | null;
  notas: string | null;
};

type Sub = { nombre: string; prescripcion: Pres[] };

type Ej = {
  nombre: string;
  nombre_clave: string;
  notas: string;
  superconjunto_con: string | null;
  prescripcion: Pres[];
  subprescripciones?: Sub[];
  rm_referencia?: { valor?: string | number | null } | null;
};

type Dia = {
  codigo: string;
  enfoque_dia: string | null;
  instrucciones_sesion?: Record<string, string>;
  ejercicios: Ej[];
};

type Variante = {
  etiqueta: string;
  etiquetas?: string[];
  unidades: string | null;
};

type Plantilla = {
  nombre: string;
  fase_corta: string;
  semanas: number;
  enfoque: string;
  variantes: Variante[];
  dias: Dia[];
  notas?: string;
};

type VarianteFila = {
  poblacion: 'mujeres' | 'hombres' | null;
  material: 'poco_material' | 'sin_maquinas' | null;
  unidades: 'kg' | 'lbs' | null;
};

const avisos: string[] = [];
const saltadas: { nombre: string; porque: string }[] = [];
let enlaces = 0;
let creaciones = 0;
const enlazadosUnicos = new Set<string>();
const creadosUnicos = new Set<string>();
const notasCliente: string[] = [];
const variantesLbs: string[] = [];

function descansoSeg(valor: string | null): number | null {
  if (!valor) return null;
  const t = valor.trim();
  const minSeg = t.match(/(\d+)\s*'\s*(\d+)/);
  if (minSeg) return Number(minSeg[1]) * 60 + Number(minSeg[2]);
  const colon = t.match(/(\d+)\s*:\s*(\d+)/);
  if (colon) return Number(colon[1]) * 60 + Number(colon[2]);
  const solo = t.match(/(\d+(?:[.,]\d+)?)/);
  if (!solo) return null;
  const n = Number(solo[1].replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  if (/min/i.test(t) && !/["″]/.test(t)) return Math.round(n * 60);
  return Math.round(n);
}

function redondear(valor: string | number | null | undefined, donde: string): number | null {
  if (valor == null || valor === '') return null;
  const texto = String(valor).trim();
  const n = Number(texto.replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  const dec = texto.split(/[.,]/)[1] ?? '';
  if (dec.length > 6) {
    const r = Math.round(n * 10) / 10;
    avisos.push(`${donde}: ${texto} → ${r}`);
    return r;
  }
  return n;
}

function pctDe(valor: string | number | null, donde: string): number | null {
  const n = redondear(valor, donde);
  if (n == null) return null;
  const fraccion = n > 1 ? n / 100 : n;
  const pct = Math.round(fraccion * 10000) / 10000;
  if (pct < 0 || pct > 1) {
    avisos.push(`${donde}: porcentaje ${valor} fuera de 0–1, se omite`);
    return null;
  }
  return pct;
}

function esProgramaCliente(nombre: string): boolean {
  const n = normalizarNombre(nombre);
  return (
    n.includes('(girl)') ||
    n.includes('(ally)') ||
    n.includes('buho gym') ||
    n.includes('(formato 2)') ||
    n.includes('sin maquinas') ||
    (n.includes('if1') && n.includes('buho'))
  );
}

function varianteDe(v: Variante): VarianteFila | null {
  const texto = normalizarNombre([v.etiqueta, ...(v.etiquetas ?? [])].join(' '));
  const unidadesArchivo = normalizarNombre(v.unidades ?? '');
  let poblacion: VarianteFila['poblacion'] = null;
  let material: VarianteFila['material'] = null;
  let unidades: VarianteFila['unidades'] = null;
  if (/\b(mujeres|girls|ninas)\b/.test(texto)) poblacion = 'mujeres';
  if (/\bhombres\b/.test(texto)) poblacion = 'hombres';
  if (texto.includes('poco material')) material = 'poco_material';
  if (texto.includes('sin maquinas')) material = 'sin_maquinas';
  if (unidadesArchivo === 'lbs' || /\blbs\b/.test(texto)) unidades = 'lbs';
  else if (unidadesArchivo === 'kg' || /\bkg\b/.test(texto)) unidades = 'kg';
  if (!poblacion && !material && !unidades) return null;
  return { poblacion, material, unidades };
}

function textoPres(p: Pres, donde: string): string {
  const carga = redondear(p.carga_kg_fuente, `${donde} carga`);
  const partes = [p.prescripcion_texto, p.metodo, p.carga_texto, carga != null ? `carga ${carga}` : null, p.notas].filter(Boolean);
  return partes.join(' · ');
}

function gruposDelDia(ejercicios: Ej[]): Map<number, string> {
  const grupos = new Map<number, string>();
  let letra = 0;
  const clave = (nombre: string) => normalizarNombre(nombre);
  for (let i = 0; i < ejercicios.length; i += 1) {
    const otro = ejercicios[i].superconjunto_con;
    if (!otro || grupos.has(i)) continue;
    const j = ejercicios.findIndex((ej, k) => k !== i && clave(ej.nombre) === clave(otro));
    const marca = String.fromCharCode(65 + (letra % 26));
    letra += 1;
    grupos.set(i, marca);
    if (j >= 0) grupos.set(j, marca);
  }
  return grupos;
}

async function leerTodo<T>(tabla: string, columnas: string): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await supabase.from(tabla).select(columnas).range(desde, desde + 999);
    if (error) throw new Error(error.message);
    filas.push(...((data ?? []) as T[]));
    if (!data || data.length < 1000) break;
  }
  return filas;
}

async function asegurarFases(): Promise<Map<string, string>> {
  const actuales = await leerTodo<{ id: string; orden: number; nombre: string }>('plantilla_fases', 'id, orden, nombre');
  const porOrden = new Map(actuales.map((f) => [f.orden, f]));
  for (const fase of FASES) {
    const ya = porOrden.get(fase.orden);
    if (ya) {
      if (normalizarNombre(ya.nombre) !== normalizarNombre(fase.nombre)) {
        throw new Error(`La fase de orden ${fase.orden} se llama «${ya.nombre}», no «${fase.nombre}». No la renombro.`);
      }
      continue;
    }
    const { data, error } = await supabase.from('plantilla_fases').insert(fase).select('id, orden, nombre').single();
    if (error || !data) throw new Error(error?.message ?? `No se pudo crear la fase ${fase.nombre}.`);
    porOrden.set(fase.orden, data);
  }
  return new Map([...porOrden.values()].map((f) => [normalizarNombre(f.nombre), f.id]));
}

async function biblioteca(): Promise<Map<string, { id: string; nombre: string }>> {
  const filas = await leerTodo<{ id: string; nombre: string }>('ejercicios', 'id, nombre');
  return new Map(filas.map((e) => [normalizarNombre(e.nombre), e]));
}

async function idEjercicio(
  mapa: Map<string, { id: string; nombre: string }>,
  ej: Ej,
): Promise<{ id: string; nuevo: boolean }> {
  const clave = normalizarNombre(ej.nombre);
  const hallado = mapa.get(clave) ?? mapa.get(normalizarNombre(ej.nombre_clave));
  if (hallado) {
    enlaces += 1;
    enlazadosUnicos.add(hallado.nombre);
    return { id: hallado.id, nuevo: false };
  }
  const { data, error } = await supabase
    .from('ejercicios')
    .insert({
      nombre: ej.nombre,
      patron: clasificarPatron(ej.nombre),
      medida: clasificarMedida(ej.nombre),
      nota_default: MARCA,
    })
    .select('id, nombre')
    .single();
  if (data) {
    mapa.set(clave, data);
    creaciones += 1;
    creadosUnicos.add(data.nombre);
    return { id: data.id, nuevo: true };
  }
  if (error?.code === '23505') {
    const fresco = await biblioteca();
    for (const [k, v] of fresco) mapa.set(k, v);
    const otra = mapa.get(clave) ?? mapa.get(normalizarNombre(ej.nombre_clave));
    if (otra) {
      enlaces += 1;
      enlazadosUnicos.add(otra.nombre);
      return { id: otra.id, nuevo: false };
    }
  }
  throw new Error(`No se pudo crear «${ej.nombre}»: ${error?.message}`);
}

async function borrarRutina(id: string) {
  await supabase.from('rutinas').delete().eq('id', id);
}

async function cargarUna(
  cliente: SupabaseClient,
  plantilla: Plantilla,
  faseId: string,
  mapa: Map<string, { id: string; nombre: string }>,
) {
  const enfoque = ENFOQUES[normalizarNombre(plantilla.enfoque)] ?? 'tecnica';
  const semanas = plantilla.semanas > 0 ? plantilla.semanas : 1;
  if (plantilla.semanas <= 0) avisos.push(`${plantilla.nombre}: semanas ${plantilla.semanas} → 1`);
  const clientePrograma = esProgramaCliente(plantilla.nombre);
  if (clientePrograma) notasCliente.push(plantilla.nombre);

  const { data: rutina, error: errorRutina } = await cliente
    .from('rutinas')
    .insert({
      cliente_id: null,
      es_plantilla: true,
      nombre: plantilla.nombre,
      enfoque,
      semanas,
      estado: 'borrador',
      fase_plantilla_id: faseId,
    })
    .select('id')
    .single();
  if (errorRutina || !rutina) throw new Error(errorRutina?.message ?? 'No se pudo crear la plantilla.');

  try {
    const idsEj: { id: string; nuevo: boolean }[][] = [];
    for (const dia of plantilla.dias) {
      const ids: { id: string; nuevo: boolean }[] = [];
      for (const ej of dia.ejercicios) ids.push(await idEjercicio(mapa, ej));
      idsEj.push(ids);
    }

    const diasInsert = plantilla.dias.map((dia, i) => {
      const instrucciones = Object.entries(dia.instrucciones_sesion ?? {})
        .map(([n, texto]) => `Sesión ${n}: ${texto}`)
        .join(' ');
      const focoBase = [dia.enfoque_dia, instrucciones].filter(Boolean).join('. ');
      const foco = clientePrograma ? [NOTA_CLIENTE, focoBase].filter(Boolean).join('. ') : focoBase;
      const letra = (dia.codigo || String.fromCharCode(65 + i)).slice(0, 8);
      return { rutina_id: rutina.id, letra, orden: i, foco: foco || null };
    });
    const letras = new Set<string>();
    for (const dia of diasInsert) {
      if (letras.has(dia.letra)) dia.letra = `${dia.letra}${dia.orden + 1}`;
      letras.add(dia.letra);
    }
    const { data: dias, error: errorDias } = await cliente.from('rutina_dias').insert(diasInsert).select('id, orden');
    if (errorDias || !dias) throw new Error(errorDias?.message ?? 'No se pudieron crear los días.');
    const diaPorOrden = new Map(dias.map((d) => [d.orden as number, d.id as string]));

    const ejerciciosInsert: {
      dia_id: string;
      ejercicio_id: string;
      orden: number;
      grupo: string | null;
      intensidad_tipo: 'texto';
      nota: string | null;
      revisar: boolean;
    }[] = [];
    const presMeta: { indice: number; pres: Pres[]; subs: Sub[]; nombre: string; rm: string | number | null | undefined }[] = [];
    for (const [i, dia] of plantilla.dias.entries()) {
      const grupos = gruposDelDia(dia.ejercicios);
      dia.ejercicios.forEach((ej, j) => {
        ejerciciosInsert.push({
          dia_id: diaPorOrden.get(i)!,
          ejercicio_id: idsEj[i][j].id,
          orden: j + 1,
          grupo: grupos.get(j) ?? null,
          intensidad_tipo: 'texto',
          nota: ej.notas || null,
          revisar: idsEj[i][j].nuevo,
        });
        presMeta.push({
          indice: ejerciciosInsert.length - 1,
          pres: ej.prescripcion,
          subs: ej.subprescripciones ?? [],
          nombre: ej.nombre,
          rm: ej.rm_referencia?.valor,
        });
      });
    }
    const filasEj: { id: string }[] = [];
    if (ejerciciosInsert.length) {
      const { data, error: errorEj } = await cliente
        .from('rutina_ejercicios')
        .insert(ejerciciosInsert)
        .select('id, dia_id, orden');
      if (errorEj || !data) throw new Error(errorEj?.message ?? 'No se pudieron crear los ejercicios de la plantilla.');
      const porClave = new Map(data.map((fila) => [`${fila.dia_id}:${fila.orden}`, fila.id as string]));
      for (const fila of ejerciciosInsert) {
        const id = porClave.get(`${fila.dia_id}:${fila.orden}`);
        if (!id) throw new Error('La fila del ejercicio no volvió con su orden.');
        filasEj.push({ id });
      }
    }

    const presInsert: {
      rutina_ejercicio_id: string;
      semana: number;
      series: string | null;
      reps: string | null;
      pct: number | null;
      texto: string;
      descanso_seg: number | null;
    }[] = [];
    presMeta.forEach((meta, i) => {
      redondear(meta.rm, `${plantilla.nombre} · ${meta.nombre} RM de referencia`);
      const porSemana = new Map<number, (typeof presInsert)[number]>();
      for (const p of meta.pres) {
        const donde = `${plantilla.nombre} · ${meta.nombre} semana ${p.semana}`;
        porSemana.set(p.semana, {
          rutina_ejercicio_id: filasEj[i].id,
          semana: p.semana,
          series: p.series,
          reps: p.reps,
          pct: pctDe(p.porcentaje_rm, `${donde} %`),
          texto: textoPres(p, donde),
          descanso_seg: descansoSeg(p.descanso),
        });
      }
      for (const sub of meta.subs) {
        for (const p of sub.prescripcion) {
          const donde = `${plantilla.nombre} · ${meta.nombre} ${sub.nombre} semana ${p.semana}`;
          const extra = [`${sub.nombre}: ${textoPres(p, donde)}`].join('');
          const base = porSemana.get(p.semana);
          if (base) {
            base.texto = [base.texto, extra].filter(Boolean).join(' | ');
            if (base.descanso_seg == null) base.descanso_seg = descansoSeg(p.descanso);
          } else {
            porSemana.set(p.semana, {
              rutina_ejercicio_id: filasEj[i].id,
              semana: p.semana,
              series: p.series,
              reps: p.reps,
              pct: pctDe(p.porcentaje_rm, `${donde} %`),
              texto: extra,
              descanso_seg: descansoSeg(p.descanso),
            });
          }
        }
      }
      presInsert.push(...porSemana.values());
    });
    for (let i = 0; i < presInsert.length; i += 400) {
      const trozo = presInsert.slice(i, i + 400);
      const { error } = await cliente.from('prescripciones').insert(trozo);
      if (error) throw new Error(error.message);
    }

    const variantes = plantilla.variantes.map(varianteDe).filter((v): v is VarianteFila => v != null);
    if (variantes.some((v) => v.unidades === 'lbs')) variantesLbs.push(plantilla.nombre);
    if (variantes.length) {
      const { error } = await cliente.from('plantilla_variantes').insert(
        variantes.map((v) => ({ rutina_id: rutina.id, ...v })),
      );
      if (error) throw new Error(error.message);
    }
    const sinEtiqueta = plantilla.variantes.length - variantes.length;
    if (sinEtiqueta > 0) {
      avisos.push(`${plantilla.nombre}: ${sinEtiqueta} variante(s) sin población, material ni unidad; no caben en las etiquetas.`);
    }
  } catch (error) {
    await borrarRutina(rutina.id);
    throw error;
  }
}

async function main() {
  const fases = await asegurarFases();
  const mapa = await biblioteca();
  const existentes = await leerTodo<{ id: string; nombre: string; fase_plantilla_id: string | null }>(
    'rutinas',
    'id, nombre, fase_plantilla_id',
  );
  const plantillasYa = existentes.filter((r) => r.fase_plantilla_id !== undefined);
  const { data: soloPlantillas, error: errorPlantillas } = await supabase
    .from('rutinas')
    .select('id, nombre, fase_plantilla_id')
    .eq('es_plantilla', true)
    .is('cliente_id', null);
  if (errorPlantillas || !soloPlantillas) throw new Error(errorPlantillas?.message ?? 'No se pudieron leer las plantillas.');
  const nombres = new Set(soloPlantillas.map((r) => r.nombre));
  const sinFaseAntes = soloPlantillas.filter((r) => r.fase_plantilla_id == null).map((r) => r.nombre);

  const archivos = readdirSync(CARPETA).filter((f) => /^f\d+-.*\.json$/.test(f)).sort();
  let cargadas = 0;
  for (const archivo of archivos) {
    const plantilla = JSON.parse(readFileSync(join(CARPETA, archivo), 'utf8')) as Plantilla;
    if (nombres.has(plantilla.nombre)) {
      saltadas.push({ nombre: plantilla.nombre, porque: 'Ya existe una plantilla con ese nombre.' });
      continue;
    }
    const faseId = fases.get(normalizarNombre(plantilla.fase_corta));
    if (!faseId) {
      saltadas.push({ nombre: plantilla.nombre, porque: `Fase desconocida: ${plantilla.fase_corta}` });
      continue;
    }
    try {
      await cargarUna(supabase, plantilla, faseId, mapa);
      nombres.add(plantilla.nombre);
      cargadas += 1;
      console.log(`${cargadas}. ${plantilla.nombre}`);
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      saltadas.push({ nombre: plantilla.nombre, porque: mensaje });
      console.error(`FALLÓ ${plantilla.nombre}: ${mensaje}`);
    }
  }

  const { data: finales, error: errorFinal } = await supabase
    .from('rutinas')
    .select('nombre, fase_plantilla_id, plantilla_fases(nombre)')
    .eq('es_plantilla', true)
    .is('cliente_id', null);
  if (errorFinal || !finales) throw new Error(errorFinal?.message ?? 'No se pudo verificar.');
  const conteo = new Map<string, number>();
  for (const fila of finales) {
    const fase = (fila.plantilla_fases as { nombre?: string } | null)?.nombre ?? 'Sin fase';
    conteo.set(fase, (conteo.get(fase) ?? 0) + 1);
  }

  console.log(JSON.stringify({
    archivos: archivos.length,
    cargadas,
    saltadas,
    enlaces,
    creaciones,
    enlazadosUnicos: enlazadosUnicos.size,
    creadosUnicos: creadosUnicos.size,
    notasCliente,
    variantesLbs,
    sinFaseAntes,
    total: finales.length,
    conteo: Object.fromEntries(conteo),
    redondeos: avisos.length,
    avisos: avisos.slice(0, 30),
    plantillasYa: plantillasYa.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
