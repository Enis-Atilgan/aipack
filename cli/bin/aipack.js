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

program.parse();
