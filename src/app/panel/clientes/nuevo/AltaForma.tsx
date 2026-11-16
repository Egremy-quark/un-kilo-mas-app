'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { plataforma, esPorDefinir } from '@/config/plataforma';
import { calcularCobertura, montoCoincide, precioEsperado } from '@/lib/planes';
import type { PlanPagado } from '@/config/plataforma';

export function AltaForma() {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanPagado>('coaching');
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [monto, setMonto] = useState('');
  const [folio, setFolio] = useState('');
  const [meses, setMeses] = useState(1);
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [cargando, setCargando] = useState(false);

  const esperado = precioEsperado(plan, meses);
  const cubre = calcularCobertura({
    plan,
    fechaTransferencia: new Date(fecha),
    meses,
    veniaDePrueba: true,
  });

  async function enviar(confirmar = false) {
    setError('');
    setAviso('');
    setCargando(true);
    const montoNum = monto === '' ? null : Number(monto);
    if (!confirmar && !montoCoincide(plan, montoNum, meses)) {
      setCargando(false);
      setAviso(esperado == null ? 'El precio de coaching está [POR DEFINIR].' : `El monto no coincide con ${esperado} MXN.`);
      return;
    }
    const res = await fetch('/api/panel/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre,
        correo,
        whatsapp,
        plan,
        fecha_transferencia: fecha,
        monto_mxn: montoNum,
        folio,
        meses: plan === 'ruta_completa' ? undefined : meses,
        nota,
        confirmar_monto: confirmar || Boolean(aviso),
      }),
    });
    const json = await res.json();
    setCargando(false);
    if (!json.ok) {
      if (res.status === 409) {
        setAviso(json.mensaje);
        return;
      }
      setError(json.mensaje);
      return;
    }
    if (json.irARutina) {
      const copia = await fetch('/api/panel/rutinas/nueva', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cliente_id: json.id }) });
      const r = await copia.json().catch(() => ({}));
      router.push(r.id ? `/panel/rutinas/${r.id}` : `/panel/clientes/${json.id}`);
      return;
    }
    router.push(`/panel/clientes/${json.id}`);
  }

  return (
    <form
      className="card"
      style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}
      onSubmit={(e) => {
        e.preventDefault();
        void enviar(Boolean(aviso));
      }}
    >
      <label className="f">
        Nombre
        <input className="in" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      </label>
      <label className="f">
        Correo
        <input className="in" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
      </label>
      <label className="f">
        WhatsApp
        <input className="in" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
      </label>
      <div>
        <div className="lbl" style={{ marginBottom: 8 }}>
          Plan
        </div>
        {(['ruta_mensual', 'ruta_completa', 'coaching'] as PlanPagado[]).map((p) => (
          <label key={p} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <input type="radio" checked={plan === p} onChange={() => setPlan(p)} />
            {plataforma.planes[p].nombre}{' '}
            {plataforma.planes[p].precio == null ? (
              <span className="por-definir">[POR DEFINIR]</span>
            ) : (
              <span>${plataforma.planes[p].precio} MXN</span>
            )}
          </label>
        ))}
      </div>
      <label className="f">
        Fecha de la transferencia
        <input className="in" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
      </label>
      <label className="f">
        Monto (MXN)
        <input className="in" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} />
      </label>
      <label className="f">
        Folio
        <input className="in" value={folio} onChange={(e) => setFolio(e.target.value)} />
      </label>
      {plan !== 'ruta_completa' ? (
        <label className="f">
          Meses
          <input className="in" type="number" min={1} value={meses} onChange={(e) => setMeses(Number(e.target.value))} />
        </label>
      ) : null}
      <label className="f">
        Nota
        <input className="in" value={nota} onChange={(e) => setNota(e.target.value)} />
      </label>
      <div className="card" style={{ background: '#f1ece0' }}>
        <div className="lbl">Lo que va a pasar</div>
        <p>
          Cubre del {cubre.cubreDesde.toISOString().slice(0, 10)} al {cubre.cubreHasta.toISOString().slice(0, 10)}. Se manda la invitación al correo.
        </p>
      </div>
      {aviso ? <p className="error">{aviso} Si guardas, se registra igual.</p> : null}
      {error ? <p className="error">{error}</p> : null}
      {esPorDefinir(plataforma.datosTransferencia.clabe) ? <p className="por-definir">Datos de transferencia [POR DEFINIR]</p> : null}
      <button className="btn" type="submit" disabled={cargando}>
        Dar de alta e invitar
      </button>
    </form>
  );
}
