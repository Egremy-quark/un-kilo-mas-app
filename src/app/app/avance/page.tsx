import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { estimado1rm, mejorSerie, rmPorSemana, tendencia, volumenSerie } from '@/lib/dashboard';
import { GraficaRm } from '@/components/GraficaRm';
import { SugerirRm } from './SugerirRm';

export default async function Avance() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');
  const { data: perfil } = await supabase.from('perfiles').select('plan').eq('id', user.id).single();
  const { data: sesiones } = await supabase.from('sesiones').select('*').eq('cliente_id', user.id).order('fecha');
  const ids = (sesiones ?? []).map((s) => s.id as string);
  const { data: series } = ids.length ? await supabase.from('series').select('*, ejercicios(nombre)').in('sesion_id', ids) : { data: [] };
  const { data: rms } = await supabase.from('rm_referencia').select('ejercicio_id, kg, ejercicios(nombre)').eq('cliente_id', user.id);

  const porFecha = new Map((sesiones ?? []).map((s) => [s.id as string, s.fecha as string]));
  const hechas = (series ?? []).map((s) => ({
    ejercicio_id: s.ejercicio_id as string,
    nombre: (s.ejercicios as { nombre?: string } | null)?.nombre ?? '',
    kg: s.kg as number | null,
    reps: s.reps as number | null,
    fecha: porFecha.get(s.sesion_id as string) ?? '',
    completada: s.completada as boolean,
  }));
  const puntos = rmPorSemana(hechas);
  const mejor = mejorSerie(hechas);
  const volumen = hechas.reduce((acc, s) => acc + volumenSerie(s.kg, s.reps), 0);
  const pesos = (sesiones ?? []).map((s) => Number(s.peso_corporal)).filter((n) => Number.isFinite(n) && n > 0);
  const ganas = (sesiones ?? []).map((s) => Number(s.ganas)).filter((n) => Number.isFinite(n));
  const esRuta = perfil?.plan === 'ruta_mensual' || perfil?.plan === 'ruta_completa';

  const avisos: { ejercicioId: string; nombre: string; estimado: number; actual: number }[] = [];
  for (const r of rms ?? []) {
    const deEste = hechas.filter((s) => s.ejercicio_id === r.ejercicio_id);
    const m = mejorSerie(deEste);
    const est = m ? estimado1rm(m.kg ?? 0, m.reps ?? 0) : null;
    if (est && est > Number(r.kg)) {
      avisos.push({
        ejercicioId: r.ejercicio_id as string,
        nombre: (r.ejercicios as { nombre?: string } | null)?.nombre ?? '',
        estimado: est,
        actual: Number(r.kg),
      });
    }
  }

  return (
    <>
      <h1 className="h" style={{ fontSize: 42 }}>
        Tu <em>avance</em>
      </h1>
      <div className="card">
        <div className="lbl">Constancia</div>
        <div className="big">{sesiones?.length ?? 0}</div>
        <span>sesiones</span>
      </div>
      <div className="card">
        <div className="lbl">1RM estimado</div>
        <GraficaRm puntos={puntos} />
      </div>
      <div className="card">
        <div className="lbl">Mejor serie</div>
        {mejor ? (
          <p>
            {mejor.kg} kg × {mejor.reps}
          </p>
        ) : (
          <p className="muted">Aún no hay series.</p>
        )}
        <div className="lbl">Volumen</div>
        <p>{volumen} kg</p>
      </div>
      <div className="card">
        <div className="lbl">Peso</div>
        <p>{pesos.at(-1) ?? '—'} {tendencia(pesos) === 'sube' ? '↑' : tendencia(pesos) === 'baja' ? '↓' : ''}</p>
        <div className="lbl">Ganas</div>
        <p>{ganas.at(-1) ?? '—'} {tendencia(ganas) === 'sube' ? '↑' : tendencia(ganas) === 'baja' ? '↓' : ''}</p>
      </div>
      {esRuta && avisos.length ? (
        <SugerirRm avisos={avisos} />
      ) : null}
    </>
  );
}
