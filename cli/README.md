# PackAI CLI (`packai`)

> The command-line interface, compiler, and provisioning engine for PackAI agent bundles.

## Installation

```bash
# Global installation
npm install -g packai

# Or run directly via npx
npx packai --help
```

## Core Workflows

### 1. Reverse-engineer an existing workspace
```bash
packai init --from-existing
```
Automatically discovers `.claude/agents/*.md`, `.cursorrules`, `.cursor/rules/*.mdc`, `.roomodes`, `mcp.json`, and `skills/` to generate a standards-first bundle skeleton.

### 2. Package into a `.packai` container
```bash
packai pack ./my-pack --output dist/my-pack-1.0.0.packai
```

### 3. Non-destructive preview (`diff`)
```bash
packai diff ./my-pack --cwd /path/to/project
```

### 4. Turnkey provisioning (`apply`)
```bash
packai apply ./my-pack --cwd /path/to/project --auto-install
```
Performs pre-flight host audit, requests required credentials, and atomizes configurations into Claude Code, Cursor, Windsurf, Roo-Code, and Copilot.

### 5. Safe de-provisioning (`clean`)
```bash
packai clean ./my-pack --cwd /path/to/project
```
Prunes managed files cleanly using `.packai/lock.json` without modifying unrelated project files.

## Programmatic API / Testing

```bash
# Run CLI test suite
npm test
```

## License

[MIT](../LICENSE)
