import Link from 'next/link';
import { notFound } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { PublicarFase } from './PublicarFase';

export default async function ProgramaPage({ params }: { params: Promise<{ clave: string }> }) {
  const { clave } = await params;
  const supabase = await crearClienteServidor();
  const claveDb = clave === 'ruta-1' || clave === 'ruta-mas-1' ? 'ruta-1' : clave === 'prueba' ? 'prueba' : clave;
  const { data: programa } = await supabase.from('programas').select('*').eq('clave', claveDb).maybeSingle();
  if (!programa) notFound();
  const { data: fases } = await supabase.from('programa_fases').select('*').eq('programa_id', programa.id).order('orden');
  const rutinaIds = (fases ?? []).map((f) => f.rutina_id).filter(Boolean) as string[];
  const { data: dias } = rutinaIds.length ? await supabase.from('rutina_dias').select('id, rutina_id, letra').in('rutina_id', rutinaIds) : { data: [] };
  const diaIds = (dias ?? []).map((d) => d.id as string);
  const { data: ejs } = diaIds.length ? await supabase.from('rutina_ejercicios').select('dia_id, revisar').in('dia_id', diaIds) : { data: [] };
  const { data: ins } = await supabase.from('inscripciones').select('fase_orden').eq('programa_id', programa.id).eq('terminada', false);

  return (
    <>
      <h1 className="h" style={{ fontSize: 60 }}>
        {(programa.nombre as string) ?? 'Programa'}
      </h1>
      <p className="muted">{programa.descripcion as string}</p>
      <div className="card" style={{ padding: 0 }}>
        <table className="tabla">
          <thead>
            <tr>
              <th>Fase</th>
              <th>Semanas</th>
              <th>Días</th>
              <th>Clientes</th>
              <th>Revisar</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(fases ?? []).map((f) => {
              const diasFase = (dias ?? []).filter((d) => d.rutina_id === f.rutina_id);
              const ejsFase = (ejs ?? []).filter((e) => diasFase.some((d) => d.id === e.dia_id));
              const revisar = ejsFase.filter((e) => e.revisar).length;
              const clientes = (ins ?? []).filter((i) => i.fase_orden === f.orden).length;
              return (
                <tr key={f.id as string}>
                  <td>
                    <b>
                      {f.orden}. {f.nombre}
                    </b>
                    <br />
                    <span className="muted">{f.descripcion as string}</span>
                  </td>
                  <td>—</td>
                  <td>{diasFase.map((d) => d.letra).join(', ') || '—'}</td>
                  <td>{clientes}</td>
                  <td>{revisar ? <span className="est alerta">{revisar} por revisar</span> : '—'}</td>
                  <td>{f.publicada ? <span className="est ok">Publicada</span> : <span className="est alerta">Borrador</span>}</td>
                  <td style={{ display: 'flex', gap: 10 }}>
                    {f.rutina_id ? <Link href={`/panel/rutinas/${f.rutina_id}`}>Abrir</Link> : null}
                    <Link href={`/app?verComo=fase&rutina=${f.rutina_id}`}>Ver como cliente</Link>
                    {!f.publicada ? <PublicarFase programaId={programa.id as string} orden={f.orden as number} /> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
