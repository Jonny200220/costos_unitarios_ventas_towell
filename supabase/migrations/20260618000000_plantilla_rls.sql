-- Habilita el CRUD de plantilla desde el navegador (publishable/anon key).
-- La app es una herramienta interna sin autenticación, por lo que se permite
-- acceso total al rol anon. Si en el futuro se agrega Supabase Auth, sustituir
-- esta política por using (auth.role() = 'authenticated').

alter table plantilla enable row level security;

drop policy if exists "plantilla_anon_all" on plantilla;
create policy "plantilla_anon_all" on plantilla
  for all
  to anon, authenticated
  using (true)
  with check (true);
