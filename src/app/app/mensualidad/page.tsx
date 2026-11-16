import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { contextoCliente } from '@/lib/contexto-cliente';
import { etiquetaEstado } from '@/lib/planes';
import { plataforma, esPorDefinir } from '@/config/plataforma';
import { CopiarClabe } from './CopiarClabe';
import { urlWhatsApp, mensajeComprobante } from '@/lib/whatsapp';
import { nombrePlan } from '@/lib/clientes-panel';

export default async function Mensualidad() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');
  const ctx = await contextoCliente(supabase, user.id);
  const wa = urlWhatsApp(plataforma.whatsappVentas, mensajeComprobante((ctx.perfil?.nombre as string) ?? '', nombrePlan(ctx.perfil?.plan as string)));
  return (
    <>
      <h1 className="h" style={{ fontSize: 42 }}>
        Tu <em>plan</em>
      </h1>
      <div className="card">
        <p>
          {nombrePlan(ctx.perfil?.plan as string)} · {etiquetaEstado(ctx.estado)}
        </p>
        {ctx.cubreHasta ? <p>Cubre hasta {ctx.cubreHasta}</p> : null}
        {!ctx.puedeRegistrar ? <p>Puedes ver tu historial, pero no registrar sesiones nuevas hasta que se registre el pago.</p> : null}
      </div>
      <div className="card">
        <p>
          Banco:{' '}
          {esPorDefinir(plataforma.datosTransferencia.banco) ? <span className="por-definir">[POR DEFINIR]</span> : plataforma.datosTransferencia.banco}
        </p>
        <p>
          CLABE:{' '}
          {esPorDefinir(plataforma.datosTransferencia.clabe) ? <span className="por-definir">[POR DEFINIR]</span> : plataforma.datosTransferencia.clabe}
        </p>
        <p>
          Titular:{' '}
          {esPorDefinir(plataforma.datosTransferencia.titular) ? <span className="por-definir">[POR DEFINIR]</span> : plataforma.datosTransferencia.titular}
        </p>
        <CopiarClabe clabe={plataforma.datosTransferencia.clabe} />
      </div>
      {wa ? (
        <a className="btn" href={wa} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
      ) : (
        <p className="por-definir">WhatsApp [POR DEFINIR]</p>
      )}
    </>
  );
}
