# Decisions

## 2026-03-21

### Tailwind CSS over Bootstrap

Chosen because the project is expected to grow beyond a generic admin look and benefit from a more flexible design system over time.

### Agent documentation entry point

Created `AGENTS.md` as the top-level guide for coding agents and `.agentic/` as the home for durable project context, decisions, and planning notes.

### Manual Next.js scaffold before runtime setup

Created a Next.js App Router project structure with Tailwind CSS, TypeScript, route groups, and shared component areas directly in the repository.

This keeps momentum even though the current shell environment does not yet expose Node.js or npm, which are still needed before the app can be installed and run.

### Vitest as the first testing layer

Added Vitest with React Testing Library for the initial unit and component test setup.

This fits the current Next.js application shape well and gives fast feedback for reusable components and synchronous pages. End-to-end coverage can be added later for authentication and integration flows.
