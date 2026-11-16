import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function actualizarSesion(request: NextRequest) {
  let respuesta = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !clave) return respuesta;

  const supabase = createServerClient(url, clave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        respuesta = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const esPanel = path.startsWith('/panel');
  const esApp = path.startsWith('/app');
  const esAuth = ['/entrar', '/recuperar', '/crear-contrasena', '/bienvenida'].some((p) => path.startsWith(p));

  if ((esPanel || esApp) && !user) {
    const redir = request.nextUrl.clone();
    redir.pathname = '/entrar';
    redir.searchParams.set('siguiente', path);
    return NextResponse.redirect(redir);
  }

  if (!user) return respuesta;

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .maybeSingle();

  const rol = (perfil as { rol?: string } | null)?.rol;

  if (esPanel && rol !== 'entrenador') {
    const redir = request.nextUrl.clone();
    redir.pathname = rol === 'cliente' ? '/app' : '/entrar';
    return NextResponse.redirect(redir);
  }

  if (esApp && rol !== 'cliente') {
    const redir = request.nextUrl.clone();
    redir.pathname = rol === 'entrenador' ? '/panel' : '/entrar';
    return NextResponse.redirect(redir);
  }

  if (esAuth && path === '/entrar' && rol) {
    const redir = request.nextUrl.clone();
    redir.pathname = rol === 'entrenador' ? '/panel' : '/app';
    redir.search = '';
    return NextResponse.redirect(redir);
  }

  return respuesta;
}
