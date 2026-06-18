-- 1) Habilita lectura/escritura desde el navegador (publishable/anon key) en el resto
--    de las tablas, igual que plantilla. App interna sin autenticación; si más adelante
--    se agrega Supabase Auth, restringir con using (auth.role() = 'authenticated').

alter table nomina_detalle enable row level security;
drop policy if exists "nomina_detalle_anon_all" on nomina_detalle;
create policy "nomina_detalle_anon_all" on nomina_detalle
  for all to anon, authenticated using (true) with check (true);

alter table ventas enable row level security;
drop policy if exists "ventas_anon_all" on ventas;
create policy "ventas_anon_all" on ventas
  for all to anon, authenticated using (true) with check (true);

alter table fletes_embarques enable row level security;
drop policy if exists "fletes_embarques_anon_all" on fletes_embarques;
create policy "fletes_embarques_anon_all" on fletes_embarques
  for all to anon, authenticated using (true) with check (true);

alter table material_empaque_detalle enable row level security;
drop policy if exists "material_empaque_detalle_anon_all" on material_empaque_detalle;
create policy "material_empaque_detalle_anon_all" on material_empaque_detalle
  for all to anon, authenticated using (true) with check (true);

-- 2) cantidad puede ser fraccional (ventas por KG, p. ej. 70.55), no integer.
alter table ventas alter column cantidad type numeric(14,4) using cantidad::numeric;
