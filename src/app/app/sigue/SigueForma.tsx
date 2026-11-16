'use client';

import { useState } from 'react';
import { plataforma, esPorDefinir } from '@/config/plataforma';
import { urlWhatsApp, mensajeComprobante } from '@/lib/whatsapp';
import { nombrePlan } from '@/lib/clientes-panel';

export function SigueForma({ nombre }: { nombre: string }) {
  const [elegido, setElegido] = useState<'ruta_mensual' | 'ruta_completa' | 'coaching' | null>(null);
  const [listo, setListo] = useState(false);

  async function elegir(plan: 'ruta_mensual' | 'ruta_completa' | 'coaching') {
    const res = await fetch('/api/app/sigue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_elegido: plan }),
    });
    const json = await res.json();
    if (json.ok) {
      setElegido(plan);
      setListo(true);
    }
  }

  const clabe = plataforma.datosTransferencia.clabe;
  const wa = urlWhatsApp(
    plataforma.whatsappVentas,
    mensajeComprobante(nombre, elegido ? nombrePlan(elegido) : ''),
  );

  if (listo && elegido) {
    return (
      <>
        <h1 className="h" style={{ fontSize: 42 }}>
          Transfiere y <em>avísanos</em>
        </h1>
        <div className="card">
          <p>
            Banco: {esPorDefinir(plataforma.datosTransferencia.banco) ? <span className="por-definir">[POR DEFINIR]</span> : plataforma.datosTransferencia.banco}
          </p>
          <p>
            CLABE: {esPorDefinir(clabe) ? <span className="por-definir">[POR DEFINIR]</span> : clabe}
          </p>
          <p>
            Titular: {esPorDefinir(plataforma.datosTransferencia.titular) ? <span className="por-definir">[POR DEFINIR]</span> : plataforma.datosTransferencia.titular}
          </p>
          {!esPorDefinir(clabe) ? (
            <button className="btn2" type="button" onClick={() => void navigator.clipboard.writeText(clabe)}>
              Copiar la CLABE
            </button>
          ) : null}
        </div>
        {wa ? (
          <a className="btn" href={wa} target="_blank" rel="noreferrer">
            Mandar el comprobante por WhatsApp
          </a>
        ) : (
          <p className="por-definir">WhatsApp [POR DEFINIR]</p>
        )}
      </>
    );
  }

  const waPlatica = urlWhatsApp(plataforma.whatsappVentas, `Hola, soy ${nombre || 'cliente'} de Un Kilo Más. Quiero platicar del coaching.`);

  return (
    <>
      <h1 className="h" style={{ fontSize: 42 }}>
        ¿Cómo <em>sigues</em>?
      </h1>
      <div className="card">
        <b>{plataforma.planes.ruta_mensual.nombre}</b>
        <p>${plataforma.planes.ruta_mensual.precio} MXN al mes</p>
        <p className="muted">{plataforma.planes.ruta_mensual.descripcion}</p>
        <button className="btn" type="button" onClick={() => void elegir('ruta_mensual')}>
          Elegir mensual
        </button>
      </div>
      <div className="card">
        <b>{plataforma.planes.ruta_completa.nombre}</b>
        <p>${plataforma.planes.ruta_completa.precio} MXN</p>
        <p className="muted">{plataforma.planes.ruta_completa.descripcion}</p>
        <button className="btn" type="button" onClick={() => void elegir('ruta_completa')}>
          Pagar el programa
        </button>
      </div>
      <div className="card">
        <b>{plataforma.planes.coaching.nombre}</b>
        <p className="por-definir">[POR DEFINIR]</p>
        <p className="muted">{plataforma.planes.coaching.descripcion}</p>
        <button className="btn2" type="button" onClick={() => void elegir('coaching')}>
          Pasarte a coaching
        </button>
        {waPlatica ? (
          <a href={waPlatica} target="_blank" rel="noreferrer">
            Platícalo con nosotros
          </a>
        ) : (
          <p className="por-definir">WhatsApp [POR DEFINIR]</p>
        )}
      </div>
    </>
  );
}
