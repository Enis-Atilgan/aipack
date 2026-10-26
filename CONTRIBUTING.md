# Contributing to PackAI

First off, thank you for considering contributing to PackAI! We welcome bug fixes, documentation improvements, new client exporters, and framework ingestion adapters.

## Architecture Overview

PackAI is structured as an npm workspaces monorepo:

```
aipack/
├── cli/                   # Node.js CLI & compiler engine (`packai`)
│   ├── bin/packai.js      # CLI entrypoint
│   ├── src/commands/      # init, validate, apply, clean, diff, pack, unpack, run, info
│   ├── src/exporters/     # Target translators (Claude, Cursor, Windsurf, Copilot, Roo, Plugins)
│   ├── src/schema/        # JSON Schema for packai.yaml manifests
│   ├── src/utils/         # Pre-flight audit, credentials/keychain, lockfile, security
│   └── test/              # Native node:test integration and battle tests
│
├── marketplace/           # Next.js 16 Web Portal & Registry Explorer
│   ├── src/app/           # Next.js App Router
│   └── supabase/          # Database schema & RLS policies
│
└── docs/                  # Format specifications and design records
```

## Prerequisites

- **Node.js**: `>= 18.0.0`
- **npm**: `>= 9.0.0`
- Optional: `uv` or `python3` (for testing Python black-box runtime execution)

## Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/Enis-Atilgan/aipack.git
cd aipack

# 2. Install workspace dependencies
npm install

# 3. Link CLI locally for development
cd cli
npm link

# Now `packai` points to your local working tree
packai --version
```

## Running Tests

PackAI uses Node.js's built-in test runner (`node:test`). Tests run fast without third-party test runners:

```bash
# From repository root:
npm test

# Or directly inside cli/:
cd cli
npm test
```

All 41+ core integration and battle tests must pass before submitting a pull request.

## Adding a New Target Client Exporter

To add support for a new AI IDE or agent client:
1. Create a new exporter file in `cli/src/exporters/<client-name>.js`.
2. Implement your exporter function accepting `(manifest, dir, options)` and returning an object with the written paths and contents.
3. Wire your exporter into `cli/src/commands/apply.js` (for provisioning) and `cli/src/commands/clean.js` (for atomic de-provisioning).
4. Add a test suite verifying injection and cleanup in `cli/test/exporters.test.js`.

## Code Style & Standards

- ESM modules only (`import`/`export`).
- No unnecessary external dependencies. Prefer Node.js native APIs (`fs`, `path`, `os`, `child_process`).
- All file modifications must be atomic and reversibly tracked via `.packai/lock.json`.
- Security first: Validate all file paths to prevent Zip-Slip / path traversal attacks.

## Submitting a Pull Request

1. Fork the repo and create your feature branch: `git checkout -b feat/my-new-feature`.
2. Commit your changes with conventional commit messages: `git commit -m "feat(exporters): add Zed agent instructions exporter"`.
3. Ensure `npm test` passes cleanly.
4. Push to your branch and open a Pull Request.
