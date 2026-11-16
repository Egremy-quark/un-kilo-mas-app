import { NextResponse } from 'next/server';
import { crearClienteServidor } from './supabase/server';
import { crearClienteAdmin } from './supabase/admin';
import type { Perfil } from './supabase/database.types';

export function jsonError(mensaje: string, estado = 400) {
  return NextResponse.json({ ok: false, mensaje }, { status: estado });
}

export function jsonOk<T extends Record<string, unknown>>(extra?: T) {
  return NextResponse.json({ ok: true, ...extra });
}

export async function exigirEntrenador() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: jsonError('Entra para continuar.', 401) as NextResponse };

  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).maybeSingle();
  const p = perfil as Perfil | null;
  if (!p || p.rol !== 'entrenador') {
    return { error: jsonError('Esta pantalla es solo para entrenadores.', 403) as NextResponse };
  }
  return { user, perfil: p, admin: crearClienteAdmin() };
}

export async function exigirCliente() {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: jsonError('Entra para continuar.', 401) as NextResponse };

  const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', user.id).maybeSingle();
  const p = perfil as Perfil | null;
  if (!p || p.rol !== 'cliente') {
    return { error: jsonError('Esta pantalla es solo para clientes.', 403) as NextResponse };
  }
  return { user, perfil: p, supabase, admin: crearClienteAdmin() };
}

/** Vercel Cron manda `Authorization: Bearer $CRON_SECRET` cuando esa variable existe. */
export function cronAutorizado(request: Request): boolean {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) return false;
  const header = request.headers.get('authorization');
  return header === `Bearer ${secreto}`;
}
