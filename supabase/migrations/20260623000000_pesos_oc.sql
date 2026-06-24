create table if not exists pesos_cliente (
  nombre_cliente   text primary key,
  peso_admin       smallint not null default 1 check (peso_admin between 1 and 4),
  peso_almacen     smallint not null default 1 check (peso_almacen between 1 and 4),
  peso_preparacion smallint not null default 1 check (peso_preparacion between 1 and 4),
  peso_embarque    smallint not null default 1 check (peso_embarque between 1 and 4),
  peso_me          smallint not null default 1 check (peso_me between 1 and 4),
  peso_fletes      smallint not null default 1 check (peso_fletes between 1 and 4)
);

comment on table pesos_cliente is 'Pesos 1-4 por área para cada cliente — todas las OCs del cliente heredan estos pesos al calcular costos unitarios';

alter table pesos_cliente enable row level security;

create policy "anon_read_pesos_cliente"   on pesos_cliente for select using (true);
create policy "anon_insert_pesos_cliente" on pesos_cliente for insert with check (true);
create policy "anon_update_pesos_cliente" on pesos_cliente for update using (true);
