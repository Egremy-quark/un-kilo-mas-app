import ExcelJS from 'exceljs';
import { exigirEntrenador, jsonError } from '@/lib/api';
import { finDeMes, ymdEnZona } from '@/lib/fecha';

export async function GET(request: Request) {
  const auth = await exigirEntrenador();
  if ('error' in auth) return auth.error;
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo') ?? 'clientes';
  const mes = searchParams.get('mes');

  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet(tipo);

  if (tipo === 'clientes') {
    hoja.columns = [
      { header: 'Nombre', key: 'nombre' },
      { header: 'Correo', key: 'correo' },
      { header: 'Plan', key: 'plan' },
      { header: 'WhatsApp', key: 'whatsapp' },
      { header: 'Origen', key: 'origen' },
    ];
    const { data } = await auth.admin.from('perfiles').select('nombre, correo, plan, whatsapp, origen').eq('rol', 'cliente');
    hoja.addRows(data ?? []);
  } else if (tipo === 'pagos') {
    hoja.columns = [
      { header: 'Cliente', key: 'cliente' },
      { header: 'Plan', key: 'plan' },
      { header: 'Fecha', key: 'fecha_transferencia' },
      { header: 'Monto', key: 'monto_mxn' },
      { header: 'Folio', key: 'folio' },
      { header: 'Cubre desde', key: 'cubre_desde' },
      { header: 'Cubre hasta', key: 'cubre_hasta' },
    ];
    let q = auth.admin.from('pagos').select('plan, fecha_transferencia, monto_mxn, folio, cubre_desde, cubre_hasta, cliente_id');
    if (mes) q = q.gte('fecha_transferencia', `${mes}-01`).lte('fecha_transferencia', finDeMes(mes));
    const { data } = await q;
    const ids = [...new Set((data ?? []).map((p) => p.cliente_id as string))];
    const { data: perfiles } = ids.length
      ? await auth.admin.from('perfiles').select('id, nombre, correo').in('id', ids)
      : { data: [] };
    const mapa = new Map((perfiles ?? []).map((p) => [p.id as string, `${p.nombre ?? ''} <${p.correo ?? ''}>`]));
    hoja.addRows((data ?? []).map((p) => ({ ...p, cliente: mapa.get(p.cliente_id as string) ?? p.cliente_id })));
  } else if (tipo === 'registros') {
    hoja.columns = [
      { header: 'Cliente', key: 'cliente_id' },
      { header: 'Fecha', key: 'fecha' },
      { header: 'Semana', key: 'semana' },
      { header: 'Peso', key: 'peso_corporal' },
      { header: 'Ganas', key: 'ganas' },
    ];
    const { data } = await auth.admin.from('sesiones').select('cliente_id, fecha, semana, peso_corporal, ganas').order('fecha', { ascending: false }).limit(5000);
    hoja.addRows(data ?? []);
  } else if (tipo === 'leads') {
    hoja.columns = [
      { header: 'Correo', key: 'correo' },
      { header: 'Origen', key: 'origen' },
      { header: 'Fecha', key: 'creado_en' },
    ];
    const { data } = await auth.admin.from('leads').select('correo, origen, creado_en').order('creado_en', { ascending: false });
    hoja.addRows(data ?? []);
  } else {
    return jsonError('Tipo de exportación no válido.');
  }

  const archivo = tipo === 'pagos' && mes ? `pagos-${mes}.xlsx` : `${tipo}-${ymdEnZona()}.xlsx`;
  const buffer = await libro.xlsx.writeBuffer();
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${archivo}"`,
    },
  });
}
