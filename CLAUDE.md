# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server with HMR
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint with TypeScript-ESLint
npm run preview      # Preview production build locally

# Database seeding (requires SUPABASE_SERVICE_ROLE_KEY in .env)
npm run seed         # Seed all tables
npm run seed:plantilla
npm run seed:nomina
npm run seed:ventas
npm run seed:fletes
npm run seed:me
```

There is no test runner configured. Type checking runs as part of `npm run build`.

## Tech Stack

- **Frontend**: React 19 + TypeScript, Vite, TailwindCSS 4, shadcn/ui (Radix UI), Recharts
- **Backend**: Supabase (PostgreSQL + Row-Level Security)
- **Icons**: Lucide React

Path alias `@/*` maps to `src/*` (configured in `vite.config.ts` and `tsconfig.json`).

## Architecture

This is a cost-analysis BI dashboard for a textile/packaging operation. It computes **unit costs per product/client** by merging payroll, sales, logistics, and packaging data.

### Data flow

```
CSV files (src/database/)
    ↓ (seeded via supabase/seeds/)
Supabase tables
    ↓
Services (src/services/)          ← fetch from Supabase, CSV fallback if unavailable
    ↓
Custom hooks (src/hooks/)         ← async state management, memoized calculations
    ↓
Dashboard components              ← tabbed UI, charts, tables
```

All services implement **graceful CSV fallback**: if Supabase is unavailable, they parse the local CSV files in `src/database/`.

### Key directories

| Path | Purpose |
|---|---|
| `src/components/` | Dashboard tabs and UI components |
| `src/features/configuracion/` | Plantilla CRUD feature (staff management) |
| `src/services/` | `nominaService` (payroll), `ventasService` (sales) |
| `src/hooks/` | `useNominaData`, `useSalesData`, `usePagination` |
| `src/types/` | `nomina.ts` (Seccion, PlantillaRow, DetalleRow), `ventas.ts` (SalesRow) |
| `src/lib/` | `supabase.ts` (client init), `csv.ts` (parser), `format.ts`, `utils.ts` |
| `src/database/` | Source CSV files (nomina, ventas, fletes, material_empaque, etc.) |
| `supabase/migrations/` | SQL schema + RLS policies |
| `supabase/seeds/` | TypeScript seeders (idempotent — truncate then insert) |

### Dashboard tabs

`Dashboard.tsx` is the root tabbed interface with 7 sections: **Resumen, Administración, Almacén, Preparación, Embarque, Material de Empaque, Fletes**. Each tab is its own dashboard component consuming a dedicated hook.

### Domain concepts

- **Secciones**: Administración, Almacén, Preparación, Embarques (cost centers)
- **Plantilla**: Staff configuration table — central to cost calculations
- **Time period**: January–April 2026

## Environment Variables

Create a `.env` file (see `.env.example`):

```
VITE_SUPABASE_URL=           # Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY=  # Anon/publishable key (safe for client)
SUPABASE_SERVICE_ROLE_KEY=   # Service role key — seeds only, never expose client-side
```

## Database

Migrations live in `supabase/migrations/` and must be applied via `supabase db push` or the Supabase dashboard. RLS is enabled on all tables; anon key has public read access; writes require the service role key.

Seeds read from CSV files in `src/database/`, truncate the target table, then bulk-insert. Running `npm run seed` is safe to repeat.

## Adding shadcn Components

The MCP server for shadcn is configured. Use it to add new components, which will be placed in `src/components/ui/`.
