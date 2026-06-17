create table if not exists ventas (
  id              bigint generated always as identity primary key,
  fecha           date          not null,
  mes             text          not null,
  nombre_cliente  text          not null default '',
  codigo_articulo text          not null default '',
  nombre_articulo text          not null default '',
  configuracion   text          not null default '',
  tamano          text          not null default '',
  color           text          not null default '',
  calidad         text          not null default '',
  empresa         text          not null default '',
  tipo_pedido     text          not null default '',
  cantidad        integer       not null default 0,
  peso_std        numeric(14,6) not null default 0,
  importe         numeric(14,2) not null default 0,
  monto_me        numeric(14,6) not null default 0,
  monto_fle       numeric(14,6) not null default 0,
  monto_myo       numeric(14,6) not null default 0
);

create index if not exists idx_ventas_mes      on ventas (mes);
create index if not exists idx_ventas_cliente  on ventas (nombre_cliente);
create index if not exists idx_ventas_articulo on ventas (codigo_articulo);
create index if not exists idx_ventas_fecha    on ventas (fecha);

comment on table ventas is 'Base de ventas por línea de pedido';
comment on column ventas.peso_std  is 'Peso estándar en kg';
comment on column ventas.monto_me  is 'Monto asignado de material de empaque';
comment on column ventas.monto_fle is 'Monto asignado de flete';
comment on column ventas.monto_myo is 'Monto asignado de maniobras y otros';
