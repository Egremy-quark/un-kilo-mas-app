export function urlApp(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

export function urlCallback(siguiente: string): string {
  const base = urlApp().replace(/\/$/, '');
  return `${base}/auth/callback?siguiente=${encodeURIComponent(siguiente)}`;
}
