# Supabase — Migraciones y Seeds

## Estructura

```
supabase/
├── migrations/          # DDL: creación de tablas
│   ├── 20260617_001_plantilla.sql
│   ├── 20260617_002_nomina_detalle.sql
│   ├── 20260617_003_ventas.sql
│   ├── 20260617_004_fletes.sql
│   └── 20260617_005_material_empaque.sql
└── seeds/               # Scripts de carga de datos desde CSV
    ├── seed_all.ts           ← punto de entrada (corre todos)
    ├── seed_plantilla.ts
    ├── seed_nomina_detalle.ts
    ├── seed_ventas.ts
    ├── seed_fletes.ts
    └── seed_material_empaque.ts
```

## 1. Crear las tablas en Supabase

Ve a **Supabase Dashboard → SQL Editor** y ejecuta cada archivo de `migrations/` en orden numérico:

1. `20260617_001_plantilla.sql`
2. `20260617_002_nomina_detalle.sql`
3. `20260617_003_ventas.sql`
4. `20260617_004_fletes.sql`
5. `20260617_005_material_empaque.sql`

O bien, si tienes la CLI de Supabase:
```bash
supabase db push
```

## 2. Cargar los datos (seed)

Asegúrate de que `.env` tenga:
```
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<tu-key>
```

Luego ejecuta:
```bash
# Cargar todo en orden
npx tsx supabase/seeds/seed_all.ts

# O individualmente
npx tsx supabase/seeds/seed_plantilla.ts
npx tsx supabase/seeds/seed_nomina_detalle.ts
npx tsx supabase/seeds/seed_ventas.ts
npx tsx supabase/seeds/seed_fletes.ts
npx tsx supabase/seeds/seed_material_empaque.ts
```

> Los seeds leen las variables del `.env` automáticamente. 
> Asegúrate de que `dotenv` esté disponible o exporta las variables al shell.

## 3. Tablas creadas

| Tabla | Fuente CSV | Registros aprox. |
|---|---|---|
| `plantilla` | `nomina_plantilla.csv` | ~39 |
| `nomina_detalle` | `nomina_detalle.csv` | ~600 |
| `ventas` | `base_ventas_ene_abr_26.csv` | ~45,000 |
| `fletes_embarques` | `fletes_embarques.csv` | ~300 |
| `material_empaque_detalle` | `material_empaque_detalle.csv` | ~2,000 |

## Próximo paso

Una vez que las tablas estén pobladas, actualizar `src/services/nominaService.ts` y `src/services/ventasService.ts` para que hagan queries a Supabase en vez de leer los CSV locales.
