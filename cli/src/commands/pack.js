import { createWriteStream, existsSync, statSync } from 'fs';
import { resolve, basename } from 'path';
import archiver from 'archiver';
import { loadManifest, validateManifest, runSemanticChecks } from './validate.js';
import { log } from '../utils/logger.js';

export async function packCommand(path, options) {
  try {
    const { manifest, dir } = loadManifest(path);

    // Validate schema
    const result = validateManifest(manifest);
    if (!result.valid) {
      log.error('Manifest has validation errors. Run "packai validate" first.');
      process.exit(1);
    }

    // Semantic checks
    const { errors } = runSemanticChecks(manifest, dir);
    if (errors.length > 0) {
      log.error('Manifest has semantic errors:');
      for (const e of errors) log.error(`  - ${e}`);
      process.exit(1);
    }

    const outputFile = options.output || `${manifest.name}-${manifest.version}.packai`;
    const outputPath = resolve(outputFile);

    log.heading('Packing PackAI Bundle');
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
      archive.glob('**/*', {
        cwd: dir,
        dot: true,
        ignore: [
          'node_modules/**',
          '.git/**',
          '**/.DS_Store',
          '.next/**',
          'dist/**',
          'build/**',
          'coverage/**',
          '*.packai',
          '*.aipack',
          '*.zip',
          '.packai/lock.json',
          '.packai/cache/**'
        ]
      });
      archive.finalize();
    });

  } catch (err) {
    log.error(err.message);
    process.exit(1);
  }
}
