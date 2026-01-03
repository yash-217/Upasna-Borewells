# Changelog

## [Unreleased]

## [0.1.0] - 2026-01-03

### Changes

1. Updated vehicles database
2. Added versioning

### Refactor
- **State Management**: Migrated data fetching from `useEffect` to `@tanstack/react-query` in `App.tsx` for better caching, background updates, and cleaner code.
- **Environment Variables**: Updated `vite.config.ts` to remove unused `loadEnv` and standardized usage of `import.meta.env` in `services/supabase.ts`.
- **Type Safety**: Removed `any` usages in `services/supabase.ts`, replacing them with strict `DBProduct`, `DBServiceRequest`, and `DBEmployee` interfaces. Added strict return types to data mapping functions.

### Performance
- **Code Splitting**: Implemented `React.lazy` and `Suspense` in `App.tsx` for route-based code splitting of `Dashboard`, `ServiceRequests`, `Inventory`, `Employees`, and `Expenses` components.
- **Build Optimization**: Added `manualChunks` to `vite.config.ts` to split large vendor libraries (`react`, `supabase-js`, `recharts`, `tesseract.js`, `lucide-react`) into separate chunks, resolving build size warnings.

### Fixes
- **Date Handling**: Updated `safeDateToDB` and `safeTimestampToDB` in `services/supabase.ts` to strictly parse dates (handling DD/MM/YYYY formats) and ensure all dates are stored as ISO-8601 strings to prevent "date out of range" errors.
