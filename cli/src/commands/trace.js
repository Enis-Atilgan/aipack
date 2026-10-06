import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
import chalk from 'chalk';
import { extractWatermark } from '../utils/watermark.js';
import { log } from '../utils/logger.js';

export async function traceCommand(targetPath, options = {}) {
  try {
    const fullPath = resolve(targetPath || '.');
    if (!existsSync(fullPath)) {
      log.error(`File or directory not found: ${fullPath}`);
      process.exit(1);
    }

    console.log();
    console.log(chalk.bold.cyan(`🐺 PackAI Traitor-Tracing Forensic Engine`));
    console.log(chalk.dim(`Scanning target: ${fullPath}`));
    console.log();

    const filesToScan = [];
    if (statSync(fullPath).isFile()) {
      filesToScan.push(fullPath);
    } else {
      const scanDir = (dir) => {
        const entries = readdirSync(dir, { withFileTypes: true });
        for (const ent of entries) {
          if (ent.name === 'node_modules' || ent.name === '.git') continue;
          const p = join(dir, ent.name);
          if (ent.isDirectory()) scanDir(p);
          else if (ent.isFile() && (ent.name.endsWith('.md') || ent.name.endsWith('.json') || ent.name.endsWith('.txt') || ent.name.endsWith('.cursorrules'))) {
            filesToScan.push(p);
          }
        }
      };
      scanDir(fullPath);
    }

    let foundCount = 0;
    for (const file of filesToScan) {
      try {
        const content = readFileSync(file, 'utf-8');
        const watermark = extractWatermark(content);
        if (watermark) {
          foundCount++;
          console.log(chalk.bold.green(`  [WATERMARK IDENTIFIED] ${chalk.white(file)}`));
          console.log(`    ${chalk.yellow('Signature Payload:')} ${chalk.bold.cyan(watermark)}`);
        }
      } catch {}
    }

    console.log();
    if (foundCount > 0) {
      log.success(`Forensic analysis complete. Traced ${foundCount} watermarked artifact(s).`);
    } else {
      log.info('No zero-width watermark signatures detected.');
    }
    console.log();

  } catch (err) {
    log.error(`Forensic trace error: ${err.message}`);
    process.exit(1);
  }
}
