import { formatearNumero, redondearAlPaso } from './formato';

export type Unidad = 'kg' | 'lb';
export type Ejercicio = '' | 'sentadilla' | 'press de banca' | 'peso muerto' | 'press militar' | 'otro';
export type ObjetivoProteina = 'mantener' | 'ganar' | 'bajar';
export type Sexo = 'mujer' | 'hombre';
export type Actividad = 'sedentario' | 'ligero' | 'moderado' | 'activo' | 'muy-activo';
export type ObjetivoCalorias = 'bajar' | 'mantener' | 'subir';

export interface Fallo {
  ok: false;
  mensaje: string;
}

export interface Carga {
  porcentaje: number;
  peso: number;
}

export interface Exito1rm {
  ok: true;
  epley: number;
  brzycki: number;
  resultado: number;
  unidad: Unidad;
  ejercicio: Ejercicio;
  cargas: Carga[];
  titulo: string;
  explicacion: string;
  nota: string;
}

export interface RangoProteina {
  minimo: number;
  maximo: number;
}

export interface ExitoProteina {
  ok: true;
  minimo: number;
  maximo: number;
  recomendado: number;
  gramosPorKilo: number;
  titulo: string;
  explicacion: string;
  rangoTexto: string;
  fuenteTexto: string;
  fuenteUrl: string;
  aviso: string;
}

export interface ExitoCalorias {
  ok: true;
  metabolismo: number;
  factor: number;
  resultado: number;
  titulo: string;
  explicacion: string;
  parrafo: string;
  fuenteTexto: string;
  fuenteUrl: string;
}

export interface AjustesCalorias {
  bajar: number;
  subir: number;
}

export const NOTA_1RM =
  'Funciona mejor con una serie pesada de 3 a 10 repeticiones, cerca del fallo y con buena técnica. Si empiezas, lo normal es calcular de más.';

export const AVISO_PROTEINA =
  'No aplica en embarazo, enfermedad renal o si un médico te indicó otra cosa.';

export const PARRAFO_CALORIAS =
  'Es tu punto de partida para mantener tu peso. Ajústalo viendo tu báscula durante 2 a 3 semanas: estas fórmulas pueden fallar más de un 10 % en algunas personas.';

export const FUENTE_PROTEINA = {
  texto:
    'Morton et al., 2018, British Journal of Sports Medicine (metaanálisis de 49 estudios): la ganancia de músculo deja de mejorar alrededor de 1.6 g/kg/día.',
  url: 'https://doi.org/10.1136/bjsports-2017-097608',
} as const;

export const FUENTE_CALORIAS = {
  texto: 'Mifflin et al., 1990, American Journal of Clinical Nutrition',
  url: 'https://doi.org/10.1093/ajcn/51.2.241',
} as const;

export const ACTIVIDADES: Record<Actividad, { factor: number; etiqueta: string; detalle: string }> = {
  sedentario: { factor: 1.2, etiqueta: 'sedentario', detalle: 'trabajo sentado, sin ejercicio' },
  ligero: { factor: 1.375, etiqueta: 'ligero', detalle: 'entrenas 1 a 3 días' },
  moderado: { factor: 1.55, etiqueta: 'moderado', detalle: 'entrenas 3 a 5 días' },
  activo: { factor: 1.725, etiqueta: 'activo', detalle: 'entrenas 6 a 7 días' },
  'muy-activo': { factor: 1.9, etiqueta: 'muy activo', detalle: 'trabajo físico y además entrenas' },
};

const PASO: Record<Unidad, number> = { kg: 2.5, lb: 5 };

const NOMBRE_EJERCICIO: Record<Exclude<Ejercicio, '' | 'otro'>, string> = {
  sentadilla: 'sentadilla',
  'press de banca': 'press de banca',
  'peso muerto': 'peso muerto',
  'press militar': 'press militar',
};

export function epley(peso: number, repeticiones: number): number {
  if (repeticiones <= 1) return peso;
  return peso * (1 + repeticiones / 30);
}

export function brzycki(peso: number, repeticiones: number): number {
  if (repeticiones <= 1) return peso;
  return (peso * 36) / (37 - repeticiones);
}

export function titulo1rm(ejercicio: Ejercicio): string {
  if (ejercicio && ejercicio !== 'otro' && ejercicio in NOMBRE_EJERCICIO) {
    return `Tu 1RM estimado en ${NOMBRE_EJERCICIO[ejercicio]}`;
  }
  return 'Tu 1RM estimado';
}

export function calcular1rm(entrada: {
  peso: number;
  repeticiones: number;
  unidad: Unidad;
  ejercicio?: Ejercicio;
  porcentajes?: readonly number[];
}): Exito1rm | Fallo {
  const { peso, repeticiones, unidad } = entrada;
  const ejercicio = entrada.ejercicio ?? '';
  const porcentajes = entrada.porcentajes ?? [70, 75, 80, 85];

  if (!Number.isFinite(peso) || peso <= 0) {
    return { ok: false, mensaje: 'Escribe un peso mayor que 0.' };
  }
  if (!Number.isInteger(repeticiones) || repeticiones < 1) {
    return { ok: false, mensaje: 'Escribe las repeticiones completas, de 1 a 10.' };
  }
  if (repeticiones > 10) {
    return {
      ok: false,
      mensaje:
        'Con más de 10 repeticiones la estimación pierde precisión. Usa una serie de 3 a 10.',
    };
  }

  const valorEpley = epley(peso, repeticiones);
  const valorBrzycki = brzycki(peso, repeticiones);
  const paso = PASO[unidad];
  const resultado =
    repeticiones === 1
      ? redondearAlPaso(peso, paso)
      : redondearAlPaso((valorEpley + valorBrzycki) / 2, paso);

  const cargas = porcentajes.map((porcentaje) => ({
    porcentaje,
    peso: redondearAlPaso((resultado * porcentaje) / 100, paso),
  }));

  const explicacion =
    repeticiones === 1
      ? 'Con 1 repetición, el 1RM es el peso levantado.'
      : `Promedio de Epley y Brzycki con ${formatearNumero(peso)} ${unidad} × ${repeticiones} repeticiones.`;

  return {
    ok: true,
    epley: valorEpley,
    brzycki: valorBrzycki,
    resultado,
    unidad,
    ejercicio,
    cargas,
    titulo: titulo1rm(ejercicio),
    explicacion,
    nota: NOTA_1RM,
  };
}

export function calcularProteina(
  pesoKg: number,
  objetivo: ObjetivoProteina,
  rango: RangoProteina = { minimo: 1.6, maximo: 2.2 },
): ExitoProteina | Fallo {
  if (!Number.isFinite(pesoKg) || pesoKg < 30 || pesoKg > 250) {
    return { ok: false, mensaje: 'Escribe un peso entre 30 y 250 kg.' };
  }

  const minimo = redondearAlPaso(pesoKg * rango.minimo, 5);
  const maximo = redondearAlPaso(pesoKg * rango.maximo, 5);
  const parteAlta = objetivo === 'bajar';
  const recomendado = parteAlta ? maximo : minimo;
  const gramosPorKilo = parteAlta ? rango.maximo : rango.minimo;
  const parte = parteAlta ? 'la parte alta del rango' : 'la parte baja del rango';

  return {
    ok: true,
    minimo,
    maximo,
    recomendado,
    gramosPorKilo,
    titulo: 'Tu proteína diaria',
    explicacion: `${formatearNumero(gramosPorKilo)} g/kg al día sobre ${formatearNumero(pesoKg)} kg, ${parte}.`,
    rangoTexto: `Entre ${formatearNumero(minimo)} y ${formatearNumero(maximo)} g al día`,
    fuenteTexto: FUENTE_PROTEINA.texto,
    fuenteUrl: FUENTE_PROTEINA.url,
    aviso: AVISO_PROTEINA,
  };
}

export function mifflinStJeor(sexo: Sexo, pesoKg: number, estaturaCm: number, edad: number): number {
  const base = 10 * pesoKg + 6.25 * estaturaCm - 5 * edad;
  return sexo === 'hombre' ? base + 5 : base - 161;
}

export function calcularCalorias(entrada: {
  sexo: Sexo;
  edad: number;
  pesoKg: number;
  estaturaCm: number;
  actividad: Actividad;
}): ExitoCalorias | Fallo {
  const { sexo, edad, pesoKg, estaturaCm, actividad } = entrada;

  if (edad < 18) {
    return {
      ok: false,
      mensaje:
        'Esta calculadora es para mayores de 18 años. Si eres menor, consulta a un profesional.',
    };
  }
  if (!Number.isInteger(edad) || edad > 80) {
    return { ok: false, mensaje: 'Escribe una edad entre 18 y 80 años.' };
  }
  if (!Number.isFinite(pesoKg) || pesoKg < 30 || pesoKg > 250) {
    return { ok: false, mensaje: 'Escribe un peso entre 30 y 250 kg.' };
  }
  if (!Number.isFinite(estaturaCm) || estaturaCm < 120 || estaturaCm > 230) {
    return { ok: false, mensaje: 'Escribe una estatura entre 120 y 230 cm.' };
  }

  const nivel = ACTIVIDADES[actividad];
  if (!nivel) {
    return { ok: false, mensaje: 'Elige qué tanto te mueves en la semana.' };
  }

  const metabolismo = mifflinStJeor(sexo, pesoKg, estaturaCm, edad);
  const resultado = redondearAlPaso(metabolismo * nivel.factor, 10);

  return {
    ok: true,
    metabolismo,
    factor: nivel.factor,
    resultado,
    titulo: 'Tu gasto diario estimado',
    explicacion: `Mifflin-St Jeor × ${nivel.factor} (actividad ${nivel.etiqueta}).`,
    parrafo: PARRAFO_CALORIAS,
    fuenteTexto: FUENTE_CALORIAS.texto,
    fuenteUrl: FUENTE_CALORIAS.url,
  };
}

/**
 * Ajuste para bajar o subir de peso. Los números los define Yohan.
 * Si `ajustes` es null, no hay nada que mostrar. El MVP mantiene el flag apagado.
 */
export function caloriasSegunObjetivo(
  gasto: number,
  objetivo: ObjetivoCalorias,
  ajustes: AjustesCalorias | null,
): number | null {
  if (!ajustes) return null;
  if (objetivo === 'mantener') return gasto;
  const delta = objetivo === 'bajar' ? ajustes.bajar : ajustes.subir;
  return redondearAlPaso(gasto + delta, 10);
}
