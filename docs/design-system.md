# Wealth Expert Design System

This is the local design system for the Wealth Expert web app, also referred to in product notes and sketches as Wealth Coach. It uses the attached Personeel.com design-system bundle as the visual baseline: Montserrat headings, Open Sans body copy, orange primary action color, pill controls, high-clarity neutral surfaces and glass-panel primitives.

## Brand Principles

- Serious, calm, founder-grade and financially precise.
- Built for repeated desktop use, not consumer budgeting entertainment.
- Every view should make account, entity, category and liquidity context obvious.
- Use restraint: low visual noise, clear hierarchy, strong tables, purposeful charts.
- Follow the sketch language where it helps product clarity: thick borders, active sidebar states, pill filters, handoff-like data density and visible "needs attention" actions.
- Avoid crypto-bro styling, gamified language, oversized marketing layouts and decorative gradients.

## Typography

- Heading font: Montserrat.
- Body font: Open Sans.
- Numeric data uses tabular numerals with `font-variant-numeric: tabular-nums`.
- Page titles: 28-34px, semibold, tight but readable line height.
- Section headings: 16-20px, semibold.
- Table text: 13-14px.
- Helper text: 12-13px, muted neutral.
- Do not use negative letter spacing.

## Spacing Scale

- 4px: tight icon gaps and compact table affordances.
- 8px: default inline gaps and small padding.
- 12px: dense control padding.
- 16px: card padding on dense screens.
- 24px: section gaps and page gutters.
- 32px: major dashboard groups.
- 48px: rare large separation only on overview pages.

## Border Radius

- 4px: table inputs, tags and compact controls.
- 6px: buttons, filter chips and small panels.
- 8px: cards and repeated list items.
- 12px: page-level feature panels only when needed.
- Avoid pill-heavy interfaces except for status badges.

## Shadows

- Prefer borders over shadows.
- Card shadow: very subtle `0 1px 2px rgb(15 23 42 / 0.06)`.
- Elevated overlays: `0 16px 40px rgb(15 23 42 / 0.12)`.
- Never use dramatic glow effects.

## Colors

- Background: `#f6f5f5`.
- Surface: `rgba(255,255,255,0.72)`.
- Surface muted: `#faf7f2`.
- Border / ink: `#171717`.
- Text strong: `#0a0a0a`.
- Text body: `#333333`.
- Text muted: `#656565`.
- Accent / primary: `#fd5e2d`.
- Accent hover: `#e5532a`.
- Accent soft: `#ffe7dc`.
- Success: `#16a34a`.
- Critical: `#c0392b`.
- Warning: `#b7791f`.
- Info: `#2563eb`.

## Semantic States

- Healthy sync: accent green badge.
- Warning sync or stale data: amber badge.
- Error sync: red badge with concise cause.
- Uncategorised: neutral badge with stronger border.
- Internal transfer: blue-gray badge.
- Illiquid: muted slate badge.
- Liquid: green-soft badge.

## Charts

- Charts must have one primary analytical purpose.
- Always show currency units or percentage units.
- Use account/entity labels in tooltips.
- Prefer line charts for trends, bar charts for comparisons, stacked bars only for composition.
- Keep chart palettes restrained and distinct: accent green, slate, blue, amber and red.
- Legends should be visible but compact.

## Card Patterns

- Cards use 8px radius, 1px border, white surface.
- KPI cards include label, value, context, optional delta.
- Avoid cards inside cards.
- Dense analytical pages can use cards for KPIs and then unframed charts/tables below.

## Table Patterns

- Tables are central to the product.
- Use sticky headers for long lists where practical.
- Keep account, entity, category and liquidity columns visible.
- Align money right.
- Use tabular numbers.
- Rows should support compact scanning, hover state and selected state.

## Filter Bars

- Filter bars are sticky on data-heavy screens when useful.
- Controls should be compact and grouped by purpose.
- Date, account, entity, category and liquidity filters are first-class.
- Prefer segmented controls for analytical modes such as liquid/all/illiquid.

## Tab Navigation

- Tabs separate analytical purposes, not decorative sections.
- Use direct labels: Trend, Category, Account, Entity, Detail.
- Keep tab content focused on one chart/table combination.

## Forms

- Labels are short and explicit.
- Financial inputs require currency or percentage context.
- Manual valuation forms must show date, source, value and note.
- Validation errors are inline and practical.

## Empty States

- Empty states should explain what data is missing and where it normally comes from.
- Avoid playful illustration.
- Provide a direct action: connect provider, resync, add manual valuation or review uncategorised.

## Density Rules

- Dashboard: medium density with strong summary cards.
- Transactions: high density, table-first.
- Cashflow, Burn, Net Worth and Rendement: KPI row, focused chart, detail table.
- Settings: grouped forms with compact explanatory helper text.

## Responsive Behavior

- Desktop-first with a fixed sidebar from 1024px upward.
- On tablets, sidebar can collapse into a top navigation pattern later.
- On mobile, cards stack, tables use horizontal scroll, and filters wrap.
- Preserve numeric readability over decorative spacing.

## Accessibility

- Maintain 4.5:1 contrast for body text.
- Do not rely on color alone for status.
- All icon buttons need accessible labels.
- Tables need semantic headers.
- Interactive focus states use a visible accent outline.
