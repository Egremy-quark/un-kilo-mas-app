/**
 * Crea una rutina en borrador a partir de una plantilla de Excel.
 * Solo lee la prescripción (día, ejercicio, texto por semana). No lee nombres de clientes ni pesos.
 *
 * Columnas esperadas (primera hoja, fila 1 = encabezados):
 *   Dia | Ejercicio | Sem 1 | Sem 2 | Sem 3 | ...
 */
import { readFileSync } from 'node:fs';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { normalizarNombre } from '../src/lib/normalizar';

config({ path: '.env.local' });
config();

const archivo = process.argv[2];
const clienteId = process.argv[3] ?? null;
if (!archivo) {
  console.error('Uso: npm run importar-excel -- archivo.xlsx [cliente_id]');
  process.exit(1);
}

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
const libro = XLSX.read(readFileSync(archivo));
const hoja = libro.Sheets[libro.SheetNames[0]];
const filas = XLSX.utils.sheet_to_json<Record<string, string>>(hoja, { defval: '' });
if (!filas.length) {
  console.error('La hoja está vacía.');
  process.exit(1);
}

const keys = Object.keys(filas[0]);
const colDia = keys.find((k) => /d[ií]a/i.test(k)) ?? keys[0];
const colEj = keys.find((k) => /ejercicio/i.test(k)) ?? keys[1];
const colSemanas = keys.filter((k) => /sem/i.test(k));

const { data: rutina, error } = await supabase
  .from('rutinas')
  .insert({
    cliente_id: clienteId,
    es_plantilla: !clienteId,
    nombre: 'Importada de Excel',
    enfoque: 'fuerza',
    semanas: Math.max(colSemanas.length, 1),
    estado: 'borrador',
  })
  .select('id')
  .single();
if (error || !rutina) throw error ?? new Error('No se pudo crear la rutina.');

const dias = new Map<string, string>();
const { data: catalogo } = await supabase.from('ejercicios').select('id, nombre');
const mapa = new Map((catalogo ?? []).map((e) => [normalizarNombre(e.nombre as string), e.id as string]));

async function ejercicioId(nombre: string): Promise<string> {
  const n = normalizarNombre(nombre);
  const id = mapa.get(n);
  if (id) return id;
  const { data } = await supabase.from('ejercicios').insert({ nombre, medida: 'kg_reps' }).select('id').single();
  if (!data) throw new Error(`No se pudo crear ${nombre}`);
  mapa.set(n, data.id as string);
  return data.id as string;
}

let ordenDia = 0;
for (const fila of filas) {
  const letra = String(fila[colDia] ?? 'A').trim().toUpperCase().slice(0, 1) || 'A';
  const nombreEj = String(fila[colEj] ?? '').trim();
  if (!nombreEj) continue;
  if (!dias.has(letra)) {
    const { data: d } = await supabase.from('rutina_dias').insert({ rutina_id: rutina.id, letra, orden: ordenDia++ }).select('id').single();
    if (d) dias.set(letra, d.id as string);
  }
  const diaId = dias.get(letra);
  if (!diaId) continue;
  const ejId = await ejercicioId(nombreEj);
  const { data: re } = await supabase
    .from('rutina_ejercicios')
    .insert({ dia_id: diaId, ejercicio_id: ejId, orden: 0, intensidad_tipo: 'texto' })
    .select('id')
    .single();
  if (!re) continue;
  for (const [i, col] of colSemanas.entries()) {
    const texto = String(fila[col] ?? '').trim();
    if (!texto) continue;
    await supabase.from('prescripciones').insert({
      rutina_ejercicio_id: re.id,
      semana: i + 1,
      texto,
    });
  }
}

console.log(`Rutina en borrador: ${rutina.id}`);
