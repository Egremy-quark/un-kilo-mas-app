/** Trazos del símbolo «+1» en un cuadro de 100×100. El «+» y el «1» se pintan por separado. */
export const TRAZO_MAS = 'M17 45h34v10H17zM29 32h10v36H29z';
export const TRAZO_UNO = 'M69 28h14v48H69zM57 42 69 28v14z';

export function partesNombre(nombre: string): { resto: string; clave: string } {
  const palabras = nombre
    .trim()
    .toLocaleUpperCase('es-MX')
    .split(/\s+/)
    .filter((parte) => parte.length > 0);
  const clave = palabras.pop() ?? '';
  return { resto: palabras.join(' '), clave };
}

export function urlInstagram(usuario: string): string {
  return `https://instagram.com/${usuario.replace(/^@/, '')}`;
}
