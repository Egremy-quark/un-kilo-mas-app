-- Fases de plantillas de coaching. Mismo esquema que programa_fases
-- (id, orden, nombre) sin colgarlas de Ruta +1 ni de la prueba.
-- Una plantilla pertenece a una sola fase (fase_plantilla_id).
-- Sin fase = fase_plantilla_id nulo.
-- Una variante guarda solo etiquetas. No copia los días.

create table public.plantilla_fases (
  id uuid primary key default gen_random_uuid(),
  orden integer not null,
  nombre text not null,
  unique (orden)
);

create index plantilla_fases_orden_idx on public.plantilla_fases (orden);

alter table public.rutinas
  add column fase_plantilla_id uuid references public.plantilla_fases (id) on delete restrict;

create index rutinas_fase_plantilla_idx on public.rutinas (fase_plantilla_id);

create table public.plantilla_variantes (
  id uuid primary key default gen_random_uuid(),
  rutina_id uuid not null references public.rutinas (id) on delete cascade,
  poblacion text check (poblacion is null or poblacion in ('mujeres', 'hombres')),
  material text check (material is null or material in ('poco_material', 'sin_maquinas')),
  unidades text check (unidades is null or unidades in ('kg', 'lbs')),
  creado_en timestamptz not null default now(),
  check (poblacion is not null or material is not null or unidades is not null)
);

create index plantilla_variantes_rutina_idx on public.plantilla_variantes (rutina_id);

alter table public.plantilla_fases enable row level security;
alter table public.plantilla_variantes enable row level security;

create policy plantilla_fases_entrenador on public.plantilla_fases
  for all to authenticated
  using (public.es_entrenador())
  with check (public.es_entrenador());

create policy plantilla_variantes_entrenador on public.plantilla_variantes
  for all to authenticated
  using (public.es_entrenador())
  with check (public.es_entrenador());

grant select, insert, update, delete on
  public.plantilla_fases,
  public.plantilla_variantes
to authenticated;

insert into public.plantilla_fases (orden, nombre)
values
  (1, '1 En Casa'),
  (2, '2 Aprender a Moverse'),
  (3, '3 Aprendiendo Fuerza'),
  (4, '3 Introducción a la Fuerza'),
  (5, '4 BIIO Evolucionado'),
  (6, '5 EL CAMINO'),
  (7, '6 Bloques de Power');
