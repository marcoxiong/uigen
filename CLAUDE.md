# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Commands

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run test` - Run tests with Vitest

### Database & Setup
- `npm run setup` - Full setup (install deps, generate Prisma client, run migrations)
- `npm run db:reset` - Reset database with force flag
- `npx prisma generate` - Regenerate Prisma client
- `npx prisma migrate dev` - Run database migrations

## Project Architecture

### Core Concept
UIGen is an AI-powered React component generator that uses a virtual file system - components are generated and edited in memory without writing to disk. The application combines real-time chat with Claude AI, live preview, and code editing capabilities.

### Key Systems

**Virtual File System**: All generated code exists in a `VirtualFileSystem` class (`src/lib/file-system.ts`), not on disk. File operations are handled through React context (`src/lib/contexts/file-system-context.tsx`) and serialized to/from the database.

**AI Integration**: Uses Anthropic Claude via Vercel AI SDK with custom tools (`str_replace_editor`, `file_manager`) that manipulate the virtual file system. Chat API endpoint is at `src/app/api/chat/route.ts`.

**Data Persistence**: SQLite database via Prisma with custom output directory (`src/generated/prisma`). Projects can be anonymous or user-owned. Messages and file system state are serialized as JSON in the database.

**Preview System**: Live React component preview using dynamic imports and Babel standalone for JSX transformation (`src/lib/transform/jsx-transformer.ts`).

### Project Structure
- `src/app/` - Next.js app router pages and API routes
- `src/components/` - React components organized by feature (chat, editor, preview, ui, auth)
- `src/lib/` - Core utilities, contexts, tools, and business logic
- `src/actions/` - Server actions for project CRUD operations
- `prisma/` - Database schema and migrations

### Testing
Uses Vitest with jsdom environment and React Testing Library. Test files are co-located in `__tests__` directories within each feature folder.

### Key Dependencies
- Next.js 15 with App Router and React 19
- Tailwind CSS v4 with Radix UI components
- Prisma with SQLite
- Anthropic Claude via AI SDK
- Monaco Editor for code editing
- Use comments sparingly, only comment complex code.