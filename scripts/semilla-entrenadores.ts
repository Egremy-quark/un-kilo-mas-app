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
const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const entrenadores = [1, 2].map((n) => ({
  correo: process.env[`ENTRENADOR_${n}_CORREO`] ?? '',
  nombre: process.env[`ENTRENADOR_${n}_NOMBRE`] ?? '',
  etiqueta: process.env[`ENTRENADOR_${n}_ETIQUETA`] ?? '',
}));

async function buscarUsuario(correo: string) {
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  return data.users.find((u) => u.email?.toLowerCase() === correo.toLowerCase()) ?? null;
}

async function sembrarUno(entrada: { correo: string; nombre: string; etiqueta: string }) {
  if (!entrada.correo) {
    console.warn('Falta un correo de entrenador en el entorno. Se omite.');
    return;
  }
  let usuario = await buscarUsuario(entrada.correo);
  if (!usuario) {
    const invitado = await supabase.auth.admin.inviteUserByEmail(entrada.correo, {
      redirectTo: `${appUrl}/crear-contrasena`,
      data: { nombre: entrada.nombre, origen: 'alta_manual' },
    });
    if (invitado.error || !invitado.data.user) {
      const creado = await supabase.auth.admin.createUser({
        email: entrada.correo,
        email_confirm: true,
        user_metadata: { nombre: entrada.nombre, origen: 'alta_manual' },
      });
      if (creado.error || !creado.data.user) {
        throw new Error(creado.error?.message ?? invitado.error?.message ?? 'No se pudo crear el entrenador.');
      }
      usuario = creado.data.user;
    } else {
      usuario = invitado.data.user;
    }
  }

  const { error } = await supabase.from('perfiles').upsert({
    id: usuario.id,
    rol: 'entrenador',
    nombre: entrada.nombre || usuario.email,
    correo: usuario.email,
    plan: 'sin_plan',
    prueba_inicio: null,
    etiqueta_publica: entrada.etiqueta,
    origen: 'alta_manual',
    activo: true,
  });
  if (error) throw error;

  await supabase.from('inscripciones').delete().eq('cliente_id', usuario.id);
  console.log(`Entrenador listo: ${entrada.nombre} <${entrada.correo}> · ${entrada.etiqueta}`);
}

for (const entrenador of entrenadores) {
  await sembrarUno(entrenador);
}
