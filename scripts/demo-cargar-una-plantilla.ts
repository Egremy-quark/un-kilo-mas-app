import { readFileSync } from 'node:fs';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
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

const NOMBRE = '1° Microciclo - Aprender a moverse 1';
const MARCA = 'Importado de Buho Way — por revisar';
const ARCHIVO = 'data/buho-way/f2-1-microciclo-aprender-a-moverse-1.json';

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

type Ej = {
  nombre: string;
  nombre_clave: string;
  notas: string;
  superconjunto_con: string | null;
  prescripcion: Pres[];
  subprescripciones?: { nombre: string; prescripcion: Pres[] }[];
  rm_referencia?: { valor?: string | number | null } | null;
};

type Dia = {
  codigo: string;
  enfoque_dia: string | null;
  instrucciones_sesion?: Record<string, string>;
  ejercicios: Ej[];
};

type Plantilla = {
  nombre: string;
  semanas: number;
  enfoque: string;
  variantes: { etiqueta: string; unidades: string | null }[];
  dias: Dia[];
};

const ENFOQUES: Record<string, string> = {
  fuerza: 'fuerza',
  hipertrofia: 'hipertrofia',
  transicion: 'transicion',
  transición: 'transicion',
  tecnica: 'tecnica',
  técnica: 'tecnica',
};

function descansoSeg(valor: string | null): number | null {
  if (!valor) return null;
  const t = valor.trim();
  const minSeg = t.match(/(\d+)\s*'\s*(\d+)/);
  if (minSeg) return Number(minSeg[1]) * 60 + Number(minSeg[2]);
  const solo = t.match(/(\d+(?:[.,]\d+)?)/);
  if (!solo) return null;
  const n = Number(solo[1].replace(',', '.'));
  if (/min/i.test(t) && !t.includes('"') && !t.includes('″')) return Math.round(n * 60);
  return Math.round(n);
}

function redondear(valor: string | number | null | undefined, donde: string, avisos: string[]): number | null {
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

function pctDe(valor: string | number | null, donde: string, avisos: string[]): number | null {
  const n = redondear(valor, donde, avisos);
  if (n == null) return null;
  const fraccion = n > 1 ? n / 100 : n;
  return Math.round(fraccion * 10000) / 10000;
}

async function main() {
  const plantilla = JSON.parse(readFileSync(ARCHIVO, 'utf8')) as Plantilla;
  if (plantilla.nombre !== NOMBRE) throw new Error(`El archivo no es la demo: ${plantilla.nombre}`);

  const { data: ya } = await supabase
    .from('rutinas')
    .select('id')
    .eq('es_plantilla', true)
    .is('cliente_id', null)
    .eq('nombre', NOMBRE)
    .limit(1);
  if (ya?.length) throw new Error('Esa plantilla ya está cargada. No se duplica.');

  const { data: fase, error: errorFase } = await supabase
    .from('plantilla_fases')
    .select('id, orden, nombre')
    .eq('orden', 2)
    .maybeSingle();
  if (errorFase || !fase) throw new Error(errorFase?.message ?? 'No está la fase de orden 2.');

  const { data: biblioteca, error: errorBib } = await supabase.from('ejercicios').select('id, nombre');
  if (errorBib || !biblioteca) throw new Error(errorBib?.message ?? 'No se pudo leer la biblioteca.');
  const porNombre = new Map(biblioteca.map((e) => [normalizarNombre(e.nombre), e]));

  const avisos: string[] = [];
  const enlazados: string[] = [];
  const creados: string[] = [];
  const idPorNombre = new Map<string, string>();

  for (const dia of plantilla.dias) {
    for (const ej of dia.ejercicios) {
      const clave = normalizarNombre(ej.nombre);
      if (idPorNombre.has(clave)) continue;
      const hallado = porNombre.get(clave) ?? porNombre.get(normalizarNombre(ej.nombre_clave));
      if (hallado) {
        idPorNombre.set(clave, hallado.id);
        enlazados.push(`${ej.nombre} → ${hallado.nombre}`);
        continue;
      }
      const { data: nuevo, error } = await supabase
        .from('ejercicios')
        .insert({
          nombre: ej.nombre,
          patron: clasificarPatron(ej.nombre),
          medida: clasificarMedida(ej.nombre),
          nota_default: MARCA,
        })
        .select('id')
        .single();
      if (error || !nuevo) throw new Error(`No se pudo crear «${ej.nombre}»: ${error?.message}`);
      idPorNombre.set(clave, nuevo.id);
      creados.push(ej.nombre);
    }
  }

  const { data: rutina, error: errorRutina } = await supabase
    .from('rutinas')
    .insert({
      cliente_id: null,
      es_plantilla: true,
      nombre: NOMBRE,
      enfoque: ENFOQUES[normalizarNombre(plantilla.enfoque)] ?? 'tecnica',
      semanas: plantilla.semanas,
      estado: 'borrador',
      fase_plantilla_id: fase.id,
    })
    .select('id')
    .single();
  if (errorRutina || !rutina) throw new Error(errorRutina?.message ?? 'No se pudo crear la plantilla.');

  try {
    for (const [i, dia] of plantilla.dias.entries()) {
      const instrucciones = Object.entries(dia.instrucciones_sesion ?? {})
        .map(([n, texto]) => `Sesión ${n}: ${texto}`)
        .join(' ');
      const foco = [dia.enfoque_dia, instrucciones].filter(Boolean).join('. ');
      const { data: filaDia, error: errorDia } = await supabase
        .from('rutina_dias')
        .insert({ rutina_id: rutina.id, letra: dia.codigo, orden: i, foco: foco || null })
        .select('id')
        .single();
      if (errorDia || !filaDia) throw new Error(errorDia?.message ?? `No se pudo crear el día ${dia.codigo}.`);

      for (const [j, ej] of dia.ejercicios.entries()) {
        const { data: filaEj, error: errorEj } = await supabase
          .from('rutina_ejercicios')
          .insert({
            dia_id: filaDia.id,
            ejercicio_id: idPorNombre.get(normalizarNombre(ej.nombre)),
            orden: j + 1,
            grupo: null,
            intensidad_tipo: 'texto',
            nota: ej.notas || null,
            revisar: creados.includes(ej.nombre),
          })
          .select('id')
          .single();
        if (errorEj || !filaEj) throw new Error(errorEj?.message ?? `No se pudo enlazar «${ej.nombre}».`);

        for (const p of ej.prescripcion) {
          const donde = `${ej.nombre} semana ${p.semana}`;
          const pct = pctDe(p.porcentaje_rm, `${donde} %`, avisos);
          redondear(p.carga_kg_fuente, `${donde} carga`, avisos);
          redondear(ej.rm_referencia?.valor, `${donde} RM de referencia`, avisos);
          const partes = [p.prescripcion_texto, p.metodo, p.carga_texto, p.notas].filter(Boolean);
          const { error: errorPres } = await supabase.from('prescripciones').insert({
            rutina_ejercicio_id: filaEj.id,
            semana: p.semana,
            series: p.series,
            reps: p.reps,
            pct,
            texto: partes.join(' · '),
            descanso_seg: descansoSeg(p.descanso),
          });
          if (errorPres) throw new Error(`${donde}: ${errorPres.message}`);
        }
      }
    }

    const variante = plantilla.variantes[0];
    if (!variante) throw new Error('La demo no trae variante.');
    const { error: errorVar } = await supabase.from('plantilla_variantes').insert({
      rutina_id: rutina.id,
      material: 'sin_maquinas',
      unidades: variante.unidades === 'lbs' ? 'lbs' : 'kg',
    });
    if (errorVar) throw new Error(errorVar.message);
  } catch (error) {
    await supabase.from('rutinas').delete().eq('id', rutina.id);
    throw error;
  }

  const { count } = await supabase
    .from('rutinas')
    .select('id', { count: 'exact', head: true })
    .eq('es_plantilla', true)
    .is('cliente_id', null)
    .is('fase_plantilla_id', null);

  console.log(JSON.stringify({
    fase: fase.nombre,
    plantilla: NOMBRE,
    rutinaId: rutina.id,
    variante: 'Sin máquinas · kg',
    enlazados,
    creados,
    sinFase: count,
    redondeos: avisos,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
