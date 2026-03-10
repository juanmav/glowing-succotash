# CLAUDE.md

## Project Overview

Chrome extension + Express backend that extracts car listing data from webpages using Claude AI. Users can review/edit extracted data and push it to a configurable API endpoint. Also supports auto-filling loan application forms.

**Monorepo with npm workspaces:** `backend/` and `extension/`.

## Quick Reference

```bash
# Install all dependencies (from root)
npm install

# Build everything
npm run build

# Dev mode
npm run dev:backend       # Backend with tsx watch
npm run dev:extension     # Extension with Vite watch

# Type checking
cd backend && npm run typecheck
cd extension && npm run typecheck
```

### Backend

- Express server on port 3000 (configurable via PORT env var)
- Requires `ANTHROPIC_API_KEY` in `backend/.env` (see `.env.example`)
- Endpoints: `POST /extract`, `GET /health`, `GET /cars`, `POST /fill-loan-form`

### Extension

- Chrome Manifest V3, built with Vite to `extension/dist/`
- Load unpacked from `extension/dist/` in `chrome://extensions`
- `npm run zip` to bundle for distribution

## Architecture

- **backend/src/index.ts** — Express server entry point
- **backend/src/extractCarData.ts** — Claude API call for car data extraction
- **backend/src/fillLoanForm.ts** — Claude API call for loan form commands
- **backend/src/carRepository.ts** — Sample car inventory
- **backend/src/types.ts** — Shared TypeScript interfaces
- **extension/src/popup/App.tsx** — Main popup UI (state machine)
- **extension/src/background/service-worker.ts** — Message hub, API calls
- **extension/src/content/content-script.ts** — Page HTML capture + DOM interaction
- **extension/src/utils/storage.ts** — Chrome storage wrapper
- **extension/src/types/** — Shared types (car.ts, loan.ts, messages.ts)

## Code Conventions

- **TypeScript strict mode** in both packages
- **Naming:** camelCase functions, PascalCase interfaces/components, UPPER_SNAKE_CASE constants
- **Error handling:** try-catch with `err instanceof Error ? err.message : String(err)`
- **API responses:** `{ success: boolean, data?: T, error?: string }` pattern
- **Claude model:** `claude-haiku-4-5-20251001` via `@anthropic-ai/sdk`
- No test framework, linter, or CI configured yet
