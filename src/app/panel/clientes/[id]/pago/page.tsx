import Link from 'next/link';
import { notFound } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { PagoForma } from './PagoForma';

export default async function PaginaPago({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const { data: c } = await supabase.from('perfiles').select('nombre, plan').eq('id', id).maybeSingle();
  if (!c) notFound();
  const { data: ultimo } = await supabase.from('pagos').select('cubre_hasta').eq('cliente_id', id).order('cubre_hasta', { ascending: false }).limit(1).maybeSingle();
  return (
    <>
      <Link href={`/panel/clientes/${id}`} style={{ fontWeight: 700 }}>
        ← {c.nombre as string}
      </Link>
      <h1 className="h" style={{ fontSize: 56 }}>
        Registrar <em>pago</em>
      </h1>
      <PagoForma clienteId={id} cubreHastaAnterior={(ultimo?.cubre_hasta as string) ?? null} veniaDePrueba={c.plan === 'prueba'} />
    </>
  );
}
