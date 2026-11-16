import { NextResponse } from 'next/server';
import { crearClienteServidor } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const siguiente = searchParams.get('siguiente') ?? '/bienvenida';
  if (code) {
    const supabase = await crearClienteServidor();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(`${origin}${siguiente.startsWith('/') ? siguiente : '/bienvenida'}`);
}
