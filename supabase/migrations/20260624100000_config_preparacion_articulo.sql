create table if not exists config_preparacion_articulo (
  nombre_cliente     text     not null,
  nombre_articulo    text     not null,
  tamano             text     not null,
  peso_preparacion   smallint not null default 1 check (peso_preparacion between 1 and 4),
  tiempo_preparacion numeric(8,2) not null default 1,
  primary key (nombre_cliente, nombre_articulo, tamano)
);

alter table config_preparacion_articulo enable row level security;

create policy "anon read" on config_preparacion_articulo
  for select using (true);

create policy "service write" on config_preparacion_articulo
  for all using (auth.role() = 'service_role');
