import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

const tiposOtp: EmailOtpType[] = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
];

function destinoSeguro(origin: string, siguiente: string | null) {
  const path = siguiente?.startsWith('/') ? siguiente : '/bienvenida';
  return `${origin}${path}`;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const typeRaw = searchParams.get('type');
  const type = tiposOtp.includes(typeRaw as EmailOtpType) ? (typeRaw as EmailOtpType) : null;
  const siguiente = searchParams.get('siguiente');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !clave) {
    return NextResponse.redirect(destinoSeguro(origin, '/entrar'));
  }

  let respuesta = NextResponse.redirect(destinoSeguro(origin, siguiente));
  const supabase = createServerClient(url, clave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        respuesta = NextResponse.redirect(destinoSeguro(origin, siguiente));
        cookiesToSet.forEach(({ name, value, options }) => respuesta.cookies.set(name, value, options));
      },
    },
  });

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(destinoSeguro(origin, '/entrar'));
    }
    return respuesta;
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      return NextResponse.redirect(destinoSeguro(origin, '/entrar'));
    }
    return respuesta;
  }

  return respuesta;
}
