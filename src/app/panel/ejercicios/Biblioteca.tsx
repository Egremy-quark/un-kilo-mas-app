'use client';

import { useEffect, useState } from 'react';
import { crearClienteNavegador } from '@/lib/supabase/client';

interface Ej {
  id: string;
  nombre: string;
  patron: string | null;
  medida: string;
  video_url: string | null;
  nota_default: string | null;
}

const MEDIDAS = [
  { id: 'kg_reps', label: 'Kilos y reps' },
  { id: 'peso_corporal', label: 'Peso corporal' },
  { id: 'tiempo', label: 'Tiempo' },
];

export function Biblioteca() {
  const supabase = crearClienteNavegador();
  const [lista, setLista] = useState<Ej[]>([]);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<Ej | null>(null);
  const [alts, setAlts] = useState<{ id: string; nombre: string; tipo: string }[]>([]);
  const [msg, setMsg] = useState('');

  async function cargar() {
    const { data } = await supabase.from('ejercicios').select('*').order('nombre');
    setLista((data ?? []) as Ej[]);
  }
  useEffect(() => {
    void cargar();
  }, []);

  async function abrir(e: Ej) {
    setEdit(e);
    const { data } = await supabase
      .from('ejercicio_alternativas')
      .select('id, tipo, ejercicios:alternativa_id(nombre)')
      .eq('ejercicio_id', e.id)
      .order('orden');
    setAlts((data ?? []).map((a) => ({ id: a.id as string, tipo: a.tipo as string, nombre: (a.ejercicios as { nombre?: string } | null)?.nombre ?? '' })));
  }

  async function guardar() {
    if (!edit) return;
    if (edit.id.startsWith('nuevo')) {
      const { data, error } = await supabase.from('ejercicios').insert({ nombre: edit.nombre, patron: edit.patron, medida: edit.medida, video_url: edit.video_url, nota_default: edit.nota_default }).select('*').single();
      setMsg(error ? error.message : 'Creado');
      if (data) setEdit(data as Ej);
    } else {
      const { error } = await supabase.from('ejercicios').update(edit).eq('id', edit.id);
      setMsg(error ? (error.message.includes('duplicate') ? 'Ya hay un ejercicio con ese nombre.' : error.message) : 'Guardado');
    }
    await cargar();
  }

  const filtrada = lista.filter((e) => e.nombre.toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      <div className="card" style={{ flex: '2 1 480px', padding: 0 }}>
        <div style={{ padding: 16 }}>
          <input className="in" placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Patrón</th>
              <th>Se mide</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrada.map((e) => (
              <tr key={e.id}>
                <td>
                  <b>{e.nombre}</b>
                </td>
                <td>{e.patron ?? '—'}</td>
                <td>{MEDIDAS.find((m) => m.id === e.medida)?.label}</td>
                <td>
                  <button type="button" onClick={() => void abrir(e)}>
                    Abrir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: 16 }}>
          <button className="btn2" type="button" onClick={() => setEdit({ id: 'nuevo', nombre: '', patron: '', medida: 'kg_reps', video_url: '', nota_default: '' })}>
            + Ejercicio
          </button>
        </div>
      </div>
      {edit ? (
        <form className="card" style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 12 }} onSubmit={(e) => { e.preventDefault(); void guardar(); }}>
          <label className="f">
            Nombre
            <input className="in" value={edit.nombre} onChange={(e) => setEdit({ ...edit, nombre: e.target.value })} />
          </label>
          <label className="f">
            Patrón
            <input className="in" value={edit.patron ?? ''} onChange={(e) => setEdit({ ...edit, patron: e.target.value })} />
          </label>
          <label className="f">
            Se mide
            <select className="in" value={edit.medida} onChange={(e) => setEdit({ ...edit, medida: e.target.value })}>
              {MEDIDAS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="f">
            Video
            <input className="in" value={edit.video_url ?? ''} onChange={(e) => setEdit({ ...edit, video_url: e.target.value })} />
          </label>
          <label className="f">
            Nota por defecto
            <input className="in" value={edit.nota_default ?? ''} onChange={(e) => setEdit({ ...edit, nota_default: e.target.value })} />
          </label>
          <div className="lbl">Cambios permitidos</div>
          {alts.map((a) => (
            <div key={a.id} className="chip">
              {a.nombre} · {a.tipo}
            </div>
          ))}
          {msg ? <p>{msg}</p> : null}
          <button className="btn" type="submit">
            Guardar
          </button>
        </form>
      ) : null}
    </div>
  );
}
