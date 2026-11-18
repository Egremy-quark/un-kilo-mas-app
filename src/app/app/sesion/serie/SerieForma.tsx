'use client';

import { useEffect, useMemo, useState } from 'react';
import { crearClienteNavegador } from '@/lib/supabase/client';
import { guardarSerieLocal, subirPendientes } from '@/lib/offline';
import { segundosATexto } from '@/lib/descanso';
import { BotonPendiente } from '@/components/BotonPendiente';

interface Props {
  sesionId: string;
  rutinaEjercicioId: string;
  ejercicioId: string;
  nombre: string;
  objetivo: string;
  descansoSeg: number | null;
  anterior: { kg: number | null; reps: number | null } | null;
  kilosObjetivo: number | null;
  puedeRegistrar: boolean;
}

export function SerieForma(p: Props) {
  const supabase = useMemo(() => crearClienteNavegador(), []);
  const [kg, setKg] = useState(p.kilosObjetivo ?? p.anterior?.kg ?? 20);
  const [reps, setReps] = useState(p.anterior?.reps ?? 8);
  const [rpe, setRpe] = useState('');
  const [numero, setNumero] = useState(1);
  const [rest, setRest] = useState(0);
  const [msg, setMsg] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (rest <= 0) return;
    const t = setTimeout(() => setRest((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [rest]);

  useEffect(() => {
    const on = () => {
      void subirPendientes(async (payload) => {
        const { error } = await supabase.from('series').insert(payload);
        return !error;
      }, p.puedeRegistrar);
    };
    window.addEventListener('online', on);
    return () => window.removeEventListener('online', on);
  }, [p.puedeRegistrar, supabase]);

  async function guardar() {
    if (!p.puedeRegistrar) {
      setMsg('Ya no puedes registrar series nuevas.');
      return;
    }
    setGuardando(true);
    const payload = {
      sesion_id: p.sesionId,
      rutina_ejercicio_id: p.rutinaEjercicioId,
      ejercicio_id: p.ejercicioId,
      numero,
      kg,
      reps,
      rpe: rpe ? Number(rpe) : null,
      completada: true,
    };
    if (!navigator.onLine) {
      await guardarSerieLocal(p.sesionId, payload);
      setMsg('Sin señal: la serie quedó en el teléfono.');
    } else {
      const { error } = await supabase.from('series').insert(payload);
      if (error) {
        await guardarSerieLocal(p.sesionId, payload);
        setMsg('No se subió. Quedó guardada en el teléfono.');
      } else setMsg('Serie guardada.');
    }
    setNumero((n) => n + 1);
    if (p.descansoSeg) setRest(p.descansoSeg);
    setGuardando(false);
  }

  return (
    <>
      <a href="/app/sesion">← Sesión</a>
      <h1 className="h" style={{ fontSize: 40 }}>
        {p.nombre}
      </h1>
      <p>Objetivo: {p.objetivo}</p>
      {p.anterior ? (
        <p className="muted">
          La vez anterior: {p.anterior.kg} kg × {p.anterior.reps}
        </p>
      ) : null}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <div className="lbl">Serie {numero}</div>
        <div className="h" style={{ fontSize: 72 }}>
          {kg}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn2" type="button" onClick={() => setKg((n) => Math.max(0, n - 5))}>
            −5
          </button>
          <button className="btn2" type="button" onClick={() => setKg((n) => Math.max(0, n - 2.5))}>
            −2.5
          </button>
          <button className="btn2" type="button" onClick={() => setKg((n) => n + 2.5)}>
            +2.5
          </button>
          <button className="btn2" type="button" onClick={() => setKg((n) => n + 5)}>
            +5
          </button>
        </div>
        <div className="h" style={{ fontSize: 56 }}>
          {reps} reps
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn2" type="button" onClick={() => setReps((n) => Math.max(0, n - 1))}>
            −1
          </button>
          <button className="btn2" type="button" onClick={() => setReps((n) => n + 1)}>
            +1
          </button>
        </div>
        <label className="f" style={{ width: '100%' }}>
          RPE (opcional)
          <input className="in" value={rpe} onChange={(e) => setRpe(e.target.value)} />
        </label>
        {rest > 0 ? (
          <div className="h" style={{ fontSize: 48 }}>
            {segundosATexto(rest)}
          </div>
        ) : null}
        {msg ? <p>{msg}</p> : null}
        <BotonPendiente className="btn btn-ancho" type="button" cargando={guardando} etiquetaCargando="Guardando…" onClick={() => void guardar()}>
          Guardar serie
        </BotonPendiente>
      </div>
    </>
  );
}
