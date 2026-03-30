# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator. Users describe a component, and Claude generates it with live preview via an in-browser iframe. Components persist to a SQLite database for authenticated users.

## Commands

```bash
npm run setup        # First-time setup: install deps, generate Prisma client, run migrations
npm run dev          # Start dev server (Next.js with Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run all Vitest tests
npm run db:reset     # Reset SQLite database
```

Run a single test file:
```bash
npx vitest run src/components/chat/__tests__/MessageInput.test.tsx
```

## Environment

- `ANTHROPIC_API_KEY` in `.env` — optional. If unset, the app uses a **mock provider** that returns static example components. This allows development without an API key.
- `JWT_SECRET` defaults to `"development-secret-key"` — override in production.
- Database: SQLite at `prisma/dev.db`, managed via Prisma.

## Architecture

### AI Generation Flow

1. User sends a message in `ChatInterface.tsx`
2. `chat-context.tsx` sends the message + current virtual filesystem state to `POST /api/chat`
3. The API route (`src/app/api/chat/route.ts`) calls Claude Haiku 4.5 via Vercel AI SDK with two tools:
   - `str_replace_editor` — create/modify files using string replacement (`src/lib/tools/str-replace.ts`)
   - `file_manager` — rename/delete files (`src/lib/tools/file-manager.ts`)
4. Tool calls are streamed back to the client and applied to the **virtual filesystem**
5. `PreviewFrame.tsx` re-renders the preview by transforming the virtual filesystem into an iframe

### Virtual Filesystem (`src/lib/file-system.ts`)

All generated code lives in memory — nothing is written to disk. The `FileSystem` class supports create/read/replace/insert operations. It serializes to JSON for database storage (in the `Project.data` column) and transmission to the API route.

### Live Preview (`src/lib/transform/jsx-transformer.ts`)

Uses Babel standalone (in the browser) to transpile JSX → JS. Generates an import map pointing to `esm.sh` CDN for React 19 and other packages. The result is injected into a sandboxed iframe.

### Client State

Two React contexts:
- `chat-context.tsx` — manages message history, AI streaming, and coordinates filesystem updates
- `file-system-context.tsx` — manages the `FileSystem` instance and exposes file operations to components

### UI Layout (`src/app/main-content.tsx`)

Three-panel resizable layout:
- **Left (35%):** Chat interface
- **Right (65%):** Tabbed — Preview (iframe) | Code (file tree + Monaco editor)

### Authentication

JWT sessions (7-day expiry) stored in cookies, validated by `src/middleware.ts`. Passwords hashed with bcrypt. Anonymous users can generate components; their work is tracked via `anon-work-tracker.ts` and can be saved upon sign-up.

### Data Model

```
User  1──* Project
Project.messages  → JSON (chat history)
Project.data      → JSON (serialized virtual filesystem)
```

## Code Style

Use comments sparingly — only on complex or non-obvious code.

## Tech Stack

- **Framework:** Next.js 15 App Router, React 19, TypeScript (strict)
- **AI:** `@ai-sdk/anthropic`, Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)
- **Database:** Prisma + SQLite
- **UI:** Tailwind CSS v4, Radix UI, shadcn/ui
- **Editor:** Monaco Editor
- **Tests:** Vitest + Testing Library, jsdom environment
- **Path alias:** `@/*` → `./src/*`
