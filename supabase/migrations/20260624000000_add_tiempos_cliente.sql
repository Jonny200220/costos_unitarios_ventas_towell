-- Agrega columnas de tiempo (min/kg) por área a la tabla pesos_cliente.
-- Default 1.0 = neutro (todos los clientes cuestan igual en tiempo base).

alter table pesos_cliente
  add column if not exists tiempo_admin        numeric(8,2) not null default 1,
  add column if not exists tiempo_almacen      numeric(8,2) not null default 1,
  add column if not exists tiempo_preparacion  numeric(8,2) not null default 1,
  add column if not exists tiempo_embarque     numeric(8,2) not null default 1,
  add column if not exists tiempo_me           numeric(8,2) not null default 1,
  add column if not exists tiempo_fletes       numeric(8,2) not null default 1;
