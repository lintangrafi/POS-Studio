# Product Overview

POS Studio is a Point of Sale system designed for photo studios in Indonesia. It supports multiple independent studio businesses, each with their own branding and customization. It manages sales transactions, inventory, shift management, open bills (suspended transactions), expenses/incomes tracking, and reporting.

## Key Concepts

- **Multi-Studio**: Each deployment serves one studio business. The store name, logo, and theme are customizable via the Settings > Kustomisasi page.
- **Roles**: CASHIER, ADMIN, SUPERADMIN — cashiers only access the POS screen and shift; admins access dashboard, inventory, reports, invoices, and settings
- **Shifts**: Cashiers must open a shift before processing transactions; shifts track opening/closing cash and sales totals
- **Open Bills**: Suspended transactions that can collect a down payment and be closed later
- **Categories**: Products are grouped into STUDIO or FB (food & beverage) categories
- **Audit Logs**: All significant actions are logged for accountability
- **Themes**: 6 color themes available (indigo, emerald, rose, amber, violet, sky)

## Locale

- The application targets Indonesian users
- UI text and error messages are in Bahasa Indonesia
- Currency is IDR (Indonesian Rupiah), formatted with `id-ID` locale
- HTML lang is set to `id`

## Database

- Hosted on Supabase (PostgreSQL)
- Connected via `postgres.js` driver with Drizzle ORM
- Connection pooling uses Transaction mode (`prepare: false`)
