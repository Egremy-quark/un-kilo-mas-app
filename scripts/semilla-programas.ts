import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { descansoASegundos } from '../src/lib/descanso';
import { normalizarNombre, tipoAlternativa } from '../src/lib/normalizar';
import { clasificarMedida, clasificarPatron } from '../src/lib/patron';

config({ path: '.env.local' });
config();

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

interface SemanaJson {
  texto?: string;
  series?: string;
  reps?: string;
  pct?: number;
  nota_carga?: string;
  tempo?: string;
  tecnica?: string;
  descanso?: string;
  omitir?: boolean;
}

interface EjercicioJson {
  orden: number;
  nombre: string;
  grupo?: string;
  nota?: string;
  revisar?: boolean;
  cambios_permitidos?: string[];
  semanas: SemanaJson[];
}

interface DiaJson {
  dia: string;
  foco?: string;
  ejercicios: EjercicioJson[];
}

interface FaseJson {
  orden: number;
  id: string;
  nombre: string;
  descripcion?: string;
  semanas: number;
  dias: DiaJson[];
}

interface RutaJson {
  programa: string;
  fases: FaseJson[];
  cambios_permitidos?: Record<string, { nombre: string; tipo: string }[]>;
}

const cacheEjercicios = new Map<string, string>();

async function ejercicioId(nombre: string): Promise<string> {
  const claveNombre = normalizarNombre(nombre);
  const cached = cacheEjercicios.get(claveNombre);
  if (cached) return cached;

  const { data: existentes } = await supabase.from('ejercicios').select('id, nombre');
  for (const fila of existentes ?? []) {
    cacheEjercicios.set(normalizarNombre(fila.nombre as string), fila.id as string);
  }
  const deNuevo = cacheEjercicios.get(claveNombre);
  if (deNuevo) return deNuevo;

  const { data, error } = await supabase
    .from('ejercicios')
    .insert({
      nombre,
      medida: clasificarMedida(nombre),
      patron: clasificarPatron(nombre),
      nota_default: null,
    })
    .select('id')
    .single();
  if (error) {
    const { data: otra } = await supabase.from('ejercicios').select('id, nombre');
    for (const fila of otra ?? []) {
      cacheEjercicios.set(normalizarNombre(fila.nombre as string), fila.id as string);
    }
    const id = cacheEjercicios.get(claveNombre);
    if (id) return id;
    throw error;
  }
  cacheEjercicios.set(claveNombre, data.id as string);
  return data.id as string;
}

async function asegurarPrograma(claveProg: string, nombre: string, descripcion: string) {
  const { data } = await supabase.from('programas').select('id').eq('clave', claveProg).maybeSingle();
  if (data?.id) {
    await supabase.from('programas').update({ nombre, descripcion }).eq('id', data.id);
    return data.id as string;
  }
  const { data: creado, error } = await supabase
    .from('programas')
    .insert({ clave: claveProg, nombre, descripcion })
    .select('id')
    .single();
  if (error || !creado) throw error ?? new Error('No se pudo crear el programa.');
  return creado.id as string;
}

function rmDeNota(nota?: string): number | null {
  if (!nota) return null;
  const m = nota.match(/(\d+)\s*RM/i);
  return m ? Number(m[1]) : null;
}

function intensidadDe(semanas: SemanaJson[]): 'pct_1rm' | 'rm' | 'rpe' | 'texto' {
  if (semanas.some((s) => s.pct != null)) return 'pct_1rm';
  if (semanas.some((s) => rmDeNota(s.nota_carga))) return 'rm';
  if (semanas.some((s) => /rpe/i.test(s.texto ?? ''))) return 'rpe';
  return 'texto';
}

async function vaciarRutina(rutinaId: string) {
  await supabase.from('rutina_dias').delete().eq('rutina_id', rutinaId);
}

async function asegurarPatrones() {
  const { data } = await supabase.from('ejercicios').select('id, nombre, patron, medida');
  for (const fila of data ?? []) {
    const nombre = fila.nombre as string;
    const patron = clasificarPatron(nombre);
    const medida = clasificarMedida(nombre);
    const patch: { patron?: string | null; medida?: string } = {};
    if (patron !== (fila.patron as string | null)) patch.patron = patron;
    if (medida !== fila.medida) patch.medida = medida;
    if (Object.keys(patch).length) await supabase.from('ejercicios').update(patch).eq('id', fila.id);
  }
}

async function asegurarFase(params: {
  programaId: string;
  orden: number;
  nombre: string;
  descripcion: string;
  semanas: number | null;
  enfoque?: 'fuerza' | 'hipertrofia' | 'transicion' | 'tecnica';
  publicada: boolean;
}) {
  const { data: fase } = await supabase
    .from('programa_fases')
    .select('id, rutina_id')
    .eq('programa_id', params.programaId)
    .eq('orden', params.orden)
    .maybeSingle();

  let rutinaId = fase?.rutina_id as string | null;
  if (!rutinaId) {
    const { data: rutina, error } = await supabase
      .from('rutinas')
      .insert({
        cliente_id: null,
        es_plantilla: false,
        nombre: params.nombre,
        enfoque: params.enfoque ?? 'tecnica',
        semanas: params.semanas,
        estado: params.publicada ? 'publicada' : 'borrador',
      })
      .select('id')
      .single();
    if (error || !rutina) throw error ?? new Error('No se pudo crear la rutina.');
    rutinaId = rutina.id as string;
  } else {
    await supabase
      .from('rutinas')
      .update({
        nombre: params.nombre,
        semanas: params.semanas,
        enfoque: params.enfoque ?? 'tecnica',
        es_plantilla: false,
        estado: params.publicada ? 'publicada' : 'borrador',
      })
      .eq('id', rutinaId);
  }

  if (fase?.id) {
    await supabase
      .from('programa_fases')
      .update({
        nombre: params.nombre,
        descripcion: params.descripcion,
        rutina_id: rutinaId,
        publicada: params.publicada,
      })
      .eq('id', fase.id);
  } else {
    await supabase.from('programa_fases').insert({
      programa_id: params.programaId,
      orden: params.orden,
      nombre: params.nombre,
      descripcion: params.descripcion,
      rutina_id: rutinaId,
      publicada: params.publicada,
    });
  }

  return rutinaId;
}

async function llenarRutina(rutinaId: string, dias: DiaJson[], semanasTotales: number) {
  await vaciarRutina(rutinaId);
  for (const [i, dia] of dias.entries()) {
    const { data: filaDia, error } = await supabase
      .from('rutina_dias')
      .insert({ rutina_id: rutinaId, letra: dia.dia, foco: dia.foco ?? null, orden: i })
      .select('id')
      .single();
    if (error || !filaDia) throw error ?? new Error('No se pudo crear el día.');
    for (const ej of dia.ejercicios) {
      const ejercicio_id = await ejercicioId(ej.nombre);
      const { data: filaEj, error: errorEj } = await supabase
        .from('rutina_ejercicios')
        .insert({
          dia_id: filaDia.id,
          ejercicio_id,
          orden: ej.orden,
          grupo: ej.grupo ?? null,
          intensidad_tipo: intensidadDe(ej.semanas ?? []),
          nota: ej.nota ?? null,
          revisar: Boolean(ej.revisar),
        })
        .select('id')
        .single();
      if (errorEj || !filaEj) throw errorEj ?? new Error('No se pudo crear el ejercicio.');
      const semanas = ej.semanas ?? [];
      for (let s = 0; s < Math.max(semanasTotales, semanas.length); s++) {
        const pres = semanas[s];
        if (!pres) continue;
        await supabase.from('prescripciones').insert({
          rutina_ejercicio_id: filaEj.id,
          semana: s + 1,
          series: pres.series ?? null,
          reps: pres.reps ?? null,
          pct: pres.pct ?? null,
          rm: rmDeNota(pres.nota_carga),
          tempo: pres.tempo ?? null,
          tecnica: pres.tecnica ?? null,
          descanso_seg: descansoASegundos(pres.descanso),
          omitir: Boolean(pres.omitir),
          texto: pres.texto ?? '',
        });
      }
    }
  }
}

async function sembrarPrueba() {
  const programaId = await asegurarPrograma(
    'prueba',
    'Prueba',
    'Rutina 01 «Base articular» y Rutina 02 «Aprender a moverse». [CONTENIDO POR YOHAN]',
  );
  const plantillas = [
    { orden: 1, nombre: 'Rutina 01 · Base articular', descripcion: '[CONTENIDO POR YOHAN] Empieza en casa, sin público.' },
    { orden: 2, nombre: 'Rutina 02 · Aprender a moverse', descripcion: '[CONTENIDO POR YOHAN] Pasa al gimnasio a aprender los movimientos básicos.' },
  ];
  for (const p of plantillas) {
    const rutinaId = await asegurarFase({
      programaId,
      orden: p.orden,
      nombre: p.nombre,
      descripcion: p.descripcion,
      semanas: null,
      enfoque: 'tecnica',
      publicada: false,
    });
    await vaciarRutina(rutinaId);
    // 8 sesiones de ejemplo: 4 semanas × días A y B, vacías para que las llene el entrenador.
    for (const [i, letra] of ['A', 'B'].entries()) {
      await supabase.from('rutina_dias').insert({
        rutina_id: rutinaId,
        letra,
        foco: '[CONTENIDO POR YOHAN]',
        orden: i,
      });
    }
  }
  console.log('Programa prueba: Rutina 01 y 02 vacías.');
}

const ENFOQUE_FASE: Record<string, 'fuerza' | 'hipertrofia' | 'transicion' | 'tecnica'> = {
  Arranque: 'tecnica',
  Pulir: 'tecnica',
  Cimientos: 'fuerza',
  Carga: 'fuerza',
  'Carga II': 'fuerza',
  Mixto: 'transicion',
  Volumen: 'hipertrofia',
  Remate: 'hipertrofia',
};

async function sembrarRuta() {
  const bruto = JSON.parse(readFileSync(join(raiz, 'datos/ruta-1.json'), 'utf8')) as RutaJson;
  const programaId = await asegurarPrograma('ruta-1', bruto.programa ?? 'Ruta +1', 'Programa general de 8 fases.');
  const tiposRaiz = new Map<string, 'sin_equipo' | 'equivalente' | 'maquina'>();
  for (const [nombre, alts] of Object.entries(bruto.cambios_permitidos ?? {})) {
    for (const alt of alts) {
      tiposRaiz.set(`${normalizarNombre(nombre)}|${normalizarNombre(alt.nombre)}`, tipoAlternativa(alt.tipo));
    }
  }

  for (const [nombre, alts] of Object.entries(bruto.cambios_permitidos ?? {})) {
    const origen = await ejercicioId(nombre);
    for (const [orden, alt] of alts.entries()) {
      const destino = await ejercicioId(alt.nombre);
      await supabase.from('ejercicio_alternativas').upsert(
        {
          ejercicio_id: origen,
          alternativa_id: destino,
          tipo: tipoAlternativa(alt.tipo),
          orden,
        },
        { onConflict: 'ejercicio_id,alternativa_id' },
      );
    }
  }

  for (const fase of bruto.fases) {
    const hayRevisar = fase.dias.some((d) => d.ejercicios.some((e) => e.revisar));
    const rutinaId = await asegurarFase({
      programaId,
      orden: fase.orden,
      nombre: fase.nombre,
      descripcion: fase.descripcion ?? '',
      semanas: fase.semanas,
      enfoque: ENFOQUE_FASE[fase.nombre] ?? 'fuerza',
      publicada: !hayRevisar,
    });
    await llenarRutina(rutinaId, fase.dias, fase.semanas);
    for (const dia of fase.dias) {
      for (const ej of dia.ejercicios) {
        const origen = await ejercicioId(ej.nombre);
        for (const [orden, nombreAlt] of (ej.cambios_permitidos ?? []).entries()) {
          const destino = await ejercicioId(nombreAlt);
          await supabase.from('ejercicio_alternativas').upsert(
            {
              ejercicio_id: origen,
              alternativa_id: destino,
              tipo: tiposRaiz.get(`${normalizarNombre(ej.nombre)}|${normalizarNombre(nombreAlt)}`) ?? 'equivalente',
              orden,
            },
            { onConflict: 'ejercicio_id,alternativa_id' },
          );
        }
      }
    }
    console.log(`Fase ${fase.orden} ${fase.nombre}${hayRevisar ? ' (sin publicar, hay ejercicios por revisar)' : ''}`);
  }
}

await sembrarPrueba();
await sembrarRuta();
await asegurarPatrones();
console.log('Semilla de programas lista.');
