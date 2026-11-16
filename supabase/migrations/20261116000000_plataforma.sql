-- Plataforma Un Kilo Más.
-- Este repo es el dueño del esquema. Compatible con la tabla leads de la landing.
-- Reemplaza el trackeo viejo (bloques / tipo_acceso), que no estaba abierto al público.

create extension if not exists unaccent with schema public;

create or replace function public.immutable_unaccent(texto text)
returns text
language sql
immutable
parallel safe
as $$
  select public.unaccent('public.unaccent', texto);
$$;

create or replace function public.normalizar_nombre(texto text)
returns text
language sql
immutable
parallel safe
as $$
  select regexp_replace(
    public.immutable_unaccent(lower(trim(coalesce(texto, '')))),
    '\s+',
    ' ',
    'g'
  );
$$;

-- --- Quitar el trackeo viejo de la landing (si existe) ---

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.manejar_nuevo_usuario();
drop function if exists public.acceso_inicial();

drop table if exists public.series_registradas cascade;
drop table if exists public.entrenamientos cascade;
drop table if exists public.progreso_bloque cascade;
drop table if exists public.ejercicios_sesion cascade;
drop table if exists public.sesiones_bloque cascade;
drop table if exists public.bloques cascade;
drop table if exists public.perfiles cascade;

-- --- Leads: se conserva para la landing ---

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  correo text not null,
  origen text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  aviso_aceptado boolean not null default false,
  creado_en timestamptz not null default now()
);

create index if not exists leads_correo_idx on public.leads (correo);
create index if not exists leads_creado_en_idx on public.leads (creado_en desc);

do $$
begin
  alter table public.leads
    add constraint leads_correo_formato
    check (correo ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' and char_length(correo) <= 320);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.leads
    add constraint leads_aviso_true
    check (aviso_aceptado = true);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.leads
    add constraint leads_origen_lista
    check (origen in (
      'rutina-01', '1rm', 'proteina', 'calorias',
      'prueba-gratis',
      'calculadora-1rm', 'calculadora-proteina', 'calculadora-calorias'
    ));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.leads
    add constraint leads_utm_largo
    check (
      char_length(coalesce(utm_source, '')) <= 80
      and char_length(coalesce(utm_medium, '')) <= 80
      and char_length(coalesce(utm_campaign, '')) <= 80
      and char_length(coalesce(utm_content, '')) <= 80
    );
exception
  when duplicate_object then null;
end $$;

-- --- Tablas nuevas ---

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  rol text not null check (rol in ('entrenador', 'cliente')),
  nombre text,
  correo text,
  whatsapp text,
  plan text not null default 'prueba'
    check (plan in ('prueba', 'ruta_mensual', 'ruta_completa', 'coaching', 'sin_plan')),
  prueba_inicio timestamptz,
  entrenador_a_cargo_id uuid references public.perfiles (id) on delete set null,
  etiqueta_publica text,
  origen text check (origen in ('landing', 'alta_manual')),
  ultimo_acceso date,
  aviso_borrado_en date,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index perfiles_rol_idx on public.perfiles (rol);
create index perfiles_plan_idx on public.perfiles (plan);
create index perfiles_activo_idx on public.perfiles (activo);
create index perfiles_correo_idx on public.perfiles (correo);

create table public.programas (
  id uuid primary key default gen_random_uuid(),
  clave text not null unique,
  nombre text not null,
  descripcion text not null default ''
);

create table public.rutinas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.perfiles (id) on delete cascade,
  es_plantilla boolean not null default false,
  nombre text not null default '',
  enfoque text check (enfoque in ('fuerza', 'hipertrofia', 'transicion', 'tecnica')),
  semanas integer not null default 4 check (semanas > 0),
  semana_descarga integer check (semana_descarga is null or semana_descarga > 0),
  estado text not null default 'borrador'
    check (estado in ('borrador', 'publicada', 'terminada', 'archivada')),
  creada_por uuid references public.perfiles (id) on delete set null,
  fecha_inicio date,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index rutinas_cliente_idx on public.rutinas (cliente_id);
create index rutinas_plantilla_idx on public.rutinas (es_plantilla) where es_plantilla;
create index rutinas_estado_idx on public.rutinas (estado);

create table public.programa_fases (
  id uuid primary key default gen_random_uuid(),
  programa_id uuid not null references public.programas (id) on delete cascade,
  orden integer not null check (orden > 0),
  nombre text not null,
  descripcion text not null default '',
  rutina_id uuid references public.rutinas (id) on delete set null,
  publicada boolean not null default false,
  unique (programa_id, orden)
);

create index programa_fases_programa_idx on public.programa_fases (programa_id, orden);

create table public.inscripciones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.perfiles (id) on delete cascade,
  programa_id uuid not null references public.programas (id) on delete cascade,
  fase_orden integer not null default 1,
  semana integer not null default 1,
  vuelta integer not null default 1,
  iniciada boolean not null default false,
  terminada boolean not null default false,
  rutina_iniciada_id uuid references public.rutinas (id) on delete set null,
  actualizado_en timestamptz not null default now(),
  unique (cliente_id, programa_id)
);

create index inscripciones_cliente_idx on public.inscripciones (cliente_id);
create index inscripciones_programa_fase_idx on public.inscripciones (programa_id, fase_orden);

create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.perfiles (id) on delete cascade,
  plan text not null check (plan in ('ruta_mensual', 'ruta_completa', 'coaching')),
  fecha_transferencia date not null,
  monto_mxn numeric(10, 2),
  folio text,
  meses integer check (meses is null or meses > 0),
  cubre_desde date not null,
  cubre_hasta date not null,
  registrado_por uuid references public.perfiles (id) on delete set null,
  nota text,
  creado_en timestamptz not null default now()
);

create index pagos_cliente_idx on public.pagos (cliente_id, cubre_hasta desc);
create index pagos_cubre_idx on public.pagos (cubre_desde, cubre_hasta);
create index pagos_fecha_idx on public.pagos (fecha_transferencia desc);
create index pagos_registrado_por_idx on public.pagos (registrado_por);

create table public.solicitudes_plan (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.perfiles (id) on delete cascade,
  plan_elegido text not null check (plan_elegido in ('ruta_mensual', 'ruta_completa', 'coaching')),
  fecha timestamptz not null default now(),
  atendida boolean not null default false
);

create index solicitudes_atendida_idx on public.solicitudes_plan (atendida, fecha desc);
create index solicitudes_cliente_idx on public.solicitudes_plan (cliente_id);

create table public.ejercicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  patron text,
  medida text not null default 'kg_reps'
    check (medida in ('kg_reps', 'peso_corporal', 'tiempo')),
  video_url text,
  nota_default text,
  creado_en timestamptz not null default now()
);

create unique index ejercicios_nombre_normalizado_idx
  on public.ejercicios (public.normalizar_nombre(nombre));

create table public.ejercicio_alternativas (
  id uuid primary key default gen_random_uuid(),
  ejercicio_id uuid not null references public.ejercicios (id) on delete cascade,
  alternativa_id uuid not null references public.ejercicios (id) on delete cascade,
  tipo text not null check (tipo in ('sin_equipo', 'equivalente', 'maquina')),
  orden integer not null default 0,
  unique (ejercicio_id, alternativa_id)
);

create index ejercicio_alternativas_ejercicio_idx on public.ejercicio_alternativas (ejercicio_id);

create table public.rutina_dias (
  id uuid primary key default gen_random_uuid(),
  rutina_id uuid not null references public.rutinas (id) on delete cascade,
  letra text not null,
  foco text,
  orden integer not null default 0,
  unique (rutina_id, letra)
);

create index rutina_dias_rutina_idx on public.rutina_dias (rutina_id, orden);

create table public.rutina_ejercicios (
  id uuid primary key default gen_random_uuid(),
  dia_id uuid not null references public.rutina_dias (id) on delete cascade,
  ejercicio_id uuid not null references public.ejercicios (id) on delete restrict,
  orden integer not null default 0,
  grupo text,
  intensidad_tipo text not null default 'texto'
    check (intensidad_tipo in ('pct_1rm', 'rm', 'rpe', 'rir_fallo', 'texto')),
  nota text,
  video_url text,
  revisar boolean not null default false
);

create index rutina_ejercicios_dia_idx on public.rutina_ejercicios (dia_id, orden);

create table public.prescripciones (
  id uuid primary key default gen_random_uuid(),
  rutina_ejercicio_id uuid not null references public.rutina_ejercicios (id) on delete cascade,
  semana integer not null check (semana > 0),
  series text,
  reps text,
  pct numeric(5, 4) check (pct is null or (pct >= 0 and pct <= 1)),
  rm integer,
  tempo text,
  tecnica text,
  descanso_seg integer,
  omitir boolean not null default false,
  texto text not null default '',
  unique (rutina_ejercicio_id, semana)
);

create index prescripciones_ejercicio_idx on public.prescripciones (rutina_ejercicio_id, semana);

create table public.cambios_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.perfiles (id) on delete cascade,
  rutina_ejercicio_id uuid not null references public.rutina_ejercicios (id) on delete cascade,
  ejercicio_id uuid not null references public.ejercicios (id) on delete restrict,
  alcance text not null check (alcance in ('hoy', 'fase')),
  fecha_sesion date,
  creado_en timestamptz not null default now()
);

create index cambios_cliente_idx on public.cambios_cliente (cliente_id, rutina_ejercicio_id);

create table public.rm_referencia (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.perfiles (id) on delete cascade,
  ejercicio_id uuid not null references public.ejercicios (id) on delete cascade,
  kg numeric(8, 2) not null check (kg >= 0),
  origen text not null check (origen in ('manual', 'estimado', 'cliente')),
  actualizado_por uuid references public.perfiles (id) on delete set null,
  actualizado_en timestamptz not null default now(),
  unique (cliente_id, ejercicio_id)
);

create index rm_referencia_cliente_idx on public.rm_referencia (cliente_id);

create table public.sesiones (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.perfiles (id) on delete cascade,
  rutina_id uuid references public.rutinas (id) on delete set null,
  dia_id uuid references public.rutina_dias (id) on delete set null,
  semana integer,
  fase_orden integer,
  vuelta integer,
  fecha date not null default current_date,
  hora_inicio timestamptz,
  hora_fin timestamptz,
  peso_corporal numeric(6, 2),
  ganas integer check (ganas is null or (ganas >= 0 and ganas <= 10)),
  nota_cliente text,
  estado text not null default 'abierta' check (estado in ('abierta', 'cerrada')),
  libre boolean not null default false,
  creado_en timestamptz not null default now()
);

create index sesiones_cliente_fecha_idx on public.sesiones (cliente_id, fecha desc);
create index sesiones_cliente_estado_idx on public.sesiones (cliente_id, estado);
create index sesiones_rutina_semana_idx on public.sesiones (rutina_id, semana);

create table public.series (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references public.sesiones (id) on delete cascade,
  rutina_ejercicio_id uuid references public.rutina_ejercicios (id) on delete set null,
  ejercicio_id uuid not null references public.ejercicios (id) on delete restrict,
  numero integer not null check (numero > 0),
  es_top_set boolean not null default false,
  kg numeric(8, 2),
  reps integer,
  segundos integer,
  rpe numeric(3, 1),
  completada boolean not null default true,
  creado_en timestamptz not null default now()
);

create index series_sesion_idx on public.series (sesion_id, numero);
create index series_ejercicio_idx on public.series (ejercicio_id);

-- --- Funciones de permiso ---

create or replace function public.es_entrenador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'entrenador' and activo = true
  );
$$;

create or replace function public.rutina_02_terminada(p_cliente uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.inscripciones i
    join public.programas p on p.id = i.programa_id
    where i.cliente_id = p_cliente
      and p.clave = 'prueba'
      and i.fase_orden >= 2
      and i.terminada = true
  );
$$;

create or replace function public.prueba_vigente(p_cliente uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles p
    where p.id = p_cliente
      and p.plan = 'prueba'
      and p.prueba_inicio is not null
      and now() < p.prueba_inicio + interval '30 days'
      and not public.rutina_02_terminada(p_cliente)
  );
$$;

create or replace function public.plan_activo(p_cliente uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pagos
    where cliente_id = p_cliente
      and cubre_desde <= current_date
      and cubre_hasta >= current_date
  );
$$;

create or replace function public.puede_registrar(p_cliente uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.prueba_vigente(p_cliente) or public.plan_activo(p_cliente);
$$;

create or replace function public.rutina_visible_para_cliente(p_rutina uuid, p_cliente uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.rutinas r
    where r.id = p_rutina
      and (
        (r.cliente_id = p_cliente and r.estado = 'publicada')
        or exists (
          select 1 from public.inscripciones i
          where i.cliente_id = p_cliente and i.rutina_iniciada_id = r.id
        )
        or exists (
          select 1
          from public.programa_fases f
          join public.inscripciones i on i.programa_id = f.programa_id and i.cliente_id = p_cliente
          where f.rutina_id = r.id
            and f.publicada = true
            and f.orden = i.fase_orden
            and i.rutina_iniciada_id is null
        )
      )
  );
$$;

-- --- Copiar rutina / iniciar fase / avance ---

create or replace function public.copiar_rutina(
  p_origen uuid,
  p_cliente_id uuid,
  p_es_plantilla boolean,
  p_estado text,
  p_creada_por uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nueva uuid;
  v_dia record;
  v_nuevo_dia uuid;
  v_ej record;
  v_nuevo_ej uuid;
begin
  if not public.es_entrenador() and auth.uid() is not null and auth.uid() is distinct from p_cliente_id then
    raise exception 'No puedes copiar esta rutina.';
  end if;

  insert into public.rutinas (
    cliente_id, es_plantilla, nombre, enfoque, semanas, semana_descarga, estado, creada_por
  )
  select p_cliente_id, p_es_plantilla, nombre, enfoque, semanas, semana_descarga, p_estado, p_creada_por
  from public.rutinas
  where id = p_origen
  returning id into v_nueva;

  for v_dia in
    select * from public.rutina_dias where rutina_id = p_origen order by orden
  loop
    insert into public.rutina_dias (rutina_id, letra, foco, orden)
    values (v_nueva, v_dia.letra, v_dia.foco, v_dia.orden)
    returning id into v_nuevo_dia;

    for v_ej in
      select * from public.rutina_ejercicios where dia_id = v_dia.id order by orden
    loop
      insert into public.rutina_ejercicios (
        dia_id, ejercicio_id, orden, grupo, intensidad_tipo, nota, video_url, revisar
      )
      values (
        v_nuevo_dia, v_ej.ejercicio_id, v_ej.orden, v_ej.grupo, v_ej.intensidad_tipo,
        v_ej.nota, v_ej.video_url, v_ej.revisar
      )
      returning id into v_nuevo_ej;

      insert into public.prescripciones (
        rutina_ejercicio_id, semana, series, reps, pct, rm, tempo, tecnica, descanso_seg, omitir, texto
      )
      select v_nuevo_ej, semana, series, reps, pct, rm, tempo, tecnica, descanso_seg, omitir, texto
      from public.prescripciones
      where rutina_ejercicio_id = v_ej.id;
    end loop;
  end loop;

  return v_nueva;
end;
$$;

create or replace function public.iniciar_fase(p_inscripcion_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ins public.inscripciones%rowtype;
  v_fase public.programa_fases%rowtype;
  v_copia uuid;
begin
  select * into v_ins from public.inscripciones where id = p_inscripcion_id;
  if not found then
    raise exception 'No encontramos esa inscripción.';
  end if;
  if auth.uid() is distinct from v_ins.cliente_id and not public.es_entrenador() then
    raise exception 'No puedes iniciar esta fase.';
  end if;
  if v_ins.rutina_iniciada_id is not null then
    return v_ins.rutina_iniciada_id;
  end if;

  select * into v_fase
  from public.programa_fases
  where programa_id = v_ins.programa_id and orden = v_ins.fase_orden;

  if not found or v_fase.rutina_id is null then
    raise exception 'Tu siguiente fase se está preparando.';
  end if;
  if not v_fase.publicada and not public.es_entrenador() then
    raise exception 'Tu siguiente fase se está preparando.';
  end if;

  v_copia := public.copiar_rutina(
    v_fase.rutina_id,
    v_ins.cliente_id,
    false,
    'publicada',
    v_ins.cliente_id
  );

  update public.inscripciones
  set rutina_iniciada_id = v_copia,
      iniciada = true,
      actualizado_en = now()
  where id = p_inscripcion_id;

  return v_copia;
end;
$$;

create or replace function public.semana_completa(p_cliente uuid, p_rutina uuid, p_semana integer)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select bool_and(existe)
    from (
      select exists (
        select 1 from public.sesiones s
        where s.cliente_id = p_cliente
          and s.rutina_id = p_rutina
          and s.dia_id = d.id
          and s.semana = p_semana
          and s.estado = 'cerrada'
      ) as existe
      from public.rutina_dias d
      where d.rutina_id = p_rutina
    ) t
  ), false);
$$;

create or replace function public.avanzar_inscripcion(p_cliente uuid, p_forzar boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ins public.inscripciones%rowtype;
  v_rutina public.rutinas%rowtype;
  v_max_fase integer;
begin
  if auth.uid() is distinct from p_cliente and not public.es_entrenador() then
    raise exception 'No puedes mover esta inscripción.';
  end if;

  select * into v_ins
  from public.inscripciones
  where cliente_id = p_cliente and terminada = false
  order by actualizado_en desc
  limit 1;
  if not found then
    return;
  end if;

  if v_ins.rutina_iniciada_id is null then
    return;
  end if;

  select * into v_rutina from public.rutinas where id = v_ins.rutina_iniciada_id;
  if not found then
    return;
  end if;

  if not p_forzar and not public.semana_completa(p_cliente, v_rutina.id, v_ins.semana) then
    return;
  end if;

  if v_ins.semana < v_rutina.semanas then
    update public.inscripciones
    set semana = semana + 1, actualizado_en = now()
    where id = v_ins.id;
    return;
  end if;

  select coalesce(max(orden), 0) into v_max_fase
  from public.programa_fases
  where programa_id = v_ins.programa_id;

  if v_ins.fase_orden < v_max_fase then
    update public.inscripciones
    set fase_orden = fase_orden + 1,
        semana = 1,
        iniciada = false,
        rutina_iniciada_id = null,
        actualizado_en = now()
    where id = v_ins.id;
  else
    update public.inscripciones
    set terminada = true, actualizado_en = now()
    where id = v_ins.id;
  end if;
end;
$$;

create or replace function public.marcar_semana_terminada()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Entra para continuar.';
  end if;
  perform public.avanzar_inscripcion(auth.uid(), true);
end;
$$;

create or replace function public.tras_cerrar_sesion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado = 'cerrada' and (old.estado is distinct from 'cerrada') then
    perform public.avanzar_inscripcion(new.cliente_id, false);
  end if;
  return new;
end;
$$;

drop trigger if exists sesiones_tras_cerrar on public.sesiones;
create trigger sesiones_tras_cerrar
  after insert or update of estado on public.sesiones
  for each row execute function public.tras_cerrar_sesion();

create or replace function public.proteger_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- La clave de servicio no trae auth.uid(); la semilla de entrenadores depende de eso.
  if auth.uid() is null then
    new.actualizado_en := now();
    return new;
  end if;
  if not public.es_entrenador() then
    new.rol := old.rol;
    new.plan := old.plan;
    new.prueba_inicio := old.prueba_inicio;
    new.entrenador_a_cargo_id := old.entrenador_a_cargo_id;
    new.etiqueta_publica := old.etiqueta_publica;
    new.origen := old.origen;
    new.activo := old.activo;
    new.aviso_borrado_en := old.aviso_borrado_en;
  end if;
  new.actualizado_en := now();
  return new;
end;
$$;

drop trigger if exists perfiles_proteger on public.perfiles;
create trigger perfiles_proteger
  before update on public.perfiles
  for each row execute function public.proteger_perfil();

-- Disparador de registro: SIEMPRE cliente en prueba. Ignora rol y plan de los metadatos.
create or replace function public.manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_programa uuid;
  v_origen text;
begin
  v_origen := coalesce(new.raw_user_meta_data->>'origen', 'landing');
  if v_origen not in ('landing', 'alta_manual') then
    v_origen := 'landing';
  end if;

  insert into public.perfiles (id, rol, nombre, correo, plan, prueba_inicio, origen, activo)
  values (
    new.id,
    'cliente',
    nullif(new.raw_user_meta_data->>'nombre', ''),
    new.email,
    'prueba',
    now(),
    v_origen,
    true
  )
  on conflict (id) do nothing;

  select id into v_programa from public.programas where clave = 'prueba';
  if v_programa is not null then
    insert into public.inscripciones (cliente_id, programa_id, fase_orden, semana, vuelta)
    values (new.id, v_programa, 1, 1, 1)
    on conflict (cliente_id, programa_id) do nothing;
  end if;

  if new.email is not null then
    insert into public.leads (correo, origen, aviso_aceptado, utm_source, utm_medium, utm_campaign, utm_content)
    values (
      new.email,
      case
        when coalesce(new.raw_user_meta_data->>'origen_lead', '') in (
          'rutina-01', '1rm', 'proteina', 'calorias',
          'prueba-gratis', 'calculadora-1rm', 'calculadora-proteina', 'calculadora-calorias'
        ) then new.raw_user_meta_data->>'origen_lead'
        else 'prueba-gratis'
      end,
      true,
      nullif(new.raw_user_meta_data->>'utm_source', ''),
      nullif(new.raw_user_meta_data->>'utm_medium', ''),
      nullif(new.raw_user_meta_data->>'utm_campaign', ''),
      nullif(new.raw_user_meta_data->>'utm_content', '')
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.manejar_nuevo_usuario();

insert into public.programas (clave, nombre, descripcion) values
  ('prueba', 'Prueba', 'Rutina 01 «Base articular» y Rutina 02 «Aprender a moverse». [CONTENIDO POR YOHAN]'),
  ('ruta-1', 'Ruta +1', 'Programa general de 8 fases. Sin entrenador.')
on conflict (clave) do nothing;

-- --- RLS ---

alter table public.leads enable row level security;
alter table public.perfiles enable row level security;
alter table public.pagos enable row level security;
alter table public.solicitudes_plan enable row level security;
alter table public.ejercicios enable row level security;
alter table public.ejercicio_alternativas enable row level security;
alter table public.programas enable row level security;
alter table public.programa_fases enable row level security;
alter table public.inscripciones enable row level security;
alter table public.rutinas enable row level security;
alter table public.rutina_dias enable row level security;
alter table public.rutina_ejercicios enable row level security;
alter table public.prescripciones enable row level security;
alter table public.cambios_cliente enable row level security;
alter table public.rm_referencia enable row level security;
alter table public.sesiones enable row level security;
alter table public.series enable row level security;

revoke all on public.leads from anon, authenticated;
grant insert on public.leads to anon;
grant select, insert, update, delete on public.leads to authenticated;

grant select, insert, update, delete on
  public.perfiles,
  public.pagos,
  public.solicitudes_plan,
  public.ejercicios,
  public.ejercicio_alternativas,
  public.programas,
  public.programa_fases,
  public.inscripciones,
  public.rutinas,
  public.rutina_dias,
  public.rutina_ejercicios,
  public.prescripciones,
  public.cambios_cliente,
  public.rm_referencia,
  public.sesiones,
  public.series
to authenticated;

grant usage on schema public to anon, authenticated;
grant execute on function public.es_entrenador() to anon, authenticated;
grant execute on function public.prueba_vigente(uuid) to authenticated;
grant execute on function public.plan_activo(uuid) to authenticated;
grant execute on function public.puede_registrar(uuid) to authenticated;
grant execute on function public.iniciar_fase(uuid) to authenticated;
grant execute on function public.marcar_semana_terminada() to authenticated;
revoke all on function public.copiar_rutina(uuid, uuid, boolean, text, uuid) from public, anon, authenticated;
grant execute on function public.avanzar_inscripcion(uuid, boolean) to authenticated;

-- leads: anónimo solo inserta; entrenadores leen
create policy leads_anon_insert on public.leads
  for insert to anon
  with check (
    aviso_aceptado = true
    and correo ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  );

create policy leads_entrenador_todo on public.leads
  for all to authenticated
  using (public.es_entrenador())
  with check (public.es_entrenador());

-- perfiles
create policy perfiles_select on public.perfiles
  for select to authenticated
  using (public.es_entrenador() or id = auth.uid() or entrenador_a_cargo_id = auth.uid());

create policy perfiles_update_propio on public.perfiles
  for update to authenticated
  using (id = auth.uid() or public.es_entrenador())
  with check (id = auth.uid() or public.es_entrenador());

create policy perfiles_entrenador_insert on public.perfiles
  for insert to authenticated
  with check (public.es_entrenador());

create policy perfiles_entrenador_delete on public.perfiles
  for delete to authenticated
  using (public.es_entrenador());

-- pagos
create policy pagos_select on public.pagos
  for select to authenticated
  using (public.es_entrenador() or cliente_id = auth.uid());

create policy pagos_entrenador_escribe on public.pagos
  for all to authenticated
  using (public.es_entrenador())
  with check (public.es_entrenador());

-- solicitudes: el cliente no inserta por RLS; lo hace el endpoint
create policy solicitudes_select on public.solicitudes_plan
  for select to authenticated
  using (public.es_entrenador() or cliente_id = auth.uid());

create policy solicitudes_entrenador on public.solicitudes_plan
  for all to authenticated
  using (public.es_entrenador())
  with check (public.es_entrenador());

-- catálogo
create policy ejercicios_select on public.ejercicios
  for select to authenticated
  using (true);

create policy ejercicios_entrenador on public.ejercicios
  for all to authenticated
  using (public.es_entrenador())
  with check (public.es_entrenador());

create policy alternativas_select on public.ejercicio_alternativas
  for select to authenticated
  using (true);

create policy alternativas_entrenador on public.ejercicio_alternativas
  for all to authenticated
  using (public.es_entrenador())
  with check (public.es_entrenador());

-- programas
create policy programas_select on public.programas
  for select to authenticated
  using (true);

create policy programas_entrenador on public.programas
  for all to authenticated
  using (public.es_entrenador())
  with check (public.es_entrenador());

create policy fases_select on public.programa_fases
  for select to authenticated
  using (public.es_entrenador() or publicada = true);

create policy fases_entrenador on public.programa_fases
  for all to authenticated
  using (public.es_entrenador())
  with check (public.es_entrenador());

create policy inscripciones_select on public.inscripciones
  for select to authenticated
  using (public.es_entrenador() or cliente_id = auth.uid());

create policy inscripciones_entrenador on public.inscripciones
  for all to authenticated
  using (public.es_entrenador())
  with check (public.es_entrenador());

-- rutinas
create policy rutinas_select on public.rutinas
  for select to authenticated
  using (public.es_entrenador() or public.rutina_visible_para_cliente(id, auth.uid()));

create policy rutinas_entrenador on public.rutinas
  for all to authenticated
  using (public.es_entrenador())
  with check (public.es_entrenador());

create policy dias_select on public.rutina_dias
  for select to authenticated
  using (public.es_entrenador() or public.rutina_visible_para_cliente(rutina_id, auth.uid()));

create policy dias_entrenador on public.rutina_dias
  for all to authenticated
  using (public.es_entrenador())
  with check (public.es_entrenador());

create policy rutina_ejercicios_select on public.rutina_ejercicios
  for select to authenticated
  using (
    public.es_entrenador()
    or exists (
      select 1 from public.rutina_dias d
      where d.id = dia_id and public.rutina_visible_para_cliente(d.rutina_id, auth.uid())
    )
  );

create policy rutina_ejercicios_entrenador on public.rutina_ejercicios
  for all to authenticated
  using (public.es_entrenador())
  with check (public.es_entrenador());

create policy prescripciones_select on public.prescripciones
  for select to authenticated
  using (
    public.es_entrenador()
    or exists (
      select 1
      from public.rutina_ejercicios e
      join public.rutina_dias d on d.id = e.dia_id
      where e.id = rutina_ejercicio_id
        and public.rutina_visible_para_cliente(d.rutina_id, auth.uid())
    )
  );

create policy prescripciones_entrenador on public.prescripciones
  for all to authenticated
  using (public.es_entrenador())
  with check (public.es_entrenador());

-- cambios del cliente
create policy cambios_select on public.cambios_cliente
  for select to authenticated
  using (public.es_entrenador() or cliente_id = auth.uid());

create policy cambios_cliente_escribe on public.cambios_cliente
  for insert to authenticated
  with check (cliente_id = auth.uid());

create policy cambios_cliente_update on public.cambios_cliente
  for update to authenticated
  using (cliente_id = auth.uid() or public.es_entrenador())
  with check (cliente_id = auth.uid() or public.es_entrenador());

create policy cambios_entrenador on public.cambios_cliente
  for delete to authenticated
  using (cliente_id = auth.uid() or public.es_entrenador());

-- 1RM
create policy rm_select on public.rm_referencia
  for select to authenticated
  using (public.es_entrenador() or cliente_id = auth.uid());

create policy rm_entrenador on public.rm_referencia
  for all to authenticated
  using (public.es_entrenador())
  with check (public.es_entrenador());

create policy rm_cliente_ruta on public.rm_referencia
  for insert to authenticated
  with check (
    cliente_id = auth.uid()
    and origen = 'cliente'
    and exists (
      select 1 from public.perfiles p
      where p.id = auth.uid() and p.plan in ('ruta_mensual', 'ruta_completa')
    )
  );

create policy rm_cliente_ruta_update on public.rm_referencia
  for update to authenticated
  using (
    cliente_id = auth.uid()
    and exists (
      select 1 from public.perfiles p
      where p.id = auth.uid() and p.plan in ('ruta_mensual', 'ruta_completa')
    )
  )
  with check (
    cliente_id = auth.uid()
    and origen = 'cliente'
  );

-- sesiones y series
create policy sesiones_select on public.sesiones
  for select to authenticated
  using (public.es_entrenador() or cliente_id = auth.uid());

create policy sesiones_insert on public.sesiones
  for insert to authenticated
  with check (
    public.es_entrenador()
    or (cliente_id = auth.uid() and public.puede_registrar(auth.uid()))
  );

create policy sesiones_update on public.sesiones
  for update to authenticated
  using (cliente_id = auth.uid() or public.es_entrenador())
  with check (cliente_id = auth.uid() or public.es_entrenador());

create policy sesiones_delete on public.sesiones
  for delete to authenticated
  using (cliente_id = auth.uid() or public.es_entrenador());

create policy series_select on public.series
  for select to authenticated
  using (
    public.es_entrenador()
    or exists (select 1 from public.sesiones s where s.id = sesion_id and s.cliente_id = auth.uid())
  );

create policy series_insert on public.series
  for insert to authenticated
  with check (
    public.es_entrenador()
    or (
      public.puede_registrar(auth.uid())
      and exists (select 1 from public.sesiones s where s.id = sesion_id and s.cliente_id = auth.uid())
    )
  );

create policy series_update on public.series
  for update to authenticated
  using (
    public.es_entrenador()
    or exists (select 1 from public.sesiones s where s.id = sesion_id and s.cliente_id = auth.uid())
  )
  with check (
    public.es_entrenador()
    or exists (select 1 from public.sesiones s where s.id = sesion_id and s.cliente_id = auth.uid())
  );

create policy series_delete on public.series
  for delete to authenticated
  using (
    public.es_entrenador()
    or exists (select 1 from public.sesiones s where s.id = sesion_id and s.cliente_id = auth.uid())
  );
