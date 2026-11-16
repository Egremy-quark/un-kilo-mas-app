'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { kilosObjetivo } from '@/lib/kilos';
import { segundosATexto } from '@/lib/descanso';
import { subirPendientes } from '@/lib/offline';

interface Props {
  clienteId: string;
  puedeRegistrar: boolean;
  inscripcionId: string | null;
  rutinaId: string | null;
  semana: number;
  faseOrden: number | null;
  vuelta: number | null;
  esRuta: boolean;
  esCoaching: boolean;
  dias: { id: string; letra: string; foco: string | null }[];
  ejercicios: {
    id: string;
    dia_id: string;
    ejercicio_id: string;
    nombre: string;
    grupo: string | null;
    nota: string | null;
    revisar: boolean;
    pres: { texto: string; pct: number | null; descanso_seg: number | null; omitir: boolean };
    rm: number | null;
    hechoId: string;
  }[];
}

export function SesionHoy(props: Props) {
  const router = useRouter();
  const supabase = useMemo(() => crearClienteNavegador(), []);
  const [peso, setPeso] = useState('');
  const [ganas, setGanas] = useState(7);
  const [sesionId, setSesionId] = useState<string | null>(null);
  const [diaId, setDiaId] = useState(props.dias[0]?.id ?? '');
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('sesiones')
        .select('id, dia_id, peso_corporal, ganas')
        .eq('cliente_id', props.clienteId)
        .eq('estado', 'abierta')
        .maybeSingle();
      if (data) {
        setSesionId(data.id as string);
        if (data.dia_id) setDiaId(data.dia_id as string);
        if (data.peso_corporal) setPeso(String(data.peso_corporal));
        if (data.ganas != null) setGanas(Number(data.ganas));
      }
      if (!navigator.onLine) return;
      const { data: puede } = await supabase.rpc('puede_registrar', { p_cliente: props.clienteId });
      await subirPendientes(async (payload) => {
        const { error: e } = await supabase.from('series').insert(payload);
        return !e;
      }, Boolean(puede));
    })();
  }, [props.clienteId, supabase]);

  async function empezar() {
    setError('');
    if (!props.puedeRegistrar) {
      setError('Ya no puedes registrar sesiones nuevas.');
      return;
    }
    if (props.inscripcionId) {
      const { error: eFase } = await supabase.rpc('iniciar_fase', { p_inscripcion_id: props.inscripcionId });
      if (eFase && !/preparando/i.test(eFase.message)) {
        // si ya estaba iniciada, seguimos
      }
    }
    const { data, error: e } = await supabase
      .from('sesiones')
      .insert({
        cliente_id: props.clienteId,
        rutina_id: props.rutinaId,
        dia_id: diaId,
        semana: props.semana,
        fase_orden: props.faseOrden,
        vuelta: props.vuelta,
        peso_corporal: peso ? Number(peso) : null,
        ganas,
        hora_inicio: new Date().toISOString(),
        estado: 'abierta',
      })
      .select('id')
      .single();
    if (e || !data) {
      setError(e?.message ?? 'No se pudo empezar.');
      return;
    }
    setSesionId(data.id as string);
  }

  const delDia = props.ejercicios.filter((e) => e.dia_id === diaId && !e.pres.omitir);
  const dia = props.dias.find((d) => d.id === diaId);

  return (
    <>
      <div className="lbl">
        Semana {props.semana}
        {dia ? ` · Día ${dia.letra}` : ''}
      </div>
      <h1 className="h" style={{ fontSize: 42 }}>
        Sesión de <em>hoy</em>
      </h1>
      {!sesionId ? (
        <section style={{ padding: 16, background: 'var(--tinta)', color: 'var(--hueso)', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <b>Antes de empezar</b>
          {props.dias.length > 1 ? (
            <label>
              Día
              <select className="in" value={diaId} onChange={(e) => setDiaId(e.target.value)}>
                {props.dias.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.letra} {d.foco ?? ''}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label>
            Tu peso hoy (kg)
            <input className="in" value={peso} onChange={(e) => setPeso(e.target.value)} />
          </label>
          <div>
            Ganas de entrenar
            <div className="h" style={{ fontSize: 40 }}>
              {ganas}
            </div>
            <input type="range" min={0} max={10} value={ganas} onChange={(e) => setGanas(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--lima)' }} />
          </div>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn" type="button" onClick={() => void empezar()} disabled={!props.puedeRegistrar}>
            Empezar
          </button>
        </section>
      ) : (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 className="h" style={{ fontSize: 30 }}>
            Lo que toca hoy
          </h2>
          {delDia.map((e, i) => {
            const kilos = e.pres.pct != null && e.rm ? kilosObjetivo(e.rm, e.pres.pct) : null;
            return (
              <div key={e.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="lbl">
                  {i + 1}
                  {e.grupo ? ` · grupo ${e.grupo}` : ''}
                </div>
                <div className="h" style={{ fontSize: 26 }}>
                  {e.nombre}
                </div>
                <div>{e.pres.texto}</div>
                {kilos != null ? (
                  <div className="h" style={{ fontSize: 30 }}>
                    {kilos} <span style={{ fontFamily: '"Source Sans 3", sans-serif', fontSize: 14 }}>kg</span>
                  </div>
                ) : null}
                {e.pres.descanso_seg ? <span className="chip">Descanso {segundosATexto(e.pres.descanso_seg)}</span> : null}
                <a className="btn" href={`/app/sesion/serie?sesion=${sesionId}&ejercicio=${e.id}`}>
                  Registrar series
                </a>
                {props.esRuta ? (
                  <a href={`/app/sesion/cambiar?sesion=${sesionId}&ejercicio=${e.id}`}>Cambiar</a>
                ) : null}
              </div>
            );
          })}
          <a className="btn2" href={`/app/sesion/cierre?sesion=${sesionId}`}>
            Cerrar sesión
          </a>
          <button
            type="button"
            className="btn2"
            onClick={async () => {
              await supabase.rpc('marcar_semana_terminada');
              router.push('/app');
              router.refresh();
            }}
          >
            Ya terminé esta semana
          </button>
        </section>
      )}
    </>
  );
}
