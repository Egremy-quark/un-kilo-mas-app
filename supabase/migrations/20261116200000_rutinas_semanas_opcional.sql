-- Las rutinas de la prueba no tienen duración hasta que Yohan las llene.
alter table public.rutinas
  alter column semanas drop not null;

alter table public.rutinas
  alter column semanas drop default;
