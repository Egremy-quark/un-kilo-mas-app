import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
config();

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: programa } = await supabase.from('programas').select('id').eq('clave', 'ruta-1').maybeSingle();
if (!programa) {
  console.error('No está el programa ruta-1.');
  process.exit(1);
}

const { data: fases } = await supabase.from('programa_fases').select('id, orden, nombre, rutina_id').eq('programa_id', programa.id).order('orden');
const rutinaIds = (fases ?? []).map((f) => f.rutina_id as string).filter(Boolean);
const { data: rutinas } = await supabase.from('rutinas').select('id, semanas').in('id', rutinaIds);
const semanas = (rutinas ?? []).reduce((n, r) => n + Number(r.semanas ?? 0), 0);
const { data: dias } = await supabase.from('rutina_dias').select('id, rutina_id, letra').in('rutina_id', rutinaIds);
const diaIds = (dias ?? []).map((d) => d.id as string);
const { count: ejercicios } = diaIds.length
  ? await supabase.from('rutina_ejercicios').select('id', { count: 'exact', head: true }).in('dia_id', diaIds)
  : { count: 0 };

const f1 = (fases ?? []).find((f) => f.orden === 1);
const letrasF1 = (dias ?? []).filter((d) => d.rutina_id === f1?.rutina_id).map((d) => d.letra).sort();

console.log(
  JSON.stringify(
    {
      fases: fases?.length ?? 0,
      semanas,
      ejercicios: ejercicios ?? 0,
      fase1: { nombre: f1?.nombre, dias: letrasF1 },
    },
    null,
    2,
  ),
);

if ((fases?.length ?? 0) !== 8 || semanas !== 37 || (ejercicios ?? 0) !== 128 || letrasF1.join(',') !== 'A,B') {
  process.exit(1);
}
