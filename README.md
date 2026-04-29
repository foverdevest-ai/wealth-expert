# Wealth Expert

Wealth Expert is a V1 single-user web app for a Dutch founder/investor. It is structured as a personal wealth operating system for spending insight, cashflow, burn, net worth, liquidity and investment performance across private, holding, UK LTD, Bitvavo, DEGIRO and manual property layers.

Product notes also refer to the app concept as Wealth Coach; the local app brand is Wealth Expert.

## Stack

- Next.js App Router with TypeScript
- Tailwind CSS
- Prisma with PostgreSQL schema
- Recharts for charts
- date-fns for period calculations
- Provider adapter abstraction for live-sync integrations
- Vitest for core financial logic tests

## Project Structure

- `src/app`: App Router pages and shell
- `src/components`: reusable app, UI and chart components
- `src/domain`: domain types and enums
- `src/server`: demo data and calculation services
- `src/providers`: provider adapter abstraction and demo adapters
- `prisma`: schema and seed script
- `docs`: design system and roadmap

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

Set `DATABASE_URL` to a PostgreSQL database URL before running Prisma commands.

```bash
npm run prisma:generate
npm run db:seed
```

The V1 UI currently reads from typed demo data in `src/server/demo-data.ts` so the app is immediately explorable while the persistent query layer is wired in.

## Test Coverage

```bash
npm run test
```

Tests cover net worth, burn, cashflow aggregation, internal transfer handling, performance calculations and provider mapping.

## V2

See `docs/TODO-v2.md`.
