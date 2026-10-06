import { existsSync, readdirSync, statSync, chmodSync } from 'fs';
import { resolve, basename, join } from 'path';
import os from 'os';
import { safeExtractZip } from '../utils/security.js';
import { log } from '../utils/logger.js';

function grantExecPermissions(dir) {
  if (os.platform() === 'win32') return;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = join(dir, ent.name);
      if (ent.isDirectory()) {
        grantExecPermissions(full);
      } else if (ent.isFile() && (ent.name.endsWith('.sh') || ent.name.endsWith('.bash') || ent.name.endsWith('.py'))) {
        try { chmodSync(full, 0o755); } catch {}
      }
    }
  } catch {}
}

export async function unpackCommand(file, options) {
  try {
    const filePath = resolve(file);

    if (!existsSync(filePath)) {
      log.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    const isPackai = filePath.endsWith('.packai');
    const isAipack = filePath.endsWith('.aipack');
    if (!isPackai && !isAipack) {
      log.warn('File does not have .packai or .aipack extension.');
    }

    const name = basename(filePath).replace(/\.(packai|aipack|zip)$/, '');
    const outputDir = options.output || resolve(name);

    if (existsSync(outputDir)) {
      log.error(`Output directory already exists: ${outputDir}`);
      process.exit(1);
    }

    log.heading('Unpacking PackAI Bundle');
    log.item('File', filePath);
    log.item('Output', outputDir);
    console.log();

    await safeExtractZip(filePath, outputDir);
    grantExecPermissions(outputDir);

    log.success(`Unpacked to ${outputDir}`);
    log.dim(`  Run: packai validate ${outputDir}`);

  } catch (err) {
    log.error(err.message);
    process.exit(1);
  }
}

