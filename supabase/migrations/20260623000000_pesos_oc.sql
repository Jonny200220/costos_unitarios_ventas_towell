create table if not exists pesos_oc (
  orden_venta      text primary key,
  peso_admin       smallint not null default 1 check (peso_admin between 1 and 4),
  peso_almacen     smallint not null default 1 check (peso_almacen between 1 and 4),
  peso_preparacion smallint not null default 1 check (peso_preparacion between 1 and 4),
  peso_embarque    smallint not null default 1 check (peso_embarque between 1 and 4),
  peso_me          smallint not null default 1 check (peso_me between 1 and 4),
  peso_fletes      smallint not null default 1 check (peso_fletes between 1 and 4)
);

comment on table pesos_oc is 'Pesos 1-4 por área para cada orden de venta — controlan el prorrateo de costos de nómina, ME y fletes';

alter table pesos_oc enable row level security;

create policy "anon_read_pesos_oc"   on pesos_oc for select using (true);
create policy "anon_insert_pesos_oc" on pesos_oc for insert with check (true);
create policy "anon_update_pesos_oc" on pesos_oc for update using (true);
