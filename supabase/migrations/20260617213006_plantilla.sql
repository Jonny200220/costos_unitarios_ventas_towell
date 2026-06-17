create table if not exists plantilla (
  id             text          not null,
  anio           smallint      not null default 2026,
  seccion        text          not null,
  subseccion     text          not null default '',
  puesto         text          not null,
  sueldo_mensual numeric(12,2) not null default 0,
  tipo_pago      text          not null,

  primary key (id, anio),

  constraint chk_seccion check (seccion in ('Administración','Almacén','Preparación','Embarques')),
  constraint chk_tipo_pago check (tipo_pago in ('semanal','quincenal','mensual'))
);

comment on table plantilla is 'Plantilla de personal por sección y año fiscal';
comment on column plantilla.id is 'ID del empleado (ej. 001, 022)';
comment on column plantilla.anio is 'Año fiscal al que corresponde la plantilla';
comment on column plantilla.sueldo_mensual is 'Sueldo mensual bruto en MXN';
