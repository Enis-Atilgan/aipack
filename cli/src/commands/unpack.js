import { existsSync } from 'fs';
import { resolve, basename } from 'path';
import extractZip from 'extract-zip';
import { log } from '../utils/logger.js';

export async function unpackCommand(file, options) {
  try {
    const filePath = resolve(file);

    if (!existsSync(filePath)) {
      log.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    if (!filePath.endsWith('.aipack')) {
      log.warn('File does not have .aipack extension.');
    }

    const name = basename(filePath, '.aipack');
    const outputDir = options.output || resolve(name);

    if (existsSync(outputDir)) {
      log.error(`Output directory already exists: ${outputDir}`);
      process.exit(1);
    }

    log.heading('Unpacking AIPack');
    log.item('File', filePath);
    log.item('Output', outputDir);
    console.log();

    await extractZip(filePath, { dir: outputDir });

    log.success(`Unpacked to ${outputDir}`);
    log.dim(`  Run: aipack validate ${outputDir}`);

  } catch (err) {
    log.error(err.message);
    process.exit(1);
  }
}
