# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dfficial Documentation First
When making all features, do not implement them directly, but rather, after reading the official documentation, implement them according to the official recommendations. For example, when preparing to use a certain feature of Qwik for implementation,


## Development Commands

- `bun run dev` - Start development server on http://localhost:5173
- `bun run build` - Build for production
- `bun run fmt` - Format code with Biome (run this before committing)
- `bun run lint` - Run lint (run this before committing)

**IMPORTANT**: After making any code changes, always run:
1. `bun run fmt` - Format the code
2. `bun run lint` - Verify no linting or type errors
3. After all logic implementations are finished, corresponding playwright tests should be written, and after confirming the completion of a certain function's implementation, call "bun run test" to test whether all functions have been implemented correctly.


## Best practices
When planning to add new pages or features, and finding that there are no implementation examples in this codebase for reference, one should first check the Qwik documentation to confirm that the way we intend to implement the code adheres to the official best practice recommendations.


## Tests
Do not use `bun run dev` to attempt to start the service; this is a long-running service, which will cause your session to time out without results. If testing is needed, please write Playwright test cases.
Do not skip test cases arbitrarily using ".skip". If it is determined that the test case is no longer needed, delete the test case. If the test case does not align with our expected testing objectives, then adjust it. If the test case is consistent with our expected objectives, then keep the test case enabled. When a test case fails, we should address the failure, rather than skipping the test case.


### Key Directories

- `src/routes/` - Qwik App Router pages and layouts
- `src/components/` - Reusable UI components
- `src/utils/` - Types and utilities
- `src/server/` - Server-side code
- `prisma/` - Prisma schema and migrations
- `public/` - Public assets

### Styling

Uses Tailwind CSS v4. Dark mode support is implemented via CSS custom properties in the root layout.

## MCP Tools

- **Context7 MCP** - Use to fetch updated documentation for libraries and frameworks like Qwik, Tailwind CSS
