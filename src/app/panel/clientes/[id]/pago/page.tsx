import { notFound } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { PagoForma } from './PagoForma';
import { FijarMigas } from '@/components/MigasPanel';

export default async function PaginaPago({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await crearClienteServidor();
  const { data: c } = await supabase.from('perfiles').select('nombre, plan').eq('id', id).maybeSingle();
  if (!c) notFound();
  const { data: ultimo } = await supabase.from('pagos').select('cubre_hasta').eq('cliente_id', id).order('cubre_hasta', { ascending: false }).limit(1).maybeSingle();
  return (
    <>
      <FijarMigas
        items={[
          { href: '/panel', label: 'Clientes' },
          { href: `/panel/clientes/${id}`, label: (c.nombre as string) || 'Cliente' },
          { label: 'Pago' },
        ]}
      />
      <h1 className="h" style={{ fontSize: 56 }}>
        Registrar <em>pago</em>
      </h1>
      <PagoForma clienteId={id} cubreHastaAnterior={(ultimo?.cubre_hasta as string) ?? null} veniaDePrueba={c.plan === 'prueba'} />
    </>
  );
}
