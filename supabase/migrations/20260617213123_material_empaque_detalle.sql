create table if not exists material_empaque_detalle (
  id               bigint generated always as identity primary key,
  folio            integer       not null,
  cuenta_cliente   text          not null default '',
  nombre_cliente   text          not null default '',
  fecha            date,
  codigo_articulo  text          not null default '',
  nombre_articulo  text          not null default '',
  configuracion    text          not null default '',
  tamano           text          not null default '',
  cantidad         numeric(12,4) not null default 0,
  precio_costo     numeric(12,4) not null default 0,
  importe_costo    numeric(14,2) not null default 0,
  mes              text          not null,
  cliente_agrupado text          not null default ''
);

create index if not exists idx_me_mes     on material_empaque_detalle (mes);
create index if not exists idx_me_cliente on material_empaque_detalle (nombre_cliente);
create index if not exists idx_me_folio   on material_empaque_detalle (folio);

comment on table material_empaque_detalle is 'Detalle de material de empaque comprado por folio y artículo';
