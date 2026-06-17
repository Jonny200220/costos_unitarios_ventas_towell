create table if not exists fletes_embarques (
  id                bigint generated always as identity primary key,
  folio             text          not null unique,
  proveedor         text          not null default '',
  cliente           text          not null default '',
  vehiculo          text          not null default '',
  destino           text          not null default '',
  fecha_envio       date,
  hora_carga        time,
  prioridad         smallint      not null default 0,
  precio_flete      numeric(12,2) not null default 0,
  importe_otros     numeric(12,2) not null default 0,
  importe_agregados numeric(12,2) not null default 0,
  importe_total     numeric(12,2) not null default 0,
  flete             numeric(12,2) not null default 0,
  maniobras_y_otros numeric(12,2) not null default 0,
  mes               text          not null
);

create index if not exists idx_fletes_mes     on fletes_embarques (mes);
create index if not exists idx_fletes_cliente on fletes_embarques (cliente);

comment on table fletes_embarques is 'Detalle de embarques: fletes y maniobras por folio';
comment on column fletes_embarques.flete             is 'Costo puro del flete';
comment on column fletes_embarques.maniobras_y_otros is 'Maniobras y cargos adicionales';
