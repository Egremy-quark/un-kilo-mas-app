-- Solo la fase de esta demo. No crea las otras fases de Buho Way.

create table if not exists public.plantilla_fases (
  id uuid primary key default gen_random_uuid(),
  orden integer not null,
  nombre text not null,
  unique (orden)
);

create index if not exists plantilla_fases_orden_idx on public.plantilla_fases (orden);

alter table public.rutinas
  add column if not exists fase_plantilla_id uuid references public.plantilla_fases (id) on delete restrict;

create index if not exists rutinas_fase_plantilla_idx on public.rutinas (fase_plantilla_id);

create table if not exists public.plantilla_variantes (
  id uuid primary key default gen_random_uuid(),
  rutina_id uuid not null references public.rutinas (id) on delete cascade,
  poblacion text check (poblacion is null or poblacion in ('mujeres', 'hombres')),
  material text check (material is null or material in ('poco_material', 'sin_maquinas')),
  unidades text check (unidades is null or unidades in ('kg', 'lbs')),
  creado_en timestamptz not null default now(),
  check (poblacion is not null or material is not null or unidades is not null)
);

create index if not exists plantilla_variantes_rutina_idx on public.plantilla_variantes (rutina_id);

alter table public.plantilla_fases enable row level security;
alter table public.plantilla_variantes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'plantilla_fases' and policyname = 'plantilla_fases_entrenador'
  ) then
    create policy plantilla_fases_entrenador on public.plantilla_fases
      for all to authenticated
      using (public.es_entrenador())
      with check (public.es_entrenador());
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'plantilla_variantes' and policyname = 'plantilla_variantes_entrenador'
  ) then
    create policy plantilla_variantes_entrenador on public.plantilla_variantes
      for all to authenticated
      using (public.es_entrenador())
      with check (public.es_entrenador());
  end if;
end $$;

grant select, insert, update, delete on public.plantilla_fases, public.plantilla_variantes to authenticated;

insert into public.plantilla_fases (orden, nombre)
select 2, '2 Aprender a Moverse'
where not exists (
  select 1 from public.plantilla_fases
  where public.normalizar_nombre(nombre) = public.normalizar_nombre('Aprender a Moverse')
     or public.normalizar_nombre(nombre) = public.normalizar_nombre('2 Aprender a Moverse')
);

notify pgrst, 'reload schema';
