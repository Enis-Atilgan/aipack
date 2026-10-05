import { createWriteStream, existsSync, statSync } from 'fs';
import { resolve, basename } from 'path';
import archiver from 'archiver';
import { loadManifest, validateManifest } from './validate.js';
import { log } from '../utils/logger.js';

export async function packCommand(path, options) {
  try {
    const { manifest, dir } = loadManifest(path);

    // Validate first
    const result = validateManifest(manifest);
    if (!result.valid) {
      log.error('Manifest has validation errors. Run "aipack validate" first.');
      process.exit(1);
    }

    const outputFile = options.output || `${manifest.name}-${manifest.version}.aipack`;
    const outputPath = resolve(outputFile);

    log.heading('Packing AIPack');
    log.item('Pack', manifest.name);
    log.item('Version', manifest.version);
    log.item('Source', dir);
    log.item('Output', outputPath);
    console.log();

    await new Promise((resolvePromise, reject) => {
      const output = createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        const sizeMB = (archive.pointer() / 1024 / 1024).toFixed(2);
        log.item('Size', `${sizeMB} MB`);
        log.success(`Packed to ${outputFile}`);
        resolvePromise();
      });

      archive.on('error', reject);
      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          log.warn(err.message);
        } else {
          reject(err);
        }
      });

      archive.pipe(output);
      archive.directory(dir, false);
      archive.finalize();
    });

  } catch (err) {
    log.error(err.message);
    process.exit(1);
  }
}
