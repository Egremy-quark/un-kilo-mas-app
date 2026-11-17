function sinSlash(url: string): string {
  return url.replace(/\/$/, '');
}

function urlVercel(): string | null {
  const host =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;
  if (!host) return null;
  return `https://${host.replace(/^https?:\/\//, '')}`;
}

/** En el navegador usa el origen actual, para que el correo no mande a localhost si estás en Vercel. */
export function urlApp(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return sinSlash(window.location.origin);
  }
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return sinSlash(env);
  const vercel = urlVercel();
  if (vercel) return sinSlash(vercel);
  return 'http://localhost:3000';
}

export function urlCallback(siguiente: string): string {
  const base = urlApp();
  return `${base}/auth/callback?siguiente=${encodeURIComponent(siguiente)}`;
}
