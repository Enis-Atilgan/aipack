#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initCommand } from '../src/commands/init.js';
import { validateCommand } from '../src/commands/validate.js';
import { exportCommand } from '../src/commands/export.js';
import { packCommand } from '../src/commands/pack.js';
import { unpackCommand } from '../src/commands/unpack.js';
import { applyCommand } from '../src/commands/apply.js';
import { diffCommand } from '../src/commands/diff.js';
import { cleanCommand } from '../src/commands/clean.js';
import { infoCommand } from '../src/commands/info.js';
import { runCommand } from '../src/commands/run.js';
import { listCommand } from '../src/commands/list.js';
import { traceCommand } from '../src/commands/trace.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

const program = new Command();

program
  .name('packai')
  .description('PackAI: Standards-first bundle, pre-flight provisioning & cross-client distribution layer')
  .version(pkg.version);

program
  .command('init [name]')
  .description('Create a new pack skeleton, or reverse-engineer an existing workspace setup')
  .option('-l, --level <level>', 'Pack level: simple, enhanced, system', 'simple')
  .option('-c, --category <category>', 'Pack category', 'coding')
  .option('--from-existing [dir]', 'Scan and ingest existing workspace (.claude/, .cursor/, AGENTS.md, mcp.json)')
  .action(initCommand);

program
  .command('validate [path]')
  .description('Validate a PackAI manifest (packai.yaml or manifest.json) and standard companion files')
  .action(validateCommand);

program
  .command('export [path]')
  .description('Export pack to a target platform or generate plugin manifests')
  .requiredOption('-t, --target <platform>', 'Target platform: cursor, claude, chatgpt, agentsmd, windsurf, roo, plugins')
  .option('-o, --output <path>', 'Output file or directory path')
  .action(exportCommand);

program
  .command('pack [path]')
  .description('Package directory into .packai bundle archive')
  .option('-o, --output <file>', 'Output file path')
  .action(packCommand);

program
  .command('unpack <file>')
  .description('Unpack .packai (or .aipack) file into directory')
  .option('-o, --output <dir>', 'Output directory')
  .action(unpackCommand);

program
  .command('apply [path]')
  .alias('install')
  .alias('i')
  .description('Audit pre-flight requirements and provision agent system into target clients (alias: install, i)')
  .option('-t, --target <client>', 'Target client: all, claude, cursor, copilot, agentsmd, windsurf, roo', 'all')
  .option('-c, --cwd <dir>', 'Target project directory to provision', '.')
  .option('-i, --interactive', 'Interactively prompt for missing secrets and save to OS Keychain')
  .option('--auto-install', 'Attempt automatic installation of missing dependencies via package manager')
  .option('--auto-start', 'Attempt to automatically start inactive background services')
  .option('-f, --force', 'Force provisioning even if platform checks warn')
  .action(applyCommand);

program
  .command('diff [path]')
  .description('Visual non-destructive preview of changes and client capability audit before applying')
  .option('-t, --target <client>', 'Target client: all, claude, cursor, copilot, agentsmd, windsurf, roo', 'all')
  .option('-c, --cwd <dir>', 'Target project directory to inspect', '.')
  .action(diffCommand);

program
  .command('clean [path]')
  .alias('uninstall')
  .alias('un')
  .description('Safely remove provisioned agent files and prune MCP configs (alias: uninstall, un)')
  .option('-t, --target <client>', 'Target client: all, claude, cursor, copilot, agentsmd, windsurf, roo', 'all')
  .option('-c, --cwd <dir>', 'Target project directory to clean', '.')
  .option('-f, --force', 'Force removal of modified root config files')
  .action(cleanCommand);

program
  .command('info [path]')
  .description('Inspect detailed dossier of a .packai archive or pack directory')
  .action(infoCommand);

program
  .command('run [target]')
  .description('Audit pre-flight requirements and launch standalone framework execution runner')
  .option('-c, --cwd <dir>', 'Working directory')
  .option('-f, --force', 'Force execution even if platform/binary checks warn')
  .action(runCommand);

program
  .command('list [path]')
  .alias('ls')
  .description('List all PackAI packs currently installed in the workspace (alias: ls)')
  .option('-c, --cwd <dir>', 'Project directory to inspect', '.')
  .action(listCommand);

program
  .command('trace [path]')
  .description('Forensic inspection of files to extract invisible zero-width leak tracking signatures')
  .action(traceCommand);

program.parse();
