import { resolve } from 'path';
import chalk from 'chalk';
import { listInstalledPacks } from '../utils/lockfile.js';
import { log } from '../utils/logger.js';

export async function listCommand(path, options = {}) {
  const targetDir = resolve(path || options.cwd || '.');
  const packs = listInstalledPacks(targetDir);

  console.log();
  console.log(chalk.bold.cyan(`🐺 PackAI Installed Packs`));
  console.log(chalk.dim(`Directory: ${targetDir}`));
  console.log();

  if (packs.length === 0) {
    console.log(chalk.yellow(`  No PackAI packs currently installed in this directory.`));
    console.log(chalk.dim(`  To install a pack, run: ${chalk.green('packai apply <pack-name>')}`));
    console.log();
    return;
  }

  for (const pack of packs) {
    const levelBadge = pack.level === 'system'
      ? chalk.bgMagenta.black(` SYSTEM `)
      : pack.level === 'enhanced'
        ? chalk.bgBlue.black(` ENHANCED `)
        : chalk.bgGreen.black(` SIMPLE `);

    console.log(`  ${chalk.bold.white(pack.name)} ${chalk.dim(`(v${pack.version})`)} ${levelBadge}`);
    console.log(`  ${chalk.dim('├─ Applied:')} ${pack.applied_at}`);
    console.log(`  ${chalk.dim('├─ Target:')} ${pack.target_client}`);

    if (pack.files_created && pack.files_created.length > 0) {
      console.log(`  ${chalk.dim('├─ Files:')} ${pack.files_created.length} managed items (${pack.files_created.slice(0, 3).join(', ')}${pack.files_created.length > 3 ? '...' : ''})`);
    }

    if (pack.mcp_servers && pack.mcp_servers.length > 0) {
      console.log(`  ${chalk.dim('├─ MCP Servers:')} ${pack.mcp_servers.join(', ')}`);
    }

    if (pack.skills && pack.skills.length > 0) {
      console.log(`  ${chalk.dim('└─ Skills:')} ${pack.skills.join(', ')}`);
    } else {
      console.log(`  ${chalk.dim('└─ Status: Active')}`);
    }
    console.log();
  }

  log.dim(`Total installed: ${packs.length} pack${packs.length > 1 ? 's' : ''}`);
  console.log();
}
