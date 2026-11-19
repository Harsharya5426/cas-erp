# CAS ERP Design System Specification (`03_UI_UX_PRD.md`)

## 1. Visual Tokens & Theming (`apps/web/src/index.css`)
- **Themes**: `dark`, `light`, and `system` (automatic `prefers-color-scheme` listener), persisted per user via `PATCH /api/v1/auth/me/preferences`.
- **Palette**:
  - Maritime Cerulean / Teal baseline: `--palette-cyan: #88CCF1`, `--palette-ice: #C1DFF0`, `--palette-steel: #3587A4`, `--palette-ocean: #2D848A`, `--palette-jade: #2D898B`
  - User-selectable accessible accent swatches (`#3587A4`, `#2D898B`, `#2563EB`, `#0F766E`, `#6D28D9`)
  - Semantic status tokens: `--success`, `--warning`, `--danger`, `--info` with dedicated high-contrast borders and backgrounds.
- **Typography**: `Plus Jakarta Sans`, `Inter`, `Noto Sans Devanagari` (Unicode-safe Hindi rendering), and `JetBrains Mono` for codes/PRNs/receipts.

## 2. Core UI Primitives (`apps/web/src/components/UiPrimitives.jsx`)
- **`PageHeader`**: Standardized title, subtitle, and right-aligned action group with directional entrance motion.
- **`StatCard`**: Keyboard-accessible KPI card (`role="button"`, `Enter`/`Space` handling when interactive) with `.kpi-grid` staggered reveal.
- **`StatusBadge`**: Unified semantic badge mapping (`paid`/`approved`/`verified` -> success, `pending`/`partial` -> warning, `overdue`/`rejected`/`revoked` -> danger).
- **`ErrorBanner` & `EmptyState`**: Accessible `role="alert"` retry banner and empty-state guidance card.

## 3. Navigation, Motion & Accessibility (WCAG 2.2 AA)
- **Skip Link & Focus**: `.skip-link` jumps directly to `#main-content`; universal `:focus-visible` cyan outline across all interactive elements.
- **Motion System**: Directional keyframes (`enterFromTop`, `enterFromBottom`, `enterFromLeft`, `enterFromRight`, `scaleInCenter`, `pageStageEnter`, `tableRowReveal`) automatically disabled/minimized under `@media (prefers-reduced-motion: reduce)`.
- **Responsive Breakpoints**: Desktop (`>=1024px` collapsible sidebar), Tablet (`<=1023px` slide-out drawer with backdrop), Mobile (`<=768px` & `<=580px` single-column grids and full-width modals).
- **Locale Rules**: Canonical codes stored in MongoDB independently of UI language (`en`/`hi`); dates rendered in `DD-MM-YYYY` (`Asia/Kolkata`) and currency in `₹ INR`.

