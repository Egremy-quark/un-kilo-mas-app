'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { calcularCobertura, montoCoincide, precioEsperado } from '@/lib/planes';
import type { PlanPagado } from '@/config/plataforma';
import { formatearRangoCorto, utcDesdeYmd, ymdDeDate, ymdEnZona } from '@/lib/fecha';
import { formatearDinero } from '@/lib/formato';
import { TarjetasPlan } from '@/components/TarjetasPlan';

export function PagoForma({ clienteId, cubreHastaAnterior, veniaDePrueba }: { clienteId: string; cubreHastaAnterior: string | null; veniaDePrueba: boolean }) {
  const router = useRouter();
  const [plan, setPlan] = useState<PlanPagado>('ruta_mensual');
  const [fecha, setFecha] = useState(ymdEnZona());
  const [monto, setMonto] = useState('');
  const [folio, setFolio] = useState('');
  const [meses, setMeses] = useState(1);
  const [nota, setNota] = useState('');
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState('');
  const cubre = calcularCobertura({
    plan,
    fechaTransferencia: utcDesdeYmd(fecha),
    meses,
    cubreHastaAnterior: cubreHastaAnterior ? utcDesdeYmd(cubreHastaAnterior) : null,
    veniaDePrueba,
  });
  const esperado = precioEsperado(plan, meses);

  async function enviar() {
    setError('');
    const montoNum = monto === '' ? null : Number(monto);
    const res = await fetch('/api/panel/pagos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente_id: clienteId,
        plan,
        fecha_transferencia: fecha,
        monto_mxn: montoNum,
        folio,
        meses: plan === 'ruta_completa' ? undefined : meses,
        nota,
        confirmar_monto: Boolean(aviso) || montoCoincide(plan, montoNum, meses),
      }),
    });
    const json = await res.json();
    if (res.status === 409) {
      setAviso(json.mensaje);
      return;
    }
    if (!json.ok) {
      setError(json.mensaje);
      return;
    }
    if (json.irARutina) {
      const r = await fetch('/api/panel/rutinas/nueva', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cliente_id: clienteId }) });
      const j = await r.json();
      router.push(j.id ? `/panel/rutinas/${j.id}` : `/panel/clientes/${clienteId}`);
      return;
    }
    router.push(`/panel/clientes/${clienteId}`);
  }

  return (
    <form
      className="card"
      style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720 }}
      onSubmit={(e) => {
        e.preventDefault();
        void enviar();
      }}
    >
      <div className="lbl">Plan</div>
      <TarjetasPlan valor={plan} onChange={setPlan} />
      <label className="f">
        Fecha
        <input className="in" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </label>
      <label className="f">
        Monto
        <input className="in" value={monto} onChange={(e) => setMonto(e.target.value)} />
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
        Cubre {formatearRangoCorto(ymdDeDate(cubre.cubreDesde), ymdDeDate(cubre.cubreHasta))}.
        {esperado != null ? ` Precio de tarifa: ${formatearDinero(esperado)}.` : ' Precio de coaching [POR DEFINIR].'}
      </div>
      {aviso ? <p className="error">{aviso} Si vuelves a guardar, se registra igual.</p> : null}
      {error ? <p className="error">{error}</p> : null}
      <button className="btn" type="submit">
        Registrar pago
      </button>
    </form>
  );
}
