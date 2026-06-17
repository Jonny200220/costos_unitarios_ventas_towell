create table if not exists nomina_detalle (
  id           bigint generated always as identity primary key,
  empleado_id  text          not null,
  anio         smallint      not null default 2026,
  seccion      text          not null,
  subseccion   text          not null default '',
  puesto       text          not null,
  mes          text          not null,
  periodo      text          not null,
  fecha_inicio date,
  fecha_fin    date,
  dias_lab     smallint      not null default 0,
  horas        smallint      not null default 0,
  sueldo_diario  numeric(12,4) not null default 0,
  pago_periodo   numeric(12,2) not null default 0,
  tipo_pago    text          not null,
  jornada      text          not null default '',

  constraint fk_empleado foreign key (empleado_id, anio)
    references plantilla (id, anio)
    on delete restrict,

  constraint chk_mes check (mes in ('Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'))
);

create index if not exists idx_nomina_detalle_seccion on nomina_detalle (seccion, mes, anio);
create index if not exists idx_nomina_detalle_empleado on nomina_detalle (empleado_id, anio);

comment on table nomina_detalle is 'Detalle de nómina por empleado, período y mes';
comment on column nomina_detalle.empleado_id is 'Referencia a plantilla.id';
comment on column nomina_detalle.periodo is 'Q1/Q2 = quincena, S1-S4 = semana, M1 = mensual';
