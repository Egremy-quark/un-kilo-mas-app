import Link from 'next/link';
import { notFound } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { plataforma } from '@/config/plataforma';
import { esPendienteYohan, restoTrasMarca } from '@/lib/pendiente-yohan';
import { ListaFases, type FilaFase } from './ListaFases';

export default async function ProgramaPage({ params }: { params: Promise<{ clave: string }> }) {
  const { clave } = await params;
  const supabase = await crearClienteServidor();
  const claveDb = clave === 'ruta-1' || clave === 'ruta-mas-1' ? 'ruta-1' : clave === 'prueba' ? 'prueba' : clave;
  const { data: programa } = await supabase.from('programas').select('*').eq('clave', claveDb).maybeSingle();
  if (!programa) notFound();
  const { data: fases } = await supabase.from('programa_fases').select('*').eq('programa_id', programa.id).order('orden');
  const rutinaIds = (fases ?? []).map((f) => f.rutina_id).filter(Boolean) as string[];
  const { data: rutinas } = rutinaIds.length
    ? await supabase.from('rutinas').select('id, semanas').in('id', rutinaIds)
    : { data: [] };
  const semanasMap = new Map((rutinas ?? []).map((r) => [r.id as string, r.semanas as number | null]));
  const { data: dias } = rutinaIds.length ? await supabase.from('rutina_dias').select('id, rutina_id, letra').in('rutina_id', rutinaIds) : { data: [] };
  const diaIds = (dias ?? []).map((d) => d.id as string);
  const { data: ejs } = diaIds.length
    ? await supabase.from('rutina_ejercicios').select('dia_id, revisar, ejercicios(nombre)').in('dia_id', diaIds)
    : { data: [] };
  const { data: ins } = await supabase
    .from('inscripciones')
    .select('fase_orden, cliente_id, perfiles:cliente_id(plan)')
    .eq('programa_id', programa.id)
    .eq('terminada', false);
  const { count: clientesRuta } = await supabase
    .from('perfiles')
    .select('id', { count: 'exact', head: true })
    .eq('rol', 'cliente')
    .in('plan', ['ruta_mensual', 'ruta_completa']);
  const { count: clientesPrueba } = await supabase
    .from('perfiles')
    .select('id', { count: 'exact', head: true })
    .eq('rol', 'cliente')
    .eq('plan', 'prueba');
  const ejsRevisar = (ejs ?? []).filter((e) => e.revisar);
  const porRevisar = ejsRevisar.length;
  const nombresRevisar = [
    ...new Set(
      ejsRevisar
        .map((e) => (e.ejercicios as { nombre?: string } | null)?.nombre)
        .filter((n): n is string => Boolean(n)),
    ),
  ];
  const esRuta = claveDb === 'ruta-1';
  const esPrueba = claveDb === 'prueba';
  const semanasTotales = (rutinas ?? []).reduce((n, r) => n + (Number(r.semanas) || 0), 0);
  const remate = (fases ?? []).find((f) => (f.nombre as string) === 'Remate');
  const descripcionPublica = restoTrasMarca(programa.descripcion as string);
  const pendientePrograma = esPendienteYohan(programa.descripcion as string);

  function clientesDeFase(orden: number) {
    return (ins ?? []).filter((i) => {
      if (i.fase_orden !== orden) return false;
      const plan = (i.perfiles as { plan?: string } | null)?.plan;
      if (esPrueba) return plan === 'prueba';
      return true;
    }).length;
  }

  const filas: FilaFase[] = (fases ?? []).map((f) => {
    const diasFase = (dias ?? []).filter((d) => d.rutina_id === f.rutina_id);
    const ejsFase = (ejs ?? []).filter((e) => diasFase.some((d) => d.id === e.dia_id));
    const descFase = (f.descripcion as string) ?? '';
    return {
      id: f.id as string,
      orden: f.orden as number,
      nombre: f.nombre as string,
      descripcion: esPendienteYohan(descFase) ? '' : descFase,
      pendiente: esPendienteYohan(descFase),
      semanas: f.rutina_id ? (semanasMap.get(f.rutina_id as string) ?? null) : null,
      dias: diasFase.map((d) => d.letra).join(', '),
      clientes: clientesDeFase(f.orden as number),
      publicada: Boolean(f.publicada),
      revisar: ejsFase.filter((e) => e.revisar).length,
      rutinaId: (f.rutina_id as string | null) ?? null,
      programaId: programa.id as string,
    };
  });
  const publicadas = filas.filter((f) => f.publicada).length;
  const aviso = pendientePrograma
    ? `Falta el texto de este programa. Fred o Yohan pueden escribirlo. El cliente no ve esta marca.${descripcionPublica ? ` ${descripcionPublica}` : ''}`
    : undefined;
  const revisarTexto = porRevisar
    ? `${porRevisar} ejercicio${porRevisar === 1 ? '' : 's'} marcado${porRevisar === 1 ? '' : 's'} «revisar»${nombresRevisar.length ? `: ${nombresRevisar.join(', ')}` : ''}. La marca no impide publicar.`
    : '';

  return (
    <ListaFases
      kicker={esRuta ? 'Panel · Ruta +1' : 'Panel · Prueba'}
      titulo={esRuta ? 'Ruta +1' : ((programa.nombre as string) ?? 'Prueba')}
      subtitulo={esRuta ? `${filas.length} fases · ${plataforma.ruta.semanas} semanas` : `${filas.length} fases · ${clientesPrueba ?? 0} en prueba`}
      aviso={aviso}
      resumen={
        esRuta
          ? [
              { valor: String(plataforma.ruta.semanas), etiqueta: 'semanas', lima: true },
              { valor: String(filas.length), etiqueta: 'fases' },
              { valor: String(clientesRuta ?? 0), etiqueta: 'clientes en Ruta +1' },
              { valor: String(publicadas), etiqueta: 'publicadas' },
              { valor: String(filas.length - publicadas), etiqueta: 'en borrador' },
              ...(porRevisar ? [{ valor: String(porRevisar), etiqueta: 'marcados revisar', naranja: true }] : []),
            ]
          : [
              { valor: String(filas.length), etiqueta: 'fases', lima: true },
              { valor: String(clientesPrueba ?? 0), etiqueta: 'en prueba' },
              { valor: String(publicadas), etiqueta: 'publicadas' },
              { valor: String(filas.length - publicadas), etiqueta: 'en borrador' },
            ]
      }
      filas={filas}
      pie={
        <>
          {esRuta ? <span>Duración real de las fases: {semanasTotales} semanas. </span> : null}
          {revisarTexto ? <span>{revisarTexto} </span> : null}
          {remate?.rutina_id ? (
            <Link href={`/panel/rutinas/${remate.rutina_id as string}`}>Abrir Remate</Link>
          ) : null}
        </>
      }
    />
  );
}
