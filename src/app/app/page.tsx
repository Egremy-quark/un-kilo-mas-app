import Link from 'next/link';
import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { contextoCliente } from '@/lib/contexto-cliente';
import { plataforma, esPorDefinir } from '@/config/plataforma';
import { etiquetaEstado } from '@/lib/planes';
import { nombrePlan } from '@/lib/clientes-panel';

export default async function InicioCliente() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');
  const ctx = await contextoCliente(supabase, user.id);
  const plan = ctx.perfil?.plan as string;

  if (plan === 'prueba' && (ctx.estado === 'prueba_terminada' || ctx.insPrueba?.terminada)) {
    redirect('/app/sigue');
  }
  if ((plan === 'ruta_mensual' || plan === 'ruta_completa') && ctx.insRuta?.terminada) {
    redirect('/app/fin-de-ruta');
  }
  if (ctx.estado === 'vencida' || ctx.estado === 'prueba_terminada') {
    // puede entrar, pero se avisa
  }

  if (plan === 'prueba') return <InicioPrueba ctx={ctx} />;
  if (plan === 'ruta_mensual' || plan === 'ruta_completa') return <InicioRuta ctx={ctx} />;
  return <InicioCoaching ctx={ctx} />;
}

async function InicioPrueba({ ctx }: { ctx: Awaited<ReturnType<typeof contextoCliente>> }) {
  const supabase = await crearClienteServidor();
  const fase = ctx.insPrueba?.fase_orden ?? 1;
  const { data: fases } = ctx.insPrueba
    ? await supabase.from('programa_fases').select('*').eq('programa_id', ctx.insPrueba.programa_id).order('orden')
    : { data: [] };
  const f1 = (fases ?? []).find((f) => f.orden === 1);
  const f2 = (fases ?? []).find((f) => f.orden === 2);
  const { data: sesiones } = await supabase
    .from('sesiones')
    .select('id, estado, rutina_id')
    .eq('cliente_id', ctx.perfil!.id)
    .eq('estado', 'cerrada');
  const r1 = f1?.rutina_id;
  const hechas = (sesiones ?? []).filter((s) => s.rutina_id === r1 || s.rutina_id === ctx.insPrueba?.rutina_iniciada_id).length;
  const bloqueada02 = fase < 2;

  return (
    <>
      <h1 className="h" style={{ fontSize: 42 }}>
        Tu primer mes <em>va por nuestra cuenta</em>
      </h1>
      <p className="muted">Empieza por la rutina 01. Cuando la termines, se abre la 02.</p>
      <div className="card" style={{ border: '3px solid var(--tinta)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="est" style={{ background: 'var(--lima)' }}>
            Paso 1 de 2
          </span>
          <span className="muted">{hechas} sesiones</span>
        </div>
        <div className="h" style={{ fontSize: 32 }}>
          {f1?.nombre ?? 'Rutina 01 · Base articular'}
        </div>
        <p>{f1?.descripcion}</p>
        {ctx.puedeRegistrar ? (
          <Link className="btn btn-ancho" href="/app/sesion">
            Hacer la sesión de hoy
          </Link>
        ) : (
          <p className="muted">Puedes ver tu historial, pero ya no registrar sesiones nuevas.</p>
        )}
      </div>
      <div className="card" style={{ background: '#f1ece0', borderStyle: 'dashed' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className="est">{bloqueada02 ? 'Paso 2 de 2' : 'Paso 2 de 2 · abierta'}</span>
        </div>
        <div className="h" style={{ fontSize: 30, color: bloqueada02 ? 'var(--gris)' : 'var(--tinta)' }}>
          {f2?.nombre ?? 'Rutina 02 · Aprender a moverse'}
        </div>
        <p className="muted">{bloqueada02 ? 'Se abre al terminar la rutina 01.' : f2?.descripcion}</p>
      </div>
      {!ctx.puedeRegistrar ? (
        <Link href="/app/sigue" className="btn">
          ¿Cómo sigues?
        </Link>
      ) : null}
    </>
  );
}

async function InicioRuta({ ctx }: { ctx: Awaited<ReturnType<typeof contextoCliente>> }) {
  const supabase = await crearClienteServidor();
  const { data: fases } = ctx.insRuta
    ? await supabase.from('programa_fases').select('*').eq('programa_id', ctx.insRuta.programa_id).order('orden')
    : { data: [] };
  const actual = ctx.insRuta?.fase_orden ?? 1;
  const faseActual = (fases ?? []).find((f) => f.orden === actual);
  const publicada = faseActual?.publicada;
  return (
    <>
      <h1 className="h" style={{ fontSize: 42 }}>
        Fase {actual} · <em>{faseActual?.nombre ?? ''}</em>
      </h1>
      <p>
        Semana {ctx.insRuta?.semana ?? 1}
        {ctx.insRuta?.vuelta && ctx.insRuta.vuelta > 1 ? ` · vuelta ${ctx.insRuta.vuelta}` : ''}
      </p>
      {!publicada ? <p>Tu siguiente fase se está preparando.</p> : null}
      <div className="card">
        {(fases ?? []).map((f) => (
          <p key={f.id as string}>
            {f.orden === actual ? '→ ' : (f.orden as number) < actual ? '✓ ' : ''}
            {f.orden}. {f.nombre as string}
          </p>
        ))}
      </div>
      <p className="muted">
        {nombrePlan(ctx.perfil!.plan as string)} · {etiquetaEstado(ctx.estado)}
        {ctx.cubreHasta ? ` · vence ${ctx.cubreHasta}` : ''}
      </p>
      {ctx.puedeRegistrar && publicada ? (
        <Link className="btn btn-ancho" href="/app/sesion">
          Hacer la sesión de hoy
        </Link>
      ) : (
        <Link href="/app/mensualidad">Ver tu plan</Link>
      )}
    </>
  );
}

async function InicioCoaching({ ctx }: { ctx: Awaited<ReturnType<typeof contextoCliente>> }) {
  const supabase = await crearClienteServidor();
  const rutina = ctx.rutinaCoach;
  const { data: entrenador } = ctx.perfil?.entrenador_a_cargo_id
    ? await supabase.from('perfiles').select('nombre, etiqueta_publica').eq('id', ctx.perfil.entrenador_a_cargo_id).maybeSingle()
    : { data: null };
  const { data: dias } = rutina ? await supabase.from('rutina_dias').select('*').eq('rutina_id', rutina.id).order('orden') : { data: [] };
  return (
    <>
      <h1 className="h" style={{ fontSize: 42 }}>
        Hoy te toca <em>entrenar</em>
      </h1>
      {rutina ? (
        <div className="card">
          <div className="lbl">{rutina.nombre as string}</div>
          <p>Días {(dias ?? []).map((d) => d.letra).join(', ')}</p>
          <p className="muted">
            Armada por {(entrenador as { nombre?: string } | null)?.nombre ?? 'tu entrenador'} · {(entrenador as { etiqueta_publica?: string } | null)?.etiqueta_publica}
          </p>
        </div>
      ) : (
        <p>Tu entrenador todavía está armando tu rutina.</p>
      )}
      <p>
        {nombrePlan(ctx.perfil!.plan as string)} · {etiquetaEstado(ctx.estado)}
        {ctx.cubreHasta ? ` · vence ${ctx.cubreHasta}` : ''}
      </p>
      {ctx.puedeRegistrar && rutina ? (
        <Link className="btn btn-ancho" href="/app/sesion">
          Hacer la sesión de hoy
        </Link>
      ) : (
        <Link href="/app/mensualidad">Cómo renovar</Link>
      )}
      {esPorDefinir(plataforma.datosTransferencia.clabe) ? <p className="por-definir">Datos de transferencia [POR DEFINIR]</p> : null}
    </>
  );
}
