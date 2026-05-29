# Tech Stack

## Core

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL via Supabase (connection pooling with `postgres.js` driver)
- **ORM**: Drizzle ORM with drizzle-kit for migrations
- **Auth**: Custom JWT-based sessions using `jose`, stored in httpOnly cookies (12h expiry)
- **State Management**: Zustand with localStorage persistence (client-side POS cart state)
- **Styling**: Tailwind CSS v4 with `tailwind-merge` and `clsx` via `cn()` utility

## UI Libraries

- Radix UI primitives (dialog, dropdown-menu, select, tabs, toast, avatar, label, separator, slot)
- Lucide React for icons
- class-variance-authority (CVA) for component variants

## Key Libraries

- `bcryptjs` — password hashing
- `date-fns` — date manipulation
- `jose` — JWT signing/verification

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema changes to Supabase database |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:studio` | Open Drizzle Studio (DB GUI) |
| `npm run db:seed` | Seed database with initial data |

## Configuration

- Path alias: `@/*` maps to `./src/*`
- Server Actions body size limit: 2MB
- Drizzle config: schema at `./src/db/schema.ts`, migrations output to `./migrations`
- Database URL provided via `DATABASE_URL` env variable (Supabase connection string)
- Auth secret via `AUTH_SECRET` env variable (required in production)
- DB connection uses `prepare: false` for Supabase Transaction mode pooling
