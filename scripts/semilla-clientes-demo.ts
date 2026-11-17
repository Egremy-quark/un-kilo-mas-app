import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { utcDesdeYmd, ymdEnZona } from '../src/lib/fecha';
import { calcularCobertura } from '../src/lib/planes';

config({ path: '.env.local' });
config();

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(url, clave, { auth: { persistSession: false, autoRefreshToken: false } });
const password = process.env.DEMO_CLIENTE_CLAVE ?? 'UnKiloMas-demo-16';
const hoy = ymdEnZona();

const demos = [
  { clave: 'prueba', correo: process.env.DEMO_CLIENTE_PRUEBA_CORREO ?? 'demo.prueba@example.com', nombre: 'Demo Prueba', plan: 'prueba' as const },
  { clave: 'ruta', correo: process.env.DEMO_CLIENTE_RUTA_CORREO ?? 'demo.ruta@example.com', nombre: 'Demo Ruta', plan: 'ruta_mensual' as const },
  { clave: 'coaching', correo: process.env.DEMO_CLIENTE_COACHING_CORREO ?? 'demo.coaching@example.com', nombre: 'Demo Coaching', plan: 'coaching' as const },
];

async function usuarioPorCorreo(correo: string) {
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  return data.users.find((u) => u.email?.toLowerCase() === correo.toLowerCase()) ?? null;
}

const demoEntrenadorCorreo = process.env.PLAYWRIGHT_ENTRENADOR_CORREO ?? 'demo.entrenador@example.com';
{
  let user = await usuarioPorCorreo(demoEntrenadorCorreo);
  if (!user) {
    const creado = await supabase.auth.admin.createUser({
      email: demoEntrenadorCorreo,
      password,
      email_confirm: true,
      user_metadata: { nombre: 'Demo Entrenador', origen: 'alta_manual' },
    });
    if (creado.error || !creado.data.user) throw new Error(creado.error?.message ?? 'No se pudo crear el entrenador de capturas.');
    user = creado.data.user;
  } else {
    await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true });
  }
  await supabase.from('perfiles').upsert({
    id: user.id,
    rol: 'entrenador',
    nombre: 'Demo Entrenador',
    correo: demoEntrenadorCorreo,
    plan: 'sin_plan',
    prueba_inicio: null,
    etiqueta_publica: 'Capturas',
    origen: 'alta_manual',
    activo: true,
  });
  console.log(`Entrenador de capturas: ${demoEntrenadorCorreo}`);
}

const { data: entrenador } = await supabase.from('perfiles').select('id, correo').eq('rol', 'entrenador').not('correo', 'ilike', '%@example.com').limit(1).maybeSingle();
const { data: ruta } = await supabase.from('programas').select('id').eq('clave', 'ruta-1').maybeSingle();
const { data: prueba } = await supabase.from('programas').select('id').eq('clave', 'prueba').maybeSingle();
const { data: fase1 } = ruta
  ? await supabase.from('programa_fases').select('rutina_id').eq('programa_id', ruta.id).eq('orden', 1).maybeSingle()
  : { data: null };

for (const demo of demos) {
  let user = await usuarioPorCorreo(demo.correo);
  if (!user) {
    const creado = await supabase.auth.admin.createUser({
      email: demo.correo,
      password,
      email_confirm: true,
      user_metadata: { nombre: demo.nombre, origen: 'alta_manual' },
    });
    if (creado.error || !creado.data.user) throw new Error(creado.error?.message ?? `No se pudo crear ${demo.correo}`);
    user = creado.data.user;
  } else {
    await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true });
  }

  await supabase.from('perfiles').upsert({
    id: user.id,
    rol: 'cliente',
    nombre: demo.nombre,
    correo: demo.correo,
    plan: demo.plan,
    origen: 'alta_manual',
    entrenador_a_cargo_id: demo.plan === 'coaching' ? entrenador?.id ?? null : null,
    prueba_inicio: demo.plan === 'prueba' ? hoy : null,
    activo: true,
  });

  if (demo.plan === 'prueba' && prueba?.id) {
    await supabase.from('inscripciones').upsert(
      {
        cliente_id: user.id,
        programa_id: prueba.id,
        fase_orden: 1,
        semana: 1,
        vuelta: 1,
        iniciada: false,
        terminada: false,
      },
      { onConflict: 'cliente_id,programa_id' },
    );
  }

  if (demo.plan === 'ruta_mensual' && ruta?.id) {
    const cubre = calcularCobertura({ plan: 'ruta_mensual', fechaTransferencia: utcDesdeYmd(hoy), meses: 1, veniaDePrueba: true });
    const { data: pagoPrev } = await supabase.from('pagos').select('id').eq('cliente_id', user.id).limit(1).maybeSingle();
    if (!pagoPrev) {
      await supabase.from('pagos').insert({
        cliente_id: user.id,
        plan: 'ruta_mensual',
        fecha_transferencia: hoy,
        monto_mxn: 200,
        cubre_desde: cubre.cubreDesde.toISOString().slice(0, 10),
        cubre_hasta: cubre.cubreHasta.toISOString().slice(0, 10),
        registrado_por: entrenador?.id ?? user.id,
      });
    }
    await supabase.from('inscripciones').upsert(
      {
        cliente_id: user.id,
        programa_id: ruta.id,
        fase_orden: 1,
        semana: 1,
        vuelta: 1,
        iniciada: false,
        terminada: false,
      },
      { onConflict: 'cliente_id,programa_id' },
    );
  }

  if (demo.plan === 'coaching' && fase1?.rutina_id) {
    const cubre = calcularCobertura({ plan: 'coaching', fechaTransferencia: utcDesdeYmd(hoy), meses: 1, veniaDePrueba: true });
    const { data: pagoPrev } = await supabase.from('pagos').select('id').eq('cliente_id', user.id).limit(1).maybeSingle();
    if (!pagoPrev) {
      await supabase.from('pagos').insert({
        cliente_id: user.id,
        plan: 'coaching',
        fecha_transferencia: hoy,
        monto_mxn: null,
        cubre_desde: cubre.cubreDesde.toISOString().slice(0, 10),
        cubre_hasta: cubre.cubreHasta.toISOString().slice(0, 10),
        registrado_por: entrenador?.id ?? user.id,
      });
    }
    const { data: existente } = await supabase.from('rutinas').select('id').eq('cliente_id', user.id).maybeSingle();
    if (!existente) {
      await supabase.from('rutinas').insert({
        cliente_id: user.id,
        es_plantilla: false,
        nombre: 'Rutina de Demo Coaching',
        enfoque: 'tecnica',
        semanas: 4,
        estado: 'publicada',
      });
    } else {
      await supabase.from('rutinas').update({ estado: 'publicada' }).eq('id', existente.id);
    }
  }

  console.log(`Cliente demo listo: ${demo.nombre} <${demo.correo}> · ${demo.plan}`);
}

console.log(`Contraseña de los tres: ${password}`);
