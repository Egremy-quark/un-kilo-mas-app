export type Rol = 'entrenador' | 'cliente';
export type Plan = 'prueba' | 'ruta_mensual' | 'ruta_completa' | 'coaching' | 'sin_plan';
export type OrigenPerfil = 'landing' | 'alta_manual';
export type Medida = 'kg_reps' | 'peso_corporal' | 'tiempo';
export type TipoAlternativa = 'sin_equipo' | 'equivalente' | 'maquina';
export type IntensidadTipo = 'pct_1rm' | 'rm' | 'rpe' | 'rir_fallo' | 'texto';
export type EstadoRutina = 'borrador' | 'publicada' | 'terminada' | 'archivada';
export type Enfoque = 'fuerza' | 'hipertrofia' | 'transicion' | 'tecnica';
export type AlcanceCambio = 'hoy' | 'fase';
export type OrigenRm = 'manual' | 'estimado' | 'cliente';
export type EstadoSesion = 'abierta' | 'cerrada';

export interface Database {
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string;
          rol: Rol;
          nombre: string | null;
          correo: string | null;
          whatsapp: string | null;
          plan: Plan;
          prueba_inicio: string | null;
          entrenador_a_cargo_id: string | null;
          etiqueta_publica: string | null;
          origen: OrigenPerfil | null;
          ultimo_acceso: string | null;
          aviso_borrado_en: string | null;
          activo: boolean;
          creado_en: string;
          actualizado_en: string;
        };
        Insert: Partial<Database['public']['Tables']['perfiles']['Row']> & { id: string; rol: Rol };
        Update: Partial<Database['public']['Tables']['perfiles']['Row']>;
      };
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Functions: {
      es_entrenador: { Args: Record<string, never>; Returns: boolean };
      prueba_vigente: { Args: { p_cliente: string }; Returns: boolean };
      plan_activo: { Args: { p_cliente: string }; Returns: boolean };
      puede_registrar: { Args: { p_cliente: string }; Returns: boolean };
      iniciar_fase: { Args: { p_inscripcion_id: string }; Returns: string };
      marcar_semana_terminada: { Args: Record<string, never>; Returns: undefined };
    };
  };
}

export type Perfil = Database['public']['Tables']['perfiles']['Row'];
