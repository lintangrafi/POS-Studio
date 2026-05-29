# Project Structure

```
src/
├── actions/          # Server Actions (business logic layer)
│   ├── auth-actions.ts
│   ├── admin-actions.ts
│   ├── pos-actions.ts
│   ├── shift-actions.ts
│   ├── inventory-actions.ts
│   ├── invoice-actions.ts
│   ├── expense-actions.ts
│   ├── report-actions.ts
│   └── store-actions.ts    # Store customization (name, theme)
├── app/              # Next.js App Router pages
│   ├── (auth)/       # Public routes (login)
│   ├── (dashboard)/  # Protected routes with sidebar layout
│   │   ├── dashboard/
│   │   ├── inventory/
│   │   ├── invoices/
│   │   ├── pos/
│   │   ├── reports/
│   │   ├── settings/
│   │   │   ├── page.tsx         # User management
│   │   │   └── customize/       # Store branding & theme
│   │   └── shift/
│   ├── layout.tsx    # Root layout (Inter font, metadata)
│   └── globals.css   # Tailwind imports and base styles
├── components/
│   ├── layout/       # App shell components (Sidebar)
│   ├── pos/          # POS-specific components (CartPanel, CheckoutDialog, ProductGrid)
│   └── ui/           # Reusable UI primitives (button, card, input, badge)
├── db/
│   ├── index.ts      # Database connection (drizzle + postgres.js → Supabase)
│   └── schema.ts     # Drizzle schema definitions and relations
├── lib/
│   ├── auth.ts       # JWT session management (encrypt, decrypt, requireAuth)
│   ├── themes.ts     # Theme color definitions for customization
│   └── utils.ts      # Shared utilities (cn, formatCurrency, formatDate, etc.)
├── middleware.ts     # Route protection and role-based access control
└── store/
    └── use-pos-store.ts  # Zustand store for POS cart state (persisted to localStorage)
scripts/
└── seed.ts           # Database seeding script
```

## Conventions

- **Server Actions**: All data mutations go through `src/actions/`. Each file groups related actions by domain. Actions use `'use server'` directive and call `requireAuth()` or `requireAdmin()` for access control.
- **Route Groups**: `(auth)` for public pages, `(dashboard)` for authenticated pages with the sidebar layout.
- **Components**: Domain-specific components live in named folders (`pos/`, `layout/`). Generic reusable components go in `ui/`.
- **Database**: Single schema file with all tables, enums, and relations. Use Drizzle's query builder and relational queries. Connected to Supabase PostgreSQL.
- **State**: Client-side state uses Zustand stores in `src/store/` with localStorage persistence. Server state is fetched via server actions or server components.
- **Error Handling**: Server actions return `{ error: string }` on failure or `{ success: true, ...data }` on success — no thrown exceptions to the client.
- **Naming**: Files use kebab-case. React components use PascalCase. Zustand stores are prefixed with `use-`.
- **Customization**: Store name, subtitle, logo initial, and theme color are stored in `store_settings` table and rendered dynamically across the app.
