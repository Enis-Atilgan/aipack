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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

const program = new Command();

program
  .name('aipack')
  .description('Universal AI system package format - CLI tool')
  .version(pkg.version);

program
  .command('init <name>')
  .description('Create a new aipack skeleton')
  .option('-l, --level <level>', 'Pack level: simple, enhanced, system', 'simple')
  .option('-c, --category <category>', 'Pack category', 'other')
  .action(initCommand);

program
  .command('validate [path]')
  .description('Validate an aipack manifest')
  .action(validateCommand);

program
  .command('export [path]')
  .description('Export pack to a target platform')
  .requiredOption('-t, --target <platform>', 'Target platform: cursor, claude, chatgpt')
  .option('-o, --output <file>', 'Output file path')
  .action(exportCommand);

program
  .command('pack [path]')
  .description('Package directory into .aipack file')
  .option('-o, --output <file>', 'Output file path')
  .action(packCommand);

program
  .command('unpack <file>')
  .description('Unpack .aipack file into directory')
  .option('-o, --output <dir>', 'Output directory')
  .action(unpackCommand);

program
  .command('apply [path]')
  .description('Audit pre-flight requirements and provision agent system into target clients')
  .option('-t, --target <client>', 'Target client: all, claude, cursor', 'all')
  .option('-c, --cwd <dir>', 'Target project directory to provision', '.')
  .option('--auto-install', 'Attempt automatic installation of missing dependencies via package manager')
  .option('--auto-start', 'Attempt to automatically start inactive background services')
  .option('-f, --force', 'Force provisioning even if platform checks warn')
  .action(applyCommand);

program
  .command('diff [path]')
  .description('Visual non-destructive preview of changes before applying')
  .option('-t, --target <client>', 'Target client: all, claude, cursor', 'all')
  .option('-c, --cwd <dir>', 'Target project directory to inspect', '.')
  .action(diffCommand);

program
  .command('clean [path]')
  .description('Safely remove provisioned agent files and prune MCP configs')
  .option('-t, --target <client>', 'Target client: all, claude, cursor', 'all')
  .option('-c, --cwd <dir>', 'Target project directory to clean', '.')
  .option('-f, --force', 'Force removal of modified root config files')
  .action(cleanCommand);

program
  .command('info [path]')
  .description('Inspect detailed dossier of an .aipack archive or pack directory')
  .action(infoCommand);

program.parse();
